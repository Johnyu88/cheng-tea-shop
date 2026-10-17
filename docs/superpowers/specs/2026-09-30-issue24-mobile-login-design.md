# Issue #24 — mobile merchant login and short order references
Approved scope: user directly authorized implementation, tests and cloud deployment on 2026-09-30, with no intermediate approval except teacher enrollment or hard blockers.
## Decisions
- Keep the original free Render preview unchanged: its local /tmp storage is ephemeral and no restorable raw export is available through current app routes.
- Publish a separate private free Singapore preview from feature/issue-24-mobile-login. No paid disk, main merge, original deployment or original configuration mutation.
- Independently reconstruct the explicitly identified synthetic Yu NT$800 order only on a new empty service with explicit opt-in. This is a fixture, not a backup of the original order.
- Preserve internal UUID and 64-hex lookup credential. Add a server allocated Taipei-date YYMMDD-NNN public reference and SQLite unique index plus durable daily sequence.
- Additive migration/backfill preserves old order secrets, statuses, photos and notifications. Short/old UUID lookup requires the existing secret, name, phone suffix and OTP; short reference alone never grants access.
- Same-tab receipt automatically carries the private secret. Completion page, lookup and merchant cards display short numbers; completion includes one-tap copy. Old UUID receipts remain usable.
- Merchant login UI uses the provisioned phone and six-digit one-time random OTP, five-minute expiry, five wrong attempts, resend cooldown and issuance/verification budgets.
- Initial teacher enrollment is an operator configuration step requiring the teacher's confirmation. Do not provision a real phone or assert owner confirmation without that authorization.
- Simulated SMS uses a separate protected operator inbox; no fixed/public code, no credential field in merchant UI, no cloud raw-credential login.
- Session remains signed HttpOnly Secure SameSite=Strict, expires after 30 minutes, resumes on refresh and is invalidated by provisioning changes.
- Formal SMS provider integration remains pending; current app explicitly labels simulation and never claims a real SMS was delivered.
## Acceptance and limits
Automated synthetic acceptance must cover phone checkout, short receipt, secret+OTP lookup, merchant simulated OTP login, manual receipt confirmation, camera/gallery preview, explicit packing confirmation, shipment/delivery and updated customer status.
Original historical data is untouched, not backed up. Separate free preview state remains ephemeral on provider restarts; SQLite durability applies only while its backing directory survives.
Human phone acceptance and teacher authorization remain pending after automated checks. Do not close Issue #24 as fully accepted until those are completed.
