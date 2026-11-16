import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { confirmPayment } from "@/lib/payments";
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
  const providerId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const paymentId = session.metadata?.paymentId;
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });
  if (!paymentId || !providerId || session.currency !== "usd" || session.amount_total == null) {
    return new NextResponse("Invalid payment details.", { status: 400 });
  }

  try {
    await confirmPayment(paymentId, providerId, session.amount_total);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Could not confirm payment", error);
    return new NextResponse("Could not confirm payment.", { status: 500 });
  }
}
