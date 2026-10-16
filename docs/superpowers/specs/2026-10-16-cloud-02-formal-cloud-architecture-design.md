# CLOUD-02 正式雲端架構設計

**狀態：** 已獲條件批准；本文件只定義架構與準備工作，不建立資源、不部署、不遷移資料。

**基準：** `codex/cloud-02-architecture-20261016`，源自 `codex/prod-restore-20261015` commit `8365372`。

## 1. 目標與邊界

目標是讓一般 iPhone Safari 在不安裝、不連接 Tailscale 的情況下，使用公開 HTTPS 前台購物及受保護後台，完成商品、訂單、人工付款確認、包裝與出貨管理。

本階段交付：

- staging／production 隔離拓樸；
- PostgreSQL schema 與 API 對應；
- 私有物件儲存、上傳、替換、備份規格；
- 正式身份驗證、session、RBAC 與 secrets 規格；
- Demo SQLite／JSON 隔離與轉換流程；
- 成本模型與 staging 低成本方案；
- 備份、還原、回退、資料一致性規格；
- 無 Tailscale iPhone Safari 八項驗收腳本；
- 後續實作計畫。

本階段不包含：建立 Render／R2 資源、部署、資料遷移、DNS 切換、正式商品輸入、付款或簡訊 provider 開通，以及 Acer／4090 變更。

## 2. 推薦拓樸

```text
                         ┌────────────────────────────┐
 iPhone Safari ─ HTTPS ─▶│ Render production Web       │
 顧客／商家                │ Next.js standalone          │
                         └──────┬──────────┬──────────┘
                                │ private  │ S3 API over TLS
                                ▼          ▼
                         ┌────────────┐  ┌────────────────┐
                         │ Render     │  │ R2 prod bucket  │
                         │ PostgreSQL │  │ private objects │
                         └────────────┘  └────────────────┘
                                │
                         backups / restore proof

                         ┌────────────────────────────┐
                         │ Render staging Web          │
                         │ separate URL / env / secret │
                         └──────┬──────────┬──────────┘
                                ▼          ▼
                         staging Postgres  R2 staging prefix
                         synthetic only     synthetic only
```

### Environment contract

| Boundary | Staging | Production |
|---|---|---|
| Render service | `cheng-tea-staging-web` | `cheng-tea-production-web` |
| Database | Separate instance/database/user | Separate instance/database/user |
| Object storage | Separate bucket or account prefix | Separate bucket or account prefix |
| Secrets | Separate values; never copied from production | Production-only values |
| Domain | `staging.<approved-domain>` or Render URL | Approved public domain |
| Data | Synthetic fixtures and test orders only | Approved real catalog and customer/order data |
| Deploy trigger | Manual or checks-pass; no automatic production deploy | Protected manual release after checks |
| Tailscale | Not required; never used as acceptance proof | Not required |

The four existing Render Free services remain test fixtures and are not promoted or attached to either environment.

## 3. Runtime and networking

- Use the existing Next.js standalone Docker image as the portable application artifact.
- Bind `0.0.0.0:$PORT`; Render terminates TLS at the edge and forwards HTTP to the container.
- Health path: `/api/health`, containing no database or secret values. A deeper authenticated readiness check is separate and never public.
- Use Render internal Postgres URL from the same region. External database access is for controlled migrations/backup tooling only and must use TLS.
- Keep one production Web Service instance at the baseline. Do not add a persistent disk to the app service; it would impose single-instance and non-zero-downtime constraints.
- No public database, bucket, admin API key, or direct object URL.

## 4. PostgreSQL logical schema

The reference DDL is in `docs/architecture/cloud-02-postgresql-schema.sql`. It is a design artifact, not an executed migration.

### Domain mapping

| Existing API/domain concept | PostgreSQL source of truth |
|---|---|
| `Product` | `products`, `product_variants`, `product_images` |
| `Product.publication` | `products.publication_status` plus `published_at` |
| `CartLine` | Request-time cart; order snapshot is `order_items` |
| `CheckoutDraft` | `orders` contact/delivery fields; address encrypted or minimized by policy |
| `CheckoutReceipt` | `orders.order_number`, `orders.status`, `orders.total_amount` |
| manual payment | `payments`, `order_events` |
| packing photo | `packing_photos` + private object key |
| ship/deliver | `shipments`, `order_events` |
| merchant session | Better Auth tables in the same database, isolated schema/table prefix |
| notification outbox | `notification_outbox` with idempotency key |

### Invariants

- Monetary amounts are integer minor units; TWD is stored as integer NTD and currency is checked as `TWD`.
- Product price/name/specification are copied into `order_items`; later product edits do not rewrite historical orders.
- Order status transitions are append-only in `order_events` and validated by a transition function.
- Payment confirmation, packing, shipment and delivery are separate gates; shipment cannot be marked shipped before payment confirmation and packing confirmation.
- Every mutation has an idempotency key and actor/session identity.
- All timestamps are `timestamptz` in UTC; UI renders Asia/Taipei.
- Customer lookup uses a bounded identity digest or verified account/session; full phone numbers are not logged.
- No card number, CVV, payment credential or object-store secret is stored in the application database.

## 5. Private object storage

Cloudflare R2 is the initial S3-compatible candidate because it has a private S3 API, no internet egress charge, and a published free allowance. The bucket remains private; `r2.dev` and public bucket exposure are prohibited.

### Key layout

```text
<environment>/products/<product-id>/<image-id>/<version>.<ext>
<environment>/orders/<order-id>/packing/<photo-id>/<version>.<ext>
<environment>/backups/manifests/<backup-id>.json
```

### Upload and replacement flow

1. Authenticated merchant requests an upload intent for a product or order.
2. API checks role, target state, MIME allowlist (`image/jpeg`, `image/png`, `image/webp`), byte limit, declared checksum and object key scope.
3. API returns a short-lived signed PUT URL; the browser uploads directly to the private bucket.
4. API verifies object existence, size, checksum and content type before publishing the DB row.
5. Existing image remains active until the new row is verified; replacement is a new version, not an overwrite.
6. Read access is a short-lived signed GET URL issued only after the relevant public/catalog or merchant authorization check.
7. Failed or abandoned uploads are garbage-collected only after a retention window and manifest comparison.

Packing photos are private by default and never appear in public catalog responses. Product images can be public only through application-controlled signed delivery or an approved CDN policy after publication.

## 6. Formal authentication and secrets

### Merchant identity

- Use Better Auth with a PostgreSQL adapter, not the Demo SQLite store.
- Primary method: WebAuthn/passkey on the merchant's iPhone and approved backup device.
- Recovery method: an explicitly approved password or recovery flow with rate limiting, step-up confirmation and audited rotation; no shared demo password.
- Roles: `owner` can manage users/secrets-sensitive settings; `staff` can manage catalog and fulfillment but cannot change owner credentials or export unrestricted customer data.
- Session: signed, opaque, server-side session; `HttpOnly`, `Secure`, `SameSite=Lax` for normal same-site navigation, narrow `Path`, idle and absolute expiry, server-side revocation on logout and credential rotation.
- Mutation routes require origin checking, CSRF protection, same-site cookie validation, rate limiting and idempotency.
- Admin routes fail closed with `401/403`; no preview Basic Auth is treated as application authentication.

### Secrets

Secrets are stored in Render environment/secret management or an approved external secret manager, never GitHub, SQL, object storage, issue comments or client bundles.

Required names (values intentionally omitted):

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_PUBLIC_DELIVERY_MODE
SESSION_ENCRYPTION_KEY
EMAIL_PROVIDER_API_KEY       # only if approved
SMS_PROVIDER_API_KEY         # only if approved
PAYMENT_PROVIDER_SECRET      # only if approved
```

`DATABASE_URL` is injected from the Render Postgres connection wiring. Production and staging values must be different, and secret rotation requires a planned session revocation and rollback check.

## 7. Demo isolation and conversion

Demo mode is enabled only when an explicit `DEMO_*` flag is present and must fail closed in production. Demo `catalog.json`, SQLite files and local photo directories are never mounted into production.

The only permitted conversion path is:

```text
read-only Demo export
  → canonical manifest (products, photos, synthetic orders, checksums)
  → schema validation and duplicate detection
  → staging dry-run import
  → human review of counts/checksums/claims
  → separately approved production import
```

Synthetic IDs use a `demo:` namespace and cannot collide with production IDs. Existing Demo orders are test evidence only; no customer, order or photo migration is implied by this design.

## 8. Backup, restore, migration and rollback

### Backup set

- Render Postgres logical backup (`pg_dump --format=custom`) plus provider-managed PITR where available.
- Object manifest containing key, version, byte length, MIME, checksum, database reference and environment.
- Encrypted backup copy outside the live database and bucket account; retention: daily 35 days, monthly 12 months, subject to final provider approval.
- Backup metadata records schema version, application commit, migration version, source environment and UTC timestamp.

### Restore proof

At least once before production use and monthly thereafter:

1. Restore Postgres into an isolated database.
2. Restore or verify object versions into an isolated prefix.
3. Run referential-integrity, count, checksum, orphan-object and missing-object checks.
4. Start the exact application artifact against the restored pair.
5. Run read-only catalog/order/admin smoke tests and record evidence.
6. Destroy only the isolated restore target after evidence retention; never test restore over production.

### Deployment and rollback

- Build image is immutable and identified by Git SHA plus image digest.
- Expand migrations are additive and retry-safe; destructive changes require a separate approved maintenance migration after an observation window.
- Release order: backup marker → migration dry-run → migration → deploy candidate → health/readiness → synthetic smoke → authenticated staging smoke → production approval → traffic switch.
- Failure before traffic switch: cancel deploy and retain current service.
- Failure after switch: roll back application artifact only if schema is backward compatible; otherwise restore the previous compatible image and follow the documented data repair path.
- DNS changes are last, with low TTL before cutover and prior DNS record retained for rollback. No DNS change is authorized in CLOUD-02.

## 9. Staging cost and lifecycle

### Option A — disposable free staging (recommended before formal data)

- Render Free Web Service: US$0/month.
- Render Free Postgres: US$0/month, 1 GB, expires after 30 days, no backups, restarts/maintenance possible.
- Cloudflare R2 staging prefix: US$0 within 10 GB-month, 1M Class A and 10M Class B monthly allowance.
- Monthly fixed cost: **US$0**.
- Hard rule: synthetic data only, reset/reseed before expiry, no customer or production order, no restore SLA, no production acceptance claim.

### Option B — paid staging test window

- Paid Web Service `0.5c-512mb`: US$7/month equivalent, prorated by active seconds; 24 hours is about US$0.23 at a 30-day month.
- Paid Postgres `0.1c-256mb`: US$6/month equivalent, 1 GB included; use only during a controlled test window and destroy/recreate only with explicit approval if no durable staging data is required.
- R2: usually US$0 within the allowance.
- Full-month ceiling before bandwidth/overages: **US$13/month**.
- One 8-hour test window with both paid services, using straight-line monthly proration: approximately **US$0.14** compute/database equivalent; actual billing is provider-metered and must be confirmed in Dashboard.

### Production baseline

- Render Hobby workspace: US$0/month.
- Paid Web Service `0.5c-512mb`: US$7/month.
- Paid Postgres `0.1c-256mb`: US$6/month, 1 GB storage included.
- R2 Standard: US$0 within 10 GB-month + 1M Class A + 10M Class B allowance; then US$0.015/GB-month, US$4.50/million Class A and US$0.36/million Class B.
- Hobby bandwidth: 5 GB/month included, then US$0.15/GB.
- Production fixed baseline: **US$13/month**, before overages, domain, email/SMS/payment/物流 providers and taxes.
- Production must not use Free Postgres or Free Web filesystem because Free Postgres expires after 30 days and Free local files are ephemeral.

## 10. Deployment preparation steps (not execution authorization)

1. Approve provider accounts, region, data-retention policy and monthly spend limit.
2. Create staging-only service/database/bucket after a separate resource approval.
3. Implement schema migrations and adapter contracts behind a feature flag.
4. Implement R2 signed upload/read path and object manifest verification.
5. Configure staging secrets without committing values.
6. Run schema, auth, object, backup/restore and failure-path tests.
7. Run the eight-item no-Tailscale iPhone Safari acceptance matrix.
8. Review evidence and approve production resources separately.
9. Create production resources and migrate only approved data after a separate migration approval.
10. Perform DNS cutover only after production acceptance and rollback rehearsal.

## 11. Stop conditions

Stop before resource creation, paid spend, deploy, migration, secret rotation, DNS change or formal data entry if any of the following is missing: approved provider/account, budget, schema review, backup/restore proof, auth recovery decision, object permission proof, or complete acceptance evidence.
