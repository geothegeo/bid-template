# City Directory (ranked listings)

A city directory where listings pay for position. **Ranked** listings bid for a place on the homepage or a category board (price matrix, per-board minimum bid and increment, one-year validity, move up by paying the difference). **Unranked** listings pay a flat fee for 1–12 months and always show below ranked ones. No account is needed to buy; accounts give a dashboard. Requirements live in [requirements/](requirements/README.md) (start there; status in [08-status.md](requirements/08-status.md)).

## Setup

Requires Node.js 22, PostgreSQL, and a Stripe account.

1. Install dependencies with `npm ci`.
2. Set the following environment variables locally or in Vercel:
   - `DATABASE_URL`: PostgreSQL connection URL. Use a provider's pooled connection URL if appropriate for serverless deployments.
   - `STRIPE_SECRET_KEY`: Stripe secret API key.
   - `STRIPE_WEBHOOK_SECRET`: signing secret for the endpoint below.
   - `ADMIN_EMAILS`: comma-separated emails that become admins when they register.
   - `CRON_SECRET`: bearer secret for `/api/cron/notices` (Vercel Cron sends it automatically; `vercel.json` schedules it daily).
   - `RESEND_API_KEY` / `EMAIL_FROM` (optional): send expiry notices; without them notices are logged.
   - `APP_URL`: public application origin, e.g. `https://example.com` (no path or trailing query). For local development use `http://localhost:3000`.
3. Apply the committed migration with `npx prisma migrate deploy`.
4. Run `npm run dev`, then open `http://localhost:3000`.

Configure a Stripe webhook at `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. For local testing, forward these events to `localhost:3000/api/webhooks/stripe` with the Stripe CLI and use the CLI's signing secret. Use Stripe test keys and test payment methods while developing. The redirect from Checkout does not confirm a bid: only a verified webhook for a paid session updates the leaderboard. Stripe retries are safe; delayed payments appear once confirmed.

## Deploying on Vercel

Import this repository into Vercel as a Next.js project, configure the environment variables above, and deploy. Run `npx prisma migrate deploy` against the target database as part of deployment before serving traffic. Prisma Client is generated during installation. Set `APP_URL` to the canonical deployment origin and configure the Stripe webhook for that same deployment. No custom `vercel.json` is required.

Payments: Stripe Checkout is wired today; Dodo Payments is the target processor once credentials exist (see requirements/03-payments.md). The webhook confirms payments and the board updates (clients poll every 5 s).

The checkout endpoint limits requests to five per IP per hour using PostgreSQL. It uses the last address in `X-Forwarded-For`, as provided by Vercel. When self-hosting, configure a trusted proxy to overwrite this header; without it all requests share one limit. The limit covers both new entries and bids on existing entries.

All URL query parameters and fragments are removed, and common shorteners, group invites, and adult domains are blocked. This is a basic blocklist, not a content moderation system. Pending or abandoned checkouts remain in the database but never appear on any board.

## Manual checklist (needs Postgres + Stripe test keys)

1. Register with an `ADMIN_EMAILS` address; in `/admin` add categories and tweak fees.
2. Post a ranked listing on the homepage; pay with a Stripe test card; confirm it appears at the quoted position after the webhook.
3. Bid with a second listing and confirm the first slides down but stays above unranked ones; upgrade it from `/listing/[id]` and check it pays only the difference.
4. Post an unranked listing and check it shows below ranked ones; call `/api/cron/notices` with the bearer secret to test notices.

## Checks

Run `npm test`, `npm run lint`, and `npm run build`. The validation tests use Node's built-in test runner.
