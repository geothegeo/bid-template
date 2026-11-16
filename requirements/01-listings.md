# 01 Listings

- **R-LST-01** Two listing types: **ranked** and **unranked**. Both are paid; there is no free claiming. (v3 #13, #25, #27, #31, #32)
- **R-LST-02** A listing belongs to exactly one **board**: the homepage or one category (level 1 or level 2). (v3 #2, #5, #33)
- **R-LST-03** User-supplied content is limited to: title, URL **or** `#handle`, short description, optional image URL. (v2 form, v3 #28)
- **R-LST-04** Posting a listing does **not** require an account, for ranked or unranked. Each purchase is one-by-one, no holding account. (v3 #30; supersedes v2 "unranked needs account")
- **R-LST-05** A contact email is collected at purchase so expiry notices and receipts can be sent.
- **R-LST-06** Posting flow: choose type → board (home/category) → position (ranked) or duration (unranked) → details → price matrix/fee table → pay. (v3 #6)
- **R-LST-07** A listing is visible only after payment is verified by webhook; pending listings never appear. (v2 §4, v3 #3)
- **R-LST-08** Every paid listing has an expiry. Ranked: **1 year** from the latest payment. Unranked: purchased length (1, 3, 6 or 12 months; configurable). Expired listings disappear immediately. (v3 #1, #9, #10, #23, #29)
- **R-LST-09** Duplicate detection: an active listing with the same normalised URL on the same board cannot be posted again; the user is pointed to the existing listing to upgrade/renew. (v2 §4)
- **R-LST-10** A user can hold many listings across boards. (v3 #15, #37)
- **R-LST-11** An unranked listing can be upgraded to ranked by paying the difference between the ranked price and what was paid for the unranked plan. (v2 §3)
- **R-LST-12** Unranked fees are one-off, non-refundable; no auto-renewal. Renewal is manual, extending from current expiry if still active. (v3 #7, #33)
