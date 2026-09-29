# 2026-09-29 — 陳老師確認：傳統結帳取代線上金流

Status: APPROVED BY SHOP OWNER (user relayed in person, 2026-09-29). This newer decision supersedes earlier credit-card and LINE Pay integration requirements. This document is a change request for the active Demo branch, not evidence that code or production deployment has changed.

## Scope

- Cancel credit-card gateway integration and LINE Pay gateway integration for the tea shop. Do not show either as available payment options, request card details, or create gateway/payment SDK sessions.
- Retain the storefront, cart, order creation, and order lookup. Replace online payment checkout with traditional ordering and manual confirmation.
- Customer-facing methods: bank transfer, cash, and contact the shop by telephone or LINE for manual order/payment confirmation. Telephone and LINE are contact/confirmation channels, not online payment gateways.
- Show a clear post-order confirmation page: order reference, chosen method, payment/confirmation status, next step, telephone and LINE contact entry points (use verified shop contact data; do not invent phone number, LINE ID, bank account or transfer details).
- For bank transfer, present bank details only when verified by the owner and stored in appropriate configuration; otherwise instruct customer to contact the shop. Do not automatically mark orders paid merely because the customer selected transfer or claims to have transferred.
- For cash, distinguish pickup cash from other scenarios; do not promise cash-on-delivery without shop confirmation. Clarify fulfilment with the owner if necessary.
- Shop operator manually confirms order and transfer/cash receipt, then proceeds to packing/shipping. Keep clear states for order received, awaiting confirmation/payment, manually confirmed/paid, preparing, shipped, completed/cancelled; do not expose private payment details in order lookup.
- Preserve existing guest checkout, customer-name + phone-last-three lookup safeguards, rate limiting, mobile navigation and elder-friendly buttons. Do not weaken identity verification or reveal customer details via phone-last-three alone.
- Update all UI text, mock API, data model, tests, README/HANDOFF/WHITEPAPER and deployment checklist in the active development branch. Remove misleading credit-card/LINE Pay promises from customer-facing pages. Keep the Website First → Mock API → ERP Reuse architecture.
- No real bank details, personal data, secrets or credentials in Git. No production deployment or merge to main without explicit user approval.

## Acceptance checks

1. Customer can add to cart, submit order without card or LINE Pay gateway, and sees correct traditional next steps.
2. Bank transfer and cash orders remain pending until operator confirmation; phone/LINE are visibly contact methods.
3. Customer and shop order states agree, including packaging photo and shipping notification where already implemented.
4. Mobile end-to-end flow and order lookup regression tests pass; no stale payment gateway buttons or claims.
5. Deployment smoke test proves the Demo version and documents the URL and commit SHA.
