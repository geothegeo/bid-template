import Link from "next/link";
import { db } from "@/lib/db";
import { categoryTree, dollars } from "@/lib/boards";
import { DEFAULT_RULES, parsePlans } from "@/lib/ranking";

export const dynamic = "force-dynamic";

/** R-FEE-02: public fee structure and bid rules for every board. */
export default async function Fees() {
  const [tree, configs] = await Promise.all([categoryTree(), db.boardConfig.findMany()]);
  const byKey = new Map(configs.map((c) => [c.scopeKey, c]));
  const boards = [
    { key: "home", name: "Homepage", slug: "" },
    ...tree.flatMap((c) => [{ key: c.id, name: c.name, slug: c.slug }, ...c.children.map((k) => ({ key: k.id, name: `${c.name} › ${k.name}`, slug: k.slug }))]),
  ];
  return (
    <>
      <h1 className="text-3xl font-black">Fees and bid rules</h1>
      <ul className="mt-3 max-w-2xl list-disc space-y-1 pl-5 text-stone-700">
        <li><strong>Ranked</strong>: bid for a position. You must beat the current holder by the board&apos;s increment. Valid 1 year from payment, even if you slide down the board; ranked always shows above unranked.</li>
        <li><strong>Unranked</strong>: flat fee for the length you choose, shown below ranked listings.</li>
        <li>Move up later by paying only the difference. Equal bids: first confirmed payment wins. All payments are non-refundable.</li>
      </ul>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500"><tr><th className="p-3">Board</th><th className="p-3">Min bid</th><th className="p-3">Increment</th><th className="p-3">Unranked plans</th></tr></thead>
          <tbody>
            {boards.map((b) => {
              const c = byKey.get(b.key);
              const plans = c ? parsePlans(c.unrankedPlans) : DEFAULT_RULES.unrankedPlans;
              return (
                <tr key={b.key} className="border-t border-stone-100">
                  <td className="p-3 font-semibold"><Link href={b.slug ? `/c/${b.slug}` : "/"} className="hover:underline">{b.name}</Link></td>
                  <td className="p-3">{dollars(c?.minBidCents ?? DEFAULT_RULES.minBidCents)}</td>
                  <td className="p-3">{dollars(c?.minIncrementCents ?? DEFAULT_RULES.minIncrementCents)}</td>
                  <td className="p-3">{plans.map((p) => `${p.months} mo ${dollars(p.cents)}`).join(" · ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
