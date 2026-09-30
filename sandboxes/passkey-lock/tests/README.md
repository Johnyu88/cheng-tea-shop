# Virtual WebAuthn acceptance

Run from the tea repository root:

```bash
node sandboxes/passkey-lock/tests/run-local-fixtures.mjs
```

The runner generates private synthetic credentials, prepares two independent temporary vendor databases, and starts the sandbox on localhost:3142. It authorizes the actual server-created vendor user ID in the first fixture and leaves the allowlist empty in the second. It deletes only its own temporary fixture directories.

The browser smoke uses Chromium CDP with a virtual internal CTAP2 authenticator, resident keys and user verification. It checks private access, vendor bootstrap login, Passkey registration, two logout/login rounds, rejected wrong origin, disabled public signup, rejected modified cookie, rejected incorrect cryptographic signature, rejected missing authenticator credential, and a read-only merchant bridge. An authenticated user outside the server user-ID allowlist must retain merchantAllowed=false.

This does not verify a physical iPhone, Face ID, fingerprint sensor, or cross-device Passkey synchronization.

To target an already running local sandbox, use private environment variables and run:

```bash
node sandboxes/passkey-lock/tests/webauthn-smoke.mjs
```

Required variables: SANDBOX_TEST_BASE_URL=http://localhost:3142, SANDBOX_ACCESS_PASSWORD, SANDBOX_BOOTSTRAP_EMAIL, SANDBOX_BOOTSTRAP_PASSWORD. SANDBOX_TEST_EXPECT_MERCHANT_ALLOWED=no selects the denied-role fixture. Tests never print injected secrets.
