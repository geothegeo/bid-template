"use client";

import { useState } from "react";

type Choice = { id: string; label: string; dollars: string };

export function BidForm({ entries, leaderDollars }: { entries: Choice[]; leaderDollars: string }) {
  const [entryId, setEntryId] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("5");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = entries.find((entry) => entry.id === entryId);
  const needed = BigInt(leaderDollars) - BigInt(selected?.dollars ?? "0") + BigInt(1);
  const toFirst = needed > BigInt(5) ? needed : BigInt(5);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(entryId ? { entryId } : { url, label }), amount: Number(amount) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start checkout.");
      window.location.assign(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  const field = "mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Make your move</p>
      <h2 className="mt-2 text-2xl font-black">Place a bid</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">Add a new link or boost one already on the board.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">Choose an entry
          <select className={field} value={entryId} onChange={(event) => setEntryId(event.target.value)}>
            <option value="">Submit a new link</option>
            {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} (${BigInt(entry.dollars).toLocaleString("en-US")})</option>)}
          </select>
        </label>
        {!entryId && <>
          <label className="block text-sm font-bold">Link URL
            <input className={field} type="url" required maxLength={2048} placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">Display label
            <input className={field} required maxLength={80} placeholder="Your project or profile" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
        </>}
        <label className="block text-sm font-bold">Bid amount (USD)
          <input className={field} type="number" min="5" max="999999" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">To take #1: <strong>${toFirst.toLocaleString("en-US")}</strong> {selected ? "additional" : "minimum"} at current standings.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "Starting checkout…" : "Continue to payment →"}
        </button>
        <p className="text-center text-xs leading-relaxed text-stone-500">Minimum $5, whole dollars only. Secure checkout by Stripe.</p>
      </form>
    </>
  );
}
