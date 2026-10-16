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
