# Requirements

Source documents (repo root, untracked originals):
- **v2** – `clone outbid.lol_version 2.docx` (original brief)
- **v3** – `clone outbid_version 3.docx` (client answers to freelancer questions; **newer, wins on conflict**)

Product: a **city-directory** version of Outbid.lol. People and businesses pay to rank a listing on the homepage or in a category; cheaper **unranked** listings sit below all ranked ones.

Architecture is fixed: Next.js (App Router) + Tailwind + PostgreSQL via Prisma, hosted on Vercel. Requirement IDs (`R-…`) are referenced in code comments and tests.

| File | Contents |
|---|---|
| [01-listings.md](01-listings.md) | Listing types, posting flow, lifecycle |
| [02-ranking-and-bidding.md](02-ranking-and-bidding.md) | Ranking engine, price matrix, upgrades |
| [03-payments.md](03-payments.md) | Payment provider, webhooks, receipts, ledger |
| [04-categories-fees-admin.md](04-categories-fees-admin.md) | Category tree, per-board fee rules, admin |
| [05-accounts-dashboard-notices.md](05-accounts-dashboard-notices.md) | Accounts, dashboard, expiry notices |
| [06-pages-ui-realtime.md](06-pages-ui-realtime.md) | Pages, search, design, live updates |
| [07-conflicts-and-open-questions.md](07-conflicts-and-open-questions.md) | v2/v3 conflicts, decisions taken, open items |
| [08-status.md](08-status.md) | Implementation status per requirement |

Status legend: ✅ implemented · 🟡 partial · ⏳ deferred (blocked) · ❌ out of scope.
