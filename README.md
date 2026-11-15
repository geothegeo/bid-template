# Bidboard

A public pay-to-rank leaderboard. Bids are cumulative, in whole US dollars, and start at $5. The highest paid total ranks first; ties go to the earlier entry. Anyone can add a bid to an existing entry. Bids are not refunded when an entry is overtaken.

## Setup

Requires Node.js 22, PostgreSQL, and a Stripe account.

1. Install dependencies with `npm ci`.
2. Set the following environment variables locally or in Vercel:
   - `DATABASE_URL`: PostgreSQL connection URL. Use a provider's pooled connection URL if appropriate for serverless deployments.
   - `STRIPE_SECRET_KEY`: Stripe secret API key.
   - `STRIPE_WEBHOOK_SECRET`: signing secret for the endpoint below.
   - `APP_URL`: public application origin, e.g. `https://example.com` (no path or trailing query). For local development use `http://localhost:3000`.
3. Apply the committed migration with `npx prisma migrate deploy`.
4. Run `npm run dev`, then open `http://localhost:3000`.

Configure a Stripe webhook at `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. For local testing, forward these events to `localhost:3000/api/webhooks/stripe` with the Stripe CLI and use the CLI's signing secret. Use Stripe test keys and test payment methods while developing. The redirect from Checkout does not confirm a bid: only a verified webhook for a paid session updates the leaderboard. Stripe retries are safe; delayed payments appear once confirmed.

## Deploying on Vercel

Import this repository into Vercel as a Next.js project, configure the environment variables above, and deploy. Run `npx prisma migrate deploy` against the target database as part of deployment before serving traffic. Prisma Client is generated during installation. Set `APP_URL` to the canonical deployment origin and configure the Stripe webhook for that same deployment. No custom `vercel.json` is required.

The submission endpoint limits requests to five per IP per hour using PostgreSQL. It uses the last address in `X-Forwarded-For`, as provided by Vercel. When self-hosting, configure a trusted proxy to overwrite this header; without it all requests share one limit. The limit covers both new entries and bids on existing entries.

All URL query parameters and fragments are removed, and common shorteners, group invites, and adult domains are blocked. This is a basic blocklist, not a content moderation system. Pending or abandoned checkouts remain in the database but never appear on the board.

## Checks

Run `npm test`, `npm run lint`, and `npm run build`. The validation tests use Node's built-in test runner.
