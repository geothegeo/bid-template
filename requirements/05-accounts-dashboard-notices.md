# 05 Accounts, dashboard, notices

- **R-ACC-01** Optional accounts (email + password, username). Not needed to buy. (R-LST-04)
- **R-ACC-02** Listings bought while logged in are linked to the account.
- **R-DSH-01** User dashboard lists every linked listing: ranked/unranked, board, current position, paid amount, start date, expiry date, with actions to upgrade/renew. (v3 #15)
- **R-DSH-02** Listing detail page shows position, history of confirmed payments and expiry.
- **R-NTC-01** Email notice **30 days** before ranked expiry and **7 days** before unranked expiry; sent once per period. (v3 #1, #7, #19)
- **R-NTC-02** Notices are driven by a scheduled endpoint (`/api/cron/notices`, protected by `CRON_SECRET`). Email via Resend if `RESEND_API_KEY` is set, otherwise logged.
- **R-NTC-03** Outbid alerts: ❌ not requested (v3 #36 asked, no answer) — see open questions.
