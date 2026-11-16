# 07 Conflicts and open questions

## Conflicts resolved (v3 wins)
| Topic | v2 | v3 | Decision |
|---|---|---|---|
| Accounts | Unranked needs account | #30 no registration, no holding account | No account needed; accounts are optional for the dashboard |
| Theme | Dark, purple/blue | #17 "not too dark or purple" | Light directory theme |
| Stack | Supabase, Supabase Auth, Stripe/Dodo, OpenAI | Brief: keep architecture | Keep Next.js + Prisma + Postgres; simple own session auth; no AI features |
| Unranked prices | $10/mo, $100/yr | $10/mo, $60/6mo, $100/yr; 1/3/12 mo mentioned | Plans configurable per board; defaults 1/6/12 mo |
| Free claiming | Option listed | All listings paid | No free claiming |
| Leaderboard of users | "Top-ranked users" | Not mentioned | ❌ Not built; boards are per listing |

## Open items (need client input)
1. Dodo Payments API keys and supported methods (PayPal/ACH later).
2. Removal/refund/moderation policy (v3 #34, #37 unanswered). Currently no admin removal; listings are non-refundable.
3. Outbid alerts (email/push) — asked in v3 #36, not answered.
4. Ranked renewal price when expired (assumed fresh purchase) and whether partial upgrades from an unranked credit are wanted.
5. Scalability (v3 #4 "any suggestions"): ranks computed on read with indexes per board is fine to tens of thousands of listings per board; beyond that cache boards or materialise ranks.
