# 08 Implementation status

Verified: `npm test` (ranking/validation unit tests, incl. the v2/v3 worked examples), `npm run lint`, `npm run build`. **Not yet exercised against a live Postgres/Stripe** (none available when built) – run the manual checklist in the README before launch.

| Requirement | Status | Where |
|---|---|---|
| R-LST-01..03, 06 posting flow, price matrix | ✅ | `app/post`, `components/listing-form.tsx`, `/api/quote` |
| R-LST-04/05 guest purchase + email | ✅ | `/api/checkout` |
| R-LST-07 visible only after verified payment | ✅ | `lib/payments.ts` |
| R-LST-08 expiry (1 yr ranked, plan length unranked) | ✅ | derived from `expiresAt` on every read |
| R-LST-09 duplicate detection | ✅ | `/api/checkout` (active listings per board) |
| R-LST-11 unranked → ranked pays difference | ✅ | action `to_ranked` |
| R-LST-12 manual unranked renewal | ✅ | action `renew` |
| R-RNK-01..11 ranking engine | ✅ | `lib/ranking.ts`, `lib/boards.ts` |
| R-PAY-01 Dodo Payments | ⏳ | Stripe Checkout used; swap needs Dodo keys/API docs |
| R-PAY-02 swappable processor | 🟡 | isolated in `lib/stripe.ts`, `/api/checkout`, `/api/webhooks/stripe`, `lib/payments.ts` |
| R-PAY-03..05 verification, idempotency, receipt text | ✅ | webhook + `confirmPayment` |
| R-PAY-07 ledger | ✅ | `LedgerEvent` (append-only by convention; no update/delete code paths) |
| R-CAT-01..03 categories, suggestions | ✅ | `app/actions.ts`, `/admin` |
| R-FEE-01..03 per-board rules, public fees | ✅ | `/admin`, `/fees` |
| R-ADM-01/02 | ✅ | `ADMIN_EMAILS` |
| R-ACC-01/02, R-DSH-01/02 | ✅ | `/register`, `/login`, `/dashboard`, `/listing/[id]` |
| R-NTC-01/02 expiry notices | ✅ | `/api/cron/notices` + `vercel.json` (needs `CRON_SECRET`, optional `RESEND_API_KEY`) |
| R-UI-01..06 | ✅ | live updates are 5 s polling, not websockets |
| Top-ranked *users* leaderboard (v2) | ❌ | superseded by per-board listing leaderboards |
| Apple/Google Pay, PayPal, ACH | 🟡 | depends on processor config (Stripe Dashboard now, Dodo later) |
