import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingForm } from "@/app/components/listing-form";
import { LiveRefresh } from "@/app/components/live-refresh";
import { db } from "@/lib/db";
import { dollars, fmtDate, isLive, positionOf } from "@/lib/boards";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const listing = await db.listing.findUnique({
    where: { id },
    include: { category: true, payments: { where: { status: "confirmed" }, orderBy: { confirmedAt: "desc" } } },
  });
  if (!listing) notFound();
  const live = isLive(listing);
  const position = live && listing.type === "ranked" ? await positionOf(listing) : null;
  const boardSlug = listing.category?.slug ?? "home";
  const boards = [{ slug: boardSlug, label: listing.category?.name ?? "Homepage" }];
  const isHandle = listing.url.startsWith("#");

  if (listing.status === "pending") {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-black">Waiting for payment confirmation</h1>
        <p className="mt-2 text-stone-600">Your listing goes live as soon as the payment is verified, usually within a minute.</p>
        <LiveRefresh />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LiveRefresh />
      {query.checkout === "success" && <p role="status" className="rounded-xl bg-emerald-100 p-4 text-sm text-emerald-900">Thanks! Your listing updates once payment is verified. This page refreshes by itself.</p>}
      <div>
        <p className="text-sm text-stone-500"><Link href={listing.category ? `/c/${listing.category.slug}` : "/"} className="hover:underline">{listing.category?.name ?? "Homepage"}</Link> · {listing.type}</p>
        <h1 className="text-3xl font-black">{listing.title}</h1>
        <p className="mt-1">{isHandle ? listing.url : <a href={listing.url} target="_blank" rel="nofollow noopener" className="text-emerald-700 hover:underline">{listing.url} ↗</a>}</p>
        <p className="mt-3 text-stone-700">{listing.description}</p>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-sm sm:grid-cols-4">
        <div><dt className="text-stone-500">Status</dt><dd className="font-bold">{live ? "Live" : "Expired"}</dd></div>
        {listing.type === "ranked" && <div><dt className="text-stone-500">Position</dt><dd className="font-bold">{position ? `#${position}` : "—"}</dd></div>}
        <div><dt className="text-stone-500">Total paid</dt><dd className="font-bold">{dollars(listing.totalPaidCents)}</dd></div>
        <div><dt className="text-stone-500">Valid until</dt><dd className="font-bold">{fmtDate(listing.expiresAt)}</dd></div>
      </dl>

      {live && listing.type === "ranked" && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-bold">Move up</h2>
          <p className="mb-4 text-sm text-stone-600">Pay only the difference. Upgrading restarts your one-year period.</p>
          <ListingForm mode="upgrade" boards={boards} defaultBoard={boardSlug} listingId={listing.id} currentCents={Number(listing.totalPaidCents)} />
        </section>
      )}
      {live && listing.type === "unranked" && (
        <>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-bold">Renew</h2>
            <p className="mb-4 text-sm text-stone-600">Extends from your current expiry date.</p>
            <ListingForm mode="renew" boards={boards} defaultBoard={boardSlug} listingId={listing.id} />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-bold">Upgrade to ranked</h2>
            <p className="mb-4 text-sm text-stone-600">What you paid ({dollars(listing.totalPaidCents)}) counts toward your ranked bid.</p>
            <ListingForm mode="to_ranked" boards={boards} defaultBoard={boardSlug} listingId={listing.id} currentCents={Number(listing.totalPaidCents)} />
          </section>
        </>
      )}
      {!live && <p className="rounded-xl bg-stone-100 p-4 text-sm">This listing has expired and is hidden. <Link className="underline" href={`/post?board=${boardSlug}`}>Post it again</Link>.</p>}

      <section>
        <h2 className="mb-2 font-bold">Payment history</h2>
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white text-sm">
          {listing.payments.map((p) => <li key={p.id} className="flex justify-between px-5 py-3"><span>{p.kind.replaceAll("_", " ")}</span><span>{dollars(p.amountCents)} · {fmtDate(p.confirmedAt)}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
