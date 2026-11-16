"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** R-UI-04: refresh server data shortly after a payment is confirmed. */
export function LiveRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  useEffect(() => {
    let stop = false;
    async function tick() {
      if (document.hidden) return;
      try {
        const { v } = await (await fetch("/api/version", { cache: "no-store" })).json();
        if (stop) return;
        if (last.current !== null && v !== last.current) router.refresh();
        last.current = v;
      } catch { /* offline: try again next tick */ }
    }
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => { stop = true; clearInterval(timer); };
  }, [router, intervalMs]);
  return null;
}
