# 04 Categories, fees and admin

- **R-CAT-01** Categories are two levels deep (e.g. Real estate → Agents). Count is unlimited. (v3 #8, #22)
- **R-CAT-02** Admin creates, renames, reorders and deletes (if empty) categories.
- **R-CAT-03** Any visitor may **suggest** a category; it is unavailable until admin approves. (v3 #7, #33)
- **R-FEE-01** The homepage and each category have an independent **board config**: minimum bid, minimum increment, and unranked plans (months → price). (v3 #12, #22, #25)
- **R-FEE-02** Fee structure and bid rules are visible to all users (`/fees`, and on each board and posting form). (v3 #12)
- **R-FEE-03** Defaults when a board has no explicit config: min bid $5, increment $5, unranked 1 mo $10 / 6 mo $60 / 12 mo $100. (v2 §3, v3 #33)
- **R-ADM-01** Admin dashboard scope: categories, category suggestions, and fee/bid rules only. No manual ranking, moderation or refunds in v1. (v3 #18)
- **R-ADM-02** Admin accounts are designated via `ADMIN_EMAILS`.
