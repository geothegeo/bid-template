import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getRules, isLive, rankedTotals, resolveBoard } from "@/lib/boards";
import { allowSubmission } from "@/lib/rate-limit";
import { priceForPosition, RANKED_MONTHS } from "@/lib/ranking";
import { getAppUrl, getStripe } from "@/lib/stripe";
import {
  targetKey, validateDescription, validateEmail, validateLabel, validateOptionalImage, validateTarget,
} from "@/lib/validation";

export const runtime = "nodejs";

type Body = Record<string, unknown>;
class Bad extends Error {}

const wholeDollars = (v: unknown) => {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 1 || v > 999999) throw new Bad("Enter a whole-dollar amount.");
  return v * 100;
};

export async function POST(request: Request) {
  try {
    if (!(await allowSubmission(request))) {
      return NextResponse.json({ error: "Too many submissions. Try again in an hour." }, { status: 429 });
    }
    const body = (await request.json().catch(() => null)) as Body | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Bad("Invalid request.");
    const user = await getUser();
    const action = body.action;

    let listingId: string;
    let kind: "new_ranked" | "upgrade" | "new_unranked" | "renew_unranked" | "unranked_to_ranked";
    let amountCents: number;
    let targetTotalCents: number | null = null;
    let months: number | null = null;
    let boardName: string;
    let email: string;

    if (action === "new_ranked" || action === "new_unranked") {
      const board = await resolveBoard(typeof body.board === "string" ? body.board : null);
      if (!board) throw new Bad("Unknown category.");
      const rules = await getRules(board.scopeKey);
      const target = validateTarget(body.url);
      const title = validateLabel(body.title);
      const description = validateDescription(body.description);
      const imageUrl = validateOptionalImage(body.imageUrl);
      email = validateEmail(user?.email ?? body.email);

      // R-LST-09 duplicate detection
      const sameBoard = await db.listing.findMany({ where: { categoryId: board.categoryId, status: "active", expiresAt: { gt: new Date() } }, select: { url: true, id: true } });
      const dup = sameBoard.find((l) => targetKey(l.url) === targetKey(target));
      if (dup) throw new Bad(`That link is already listed here (listing ${dup.id}). Upgrade or renew it instead.`);

      if (action === "new_ranked") {
        const position = Number(body.position);
        if (!Number.isInteger(position) || position < 1 || position > 20) throw new Bad("Choose a position from 1 to 20.");
        const total = wholeDollars(body.amount);
        if (total < priceForPosition(await rankedTotals(board.categoryId), position, rules)) {
          throw new Bad("That amount does not reach the price for the chosen position. Prices may have changed; refresh the matrix.");
        }
        kind = "new_ranked"; amountCents = total; targetTotalCents = total; months = RANKED_MONTHS;
      } else {
        const plan = rules.unrankedPlans.find((p) => p.months === Number(body.months));
        if (!plan) throw new Bad("Choose a listing length.");
        kind = "new_unranked"; amountCents = plan.cents; months = plan.months;
      }
      const listing = await db.listing.create({
        data: {
          type: action === "new_ranked" ? "ranked" : "unranked", categoryId: board.categoryId, userId: user?.id,
          email, title, url: target, description, imageUrl,
        },
      });
      listingId = listing.id;
      boardName = board.name;
    } else if (["upgrade", "renew", "to_ranked"].includes(String(action))) {
      const listing = typeof body.listingId === "string" ? await db.listing.findUnique({ where: { id: body.listingId }, include: { category: true } }) : null;
      if (!listing || listing.status !== "active") throw new Bad("Listing not found.");
      const rules = await getRules(listing.categoryId ?? "home");
      boardName = listing.category?.name ?? "Homepage";
      email = listing.email;
      listingId = listing.id;

      if (action === "renew") {
        if (listing.type !== "unranked") throw new Bad("Ranked listings are extended by upgrading the bid.");
        const plan = rules.unrankedPlans.find((p) => p.months === Number(body.months));
        if (!plan) throw new Bad("Choose a renewal length.");
        kind = "renew_unranked"; amountCents = plan.cents; months = plan.months;
      } else {
        const total = wholeDollars(body.amount);
        const price = priceForPosition(await rankedTotals(listing.categoryId, listing.id), Number(body.position), rules);
        if (!Number.isInteger(Number(body.position)) || Number(body.position) < 1) throw new Bad("Choose a position.");
        if (total < price) throw new Bad("That amount does not reach the price for the chosen position.");
        if (action === "upgrade") {
          if (listing.type !== "ranked" || !isLive(listing)) throw new Bad("Only live ranked listings can be upgraded.");
          const current = Number(listing.totalPaidCents);
          if (total <= current) throw new Bad("The new total must exceed your current bid.");
          kind = "upgrade"; amountCents = total - current; targetTotalCents = total;
        } else {
          if (listing.type !== "unranked" || !isLive(listing)) throw new Bad("Only live unranked listings can be upgraded to ranked.");
          const credit = Number(listing.totalPaidCents);
          if (total <= credit) throw new Bad("The ranked total must exceed what you paid for the unranked plan.");
          kind = "unranked_to_ranked"; amountCents = total - credit; targetTotalCents = total;
        }
        months = RANKED_MONTHS;
      }
    } else {
      throw new Bad("Unknown action.");
    }

    const payment = await db.payment.create({ data: { listingId, kind, amountCents, targetTotalCents, months } });
    const ranked = kind === "new_ranked" || kind === "upgrade" || kind === "unranked_to_ranked";
    const period = ranked ? "valid 1 year from payment" : `valid ${months} month${months === 1 ? "" : "s"}${kind === "renew_unranked" ? " added to current expiry" : " from payment"}`;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [{
        price_data: {
          currency: "usd", unit_amount: amountCents,
          // R-PAY-05: receipt shows type, board and valid period
          product_data: { name: `${ranked ? "Ranked" : "Unranked"} listing - ${boardName} - ${period}` },
        },
        quantity: 1,
      }],
      metadata: { paymentId: payment.id },
      success_url: `${getAppUrl()}/listing/${listingId}?checkout=success`,
      cancel_url: `${getAppUrl()}/post?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Checkout session has no URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Bad || (error instanceof Error && /^Enter |^Only |^Handles|^That domain|^Image/.test(error.message))) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    console.error("Could not create checkout session", error);
    return NextResponse.json({ error: "Unable to start checkout. Please try again later." }, { status: 500 });
  }
}
