# CLOUD-02-REVIEW-03 GCP staging 部署準備規格

狀態：只完成準備文件與靜態檢查；不建立 GCP 資源、不啟用 API、不升級 billing、不部署、不遷移資料。

## 1. 目標與邊界

GCP 是下一階段 staging 驗證的第一候選；Render 保留為長期 production 候選。staging 只允許 synthetic products、synthetic customers、synthetic orders、synthetic payment events 與 synthetic photos。任何真實顧客、訂單、商品照片與正式 Secrets 均禁止進入 staging。

## 2. 服務與隔離矩陣

| Boundary | GCP staging | GCP production（未建立） |
|---|---|---|
| Project | `cheng-tea-staging`（placeholder，待核准） | `cheng-tea-production`（placeholder，待核准） |
| Region | `asia-east1` default candidate | same region only after measured acceptance |
| Cloud Run | `cheng-tea-staging-web`, min 0, bounded max | separate service and service account |
| Cloud SQL | separate PostgreSQL instance/database/user | separate instance/database/user |
| Cloud Storage | private staging bucket or approved staging prefix | private production bucket; no shared write credentials |
| Secrets | staging-only versions and URLs | production-only versions and URLs |
| IAM | deployer, runtime, backup-reader identities separate | same separation; no human owner key in runtime |
| Data | synthetic only | approved real data only after migration approval |
| HTTPS | Cloud Run managed HTTPS URL; custom domain later | approved public domain later |

No staging/production dual-write is permitted. A staging URL must never be used as a customer-facing production link.

## 3. Existing standalone Docker compatibility

The existing Dockerfile produces a Next.js standalone artifact and the runner binds `0.0.0.0:$PORT`. The Cloud Run preparation contract is:

- build and push an immutable image tagged with Git SHA and verified by digest;
- set `PORT` from the Cloud Run runtime contract and do not hard-code a private LAN address;
- expose `/api/health` without secrets or database contents;
- keep filesystem writes limited to temporary cache; catalog, orders and photos must use Cloud SQL/Cloud Storage;
- set request-based billing, `minInstances=0`, an explicit `maxInstances`, concurrency and request timeout after load-test evidence;
- handle SIGTERM and close database/object clients without creating duplicate outbox work;
- use Cloud SQL connector/Auth Proxy or approved private connectivity, with TLS and bounded pool size;
- use a runtime service account with only Cloud SQL client, Storage object access, Secret Manager accessor and logging roles required by the service.

Static status: **PASS for artifact design compatibility**. Runtime status: **BLOCKED until an approved staging resource exists and a smoke deploy is executed**.

## 4. Public HTTPS without Tailscale

The first staging endpoint uses the Cloud Run managed HTTPS URL. This proves public reachability without Acer, 4090, Tailscale, private DNS or LAN routing. Custom DNS is out of scope for this review. Cloud Run ingress must be internet-reachable for the public storefront, while merchant mutations still require application authentication and authorization; Cloud Run IAM bearer tokens must not be required on the customer storefront.

Required checks in the next approved phase:

1. cellular iPhone Safari reaches the HTTPS URL with Tailscale disconnected;
2. HTTP redirects or is rejected in favor of HTTPS;
3. frontend public routes work without an IAM token;
4. `/admin/*` and mutation APIs return 401/403 without an application session;
5. cookies are Secure/HttpOnly with the approved SameSite policy;
6. no response exposes project IDs, secret values, database URLs or signed object credentials.

## 5. Cloud SQL connection and persistence

- Cloud Run and Cloud SQL stay in `asia-east1` unless the approved region review selects Tokyo.
- Runtime uses a small bounded connection pool; the pool maximum is below the Cloud SQL connection budget and is multiplied by the Cloud Run maximum instances before approval.
- Every order mutation is a transaction with row locking or an equivalent optimistic version check; no request may rely on process memory for state.
- Health and readiness are separate: liveness must not fail open with a fake database result; readiness checks use a short timeout and redact errors.
- Restart test creates a synthetic order, payment event and product revision, restarts or shifts the Cloud Run revision, then verifies the same rows and event sequence.

Persistence status: **BLOCKED / not executed** because no Cloud SQL instance exists and no data migration is approved.

## 6. Cloud Storage photo contract

- Bucket is private; public ACLs, website configuration and unauthenticated object listing are prohibited.
- Product and packing-photo keys include environment, object id and immutable version.
- Upload uses a short-lived signed URL; server verifies MIME, byte length and SHA-256 before committing metadata.
- Packing photos are merchant-only; product photos use an application-approved signed delivery path.
- Replacing a photo creates a new version and leaves the prior version recoverable until retention cleanup.
- A manifest binds object key/version/checksum/byte length/MIME to the database row.

Storage status: **PASS for design contract; BLOCKED for live access test**.

## 7. Required approval gates before staging creation

The next phase cannot create resources until all are separately approved:

1. GCP project IDs and billing account remain on the existing Free Trial without activation/upgrade.
2. `asia-east1` availability, quota, Cloud SQL free-trial eligibility and all required APIs are confirmed read-only in Console.
3. Monthly budget ceiling is set to US$25 for the trial window with 50/80/100% alerts and a named stop owner.
4. Synthetic fixture seed and object manifest are reviewed; no production export is used.
5. Runtime/deployer/backup IAM identities and Secret Manager names are reviewed without exposing values.
6. Backup/restore target and failure rollback evidence plan are accepted.

