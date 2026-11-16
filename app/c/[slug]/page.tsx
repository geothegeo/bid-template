import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardView } from "@/app/components/board";
import { db } from "@/lib/db";
import { resolveBoard } from "@/lib/boards";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const board = await resolveBoard(slug);
  if (!board?.categoryId) notFound();
  const category = await db.category.findUnique({
    where: { id: board.categoryId },
    include: { parent: true, children: { where: { approved: true }, orderBy: { name: "asc" } } },
  });
  return (
    <>
      <p className="text-sm text-stone-500"><Link href="/" className="hover:underline">Home</Link>{category?.parent && <> / <Link href={`/c/${category.parent.slug}`} className="hover:underline">{category.parent.name}</Link></>}</p>
      <h1 className="mb-4 text-3xl font-black">{board.name}</h1>
      {category && category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => <Link key={c.id} href={`/c/${c.slug}`} className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold hover:border-emerald-600">{c.name}</Link>)}
        </div>
      )}
      <BoardView board={board} />
    </>
  );
}
