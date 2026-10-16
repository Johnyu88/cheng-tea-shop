# PRODUCT-11-CONTAINER-06 Linux bind-mount isolation evidence

Date: 2026-10-16

Candidate source: `aae6a9b7f63054498b09918ddbaac29d64267518`

Candidate image: `tea-nextjs:product-11-container-06-aae6a9b`, digest `sha256:fa2c5b56b2eaa1880a6be7d213cba1a93be2b1cd788c835e456edac8d93f007e`

All data was synthetic. Windows directories were new and separate from `C:\data\tea-staging`; no formal catalog, photos, orders, or service mounts were accessed.

## Results

| Check | Result | Evidence |
|---|---|---|
| Linux candidate image build | PASS | Dockerfile build completed; only existing dynamic filesystem tracing warnings appeared. |
| Windows bind mount to Linux `/app/data` and `/app/catalog-sync` | PASS | Candidate containers ran with fresh directories and isolated ports 8443/8444/8445. |
| Synthetic product 11 and 12 | PASS | Two POST responses were HTTP 201 with persisted IDs; same-session GET found both IDs; catalog grew from 8 to 10. |
| Container stop/restart persistence | PASS | After stop/start, same isolated catalog returned both product IDs and total 10. |
| Cross-process lock | PASS | Two candidate containers concurrently POSTed; both returned HTTP 201/persisted/completed and both names were found after GET. |
| fsync / atomic replacement path | PASS | POST responses completed and the bind-mounted catalog remained valid after process stop/restart; the candidate write path uses temp file sync and rename. |
| Abandoned lock timeout/recovery | PASS | Isolated `catalog.json.lock` caused HTTP 400 with no successful ID; removing that isolated lock allowed HTTP 201 and exactly one matching ID. |
| Public sync failure | PASS | Read-only public mount returned HTTP 503; log recorded `writeStatus=persisted`, `syncStatus=failed`. Private ID remained present. |
| Sync recovery without duplicate | PASS | Writable container PATCHed the same ID; HTTP 200 and public catalog contained one matching ID. |
| Diagnostic safety | PASS | Logs contained request ID, instance ID, write/sync status only; no product content, credential, or personal data was used. |

## Rollback image

The formal image `tea-nextjs:prod-admin-14-2be6be0` was confirmed locally at digest `sha256:e4be4719acae0837c10c8244f268b220b3b14b12b89b05bcd812d2bb423a7f7f`. It started in a separate container with new isolated mounts and `/api/health` returned HTTP 200. No formal container was stopped or recreated.

This proves local Acer image startup only. It does not prove registry or another deployment host can pull the image, and it does not establish source-SHA equivalence because the image has no verified Git label.

## Minimal candidate

The checkout effect/lint change was independent of PRODUCT-11. A separate worktree and branch removed only that change:

`fix/product-11-fix-01-minimal` at `206d0cbb4221ed3c73e7987f10fc803f9d81ea6d`

Focused tests passed: 5 files, 25 tests. This branch was not pushed and did not replace `fix/product-11-fix-01`.

## Remaining blockers

- Full formal image/source equivalence remains unprovable without build provenance.
- Registry/deployment-host pullability of the original rollback image remains unverified.
- Formal backup, deployment, post-deployment validation, and rollback have not been executed.
- No production approval was implied by these isolated results.
