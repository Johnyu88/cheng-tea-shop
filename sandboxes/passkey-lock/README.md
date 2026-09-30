# Better Auth Passkey sandbox

Independent app. It does not import the tea shop's order routes, merchant session signer, or business database.

Versions: Better Auth and Passkey plugin 1.7.6, Next.js 16.3.6, React 19.3.0, pnpm 11.19.0.
Node.js 24.19 or newer is required for the built-in SQLite driver.

## Private configuration

Set these server environment variables; never commit their values:

- `SANDBOX_ORIGIN`: exactly `http://localhost:3142` for local tests or `https://cheng-tea-passkey-sandbox.onrender.com` for this sandbox.
- `SANDBOX_SECRET`: independent Better Auth secret, at least 32 characters.
- `SANDBOX_ACCESS_PASSWORD`: independent private entrance password, at least 16 characters. HTTP Basic username is `sandbox`.
- `SANDBOX_BOOTSTRAP_EMAIL`: the administrator-provisioned synthetic test account.
- `SANDBOX_BOOTSTRAP_PASSWORD`: its initial password, at least eight characters.
- `SANDBOX_BOOTSTRAP_ALLOWED=yes`: permits server startup to create that fixed account if absent.
- `SANDBOX_DATA_DIR`: absolute isolated directory whose final name is `passkey-lock` or `passkey-lock-<suffix>`. The only database file is `auth.sqlite`.
- `SANDBOX_MERCHANT_USER_IDS`: optional comma-separated approved vendor user IDs. Empty by default; registration does not confer merchant permission.

## Commands

Run inside this directory:

```sh
corepack pnpm --config.verifyDepsBeforeRun=false install --frozen-lockfile --ignore-scripts
corepack pnpm --config.verifyDepsBeforeRun=false audit --audit-level=high
corepack pnpm --config.verifyDepsBeforeRun=false typecheck
corepack pnpm --config.verifyDepsBeforeRun=false build
corepack pnpm --config.verifyDepsBeforeRun=false test
corepack pnpm --config.verifyDepsBeforeRun=false dev
```

The startup preparation script uses Better Auth's `getMigrations` API and native account creation.
Public signup is disabled. Existing bootstrap accounts are preserved rather than reset.

The phone flow is initial account login → register phone Passkey → logout → Passkey login.
Better Auth and its SimpleWebAuthn dependency own challenge generation, verification, session issuance, and logout.
The read-only `GET /api/merchant-session` bridge returns only `authenticated`, `userId`, and `merchantAllowed`.
There is no tea-shop authorization bridge or business write API.

Browser automation uses a virtual authenticator. Actual Face ID, fingerprint, and synced Passkey behavior still require phone acceptance.
