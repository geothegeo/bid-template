import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { db } from "./db";

export async function allowSubmission(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = forwarded && isIP(forwarded) ? forwarded : "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" <= NOW() - INTERVAL '1 hour'
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" <= NOW() - INTERVAL '1 hour'
        THEN NOW() ELSE "RateLimit"."windowStart" END
    RETURNING "count"
  `;
  return rows[0].count <= 5;
}
