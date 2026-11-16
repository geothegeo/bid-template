import Link from "next/link";
import { login as action } from "../actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const input = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm";
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-black">Log in</h1>
      <p className="mt-2 text-sm text-stone-600">An account is optional. It gives you a dashboard of your listings.</p>
      <form action={action} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">Email<input name="email" type="email" required className={input} /></label>

        <label className="block text-sm font-bold">Password<input name="password" type="password" required minLength={8} className={input} /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white">Log in</button>
      </form>
      <p className="mt-4 text-sm text-stone-600"><Link href="/register" className="underline">Create an account</Link></p>
    </div>
  );
}
