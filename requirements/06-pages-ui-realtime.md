# 06 Pages, UI, real-time

| Page | Route | Requirement |
|---|---|---|
| Home | `/` | Home button, categories, login/register, homepage top ranked + more, activity, randomised unranked below (v2 §2) |
| Category | `/c/[slug]` | Same board layout for that category |
| Explore | `/explore` | Search by keyword and category; ranked first, unranked after (random order) (v3 #31, #36) |
| Post | `/post` | Posting flow + price matrix (R-LST-06) |
| Listing | `/listing/[id]` | Detail, history, upgrade/renew |
| Fees | `/fees` | Public fee & bid rules |
| Login/Register | `/login`, `/register` | R-ACC-01 |
| Dashboard | `/dashboard` | R-DSH-01 |
| Admin | `/admin` | R-ADM-01 |

- **R-UI-01** Unranked listings display in random order (reshuffled per load), always below ranked ones, including in search. (v3 #5, #17, #36)
- **R-UI-02** Unranked listings are searchable by category and keyword. (v3 #31)
- **R-UI-03** Light, friendly **city-directory** look; explicitly *not* dark/purple. Clear amounts, large #1 spotlight, green claim buttons, responsive. (v3 #17; overrides v2 §5)
- **R-UI-04** Live updates: boards refresh without manual reload once a payment is confirmed. Implemented by polling a lightweight version endpoint (a few seconds) — works on serverless. (v3 #7, #18, #25)
- **R-UI-05** Activity feed: recent claims, upgrades and renewals from the ledger.
- **R-UI-06** Home/category pages show ≥15 ranked listings when they exist. (v2 §2)
