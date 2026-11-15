import { db } from "@/lib/db";
import Link from "next/link";
import { BidForm } from "./bid-form";

export const dynamic = "force-dynamic";

function dollars(cents: bigint) {
  return `$${(cents / BigInt(100)).toLocaleString("en-US")}`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [entries, params] = await Promise.all([
    db.entry.findMany({
      where: { totalPaidCents: { gt: 0 } },
      orderBy: [{ totalPaidCents: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    }),
    searchParams,
  ]);
  const choices = entries.map(({ id, label, totalPaidCents }) => ({
    id, label, dollars: (totalPaidCents / BigInt(100)).toString(),
  }));
  const leader = entries[0]?.totalPaidCents ?? BigInt(0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-12 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight">bidboard<span className="text-emerald-600">.</span></Link>
        <a href="#bid" className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Place a bid ↗</a>
      </header>
      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">The internet&apos;s open leaderboard</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl">Pay to rank.<br />That&apos;s it.</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">No accounts. No algorithm. The more you bid, the higher your link climbs.</p>
          </div>
          {params.checkout === "success" && <p role="status" className="mb-5 rounded-xl bg-emerald-100 p-4 text-sm text-emerald-900">Thanks! Your bid appears after Stripe confirms your payment. This can take a moment.</p>}
          {params.checkout === "cancelled" && <p role="status" className="mb-5 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Checkout cancelled. No bid was added.</p>}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="font-bold">The leaderboard</h2>
              <span className="text-sm text-stone-500">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            </div>
            {entries.length === 0 ? (
              <p className="px-5 py-12 text-center text-stone-500">The board is empty. Be the first to claim a spot.</p>
            ) : (
              <ol>
                {entries.map((entry, index) => (
                  <li key={entry.id} className="flex items-center gap-4 border-b border-stone-100 px-5 py-5 last:border-0">
                    <span className="w-9 shrink-0 text-lg font-black text-stone-400">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <a href={entry.url} target="_blank" rel="nofollow noopener" className="block truncate font-bold hover:text-emerald-700">{entry.label} ↗</a>
                      <p className="truncate text-sm text-stone-500">{new URL(entry.url).hostname}</p>
                    </div>
                    <span className="font-black tabular-nums">{dollars(entry.totalPaidCents)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <p className="mt-5 text-sm text-stone-500">Bids are cumulative and non-refundable. Ties go to the earlier entry.</p>
        </section>
        <aside id="bid" className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <BidForm entries={choices} leaderDollars={(leader / BigInt(100)).toString()} />
        </aside>
      </div>
    </main>
  );
}
