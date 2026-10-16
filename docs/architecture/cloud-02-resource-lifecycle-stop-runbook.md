# CLOUD-02-REVIEW-03 GCP 資源生命週期與停止守則

本文件只定義只讀盤點、停止、保存與清理規則；不授權執行任何 GCP 命令或刪除。

## Cost protection policy

- Trial budget: **US$25 for the approved trial window**.
- Alerts: **50% = US$12.50**, **80% = US$20.00**, **100% = US$25.00**.
- Alerts notify owners; they do not automatically stop billing, delete resources or prevent a race between usage and alert delivery.
- A named operator must perform the stop/cleanup action after an alert or scheduled window. Any destructive cleanup needs separate confirmation and a fresh export/manifest first.
- Do not assume unused trial credit extends beyond 2026-11-13; preserve data before the end date and treat all resources as at risk of shutdown.

## GCP staging lifecycle

1. **Create gate:** approved project/region/budget/owner, synthetic fixture checksum, IAM review and restore plan.
2. **Run gate:** Cloud Run `minInstances=0`, bounded `maxInstances`, Cloud SQL connection cap, Storage lifecycle and log retention cap.
3. **End-of-window:** block new writes, export synthetic database, generate object manifest, verify checksums, record image digest and stop the service.
4. **Suspend:** set Cloud Run traffic to zero or remove the service only after evidence; stop Cloud SQL with `activation-policy=NEVER` where supported; retain only explicitly approved artifacts.
5. **Trial expiry:** before 2026-11-13, export database and object manifests to an approved independent location, verify downloads/checksums, record the final bill/credit view, then stop staging. Do not upgrade billing as a recovery strategy.
6. **Cleanup:** deleting a database, bucket, disk, IP or image is destructive and requires an explicit approval. No cleanup is performed in CLOUD-02-REVIEW-03.

## What continues to cost after stopping

| Resource | After stop | Required check |
|---|---|---|
| Cloud Run request-based service with min 0 | no idle instance charge, but requests, revisions/images and related services can still incur cost | list services, revisions, Artifact Registry and Cloud Build usage |
| Cloud SQL | instance compute suspends; storage and IP charges continue | instance state, provisioned storage, backups/PITR and IP |
| Cloud SQL backups/PITR | retained backup storage or final backup can continue to cost | backup list, retention and used GiB |
| Cloud Storage | stored objects, noncurrent versions, soft-deleted objects, operations and egress continue | bucket size, versioning/soft delete, lifecycle and egress |
| Persistent Disk | charges continue while attached to stopped VM or unattached until deleted | disk type, provisioned size and users |
| Static external IP | reserved unused IP costs more; in-use VM IP can still cost while VM is stopped | address status and attachment |
| Cloud NAT / VPC connector | gateway, IP and processed GiB can continue while configured | NAT gateways, routers, connectors and IPs |
| Logging | ingestion beyond free allowance and retention beyond default continue | log volume, retention, sinks and exported destinations |
| Artifact Registry / Cloud Build | image storage, pulls, build minutes and egress can continue | repositories, images, builds and retention |
| Cloud DNS | zones and queries continue; no free tier | managed zones and query volume |

## Read-only commands for the approved operator

Replace placeholders only in the operator's terminal; these commands are inventory/status reads and must not be changed into delete or patch commands.

```powershell
gcloud config get-value project
gcloud projects describe PROJECT_ID --format="value(projectId,lifecycleState)"
gcloud compute instances describe hermes-free --zone=ZONE --format="value(name,status,zone)"
gcloud compute disks list --filter="users~hermes-free" --format="table(name,zone,sizeGb,status,users)"
gcloud compute addresses list --format="table(name,region,status,address,users)"
gcloud run services list --platform=managed --region=asia-east1 --format="table(metadata.name,status.url,spec.template.metadata.annotations)"
gcloud sql instances list --format="table(name,region,state,settings.activationPolicy,settings.dataDiskSizeGb)"
gcloud storage buckets list --format="table(name,location,storageClass)"
gcloud artifacts repositories list --location=asia-east1
gcloud logging sinks list
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID
```

For Hermes, the evidence must include `status=TERMINATED` (or the provider's equivalent), disk users/size, external IP status, other running services and the current billing/budget view. If GCP access, project, zone or billing-account ID is unavailable, result is **BLOCKED**, not PASS and not an inference.

