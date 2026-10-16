# CLOUD-02 正式登入、Session、權限與 Secrets 規格

## Authentication

Better Auth uses PostgreSQL in staging and production. The existing Demo SQLite auth store and preview Basic Auth remain test-only and are never a production control.

Primary merchant login is WebAuthn/passkey. Recovery is an approved owner-controlled password/recovery path with rate limiting, credential rotation and an auditable event. No shared password is embedded in the image, repository or issue.

## Authorization

Roles:

- `owner`: manage merchant identities, role assignments, catalog, orders, payments, shipping and recovery settings.
- `staff`: manage catalog, payment confirmation and fulfillment; cannot manage owner credentials, secrets or unrestricted exports.
- `customer`: guest order lookup only through bounded identity proof, or an explicitly approved customer account flow.

Every merchant API checks session, role, target record and environment. A valid session alone never authorizes access to another order's photo or customer data.

## Session and request protections

- Opaque server-side sessions with rotation after login and credential changes.
- `HttpOnly`, `Secure`, `SameSite=Lax`, narrow `Path`, idle timeout and absolute expiry.
- Logout revokes the server-side session; credential rotation revokes all sessions for that identity.
- Mutation requests require same-origin checks, CSRF token or equivalent origin-bound protection, replay-safe idempotency key and rate limiting.
- `401` and `403` responses are generic and do not reveal whether an account or order exists.
- Audit events record actor, action, target type/id, result and timestamp; never passwords, tokens, full phone numbers or signed URLs.

## Required secrets

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
SESSION_ENCRYPTION_KEY
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_PUBLIC_DELIVERY_MODE
```

Optional provider secrets are added only after separate approval: email, SMS, payment and logistics. Render secret/env management or an approved external secret manager is the only source. Values are never committed, printed, sent to GitHub, or exposed to `NEXT_PUBLIC_*`.

## Rotation

Rotate secrets in staging first, run login/logout/revocation smoke, then rotate production during an approved window. `BETTER_AUTH_SECRET`, session encryption and object credentials have separate rotation records. Failed rotation stops at staging; it does not trigger a production deploy.
