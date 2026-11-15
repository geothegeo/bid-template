import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new NextResponse("Missing webhook signature or configuration.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new NextResponse("Invalid webhook signature.", { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const bidId = session.metadata?.bidId;
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });
  if (!bidId || !paymentIntentId || session.currency !== "usd") {
    return new NextResponse("Invalid payment details.", { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({ where: { id: bidId } });
      if (!bid || bid.amountCents !== session.amount_total) throw new Error("Payment does not match bid.");
      const updated = await tx.bid.updateMany({
        where: { id: bid.id, status: "pending" },
        data: { status: "confirmed", stripePaymentIntentId: paymentIntentId },
      });
      if (updated.count === 1) {
        await tx.entry.update({
          where: { id: bid.entryId },
          data: { totalPaidCents: { increment: bid.amountCents } },
        });
      } else {
        const confirmed = await tx.bid.findUnique({ where: { id: bid.id } });
        if (confirmed?.stripePaymentIntentId !== paymentIntentId) {
          throw new Error("Bid was confirmed with another payment.");
        }
      }
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Could not confirm payment", error);
    return new NextResponse("Could not confirm payment.", { status: 500 });
  }
}
