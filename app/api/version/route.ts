import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Cheap change marker for live refresh (R-UI-04): newest confirmed-payment ledger row. */
export async function GET() {
  const latest = await db.ledgerEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } });
  return NextResponse.json({ v: latest?.id ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
