# CLOUD-02-DB-02 API adapter implementation plan

## Scope

Add a candidate PostgreSQL order adapter without changing the default Demo SQLite/JSON runtime. The adapter is explicit opt-in and is tested only with synthetic data in a disposable local PostgreSQL instance.

## Design

1. Keep the existing Demo routes and runtime unchanged.
2. Add `PostgresOrderAdapter` with an injected `pg.Pool`, explicit environment validation, and one transaction per business operation.
3. Reuse DB-01 contract functions for idempotency, amount validation, inventory reservation and legal transitions.
4. Add additive DB-02 reservation lifecycle functions and cancellation rules to the reference-only migration.
5. Add integration tests for create, payment, packing, shipping, cancellation, replay, conflict, concurrency, rollback, isolation and fail-closed configuration.
6. Fix only the three known full-lint errors and add regression coverage where behavior is affected.

## Transaction boundaries

- Create: idempotency claim, authoritative variant reads, order/items/payment insert, inventory reservations, response persistence, commit.
- Payment confirmation: idempotency claim, payment amount check, payment update, `transition_cloud02_order`, commit.
- Packing/shipping: idempotency claim, photo or transition gate, commit.
- Cancellation: idempotency claim, lock order, release active reservations once, mark payment refunded only when explicitly requested, transition to cancelled, commit.

## Verification

- Disposable localhost-only PostgreSQL container with synthetic fixture.
- DB-01 11 contract tests remain unchanged and pass.
- New DB-02 adapter tests run only when `CLOUD02_DB_URL` is set.
- Full Vitest, typecheck, lint, production build, secret scan and diff check.
- No cloud, formal data, DNS, deployment or production configuration access.
