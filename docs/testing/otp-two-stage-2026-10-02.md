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
