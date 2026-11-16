import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { logout } from "./actions";
import { getUser } from "@/lib/auth";
import { categoryTree } from "@/lib/boards";

export const metadata: Metadata = {
  title: "City Directory - ranked listings",
  description: "Find and promote local people and businesses. Top positions are claimed by bidding.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, tree] = await Promise.all([getUser(), categoryTree().catch(() => [])]);
  const link = "rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100";
  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-5 py-3 sm:px-8">
            <Link href="/" className="mr-3 text-xl font-black tracking-tight">City<span className="text-emerald-600">Directory</span></Link>
            <Link href="/" className={link}>Home</Link>
            <details className="relative">
              <summary className={`${link} cursor-pointer list-none`}>Categories ▾</summary>
              <div className="absolute left-0 z-20 mt-1 max-h-96 w-64 overflow-auto rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                {tree.length === 0 && <p className="p-2 text-sm text-stone-500">No categories yet.</p>}
                {tree.map((c) => (
                  <div key={c.id}>
                    <Link href={`/c/${c.slug}`} className="block rounded px-2 py-1.5 text-sm font-bold hover:bg-stone-100">{c.name}</Link>
                    {c.children.map((k) => <Link key={k.id} href={`/c/${k.slug}`} className="block rounded py-1 pl-6 pr-2 text-sm text-stone-600 hover:bg-stone-100">{k.name}</Link>)}
                  </div>
                ))}
              </div>
            </details>
            <Link href="/explore" className={link}>Explore</Link>
            <Link href="/fees" className={link}>Fees</Link>
            <span className="flex-1" />
            {user ? (
              <>
                {user.role === "admin" && <Link href="/admin" className={link}>Admin</Link>}
                <Link href="/dashboard" className={link}>{user.username}</Link>
                <form action={logout}><button className={link}>Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className={link}>Log in</Link>
                <Link href="/register" className={link}>Register</Link>
              </>
            )}
            <Link href="/post" className="ml-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">Post a listing</Link>
          </nav>
        </header>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
        <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs text-stone-500 sm:px-8">
          Payments are non-refundable. Ranked listings last one year from payment; unranked for the length purchased. We only store the listing details and email you provide.
        </footer>
      </body>
    </html>
  );
}
