# 03 Payments

- **R-PAY-01** Target processor: **Dodo Payments** (dodopayments.com) with cards, Apple Pay, Google Pay at launch; PayPal and ACH added later when Dodo supports them. (v2 §2, v3 #1, #10, #21, #35)
- **R-PAY-02** Architecture keeps payment code behind one module (`lib/stripe.ts` + checkout/webhook routes) so the processor is swappable; Stripe remains a backup option. (v3 #5)
- **R-PAY-03** Webhook signatures are verified; a payment must match the stored amount and currency before it is applied; processing is idempotent. (v3 #3)
- **R-PAY-04** Same-position race: the payment confirmed first wins (R-RNK-02).
- **R-PAY-05** Receipt/checkout line item includes: ranked or unranked, homepage or category, valid period. (v3 #28)
- **R-PAY-06** All payments are non-refundable.
- **R-PAY-07** Immutable **ledger** (append-only) records every confirmed payment and the resulting board position, powering the activity feed and dispute resolution. (v2 §3 activity, v3 #19)
- **R-PAY-08** Whole-dollar bids in USD; per-board minimum bid.

> Dodo status: ⏳ blocked on credentials/API keys (client: "will provide the info for integration"). Stripe Checkout is the working implementation until then.
