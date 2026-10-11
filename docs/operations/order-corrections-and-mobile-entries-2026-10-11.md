# ORDER corrections and mobile entries — 2026-10-11

Branch: `feat/mobile-three-pwa-entries`, based on PR #28 branch head `dce7db1`.
This work is isolated. No merge, Acer deployment, production-data import, or change to the five-day monitor is part of this branch.

## Order correction contract

- ORDER-01: merchant payment confirmation and its reversal are append-only events with timestamp, reason, and the authenticated merchant principal. Reversal restores `pending-manual-verification`; it is blocked after shipment.
- ORDER-02: a packed order can be reopened with a required reason, then receive a newly selected and previewed photo and explicit reconfirmation. Each packing and reopening event remains in the order snapshot. The existing private photo store retains uploaded originals.
- ORDER-03: shipment status never regresses. An authenticated merchant can record a shipping exception, intercept request, or shipment-record correction with a reason. The current shipment status stays visible and the customer is told an intercept request does not mean the carrier has reversed the shipment.
- Customer lookup reads the same order snapshot as merchant order management. Its progress component displays correction history and the current shipping-attention notice.

The current merchant setup is a single bound merchant account. Audit events identify the authenticated merchant principal (`authenticated-merchant`), not a named human. Do not claim per-staff attribution until individual merchant accounts exist.

## PWA entry points

Each entry has a stable, unique manifest ID, start URL, scope, two PNG icon sizes, and route metadata:

| Entry | Route | Manifest | Scope |
|---|---|---|---|
| Storefront | `/` | `/manifest-storefront.webmanifest` | `/` |
| Product management | `/admin/products` | `/manifest-products.webmanifest` | `/admin/products` |
| Order management | `/admin/orders` | `/manifest-orders.webmanifest` | `/admin/orders` |

The admin APIs validate the shared merchant session on the server. Product data that includes unpublished items and all catalog mutations require an authenticated session. Both management entries reuse the existing merchant Passkey/session.

Same-origin nested scopes are permitted by the manifest format, but browsers do not reliably treat nested apps on one origin as fully independent. Chrome may suppress the inner-app installation prompt after the root app is installed, and outer-scope link handling can capture nested routes. The manual fallback is the fixed route shortcut: open each route separately in Samsung Chrome and add it to the home screen. The install guide at `/install` recommends installing the two admin entries before the storefront.

Reference: https://web.dev/articles/building-multiple-pwas-on-the-same-domain

## High-risk reauthentication plan

Keep routine product/order work on the existing live session. Before enabling high-risk actions in a live environment, add a server-verified, one-use WebAuthn step-up challenge with required user verification, a short expiry, action/order binding, and an audit event. Require step-up for payment confirmation/reversal, lookup-secret rotation, price/publication changes, package reopening, and shipment correction actions. Keep origin, host, HTTPS, session, and CSRF checks unchanged. Expired or reused challenges must fail closed.

## Verification run — 2026-10-11

- `npm run lint`: passed with 0 errors and 10 warnings (image element advisories and pre-existing checkout warnings).
- `npm run typecheck`: passed.
- `npm run test:run`: 65 test files, 328 tests passed.
- `npm run build`: passed. Turbopack reports existing dynamic filesystem tracing warnings for the file-backed Demo stores.
- `playwright.demo.config.ts` mobile Chromium: the order loop passed, covering payment confirmation/revocation, repacking with replacement photos, intercept recording without shipment rollback, and customer OTP lookup of the corrected history.
- The PWA routing test passed for all three paths and their distinct manifest IDs, start URLs, scopes, icons, and reload destinations using 390 × 844 touch emulation.
- The optional `node cloud-demo-smoke.mjs` entry point could not start in this checkout: Node 24 failed to resolve the extensionless TypeScript import `lib/server/demo-cloud`, and no local `tsx` loader is installed. This was not counted as a pass; the route-level browser loop and Vitest suite above passed.

No deployment was performed. The Acer candidate/original containers, data, and five-day monitor were not touched by these tests.

## Mobile acceptance checklist

**Automated route and manifest check:** all three route paths load, expose their own manifest and icons, survive reload, and retain the expected path. Test at 390 × 844 with touch emulation.

**Samsung Android Chrome still requires device/emulator acceptance:**
- [ ] Install or add each route independently; verify three distinct home-screen labels and icons.
- [ ] Install product and order entries before storefront; test the reverse order and record whether Chrome merges or captures any routes.
- [ ] Force-stop/reopen each icon; verify each starts at its own route without a blank screen or 404.
- [ ] Test back navigation, shared Passkey session, logout, and direct unauthenticated access to both management entries.
- [ ] If app installation is not distinct, add fixed shortcuts from each route and repeat launch checks.

Do not mark Android installation complete until this checklist has been run on a Samsung device or Android Chrome emulator and evidence is attached.
