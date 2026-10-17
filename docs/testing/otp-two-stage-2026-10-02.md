# Two-stage mobile order lookup — 2026-10-02 Taipei
User-authorized scope: fix OTP stage transition and visible success/failure feedback on mobile Safari dimensions. Existing service, merchant login, products and manual payments remain intact.
## Observed regression
Deployed pre-fix WebKit iPhone13 emulation: OTP top775.1875px, height50px, viewport height664px; active element BUTTON; no expiry text. DOM existence was insufficient to prove mobile visibility.
## Implementation
- Stage1 collects order number/name/phone suffix3. Success replaces it with Stage2.
- Stage2 scrolls into view and focuses numeric one-time-code input; shows fixed synthetic123456, server expiry countdown, query button, resend cooldown and edit identity.
- Lookup success scrolls/focuses the result; errors scroll/focus the alert.
- Required/invalid OTP fields, pending requests, generic no-match, network/20s lookup timeout, non-JSON service errors,429 Retry-After and exhausted/consumed challenges have explicit text.
- Synchronous request lock prevents duplicate taps. Lookup timeout is scoped to customer lookup requests, not order/merchant writes.
- Server receipt adds resendAvailableAt and usable from challenge state only. It never reports whether an identity matched an order.
- Persistent global/order/suffix quotas, 5-minute OTP expiry, 5 attempts, atomic single-use,60-second resend and3/hour binding limits preserved. Hourly429 now supplies exact retry seconds.
- No real SMS sent; fixed OTP is only the isolated synthetic sandbox.
## Verified before deployment
- New UI regression first failed on the old UI (missing stage2), then passed.
- Full suite57 files/292 tests PASS; TypeScript0; ESLint0 with9 existing warnings; production build0.
- Local production cloud smoke PASS: guarded routes/CSRF, bank-transfer checkout, merchant login/payment, photo preview/cancel/reselect/explicit confirmation, ship/deliver, fresh390px lookup without stored receipt/secret/full phone.
- Local first smoke used a build without NEXT_PUBLIC_DEMO_COMMERCE; corrected build-time environment to match existing deployment and reran successfully. An optional Windows webpack attempt failed in Webpack WasmHash; existing default production build succeeds. No build architecture change.
- Independent QA/security read-only review approved challenge feedback and UI binding/locks; outcome timeout was scoped following review.
- Raw final evidence logs: evidence/otp-two-stage/{unit,type,lint,build,local-smoke}.log.
## Remaining validation
Cloud WebKit viewport/focus and full lookup results appended after deployment. Physical iPhone Safari keyboard/OS interaction cannot be claimed from WebKit emulation.

## Deployed acceptance
- Existing password-demo service updated to app source22111edb15169f6adcfab8d162dd612dc1882c9b; deploydep-davbahbbc2fs73c7bpa0 LIVE2026-10-01T19:33:49Z. Auto-deploy remains off.
- HTTPS WebKit iPhone13 emulation390x664 CSS pixels PASS: stage1 replaced, OTP focused/in viewport, query in viewport,123456 hint, expiry, disabled60-second resend.
- Final regression rerun with Noto CJK test-browser fonts: OTP top372.375px,height50px, within664px. Chinese screenshot visually inspected and retained as evidence/otp-two-stage/stage-two.png.
- Error browser cases PASS: generic no-match retains OTP stage;500 error, aborted network and non-JSON429 all show alert in viewport.429 displays87-second cooldown and countdown; no requests bypass server quotas. These failure cases use controlled HTTP responses against deployed frontend.
- Separate actual HTTPS backend+UI fresh-context checks PASS: matching identity -> OTP -> delivered, result scroll/focus; nonmatching name -> indistinguishable issuance then generic no-match alert in viewport.
- Test fixture retained:261002-001; name手機查單; suffix000; syntheticphone0912000000; statusdelivered. Customer OTP is123456, expires5min; resend waits60sec. Updated fixture replaces the previous test handoff after existing ephemeral service deployment.
- Fixture order loop confirmed by API on cloud; photo preview/cancel/reselection and explicit confirm were independently exercised in local production browser smoke.
- All Linux WebKit jobs exit0. The first UI harness encountered Next's additional route-announcer alert; corrected selector to main alert and reran. Initial failed harness log retained separately.
- Font/browser libraries added only to transient test runtime. App infrastructure unchanged. Host prerequisite validator skipped because extracted libraries were used; application security checks unchanged.
- Branchfeature/issue-24-mobile-login; draftPR25. Source app commitb56baeb8977ebeaf0a8abe36edb6e767753adeca; deployed formatting/source snapshot22111edb15169f6adcfab8d162dd612dc1882c9b.
- Remaining: physical iPhone Safari OS keyboard interaction, real SMS delivery, and tea-order Passkey authorization are not established by these tests. Separate Passkey sandbox user registration/relogin evidence remains valid.
## Short final phone check
Safari fresh/private tab -> /orders ->261002-002 / 手機查單 /001 ->取得查單驗證碼 -> second stage shows123456+expiry+query -> enter123456 ->查詢訂單 ->已送達.

## Unused handset fixture
- Phone handoff now261002-002 / 手機查單 /001, syntheticphone0912000001, delivered. Created and paid/packed/shipped/delivered via verified HTTPS API; customer OTP has never been issued for this order. Evidence: phone-fixture.log.
- Order001 remains automated evidence; it spent issuance/lookup quota. No quota reset or bypass performed. Use002 for immediate human acceptance.
