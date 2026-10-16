# CLOUD-02-REVIEW-03 PostgreSQL 合約驗證規格

本文件檢查 `docs/architecture/cloud-02-postgresql-schema.sql` 的設計缺口。DDL 是 reference-only，沒有在任何 Render、GCP 或正式資料庫執行。

## Static contract matrix

| Contract | Status | Evidence / gap | Next-phase proof |
|---|---|---|---|
| Payment/packing/shipping are distinct fields | PASS | Separate payment, packing-photo and shipment tables/status enums exist | Contract test transition gates |
| Legal order status transitions | PASS (local contract) | `transition_cloud02_order` locks the order, enumerates the legal path and appends one event | Cloud SQL staging compatibility and API adapter review remain pending |
| Payment before packing/shipping | PASS (local contract) | Transition function requires confirmed payment matching the immutable order total and a confirmed packing photo before shipment | Cloud SQL staging compatibility remains pending |
| Duplicate order prevention | PASS (local contract) | `claim_cloud02_idempotency` replays the stored response for the same scope/key/hash and binds the resource | API create-order adapter must call the function before order insert |
| Idempotency scope/request binding | PASS (local contract) | Composite scope/key plus request hash, resource type and resource ID reject changed requests | API endpoint mapping and expiry policy remain pending |
| Amount consistency | PASS (local contract) | Deferred PostgreSQL triggers validate unit × quantity, line sum, shipping, order total and payment amount | API currency/provider mapping remains pending |
| Inventory race safety | PASS (local contract) | `reserve_cloud02_inventory` locks the variant row and records a unique reservation; final-unit concurrency is 1 success / 1 rejection | Expiry/release/reconciliation jobs remain pending |
| Cross-environment isolation | PARTIAL | Environment is outside DDL; separate DB roles/buckets are specified in architecture | Wrong-DB/wrong-bucket negative test and environment marker |
| Backup/photo consistency | PARTIAL | `packing_photos` stores object key/version/checksum but no manifest table | Restore test compares DB rows, object HEAD and manifest checksums |
| Migration rollback | PASS (local repeatability) | Version/hash marker is compatibility-checked; re-application is safe and incompatible version is rejected in isolated PostgreSQL | Application-image compatibility and formal migration approval remain pending |

## Required transaction contracts

### Order creation

1. Canonicalize request and hash it.
2. Insert or replay the idempotency record under a unique key/scope.
3. Lock/read product variants and verify publication, price, quantity and inventory.
4. Compute integer TWD amounts on the server; never trust browser totals.
5. Create order and immutable item snapshots in one transaction.
6. Commit the response replay record only after the order commit succeeds.

### Status transition

The service must lock the order row, read the current status, compare an allowed transition matrix, verify gate predicates, append one event with the expected `from_status`, update the order and commit. A stale request must fail with a retryable conflict, not append a second event.

Minimum allowed path:

```text
confirmed → payment_confirmed → packed → shipped → delivered
```

Cancellation/rejection/refund edges must be explicitly enumerated with actor, reason and whether inventory is released. No implicit enum cast is a valid transition policy.

### Inventory

The current schema is not sufficient for concurrent real orders. Before migration, choose one of:

- atomic `UPDATE ... WHERE inventory_quantity >= requested` with checked affected-row count and order transaction; or
- reservation/ledger tables with expiration, release and reconciliation jobs.

The choice must be load-tested with two concurrent checkouts for the final unit and must prove no negative stock or duplicate reservation.

## Money and photo checks

Static SQL/contract checks must reject line totals or order totals that do not reconcile. Payment confirmation must compare payment amount/currency to the immutable order total. Photo verification must compare database checksum, object metadata and backup manifest; an object without a row and a row without a retrievable object are both restore failures.

## Migration/rollback verification

- Run only against a disposable local PostgreSQL container or test database in the next approved implementation phase.
- Apply expand migration, run old-image contract, apply new-image contract, then test rollback of the application image.
- Do not execute the reference DDL directly against any live database.
- Destructive columns/tables require a separate migration approval, backup marker and observation window.

## CLOUD-02-DB-01 local evidence (2026-10-16)

- Test file: `tests/cloud-02-db-01-contracts.test.ts`.
- Test environment: disposable localhost-only Docker `postgres:17` container named `cloud-02-db-01-postgres`; no existing project container or formal data was used.
- Migration: `docs/architecture/cloud-02-db-01-contract-migration.sql`; reference-only and never executed against Render, GCP or formal data.
- Result: **11/11 PASS**. Covered migration repeatability and incompatible-version rejection, four amount mismatch classes, payment/packing/shipping gates, transition replay without duplicate events, order/payment/shipment idempotency replay and conflict, final-unit concurrent reservation, and rollback without stock loss.
- Local PostgreSQL contract is PASS; focused lint and typecheck are PASS; full Vitest is **73 files / 371 tests PASS**; production build is PASS with six existing dynamic filesystem tracing warnings.
- Full repository lint is **FAIL at the existing baseline**: three errors remain in unchanged `app/admin/products/page.tsx`, `features/checkout/components/public-order-checkout.tsx`, and `tests/admin-products-diagnostic.test.ts`, plus existing warnings. This task did not alter those files; the new contract test focused lint is PASS.
- Cloud SQL/Render application, real API adapter, production migration, backup/object restore and mobile acceptance remain **BLOCKED / NOT RUN**.

Current live verification status: **BLOCKED**. The local contract is tested, but no Cloud SQL/Render migration, production data, object restore, or formal deployment was executed.

## CLOUD-02-DB-02 candidate API adapter evidence (2026-10-16)

- Candidate adapter: `lib/server/postgres-order-adapter.ts`. It is injected with a `pg.Pool`, requires explicit `COMMERCE_BACKEND=postgres` plus a valid PostgreSQL URL, and is not selected by the existing Demo runtime.
- Candidate migration: `docs/architecture/cloud-02-db-02-adapter-migration.sql`; reference-only and never executed against Cloud SQL, Render, formal data or the existing site.
- Transaction coverage: order/idempotency claim + authoritative price read + order/items/payment + inventory reservation; payment confirmation; packing/photo transition; shipment/consumption; cancellation/release. Each uses `BEGIN`/`COMMIT` with rollback on error.
- Reservation lifecycle: active → released on cancellation, active → consumed on shipping, active → expired only for expired unpaid reservations. Repeated release is a no-op; paid reservations are protected from expiry.
- Local evidence: disposable localhost-only `postgres:17`, synthetic fixtures, DB-02 adapter **9/9 PASS**, DB-01 contracts **11/11 PASS**, run serially because each suite resets the same isolated schema.
- Repository quality: full lint **PASS with 18 existing warnings and 0 errors** after correcting the three recorded baseline errors; TypeScript **PASS**; `git diff --check` **PASS**. Full Vitest/build/secret scan remain pending at this checkpoint.
- Formal/cloud/mobile boundary: **BLOCKED / NOT RUN**. No API deployment, Cloud SQL, Render, object storage, real data, DNS, or iPhone acceptance was touched.

## CLOUD-02-DB-03 HTTP route evidence (2026-10-16)

- Candidate route namespace: `/api/candidate/...`; the existing `/api/demo/...` namespace remains Demo-only and unchanged.
- Environment gate: candidate handlers require `CLOUD02_HTTP_MODE=candidate`, `COMMERCE_BACKEND=postgres`, and a PostgreSQL URL. Missing or disabled mode returns 404; bad backend configuration fails closed.
- HTTP operations covered: create/replay, OTP lookup, merchant-authenticated manual payment, packing confirmation, shipment, delivery and cancellation handler wiring. The adapter remains responsible for authoritative price, amount, inventory and state checks.
- Local evidence: 7/7 HTTP tests PASS; DB-01 11/11 PASS; DB-02 9/9 PASS. Test DB is disposable localhost-only PostgreSQL 17 with synthetic fixtures.
- Photo evidence is explicitly **TEST DOUBLE ONLY**. The route does not claim S3/GCS/object-storage persistence; response marks `storage: test-double` and `realObjectStorage: false`.
- Cloud/formal boundary remains **BLOCKED**: no route was deployed, no real merchant session or customer data was used, no object storage was contacted, and no iPhone acceptance was performed.

