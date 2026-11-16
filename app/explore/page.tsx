import Link from "next/link";
import { db } from "@/lib/db";
import { dollars } from "@/lib/boards";
import { shuffle } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function Explore({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const term = q.trim().slice(0, 80);
  const [cats, cat] = await Promise.all([
    db.category.findMany({ where: { approved: true }, orderBy: { name: "asc" } }),
    category ? db.category.findFirst({ where: { slug: category, approved: true } }) : null,
  ]);
  const ids = cat ? [cat.id, ...cats.filter((c) => c.parentId === cat.id).map((c) => c.id)] : null;
  const where = {
    status: "active" as const, expiresAt: { gt: new Date() },
    ...(ids ? { categoryId: { in: ids } } : {}),
    ...(term ? { OR: [{ title: { contains: term, mode: "insensitive" as const } }, { description: { contains: term, mode: "insensitive" as const } }, { url: { contains: term, mode: "insensitive" as const } }] } : {}),
  };
  const [ranked, unranked] = await Promise.all([
    db.listing.findMany({ where: { ...where, type: "ranked" }, include: { category: true }, orderBy: [{ totalPaidCents: "desc" }, { rankedPaidAt: "asc" }], take: 100 }),
    db.listing.findMany({ where: { ...where, type: "unranked" }, include: { category: true }, take: 300 }),
  ]);
  const results = [...ranked, ...shuffle(unranked)].slice(0, 100); // R-UI-01: ranked always first
  return (
    <>
      <h1 className="mb-4 text-3xl font-black">Explore</h1>
      <form className="mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={term} placeholder="Search keywords" className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2" />
        <select name="category" defaultValue={category} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.slug}>{c.parentId ? "– " : ""}{c.name}</option>)}
        </select>
        <button className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white">Search</button>
      </form>
      {results.length === 0 ? <p className="text-stone-500">No listings found.</p> : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {results.map((l) => (
            <li key={l.id} className="flex items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/listing/${l.id}`} className="font-bold hover:text-emerald-700">{l.title}</Link>
                <p className="text-sm text-stone-500">{l.category?.name ?? "Homepage"} · {l.type}</p>
                <p className="mt-1 text-sm text-stone-600">{l.description}</p>
              </div>
              {l.type === "ranked" && <span className="font-black tabular-nums">{dollars(l.totalPaidCents)}</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
