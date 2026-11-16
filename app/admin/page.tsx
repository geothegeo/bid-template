import { redirect } from "next/navigation";
import { createCategory, deleteCategory, saveBoardConfig, updateCategory } from "../actions";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_RULES, parsePlans } from "@/lib/ranking";

export const dynamic = "force-dynamic";

const input = "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const btn = "rounded-lg bg-stone-800 px-3 py-2 text-sm font-bold text-white";

/** R-ADM-01: categories, suggestions and fee/bid rules only. */
export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");
  const [{ error, saved }, categories, configs] = await Promise.all([
    searchParams,
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.boardConfig.findMany(),
  ]);
  const byKey = new Map(configs.map((c) => [c.scopeKey, c]));
  const tops = categories.filter((c) => !c.parentId);
  const pending = categories.filter((c) => !c.approved);
  const boards = [
    { key: "home", name: "Homepage" },
    ...tops.filter((c) => c.approved).flatMap((c) => [
      { key: c.id, name: c.name },
      ...categories.filter((k) => k.parentId === c.id && k.approved).map((k) => ({ key: k.id, name: `${c.name} › ${k.name}` })),
    ]),
  ];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-black">Admin</h1>
      {error && <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}
      {saved && <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-900">Saved.</p>}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Suggested categories</h2>
          <ul className="space-y-2">
            {pending.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                <form action={updateCategory} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="approve" value="1" />
                  <input name="name" defaultValue={c.name} className={input} />
                  <input type="hidden" name="sortOrder" value={c.sortOrder} />
                  <span className="text-stone-600">{c.parentId ? `under ${categories.find((p) => p.id === c.parentId)?.name}` : "top level"}{c.suggestedBy ? ` · ${c.suggestedBy}` : ""}</span>
                  <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Approve</button>
                </form>
                <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className={btn}>Reject</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xl font-bold">Categories <span className="text-sm font-normal text-stone-500">(two levels)</span></h2>
        <form action={createCategory} className="mb-4 flex flex-wrap gap-2">
          <input name="name" required maxLength={60} placeholder="New category" className={input} />
          <select name="parentId" className={input}><option value="">Top level</option>{tops.filter((c) => c.approved).map((c) => <option key={c.id} value={c.id}>Under {c.name}</option>)}</select>
          <input name="sortOrder" type="number" placeholder="Order" className={`${input} w-24`} />
          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Add</button>
        </form>
        <ul className="space-y-1">
          {tops.filter((c) => c.approved).flatMap((c) => [c, ...categories.filter((k) => k.parentId === c.id && k.approved)]).map((c) => (
            <li key={c.id} className={`flex flex-wrap items-center gap-2 ${c.parentId ? "ml-8" : ""}`}>
              <form action={updateCategory} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className={input} />
                <input name="sortOrder" type="number" defaultValue={c.sortOrder} className={`${input} w-20`} />
                <button className={btn}>Save</button>
              </form>
              <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Delete</button></form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Fees and bid rules</h2>
        <p className="mb-4 text-sm text-stone-600">Whole dollars. Plans are one per line as <code>months:dollars</code>. Unset boards use the defaults ($5 min, $5 increment).</p>
        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((b) => {
            const c = byKey.get(b.key);
            const plans = (c ? parsePlans(c.unrankedPlans) : DEFAULT_RULES.unrankedPlans).map((p) => `${p.months}:${p.cents / 100}`).join("\n");
            return (
              <form key={b.key} action={saveBoardConfig} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <input type="hidden" name="scopeKey" value={b.key} />
                <h3 className="font-bold">{b.name}</h3>
                <label className="flex items-center justify-between gap-2">Minimum bid ($)<input name="minBid" type="number" min={1} required defaultValue={(c?.minBidCents ?? DEFAULT_RULES.minBidCents) / 100} className={`${input} w-28`} /></label>
                <label className="flex items-center justify-between gap-2">Minimum increment ($)<input name="increment" type="number" min={1} required defaultValue={(c?.minIncrementCents ?? DEFAULT_RULES.minIncrementCents) / 100} className={`${input} w-28`} /></label>
                <label className="block">Unranked plans<textarea name="plans" rows={3} defaultValue={plans} className={`${input} mt-1 w-full`} /></label>
                <button className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white">Save</button>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
