# CLOUD-02 備份、復原、遷移與回退規格

## Backup contract

Each backup set contains:

1. Render Postgres logical backup in custom format.
2. Provider PITR coverage where enabled.
3. R2 object manifest with key, version, checksum, byte length and MIME.
4. Schema migration version, application commit, image digest, environment and UTC timestamp.
5. Encrypted copy in an independent backup location.

Target retention: daily 35 days and monthly 12 months, subject to final provider/account approval. Backup failures alert and block a production release.

## Restore rehearsal

Restore into a new isolated database and object prefix. Run row counts, foreign-key checks, order total checks, status-transition checks, object checksum checks, orphan/missing object checks and a read-only app smoke. Record the result without exposing customer data. Never restore over production as a test.

## Data migration

The current Demo SQLite/JSON stores are not production backups. A future migration must be a separately approved, read-only export followed by:

```text
export → canonical manifest → schema validation → duplicate/checksum checks
→ staging dry-run → human reconciliation → approved production import
```

Product images are imported as immutable objects first, then metadata is committed. Orders retain product/price snapshots. Any rejected row is quarantined with a reason; there is no silent partial import.

## Version and rollback

- Every image is identified by Git SHA and image digest.
- Migrations use expand/contract. Destructive changes require a separate maintenance approval.
- Before deployment, record backup ID, migration version, current image digest and current health.
- Candidate health, public health, auth, database read/write probe and object probe must pass before traffic switch.
- If candidate fails before switch, cancel it and retain the current service.
- If candidate fails after switch and schema is backward-compatible, roll back the image. If schema is not backward-compatible, follow the pre-approved repair migration; do not guess.
- DNS is changed last and prior records are retained. No DNS change is part of CLOUD-02.
