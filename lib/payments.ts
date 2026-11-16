import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { addMonths, RANKED_MONTHS } from "./ranking";

/**
 * Applies a verified payment exactly once (R-PAY-03, R-RNK-09). Ranking is derived from totals,
 * so the only mutation is the listing's totals/expiry plus an append-only ledger row.
 */
export async function confirmPayment(paymentId: string, providerId: string, paidCents: number) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { listing: true } });
    if (!payment || payment.amountCents !== paidCents) throw new Error("Payment does not match record.");

    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "pending" },
      data: { status: "confirmed", providerId, confirmedAt: new Date() },
    });
    if (claimed.count === 0) {
      const again = await tx.payment.findUnique({ where: { id: payment.id } });
      if (again?.providerId !== providerId) throw new Error("Payment was confirmed with another transaction.");
      return;
    }

    const now = new Date();
    const listing = payment.listing;
    const ranked = {
      type: "ranked" as const, status: "active" as const, rankedPaidAt: now, startsAt: now,
      expiresAt: addMonths(now, RANKED_MONTHS), noticeSentAt: null,
    };
    let data: Prisma.ListingUpdateInput;
    switch (payment.kind) {
      case "new_ranked":
      case "unranked_to_ranked":
        data = { ...ranked, totalPaidCents: payment.targetTotalCents ?? payment.amountCents };
        break;
      case "upgrade":
        data = { ...ranked, totalPaidCents: { increment: payment.amountCents } };
        break;
      case "new_unranked":
        data = {
          type: "unranked", status: "active", totalPaidCents: payment.amountCents, startsAt: now,
          expiresAt: addMonths(now, payment.months ?? 1), noticeSentAt: null,
        };
        break;
      case "renew_unranked": {
        const base = listing.expiresAt && listing.expiresAt > now ? listing.expiresAt : now;
        data = { expiresAt: addMonths(base, payment.months ?? 1), noticeSentAt: null, totalPaidCents: { increment: payment.amountCents } };
        break;
      }
    }
    const updated = await tx.listing.update({ where: { id: listing.id }, data });

    let position: number | null = null;
    if (updated.type === "ranked") {
      const board = await tx.listing.findMany({
        where: { type: "ranked", status: "active", expiresAt: { gt: now }, categoryId: updated.categoryId },
        orderBy: [{ totalPaidCents: "desc" }, { rankedPaidAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      position = board.findIndex((l) => l.id === updated.id) + 1 || null;
    }
    await tx.ledgerEvent.create({
      data: {
        listingId: listing.id, paymentId: payment.id, type: payment.kind, amountCents: payment.amountCents,
        scopeKey: listing.categoryId ?? "home", position,
      },
    });
  });
}
