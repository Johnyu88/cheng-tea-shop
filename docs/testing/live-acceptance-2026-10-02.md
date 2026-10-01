# Live acceptance update - 2026-10-02 Asia/Taipei
This update supersedes the cloud credential blocker in final-acceptance-2026-10-02.md.
Status: password-demo cloud order loop PASS; complete project acceptance remains pending.
User explicitly authorized replacement of ephemeral demo orders when rotating the gate.
Only DEMO_PREVIEW_TOKEN_SHA256 was merged into the existing password-demo environment.
No service recreation, architecture changes, product changes, payment-provider changes, or Passkey sandbox reset.
Render deployment dep-dav9s7h7lnhs73bimvbg is live at source 0fe4a50ebb65ad9f66814e41915ebfe36987c368.
Outer Basic username is preview. New gate secret was privately delivered, never committed.
The existing password merchant provider was used successfully; its secret is not committed.
## Fresh cloud results
Existing scripts/issue24-live-acceptance.mjs, with fixed synthetic customer name PhoneAcceptance:
exit 0, 12/12 checkpoints passed, at a 412x915 mobile browser viewport.
Passed: checkout/cart redirect, receipt, protected customer lookup, merchant password login,
payment confirmation, camera file preview with zero writes, cancel with zero writes,
gallery selection/reselection with zero writes, explicit packing confirmation with one write,
shipment, simulated delivery, and customer status showing delivered without horizontal overflow.
Retained delivered order: 261002-001; synthetic phone 0912000001.
A separate pending bank-transfer order 261002-002 was created and successfully queried:
customer name U+624B U+6A5F U+9A57 U+6536; phone 0912000000; suffix 000.
Valid new gate returned 200; anonymous and wrong gate returned 401.
The fixture first rejected unsupported synthetic phone 0912000002 (400), then used allowed 0912000000 and passed.
## Phone evidence and remaining limits
User screenshots confirm initial sandbox login, phone Passkey registration, logout, and Passkey re-login success.
Screenshots do not independently prove whether Face ID or device PIN performed the unlock.
Passkey merchant allowlist remains not allowed, and the sandbox is not linked to tea orders.
Actual phone camera capture/preview still needs the user's final check.
New-device lookup requires order number, access secret, full synthetic phone, name/suffix and OTP 123456.
Delivery and notifications are simulated; ephemeral demo orders may disappear on future restarts.
Evidence: evidence/2026-10-02-live-order-loop.log.
