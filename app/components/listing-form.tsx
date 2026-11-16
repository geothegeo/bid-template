"use client";

import { useEffect, useState } from "react";

type Quote = {
  name: string;
  rules: { minBidCents: number; minIncrementCents: number; unrankedPlans: { months: number; cents: number }[] };
  matrix: { position: number; cents: number }[];
  ranked: number;
};
export type BoardChoice = { slug: string; label: string };
type Mode = "new" | "upgrade" | "to_ranked" | "renew";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const field = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function ListingForm({
  mode, boards, defaultBoard = "home", defaultEmail = "", listingId, currentCents = 0,
}: {
  mode: Mode; boards: BoardChoice[]; defaultBoard?: string; defaultEmail?: string; listingId?: string; currentCents?: number;
}) {
  const existing = mode !== "new";
  const [type, setType] = useState<"ranked" | "unranked">("ranked");
  const [board, setBoard] = useState(defaultBoard);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [position, setPosition] = useState(1);
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(0);
  const [f, setF] = useState({ title: "", url: "", description: "", imageUrl: "", email: defaultEmail });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    const qs = new URLSearchParams({ board });
    if (listingId) qs.set("exclude", listingId);
    fetch(`/api/quote?${qs}`).then((r) => r.json()).then((q: Quote) => {
      if (!live || !q.matrix) return;
      setQuote(q);
      setMonths((m) => (q.rules.unrankedPlans.some((p) => p.months === m) ? m : q.rules.unrankedPlans[0]?.months ?? 0));
    }).catch(() => setError("Could not load fees."));
    return () => { live = false; };
  }, [board, listingId]);

  const ranked = mode === "new" ? type === "ranked" : mode !== "renew";
  const price = quote?.matrix[position - 1]?.cents ?? 0;
  const chosen = Math.round(Number(amount) * 100);
  const total = amount ? chosen : price;
  const pay = ranked ? total - (mode === "new" ? 0 : currentCents) : quote?.rules.unrankedPlans.find((p) => p.months === months)?.cents ?? 0;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function pick(p: number, cents: number) { setPosition(p); setAmount(String(Math.ceil(cents / 100))); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setLoading(true);
    const action = mode === "new" ? (type === "ranked" ? "new_ranked" : "new_unranked") : mode;
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, board, listingId, position, amount: Number(amount), months, ...(existing ? {} : f) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start checkout.");
      window.location.assign(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {mode === "new" && (
        <fieldset className="flex gap-3">
          {(["ranked", "unranked"] as const).map((t) => (
            <label key={t} className={`flex-1 cursor-pointer rounded-xl border-2 p-4 ${type === t ? "border-emerald-600 bg-emerald-50" : "border-stone-200 bg-white"}`}>
              <input type="radio" name="type" className="sr-only" checked={type === t} onChange={() => setType(t)} />
              <span className="block font-bold capitalize">{t}</span>
              <span className="text-sm text-stone-600">{t === "ranked" ? "Bid for a top position. Valid 1 year." : "Flat fee, listed below ranked. Choose a length."}</span>
            </label>
          ))}
        </fieldset>
      )}
      {mode === "new" && (
        <label className="block text-sm font-bold">Where should it appear?
          <select className={field} value={board} onChange={(e) => setBoard(e.target.value)}>
            {boards.map((b) => <option key={b.slug} value={b.slug}>{b.label}</option>)}
          </select>
        </label>
      )}

      {quote && ranked && (
        <div>
          <p className="text-sm font-bold">Price matrix <span className="font-normal text-stone-500">· min bid {usd(quote.rules.minBidCents)}, increment {usd(quote.rules.minIncrementCents)}{existing && ` · your current bid ${usd(currentCents)}`}</span></p>
          <div className="mt-2 grid max-h-64 grid-cols-2 gap-2 overflow-auto sm:grid-cols-4">
            {quote.matrix.filter((m) => !existing || m.cents > currentCents).map((m) => (
              <button type="button" key={m.position} onClick={() => pick(m.position, m.cents)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${position === m.position ? "border-emerald-600 bg-emerald-50" : "border-stone-200 bg-white hover:border-emerald-400"}`}>
                <span className="font-black">#{m.position}</span> <span className="tabular-nums">{usd(m.cents)}</span>
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm font-bold">{existing ? "New total bid (USD)" : "Your bid (USD)"}
            <input className={field} type="number" min={Math.ceil(price / 100)} step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(Math.ceil(price / 100))} />
          </label>
          {amount && chosen < price && <p className="mt-1 text-sm text-amber-700">Below the {usd(price)} needed for #{position}. Pick a lower position or raise your bid.</p>}
        </div>
      )}

      {quote && !ranked && (
        <fieldset>
          <p className="text-sm font-bold">Length</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {quote.rules.unrankedPlans.map((p) => (
              <label key={p.months} className={`cursor-pointer rounded-lg border-2 p-3 text-sm ${months === p.months ? "border-emerald-600 bg-emerald-50" : "border-stone-200 bg-white"}`}>
                <input type="radio" name="plan" className="sr-only" checked={months === p.months} onChange={() => setMonths(p.months)} />
                <span className="block font-bold">{p.months} month{p.months === 1 ? "" : "s"}</span>{usd(p.cents)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {mode === "new" && (
        <div className="space-y-4">
          <label className="block text-sm font-bold">Title<input className={field} required maxLength={80} value={f.title} onChange={set("title")} /></label>
          <label className="block text-sm font-bold">Website URL or #handle<input className={field} required maxLength={2048} placeholder="https://example.com or #myshop" value={f.url} onChange={set("url")} /></label>
          <label className="block text-sm font-bold">Short description<textarea className={field} required maxLength={280} rows={3} value={f.description} onChange={set("description")} /></label>
          <label className="block text-sm font-bold">Image URL (optional, https)<input className={field} type="url" maxLength={2048} value={f.imageUrl} onChange={set("imageUrl")} /></label>
          <label className="block text-sm font-bold">Your email (receipt and expiry notices; not shown publicly)
            <input className={field} type="email" required maxLength={254} value={f.email} onChange={set("email")} readOnly={!!defaultEmail} />
          </label>
        </div>
      )}

      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
        You pay <strong>{pay > 0 ? usd(pay) : "—"}</strong> today{ranked ? ` for ${position <= (quote?.ranked ?? 0) + 1 ? `a top-${position} bid` : "this bid"}. Valid for 1 year from payment` : months ? `. Valid ${months} month${months === 1 ? "" : "s"}` : ""}. Non-refundable.
      </p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
        {loading ? "Starting checkout…" : "Continue to payment →"}
      </button>
      <p className="text-center text-xs text-stone-500">Your listing goes live only after payment is verified.</p>
    </form>
  );
}
