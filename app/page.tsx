import Link from "next/link";
import { BoardView } from "./components/board";
import { categoryTree, resolveBoard } from "@/lib/boards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [board, tree] = await Promise.all([resolveBoard("home"), categoryTree()]);
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Find it in the city.</h1>
        <p className="mt-3 max-w-xl text-lg text-stone-600">Local people and businesses, ranked by who backs them. Claim a top position or list for less.</p>
        {tree.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tree.map((c) => <Link key={c.id} href={`/c/${c.slug}`} className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold hover:border-emerald-600">{c.name}</Link>)}
          </div>
        )}
      </div>
      <BoardView board={board!} />
      <p className="mt-10 text-xs text-stone-500">Privacy: listings show only the title, link and description you submit. Your email is used for receipts and expiry notices and is never displayed.</p>
    </>
  );
}
