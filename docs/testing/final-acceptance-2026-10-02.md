# Final acceptance checkpoint — 2026-10-02 Asia/Taipei
Status: BLOCKED_EXTERNAL for cloud credential verification; local order loop PASS.
Source: feature/issue-24-mobile-login, a91e0e31e2c23fc3b2f16964cefe48673064a853, PR #25.
Existing next-env.d.ts generated changes were preserved and excluded from this checkpoint.

## Fresh verification on edea
- node node_modules/vitest/vitest.mjs run: exit 0; 52 files, 266 tests passed.
- node node_modules/typescript/bin/tsc --noEmit: exit 0.
- node node_modules/eslint/bin/eslint.js .: exit 0; 0 errors, 9 existing warnings.
- NEXT_PUBLIC_DEMO_COMMERCE=enabled node node_modules/next/dist/bin/next build --webpack: exit 0.
- node cloud-demo-smoke.mjs: exit 0; real local API and mobile browser order loop passed.
- sandboxes/passkey-lock: node tests/run-local-fixtures.mjs: exit 0; both independent virtual CTAP2 fixtures passed.
Logs: docs/testing/evidence/2026-10-02-final-{tests,lint,build,order-loop,passkey}.log.
Runtime Node 24.21.0 differs from declared 24.19.0.

## Verified loop
Synthetic bank transfer checkout and receipt; customer lookup; merchant password login; manual payment confirmation; camera/gallery selection; preview without a write; cancel; reselect; explicit packing confirmation with exactly one write; shipment; simulated delivery; updated customer lookup shows delivered.
Camera interaction injects a file and verifies capture attribute; actual handset camera and Face ID remain untested.
Smoke fixtures are temporary and cleaned up. No retained cloud test order was created or revalidated this round.
Independent read-only QA confirmed the limitations below.

## Existing deployments and entrance
- Password business test: https://cheng-tea-password-demo.onrender.com/admin/orders ; outer Basic username preview; inner Demo password.
- Customer entrance: https://cheng-tea-password-demo.onrender.com/orders .
- Independent Passkey: https://cheng-tea-passkey-sandbox.onrender.com/ ; outer Basic username sandbox; bootstrap account login before Passkey registration.
- Render reports password deployment live at 12a60bd105b84fe1840be7420c90235a60da05de and Passkey deployment live at a91e0e31e2c23fc3b2f16964cefe48673064a853.
Current cloud passwords/bootstrap account were unavailable. Removed private runner configurations were not recreated with guessed values.
No cloud environment changes, redeployment, data reset, main merge, product-management edits or payment-provider changes.

## Remaining acceptance gaps
1. Cloud access secrets and bootstrap account must be supplied through an authenticated private channel before live loop/order retention can be verified.
2. Lookup is not name plus suffix alone: order number, access secret, full synthetic phone and OTP are required. Original checkout tab auto-fills via sessionStorage; a new tab/device requires manually saved credentials.
3. Passkey sandbox has no tea-business authorization bridge. Hardware acceptance must precede AuthProvider integration with merchant allowlist and password fallback.
4. Free cloud data is ephemeral. Preserve existing services and orders; do not restart/redeploy without verified complete backup and restore.
5. Manual delivery is a simulation; no real bank transfer, carrier delivery or external notification was performed.

## Shortest phone confirmation after valid credentials are available
Business: open admin/orders, log in, use a NEW synthetic order, confirm payment, choose/take photo, check preview, confirm packing, ship, simulate delivery; return to the SAME checkout tab and query with name/suffix and displayed synthetic OTP 123456.
Passkey: open separate sandbox, initial account login, register phone Passkey, log out, log in with Passkey. Report whether iPhone offers and accepts Face ID/device unlock.
These steps do not mark actual merchant Passkey integration or cross-device name/suffix lookup complete.
