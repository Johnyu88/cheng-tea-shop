# PRODUCT-11-RELEASE-07 minimal candidate seal

Date: 2026-10-16

Candidate branch: `fix/product-11-fix-01-minimal`

Starting candidate commit: `206d0cbb4221ed3c73e7987f10fc803f9d81ea6d`

## Quality gate

| Check | Result | Evidence |
|---|---|---|
| Candidate identity | PASS | HEAD verified as `206d0cbb4221ed3c73e7987f10fc803f9d81ea6d` before this document commit. |
| Excludes checkout lint change | PASS | Only `features/checkout/components/public-order-checkout.tsx` differs from `aae6a9b`; PRODUCT-11 files are unchanged from the candidate. |
| Focused PRODUCT-11 tests | PASS | 5 files, 25 tests. |
| TypeScript | PASS | Direct `typescript/bin/tsc --noEmit`. |
| Production build | PASS | Docker Linux build completed; image digest `sha256:f5c750a07ec16cee266f6201dc3f6fa85ea87fd1628980f282722a8186d53733`. |
| Full lint | FAIL / known | 1 error is the intentionally excluded checkout effect change; 17 warnings are existing. No new PRODUCT-11 lint error was found. |
| Incremental secret scan | PASS | Official gitleaks v8.30.0 archive SHA-256 verified as `54fe94f644b832dd08e8c3a5915efb3bfa862386d59fb27ca0792cb687a83573`; scan of `e626738..HEAD` covered 3 commits and found no leaks. |
| Full repository secret scan | BLOCKED | Historical security-event findings remain outside this candidate gate and must not be called clean. |
| CONTAINER-06 compatibility | PASS by scope comparison | Minimal branch removes only checkout code; Linux/Windows mount and catalog persistence code paths are unchanged. |

## Deployment checklist — design only, not executed

1. Obtain an approved maintenance window and confirm CLOUD work is unaffected.
2. Read-only verify the current container name, image digest, ports, network, command, environment variable names, and both formal mount paths.
3. Confirm the original formal image is present on Acer by full digest. Do not treat a Git SHA or `reauth-05f058e` as an image rollback guarantee.
4. Create an operator-controlled backup of formal `catalog.json`, public synchronization data, and media metadata in an approved protected location. Record UTC timestamp, byte size, SHA-256, and restore-test result. Do not create it during this preflight.
5. Record pre-deploy inventory from the same authenticated session: total products, every product ID, publication state, photo filename/reference, and draft/published counts. Do not expose product contents in logs.
6. Deploy only after explicit approval, using the intended candidate image and the known formal mount paths. Confirm the candidate image digest before switching traffic.
7. Do not change Caddy, Tailscale, DNS, or unrelated environment settings.
8. After switch, verify health, login, same-session admin GET, product count, every pre-deploy ID, photos, drafts, published products, and draft absence from public catalog.
9. Add one uniquely marked synthetic product only if separately approved; verify POST ID, same-session GET ID, restart persistence, and public sync state. Never retry a POST solely because GET is unavailable.
10. If any critical check fails, stop writes, preserve logs, and use the original formal image by its verified digest. Do not restore data until the backup checksum and target mount are independently confirmed.

## Rollback checklist — design only, not executed

1. Stop the change window and record request ID, instance ID, image digest, and last known write/sync status.
2. Confirm the original formal image digest exists locally and is the approved rollback image. Local startup evidence is not registry pullability evidence.
3. Switch the container definition back to the original image, preserving the exact formal mounts, ports, network, command, and environment names.
4. Start the rollback container without changing `catalog.json`, photos, orders, Caddy, Tailscale, or DNS.
5. Verify health, authenticated admin GET, product IDs/counts, photos, draft/publication states, and public catalog visibility.
6. Restore data only under an explicit data-rollback approval and only after backup integrity verification; never use Git source checkout as a data rollback.
7. Preserve failed-candidate logs and record the final container/image digest.

## Stop conditions and remaining risk

- Stop before deployment if the original image is not present by digest, if registry/deployment-host pullability is unknown at the deployment site, if mount paths or environment contract differ, or if backup checksum/restore evidence is missing.
- Stop on any new PRODUCT-11 test regression, any ID mismatch, missing post-restart product, duplicate after sync retry, photo loss, draft leakage to public catalog, or unexpected write/sync diagnostic.
- The formal image has no verified Git source label. Candidate-to-image source equivalence is therefore unproven.
- The minimal candidate intentionally leaves the checkout lint error. Deployment requires explicit acceptance of this known non-PRODUCT-11 quality failure or a separately approved lint-only change.
- No production backup, deployment, restart, traffic switch, or rollback was performed.
