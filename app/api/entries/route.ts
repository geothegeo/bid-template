import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowSubmission } from "@/lib/rate-limit";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { cleanUrl, validateAmount, validateLabel } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await allowSubmission(request))) {
      return NextResponse.json({ error: "Too many submissions. Try again in an hour." }, { status: 429 });
    }

    let data: { entryId?: unknown; url?: unknown; label?: unknown; amount?: unknown };
    let amountCents: number;
    let url: string | undefined;
    let label: string | undefined;
    try {
      data = await request.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid request.");
      amountCents = validateAmount(data.amount);
      if (data.entryId !== undefined) {
        if (typeof data.entryId !== "string" || !data.entryId || data.entryId.length > 100) {
          throw new Error("Invalid entry.");
        }
      } else {
        url = cleanUrl(data.url);
        label = validateLabel(data.label);
      }
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const entry = data.entryId
      ? await db.entry.findFirst({ where: { id: data.entryId as string, totalPaidCents: { gt: 0 } } })
      : await db.entry.create({ data: { url: url!, label: label! } });
    if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

    const bid = await db.bid.create({ data: { entryId: entry.id, amountCents } });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: `Leaderboard bid: ${entry.label}` },
        },
        quantity: 1,
      }],
      metadata: { bidId: bid.id },
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Checkout session has no URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Could not create checkout session", error);
    return NextResponse.json({ error: "Unable to start checkout. Please try again later." }, { status: 500 });
  }
}
