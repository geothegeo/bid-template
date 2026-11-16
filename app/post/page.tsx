import { suggestCategory } from "../actions";
import { ListingForm } from "../components/listing-form";
import { getUser } from "@/lib/auth";
import { categoryTree } from "@/lib/boards";
import { boardChoices } from "@/lib/boards-list";

export const dynamic = "force-dynamic";

export default async function PostPage({ searchParams }: { searchParams: Promise<{ board?: string; checkout?: string; suggested?: string; error?: string }> }) {
  const [params, user, boards, tree] = await Promise.all([searchParams, getUser(), boardChoices(), categoryTree()]);
  const board = boards.some((b) => b.slug === params.board) ? params.board : "home";
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black">Post a listing</h1>
      <p className="mt-2 text-stone-600">No account needed. {user ? `Signed in as ${user.username}; it will appear in your dashboard.` : "Log in first if you want it in your dashboard."} See all <a href="/fees" className="underline">fees and bid rules</a>.</p>
      {params.checkout === "cancelled" && <p role="status" className="mt-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Checkout cancelled. Nothing was charged.</p>}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <ListingForm mode="new" boards={boards} defaultBoard={board} defaultEmail={user?.email} />
      </div>
      <details className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <summary className="cursor-pointer font-bold">Don&apos;t see your category? Suggest one</summary>
        {params.suggested && <p className="mt-3 text-sm text-emerald-800">Thanks! It will appear once an admin approves it.</p>}
        {params.error && <p role="alert" className="mt-3 text-sm text-red-700">{params.error}</p>}
        <form action={suggestCategory} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={60} placeholder="Category name" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <select name="parentId" className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="">Top level</option>
            {tree.map((c) => <option key={c.id} value={c.id}>Under {c.name}</option>)}
          </select>
          <input name="email" type="email" placeholder="Your email (optional)" className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-bold text-white sm:col-span-2">Suggest category</button>
        </form>
      </details>
    </div>
  );
}
