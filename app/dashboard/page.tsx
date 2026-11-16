import Link from "next/link";
import { redirect } from "next/navigation";
import { LiveRefresh } from "../components/live-refresh";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dollars, fmtDate, isLive, positionOf } from "@/lib/boards";

export const dynamic = "force-dynamic";

/** R-DSH-01: every listing with type, board, position, paid amount, start and expiry. */
export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/login");
  const listings = await db.listing.findMany({
    where: { userId: user.id, status: "active" }, include: { category: true }, orderBy: { createdAt: "desc" },
  });
  const rows = await Promise.all(listings.map(async (l) => ({ l, live: isLive(l), position: isLive(l) && l.type === "ranked" ? await positionOf(l) : null })));
  return (
    <>
      <LiveRefresh />
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-3xl font-black">Your listings</h1><p className="text-stone-600">{user.username} · {user.email}</p></div>
        <Link href="/post" className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white">New listing</Link>
      </div>
      {rows.length === 0 ? <p className="text-stone-500">No listings yet. Log in before posting and they will appear here.</p> : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500"><tr>{["Listing", "Type", "Board", "Position", "Paid", "Started", "Expires", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(({ l, live, position }) => (
                <tr key={l.id} className="border-t border-stone-100">
                  <td className="p-3 font-semibold">{l.title}</td>
                  <td className="p-3 capitalize">{l.type}</td>
                  <td className="p-3">{l.category?.name ?? "Homepage"}</td>
                  <td className="p-3">{l.type === "ranked" ? (position ? `#${position}` : "—") : "Unranked"}</td>
                  <td className="p-3">{dollars(l.totalPaidCents)}</td>
                  <td className="p-3">{fmtDate(l.startsAt)}</td>
                  <td className={`p-3 ${live ? "" : "text-red-700"}`}>{fmtDate(l.expiresAt)}{live ? "" : " (expired)"}</td>
                  <td className="p-3"><Link href={`/listing/${l.id}`} className="font-bold text-emerald-700">Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
