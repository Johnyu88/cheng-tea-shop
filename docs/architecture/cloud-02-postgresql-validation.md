# CLOUD-02-REVIEW-03 PostgreSQL 合約驗證規格

本文件檢查 `docs/architecture/cloud-02-postgresql-schema.sql` 的設計缺口。DDL 是 reference-only，沒有在任何 Render、GCP 或正式資料庫執行。

## Static contract matrix

| Contract | Status | Evidence / gap | Next-phase proof |
|---|---|---|---|
| Payment/packing/shipping are distinct fields | PASS | Separate payment, packing-photo and shipment tables/status enums exist | Contract test transition gates |
| Legal order status transitions | FAIL | No transition table, trigger or SQL constraint validates `order_events.from_status → to_status` | Transactional service test for every allowed/denied edge |
| Payment before packing/shipping | FAIL | Schema has independent statuses but no database enforcement | Lock order row; verify payment confirmed and packing before shipment |
| Duplicate order prevention | PARTIAL | `orders.order_number`, event idempotency and `idempotency_keys.key` are unique | Replayed create request returns same response and no second order |
| Idempotency scope/request binding | FAIL | Key has request hash but no endpoint/scope or resource binding | Add route/scope and response replay contract in migration review |
| Amount consistency | FAIL | `total_amount`, line totals and payment amount have non-negative checks only | Verify `line_total = unit × quantity`, `subtotal = Σ lines`, `total = subtotal + shipping`, payment = total |
| Inventory race safety | FAIL | Quantity fields have no reservation/ledger, lock or atomic decrement contract | Concurrent checkout test; decide reservation/ledger migration before real data |
| Cross-environment isolation | PARTIAL | Environment is outside DDL; separate DB roles/buckets are specified in architecture | Wrong-DB/wrong-bucket negative test and environment marker |
| Backup/photo consistency | PARTIAL | `packing_photos` stores object key/version/checksum but no manifest table | Restore test compares DB rows, object HEAD and manifest checksums |
| Migration rollback | PARTIAL | Expand/contract is documented but no `schema_migrations` runner or compatibility test exists | Dry-run on isolated database and previous-image compatibility test |

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

Current live verification status: **BLOCKED**. No local PostgreSQL contract test was run in this review because no isolated database was started and no production data was touched.

