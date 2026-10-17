# Cross-device order lookup acceptance — 2026-10-02 Taipei
User-authorized scope: order number + customer name + phone last three digits; mandatory OTP. No customer copying/pasting long lookup credentials. Existing payment, product management, merchant authentication and services remain intact.
## Implementation
- Reuses existing runtime, HTTP guard, SQLite identity store and OTP route; no new service/provider.
- Customer submits three identity fields to issue a challenge, then those fields + challenge ID + six-digit OTP to query.
- Long secret remains in existing internal/legacy verification path. New UI does not read, render, require or transmit it.
- Empty browser/session storage supports manual three-field lookup. Original tab receipt autofills convenience identity fields only.
- Changing any identity field invalidates the visible OTP challenge and result.
- New SQLite challenge table is additive: normalized identity binding, salted code digest, 5-minute expiry, 5 guesses, single-use atomic verification, 60-second resend cooldown, 3 challenges/hour per binding.
- Wrong identities and nonexistent order numbers receive indistinguishable decoy receipts, then generic verification failure.
- Existing persisted global/order limits retained; suffix limits replace full-phone customer input. Global issuance 15/15min; order/suffix issuance 3/15min; global lookup 40/15min; order/suffix lookup 5/15min. Retry-After retained.
## Verification
- Frontend RED: original UI failed because credential input remained. GREEN: fresh storage submits only identity fields; editing identity clears verification.
- Backend RED missing lookup-OTP method; focused GREEN 16/16, including swapping, replay, expiry, invalid identities, shared phone orders and quotas/failed attempts across runtime restart.
- Full suite: 54 files, 277 tests PASS; initial full run detected an old success-page test expecting only one status node, corrected to assert the specific copied-number message.
- TypeScript exit 0; ESLint exit 0 with 9 existing warnings; production build --webpack exit 0.
- Independent QA/security review approved private synthetic scope; root inspected changes and ran fresh full tests.
- Actual browser and cloud outcomes will be appended after execution. Logs: evidence/2026-10-02-cross-device-*.log.
## Acceptance boundaries
- OTP is page-visible fixed synthetic code in the isolated demo, not real SMS or proof of phone possession. No SMS delivery claimed.
- Windows WebKit failed creating a page (browser/context closed); retained failure log. Do not equate Chromium or WebKit emulation with physical iPhone Safari.
- Physical phone Safari cross-device test still requires user action unless explicit handset evidence is obtained.
- Historical identities without a name digest fail closed; test fixtures created by current checkout have the digest.
- A consumed challenge is returned during its remaining 60-second cooldown; wait before requesting a fresh one.
- Passkey remains separate sandbox and not integrated with tea merchant authorization.
- Demo delivery is simulated; Render data directory remains ephemeral.

## Deployed cloud acceptance
- Existing service srv-daukf2ojo6nc73dhmrfg deployed source e05fa2c33a8d7cf0bf06cdb70283588e93318f38, deploy dep-davakg2d0e5s73f85vj0 LIVE at 2026-10-01T18:46:52Z.
- Mobile Chromium HTTPS order loop 12/12 PASS, exit 0, 68.27s. Retained delivered order 261002-003, name CrossDeviceAcceptance, suffix 001.
- Final lookup uses a separate browser context at 390px with empty session storage and manually entered three identity fields; captured requests contain neither accessSecret nor phone.
- Initial cloud attempts stopped at an unrelated clipboard spy assertion before lookup; the focused new lookup runner excludes clipboard coverage. Existing original acceptance runner and local public-number clipboard test remain intact.
- No service/architecture/payment-provider replacement or main merge. Existing generated next-env.d.ts modification preserved.

## Mobile WebKit HTTPS result
- Linux Playwright WebKit 26.5 / build 2336 with iPhone 13 device emulation PASS, exit 0. Test-only browser libraries loaded from extracted temporary packages after Windows WebKit page creation failed; no application service or dependency changed.
- Test fixture created by API, manually confirmed payment, uploaded packing photo, shipped and simulated delivered; separate WebKit browser context has zero session storage.
- Customer UI receives manually entered order number/name/suffix, issues OTP, and displays delivered. Captured customer requests contain neither accessSecret nor full phone. No horizontal overflow.
- Retained phone fixture: order 261002-006; name 手機查單; synthetic phone 0912000000; suffix 000. Use page-provided simulated OTP.
- WebKit automated evidence is not physical iPhone Safari acceptance. Short remaining phone check: Safari private/new browser session -> /orders -> three fixture fields -> obtain OTP -> query -> confirm delivered with no credential step.
- Runners: scripts/cross-device-live-acceptance.mjs and scripts/cross-device-webkit.mjs; credentials via private environment only. Retained logs include Chromium live and Linux WebKit live result.
- Formal real SMS, actual delivery and Passkey tea authorization remain outside this private demo completion.
