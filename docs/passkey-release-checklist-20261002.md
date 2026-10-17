# Tea Passkey release acceptance checklist — 2026-10-02

Task: `TEA-RELEASE-20261002-03`  
Scope: close the tea merchant Passkey path by reusing the existing BetterAuth integration. Customer lookup is already handset-accepted and is not repeated here.

## Gate status

- [ ] **Delivery gate:** review the dirty source/config set below as one change set; preserve unrelated `next-env.d.ts` work.
- [ ] **Verification gate:** use the coordinator’s recorded result: 61 files / 307 tests, `tsc --noEmit` exit 0 at 13:31. Do not rerun unchanged tests as part of this checklist.
- [ ] **Handset gate:** obtain physical handset evidence that the login prompt was accepted with Face ID. Existing screenshots prove registration, logout, and Passkey re-login, but do not distinguish Face ID from device PIN.
- [ ] **Cloud gate:** after an authorized delivery, run the four-step live flow below against the current isolated target and record the result; do not claim a deployment URL or commit until one actually exists.

## Required review set

### New Passkey and BetterAuth files

- [ ] `app/api/auth/[...all]/route.ts` — same-origin guard; open authentication/session paths; merchant-session protection for registration-management paths.
- [ ] `app/api/demo/admin/passkey/enroll/route.ts` — existing merchant credential/fallback gate before BetterAuth bootstrap session.
- [ ] `features/demo/components/admin-passkey-login.tsx` — first-use enrollment, Face ID/Passkey login, and password fallback UI.
- [ ] `features/demo/merchant-passkey-client.ts` — official BetterAuth React client plus Passkey plugin.
- [ ] `lib/server/merchant-passkey.ts` — isolated BetterAuth store, SQLite migrations, resident/user-verified Passkey policy, cloud origin allowlist, merchant binding, session expiry, and fail-closed environment checks.
- [ ] `lib/server/merchant-request-access.ts` — live BetterAuth session bridge to the existing merchant cookie boundary; no bridge cookie is emitted to the browser.

### Existing tea authorization and order surfaces touched by the bridge

- [ ] `app/api/demo/admin/session/route.ts` — reports Passkey state, signs out the BetterAuth session, and clears legacy merchant cookies.
- [ ] `app/api/demo/admin/orders/route.ts` — uses the bridge for order listing.
- [ ] `app/api/demo/admin/orders/[orderId]/route.ts` — uses the bridge for merchant order actions.
- [ ] `app/api/demo/admin/orders/[orderId]/packing-photo/route.ts` — uses the bridge for packing-photo upload.
- [ ] `app/api/demo/catalog/route.ts` — uses the bridge for protected merchant catalog access.
- [ ] `features/demo/components/admin-orders-page.tsx` — Passkey state, registration, logout, login resume, and order-page entry.
- [ ] `features/demo/demo-api.ts` — enrollment, status, logout, and existing order API calls.
- [ ] `lib/server/demo-access.ts` — retains the existing cookie verification boundary used by the bridge.

### Runtime/configuration and dependency files

- [ ] `package.json` — `better-auth` and `@better-auth/passkey` dependencies.
- [ ] `pnpm-lock.yaml` — lockfile entries for those dependencies and their transitive WebAuthn packages.
- [ ] `next.config.ts` — standalone server externals for BetterAuth packages.
- [ ] `start-cloud-demo.mjs` — prepares the merchant Passkey store before the standalone server starts.

### Focused tests

- [ ] `tests/admin-passkey-login.test.tsx`
- [ ] `tests/merchant-passkey.test.ts`
- [ ] `tests/merchant-passkey-routes.test.ts`
- [ ] `tests/merchant-passkey-bridge.test.ts`

`next-env.d.ts` is an existing dirty generated/user change and is not part of the Passkey review scope; do not overwrite it.

## Runtime values to configure (names only)

Configure through the isolated cloud environment; never place values in Git or this checklist:

`NEXT_PUBLIC_DEMO_COMMERCE`, `DEMO_COMMERCE_CLOUD`, `DEMO_CLOUD_ORIGIN`, `RENDER_EXTERNAL_URL`, `DEMO_PREVIEW_TOKEN_SHA256`, `DEMO_MERCHANT_SECRET`, `DEMO_AUTH_ENV`, `DEMO_AUTH_PROVIDER`, `DEMO_AUTH_PASSWORD`, `DEMO_DATA_DIR`.

Local-only verification names present in the implementation are `DEMO_COMMERCE_LOCAL` and `DEMO_PASSKEY_LOCAL_ORIGIN`.

## Origin and relying-party binding

- Cloud origin: `https://cheng-tea-password-demo.onrender.com`.
- Cloud `rpId`: `cheng-tea-password-demo.onrender.com` (derived from the configured origin hostname).
- BetterAuth `basePath`: `/api/auth`.
- Registration requires an existing BetterAuth session; resident credentials and user verification are required.
- Do not use the independent `cheng-tea-passkey-sandbox.onrender.com` as tea acceptance evidence; it is not connected to tea orders.

## Current isolated cloud target and existing deployment command

Target: the existing isolated Render password-demo service at `https://cheng-tea-password-demo.onrender.com/admin/orders`. This is the target name/origin already enforced by the source; this checklist does not assert that the current dirty worktree has been deployed there.

The repository’s documented Render command is:

```text
Build: npx --yes pnpm@11.19.0 install --frozen-lockfile && npx --yes pnpm@11.19.0 run build
Start: node start-cloud-demo.mjs
```

Use the existing isolated service and its existing data carefully: Render free-service storage is ephemeral. No reset, service recreation, or redeployment is authorized by this checklist.

## Live acceptance flow

Perform only after the authorized delivery is available, using a fresh merchant session:

1. Open `/admin/orders` on the isolated target. On first use, enter the authorized merchant password and choose **設定這支手機的 Passkey**; accept the platform credential prompt.
2. Confirm the merchant order page is visible, then choose **登出**. Confirm the page is no longer authenticated and the Passkey session is ended.
3. Choose **使用 Face ID／Passkey 登入**. On the physical handset, capture evidence that Face ID—not only device PIN—accepted the prompt. Confirm the merchant page becomes authenticated again.
4. Confirm the merchant order page loads through the bridge and can list the existing synthetic orders. Do not create or mutate an order for this login-only gate; customer lookup remains out of scope.

## Blocking gaps versus pending handset proof

### Blocking gaps before release acceptance

- [ ] The dirty change set has been reviewed and delivered through the authorized release path.
- [ ] The isolated cloud target has been live-checked with the exact origin/rpId binding above.
- [ ] The registration → logout → Face ID login → merchant order page flow passes on a physical handset.
- [ ] The four focused Passkey/bridge test results are attached to the coordinator’s existing 61-file / 307-test evidence; no new test rerun is required here unless source changes.

### Pending handset proof only

- [ ] Physical handset screenshot/video or witnessed result explicitly identifies Face ID as the authenticator during step 3.

The existing customer lookup handset acceptance is complete and must not be repeated as a Passkey release condition. The independent Passkey sandbox screenshots are supporting background only, not tea merchant authorization evidence.

## Next action

Have the release coordinator review the listed dirty files, deliver them to the existing isolated cloud target through the already documented command, then collect the single missing physical Face ID proof and append the live result to the delivery record.
