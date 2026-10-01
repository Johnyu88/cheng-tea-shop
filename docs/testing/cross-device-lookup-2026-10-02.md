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
