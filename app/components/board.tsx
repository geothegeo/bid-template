import Link from "next/link";
import { db } from "@/lib/db";
import { dollars, getRules, rankedListings, unrankedListings, type Board } from "@/lib/boards";
import { LiveRefresh } from "./live-refresh";

const label = (url: string) => (url.startsWith("#") ? url : new URL(url).hostname.replace(/^www\./, ""));
const href = (url: string) => (url.startsWith("#") ? undefined : url);

type L = Awaited<ReturnType<typeof rankedListings>>[number];

function Row({ l, rank }: { l: L; rank?: number }) {
  const external = href(l.url);
  return (
    <li className="flex items-start gap-4 border-b border-stone-100 px-5 py-4 last:border-0">
      {rank !== undefined && <span className="w-10 shrink-0 text-lg font-black text-stone-400">#{rank}</span>}
      {l.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <Link href={`/listing/${l.id}`} className="font-bold hover:text-emerald-700">{l.title}</Link>
        <p className="text-sm text-stone-500">
          {external ? <a href={external} target="_blank" rel="nofollow noopener" className="hover:underline">{label(l.url)} ↗</a> : label(l.url)}
        </p>
        <p className="mt-1 text-sm text-stone-600">{l.description}</p>
      </div>
      {rank !== undefined && <span className="font-black tabular-nums">{dollars(l.totalPaidCents)}</span>}
    </li>
  );
}

/** One board (homepage or category): ranked list, random unranked below, activity. */
export async function BoardView({ board }: { board: Board }) {
  const [ranked, unranked, rules, events] = await Promise.all([
    rankedListings(board.categoryId),
    unrankedListings(board.categoryId, 30),
    getRules(board.scopeKey),
    db.ledgerEvent.findMany({ where: { scopeKey: board.scopeKey }, orderBy: { createdAt: "desc" }, take: 8, include: { listing: { select: { title: true } } } }),
  ]);
  const [first, ...rest] = ranked;
  const postHref = `/post?board=${board.slug ?? "home"}`;
  const verb: Record<string, string> = { new_ranked: "claimed", upgrade: "moved up", unranked_to_ranked: "upgraded to ranked", new_unranked: "listed", renew_unranked: "renewed" };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <LiveRefresh />
      <section className="space-y-8">
        {first ? (
          <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">#1 on {board.name}</p>
            <Link href={`/listing/${first.id}`} className="mt-1 block text-3xl font-black hover:text-emerald-700">{first.title}</Link>
            <p className="mt-1 text-stone-600">{first.description}</p>
            <p className="mt-3 text-sm text-stone-500">{label(first.url)} · {dollars(first.totalPaidCents)}</p>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">No ranked listings yet. Claim #1!</p>
        )}
        {rest.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex justify-between border-b border-stone-200 px-5 py-3"><h2 className="font-bold">Ranked</h2><span className="text-sm text-stone-500">{ranked.length} listings</span></div>
            <ol>{rest.map((l, i) => <Row key={l.id} l={l} rank={i + 2} />)}</ol>
          </div>
        )}
        {unranked.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-3"><h2 className="font-bold">More listings</h2><p className="text-xs text-stone-500">Shown in random order</p></div>
            <ul>{unranked.map((l) => <Row key={l.id} l={l} />)}</ul>
          </div>
        )}
      </section>
      <aside className="space-y-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold">Claim a position</h2>
          <p className="mt-1 text-sm text-stone-600">Minimum bid {dollars(rules.minBidCents)}; each position must beat the holder by {dollars(rules.minIncrementCents)}.</p>
          <Link href={postHref} className="mt-4 block rounded-lg bg-emerald-700 px-4 py-3 text-center font-bold text-white hover:bg-emerald-600">Bid on {board.name} →</Link>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold">Recent activity</h2>
          {events.length === 0 ? <p className="mt-2 text-sm text-stone-500">Nothing yet.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id}><Link href={`/listing/${e.listingId}`} className="font-semibold hover:underline">{e.listing.title}</Link> {verb[e.type] ?? e.type}{e.position ? ` at #${e.position}` : ""} · {dollars(e.amountCents)}</li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
