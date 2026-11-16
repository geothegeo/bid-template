# 02 Ranking and bidding

- **R-RNK-01** Each board has its own ranking, independent of other boards. Positions start at #1–#20 for bidding. (v3 #5, #14, #25)
- **R-RNK-02** Order = total paid amount (desc), then **earliest confirmed payment** (asc), then id. First confirmed payment wins ties. (v3 #3, #17)
- **R-RNK-03** The board has **no cap**: when new bids land above, older listings slide down to #21, #22 … and stay displayed while unexpired. Ranked listings are **always above** unranked ones. (v3 #1, #9, #14)
- **R-RNK-04** Price to claim position *p*: `total of current holder of p (excluding the bidder) + minimum increment`. If fewer than *p−1* listings exist, price is the board minimum bid (bidder lands just below the last listing). Price is never below the board minimum bid. Examples: v2 §3 ($500/$300/$150/$50, inc $50 → #1 costs $550; inc $20 → #2 costs $320).
- **R-RNK-05** The posting UI shows a **price matrix** of positions 1–20 with the price for each. (v3 #6)
- **R-RNK-06** Upgrade: a listing may pay the **difference** between its current total and a new total that meets the price for the target position. Example: $100 listing, #5 holder at $160, inc $15 → new total $175, pays $75. (v3 #1, #8, #14, #22)
- **R-RNK-07** A successful upgrade restarts the 1-year period from the confirmation date. (v3 #10, #15, #29)
- **R-RNK-08** The target position is a pricing guide only: final order is recomputed from totals when payment is confirmed, so concurrent bids can never produce an invalid board.
- **R-RNK-09** Ranking updates only on a verified payment webhook, never on checkout redirect. (v2 §4)
- **R-RNK-10** Ranks are computed on read from confirmed totals; shifting happens automatically with no manual admin ranking.  (v3 #16)
- **R-RNK-11** Expired ranked listings leave the board. They can be re-posted as a fresh ranked purchase (total restarts).
