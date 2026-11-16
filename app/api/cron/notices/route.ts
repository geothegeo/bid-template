import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/boards";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86400_000;

/** R-NTC-01: ranked 30 days ahead, unranked 7 days ahead, once per period. Run daily. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const now = Date.now();
  const due = await db.listing.findMany({
    where: {
      status: "active", noticeSentAt: null, expiresAt: { gt: new Date(now) },
      OR: [
        { type: "ranked", expiresAt: { lte: new Date(now + 30 * DAY) } },
        { type: "unranked", expiresAt: { lte: new Date(now + 7 * DAY) } },
      ],
    },
    take: 200,
  });
  let sent = 0;
  for (const l of due) {
    const ok = await sendEmail(
      l.email,
      `Your listing "${l.title}" expires on ${fmtDate(l.expiresAt)}`,
      `Your ${l.type} listing "${l.title}" expires on ${fmtDate(l.expiresAt)}. Renew or upgrade here: ${getAppUrl()}/listing/${l.id}`,
    );
    if (ok) {
      await db.listing.update({ where: { id: l.id }, data: { noticeSentAt: new Date() } });
      sent++;
    }
  }
  return NextResponse.json({ due: due.length, sent });
}
