# CLOUD-02 成本模型（2026-10-16）

Prices are USD and use the official prices checked on 2026-10-16. Provider pricing can change; re-check the Dashboard before resource creation. No resource was created by this task.

## Fixed baseline

| Item | Plan/allowance | Monthly price | Environment |
|---|---|---:|---|
| Render workspace | Hobby | $0 | shared account baseline |
| Render Web Service | `0.5c-512mb`, 512 MB | $7 | production |
| Render Postgres | `0.1c-256mb`, 100 connections, 1 GB included | $6 | production |
| Cloudflare R2 Standard | first 10 GB-month, 1M Class A, 10M Class B | $0 | production baseline |
| **Production fixed baseline** | web + Postgres + R2 allowance | **$13/month** | production |

Production variable charges:

- Render Hobby bandwidth: 5 GB/month included, then $0.15/GB.
- Render Postgres storage beyond 1 GB: $0.30/GB-month.
- R2 beyond allowance: $0.015/GB-month; Class A $4.50/million; Class B $0.36/million; internet egress $0.
- Domain, email/SMS, payment and logistics provider charges are excluded until separately selected.

## Staging modes

### Disposable staging: $0/month

Render Free Web + Free Postgres + R2 allowance. This is permitted only for synthetic tests. Free Postgres is 1 GB, expires after 30 days, has no backups, and may restart. Free web local files are ephemeral. Staging must be reseeded and may not hold real customers, orders, photos or restore evidence.

### Paid staging test window

Use the same paid tiers as production but activate only for a controlled test window:

- Web: $7/month equivalent, prorated by active seconds.
- Postgres: $6/month equivalent, 1 GB included.
- R2: normally $0 within allowance.
- Full-month ceiling before variable charges: **$13/month**.
- 8-hour window straight-line equivalent: `(13 / 720) * 8 = $0.145`, approximately **$0.15**. Actual billing is provider-metered and may include storage/rounding.
- 24-hour window: `(13 / 30) = $0.433`, approximately **$0.43**.

This mode is low cost only if staging is suspended or destroyed between approved test windows. Destroying a database is data-destructive and requires explicit approval; a disposable staging dataset must be recreated from fixtures.

## Recommendation

Start with disposable $0 staging for adapter and UI work. Use a paid staging window for backup/restore and cross-device acceptance. Keep production at the $13/month baseline until traffic, connection count, backup retention or HA requirements justify a larger Postgres plan or Render Pro workspace.

## GCP parallel evaluation (checked 2026-10-16)

The following is a reproducible low-volume budget model, not a promise of a fixed bill. It uses USD list prices and the operator-provided Free Trial balance of NT$9,653 through 2026-11-13. No GCP resource or billing change was performed.

### Assumptions

| Component | Assumption | 28-day trial estimate | Post-trial monthly list estimate |
|---|---|---:|---:|
| Cloud Run | 1 service, request billing, 1 vCPU/0.5 GiB, min 0, 500k requests, 100 ms average | $0.00 under published free quantities | $0.00 under same allowance |
| Cloud SQL PostgreSQL | `db-f1-micro`, 672 h / 730 h, 10 GiB SSD, 5 GiB used backup | $7.06 + $3.13 + $0.37 = **$10.56** | $7.67 + $3.40 + $0.40 = **$11.47** |
| Cloud Storage | 10 GiB Standard in `asia-east1`, 10k Class A, 100k Class B | **$0.17** | **$0.20** |
| Secret Manager | 6 active versions, ≤10k access operations | $0.00 | $0.00 |
| Cloud Logging | ≤50 GiB/project/month, default retention | $0.00 | $0.00 |
| **Modeled subtotal** | excludes egress, build/registry, tax and price changes | **about $10.73** | **about $11.67** |

The Cloud SQL calculation uses the published shared-core rate of $0.0105/hour, SSD $0.000465753/GiB-hour, and used backup $0.000109589/GiB-hour. Cloud Storage uses the published Taiwan Standard rate of $0.000027397/GiB-hour and single-region operation rates. The rounded planning reserve is **US$25 for the 28-day trial** and **US$15/month post-trial** for this tiny workload; the reserve is a budget ceiling proposal, not a charge authorization. Cloud SQL free-trial instances are separate 30-day test instances, have no SLA/backups, and require account/project eligibility checks.

### Render vs GCP

| Option | Fixed/low-traffic baseline | Strength | Risk/cost caveat |
|---|---:|---|---|
| Render production | **$13/month** | Simplest reuse of current Docker/Next.js and current schema plan | Paid web + Postgres are always-on; R2 remains separate |
| GCP production candidate | **about $11.67 modeled; budget $15/month** | Cloud Run scale-to-zero, native IAM/Secret Manager/Logging, Cloud Storage | Cloud SQL is the floor; shared-core has no SLA; networking/build/storage can exceed model |
| GCP HA/dedicated | **not included; quote required** | Better performance/availability | Cloud SQL HA/dedicated compute and storage are materially higher; no trial assumption |

### Region comparison

`asia-east1` (Taiwan) is the default candidate: lowest user latency and Cloud Run Tier 1 pricing. `asia-northeast1` (Tokyo) is also Tier 1 and is the fallback for service availability. `asia-northeast3` (Seoul) is Tier 2 Cloud Run pricing and should not be selected for cost reasons without a latency requirement. Cloud SQL and Cloud Storage prices remain region-dependent; the final console quote is required. GCP Cloud Storage Always Free storage is limited to US regions, so the Taiwan design must not claim a zero-cost storage tier.

### Budget, shutdown and eligibility gates

- Keep the existing Free Trial account; do not click Activate/upgrade. Trial credit covers eligible usage but does not prevent resource shutdown at expiry.
- Before any creation, verify that Cloud Run, Cloud SQL PostgreSQL, Cloud Storage, Secret Manager, IAM and Logging APIs are available to this billing/project state. Cloud SQL's 30-day free-trial instance is one per project, scheduled for deletion, has no backups and is not production-capable.
- Apply a **US$25 trial budget** with alerts at **50% = US$12.50**, **80% = US$20.00**, and **100% = US$25.00**. Add a hard `maxInstances`, `minInstances=0`, log retention limit, Storage lifecycle and a named shutdown owner. Budget alerts are notifications only; they do not stop spending, revoke credentials, delete resources or prevent charges already in flight.
- Staging is disposable and synthetic-only. Stop or delete it after each approved window; never delete a database without a fresh export and explicit approval.

### Charges excluded from the US$11.67 model

- Cloud Run usage above free quantities, request/CPU/memory billing, minimum-instance idle billing, instance-based billing, outbound internet egress, VPC connector/NAT and load-balancer or domain-related services.
- Cloud SQL higher machine class, HA/regional standby, dedicated core, provisioned storage growth, backup/PITR retention beyond the model, public-IP charges, cross-region/internet egress, maintenance and unsupported feature add-ons.
- Cloud Storage bytes, noncurrent/soft-deleted object versions, Class A/B operations, retrieval/early deletion, dual/multi-region replication, network egress and lifecycle/Autoclass features.
- Secret Manager active versions beyond six, access operations beyond 10,000 and rotation notifications beyond three.
- Cloud Logging ingestion beyond 50 GiB/project/month, retention beyond the default 30 days, log-based metrics, alerting/Monitoring data and exported sinks such as BigQuery or Pub/Sub.
- Artifact Registry image storage and pulls, Cloud Build minutes, build cache, container vulnerability scanning, Cloud Scheduler/Tasks, Pub/Sub, Cloud DNS zones/queries, NAT gateway/IPs and any support, tax or currency conversion.

### Stop and cleanup accounting

Stopping Cloud Run at `minInstances=0` does not erase revisions, images or related services. Stopping Cloud SQL suspends instance compute but storage and IP charges continue. Stopped or deleted VMs can still retain Persistent Disk and static IP charges; Cloud Storage versions, soft-deleted objects and backups continue until their retention or deletion policy acts. Cleanup is therefore a separate approved action after export, manifest and restore evidence—not an automatic consequence of stopping.

### Trial expiry

Before 2026-11-13, freeze staging writes, export the synthetic database, export/verify the object manifest and checksums, save the image digest/schema version, confirm the final Billing view and stop staging. Do not assume unused credit extends the trial or preserves resources. If no paid-account approval exists, do not upgrade; preserve only approved offline/exported evidence and keep production data out of the trial project.

## Official pricing and lifecycle references

- https://cloud.google.com/free/docs/free-cloud-features
- https://cloud.google.com/run/pricing?hl=zh-TW
- https://cloud.google.com/sql/pricing?hl=en
- https://cloud.google.com/storage/pricing
- https://cloud.google.com/secret-manager/pricing
- https://cloud.google.com/products/observability/pricing
- https://docs.cloud.google.com/sql/docs/postgres/start-stop-restart-instance
- https://cloud.google.com/vpc/pricing
- https://docs.cloud.google.com/compute/docs/disks
