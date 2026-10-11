# Acer mobile regression acceptance — 2026-10-11

## Scope and source evidence

This report records regression recovery for the Acer candidate built from PR #27. It does not certify a physical iPhone test.

- Last documented live mobile-browser acceptance source: `0fe4a50ebb65ad9f66814e41915ebfe36987c368`, Render deploy `dep-dav9s7h7lnhs73bimvbg`, documented in `docs/testing/live-acceptance-2026-10-02.md`. The recorded 12/12 cases used a 412x915 browser viewport. This is browser emulation, not physical iPhone acceptance.
- The 2026-10-02 iPhone screenshots documented Passkey sandbox login/register/logout/relogin only; they are not Tea shop flow evidence. No full-flow physical iPhone acceptance commit is documented.
- PR #25 source `d19ed4b8588c14c35c74c510f9c509bc3a0bf1ab`; PR #27 app commit `db392973e1809547a24f7334f18b79a323b2ba19` (with a later handoff-only commit). PR #27 contains security/dependency/Acer-origin changes; the relevant storefront/admin functions remained in source.
- PR #15 is docs-only; PR #26 is docs-only and its teacher bank/contact data remains pending verification. Neither is merged or the cause of the regression.
- Repair commit: `6a2b2e9014c53a657c4808729e0aeb5016924f40` (`fix: select demo commerce mode for Acer image`).

## Root cause

The Acer PR25 image had been built without `NEXT_PUBLIC_DEMO_COMMERCE=enabled`. Next.js compiles this public variable into the client bundle at build time. A runtime-only `DEMO_COMMERCE_ACER=enabled` setting cannot select Demo commerce in the built client. Consequently the storefront used in-memory mock products/services while catalog administration used the persistent Acer Demo catalog. The UI controls had not been deleted: storefront slugs and checkout/data providers were split across two modes.

The fix adds a Docker build argument with a safe default of `disabled`; Acer builds explicitly pass `--build-arg NEXT_PUBLIC_DEMO_COMMERCE=enabled`. The default preserves the normal/Render code path. No arbitrary-origin allowance was added.

## Accepted feature × source × Acer before × reason × candidate

| Function | Original source / acceptance | Acer before fix | Difference cause | Candidate evidence |
|---|---|---|---|---|
| Admin orders “return to home” | `admin-orders-page.tsx` in 0fe/PR25 source; PR27 adds auth controls without removing link | Link was present; mobile navigation needed regression confirmation | Not a missing component; mode mismatch made subsequent storefront data inconsistent | Mobile E2E opened admin, used password fallback, followed return-to-storefront/home path |
| Product admin “return to storefront” | `product-management-page.tsx` in 0fe/PR25 source | Link and eight saved items rendered | Same split catalog mode | E2E verified return navigation; eight catalog products remained |
| Product → cart jump | `product-detail-page.tsx`, `router.push('/cart')` after add; accepted source | Accepted tea slug had no product heading/add-to-cart; homepage exposed `mock-tea-001…` slugs | Build-time Demo flag absent: mock storefront vs persistent Demo catalog | Candidate homepage linked persistent tea slugs; E2E added product and reached cart/checkout |
| Checkout and order creation | `app/checkout/page.tsx` selects Demo checkout only when public build flag is enabled | Normal checkout branch selected, inconsistent with admin/lookup Demo data | Same missing build-time flag | E2E completed checkout OTP and created a synthetic order |
| Product edit and image replacement | `product-management-page.tsx` edit/select/preview/save in 0fe/PR25 source; unchanged in PR27 | Product list showed eight products/images, but not the matching persistent storefront data | Mode/data source split; component code remained | E2E edited a synthetic product, previewed/cancelled/reselected/replaced/saved, then reloaded and verified persistence |
| Order lookup | `/orders` Demo OTP lookup in source | Demo lookup page existed but its store was not aligned with in-memory storefront checkout | Mode/data source split | E2E used a fresh browser context and OTP to find the delivered synthetic order |
| OTP cross-device lookup | `OrderLookupPage`; `docs/testing/otp-two-stage-2026-10-02.md` | Lookup existed; no coherent order could be created from mismatched storefront path | Missing Demo checkout selection | Fresh-context OTP lookup returned the delivered synthetic order |
| Packing photo retake/select/cancel/reselect/confirm | Existing order packing UI and photo input in PR25/PR27 source | UI path was not deleted; reliable order lifecycle was blocked upstream | No persisted Demo order from storefront checkout | E2E asserted cancel/reselect caused zero writes and confirm caused one write |
| Shipping and delivery | Existing order lifecycle in admin orders source | Could not reliably exercise end to end from the old storefront order path | No matching persisted checkout order | E2E confirmed payment, shipped, marked delivered, then verified delivery through fresh-context OTP lookup |

## Verification record

- Candidate image: `tea-nextjs-staging:regression-flag`, image `sha256:e9d25f4352e3791ec646e1fd0163927457477d554c669d97652a8c9c6c4f3286`; built from PR27 source plus repair commit. Next.js build exited 0. Five existing dynamic filesystem tracing warnings were nonfatal.
- Full mobile browser E2E at 390x844 with touch emulation passed: storefront image/layout (12 loaded, 0 broken), product-to-cart, checkout OTP/order creation, admin return and password fallback, edit/photo preview/cancel/replace/save/reload, payment/packing-photo cancel-reselect-confirm, shipping/delivery, and new-context OTP lookup.
- One initial E2E attempt stopped due to the temporary test script toggling the editor closed; the script was corrected and the complete run passed. No app source change was made for that test-script issue.
- After E2E, candidate data was restored from the five-file synthetic baseline backup. The candidate was restarted and health returned 200. No E2E order/photo mutation remains in candidate data.
- Existing original `tea-nextjs-staging` / `tea-nextjs-staging:pr25` container remains running for rollback. Candidate runs separately as `tea-nextjs-regression` with isolated `regression-data`. Caddy routes to candidate; Caddy binds only `127.0.0.1:8090`. Tailnet URL is private: `https://acer-v5.tail4d8b5a.ts.net/`; Funnel/public exposure is off.
- Backups: `C:\data\tea-staging\backups\snapshot-20261011-165248` and `C:\data\tea-staging\Caddyfile.pre-mode-fix`. Caddy configuration is the rollback switch; original app container and data were retained.
- Fixed-mode five-day monitor started `2026-10-11T10:13:06Z`, due `2026-10-16T10:13:06Z`; JSONL: `C:\data\tea-staging\soak\soak-20261011-demo-mode-fix.jsonl`. This is in progress, not a completed soak.

## Remaining acceptance gates

- A human with the authorized iPhone must verify physical Safari, Face ID/passkey, camera/photo picker, and private Tailnet access. Desktop touch emulation does not certify those device-specific paths.
- Teacher bank/contact/LINE data remains unverified; Demo checkout placeholders must stay synthetic. Do not import real payment data until the verification tracked in PR #26 is resolved.
- The five-day soak has only just started. It must not be reported as passed until its deadline and log review.
- PR #28 remains a draft, unmerged independent branch. No merge to main was performed.
