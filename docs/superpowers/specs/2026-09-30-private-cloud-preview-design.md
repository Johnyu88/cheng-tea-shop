# Private phone acceptance preview — 2026-09-30

Purpose: 游老師 can test the latest traditional checkout while Acer/4090 are offline. Render workspace was explicitly confirmed. This is a temporary synthetic preview, not a production shop.

Scope: one free Node 24.19.0 web service in Singapore; dedicated feature/private-cloud-demo branch based on security PR22; no main merge, payment provider, real notifications, logistics integration, ERP, durable database, or real customer input. Bank transfer remains pending human acceptance.

Boundaries:
- Explicit DEMO_COMMERCE_CLOUD flag; exact HTTPS onrender.com origin from service configuration; runtime refuses incomplete or mixed local/cloud configuration before listening.
- All page, static, image and API routes require independent 128-bit random preview access credential using HTTP Basic over provider HTTPS. Only SHA-256 of this random token is stored; no secret in repository or URL.
- GET /api/health is the sole unauthenticated exception and returns only generic status.
- API handlers independently recheck access and origin. Mutations require exact Origin; ambiguous/spoofed forwarded host/proto and cross-site subresource requests fail. Top-level GET navigation is allowed.
- Existing independent 256-bit merchant credential and signed 30-minute HttpOnly Secure SameSite=Strict cookies remain required for orders and cloud catalog writes/unpublished reads.
- Single-instance authentication attempt budget, SQLite lookup/OTP rate limits, private/no-store responses, CSP, frame denial, nosniff, HSTS and noindex.
- Secrets generated separately and configured only in Render. Free preview data is ephemeral and may reset on restart/redeployment; enter synthetic names/phones/address and optional .test email only. Application phone restrictions do not prevent every possible real PII field.

Verification: existing frozen install, lint/typecheck/unit tests, 32 browsers/accessibility checks and 2 synthetic mobile tests; additional cloud guard unit contracts and production standalone integration exercising unauthenticated routes, CSRF, merchant secure cookie, bank-transfer order→payment confirmation→packing→shipping→delivery→lookup and Chromium phone checkout. Provider status/health/authenticated preview smoke still required before sharing URL.
