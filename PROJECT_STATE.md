# PROJECT_STATE

Updated: 2026-10-15 (Asia/Taipei)

## Current stop point

- Task: `PROD-ADMIN-03`
- Worktree: `codex/prod-restore-20261015`
- Git commit: `0b36c71a7ba9743d52bfd8a42bb057fa1ebd9334`
- Restore baseline: `f9748e187fa1cd74860c5fda79045dced9124d0d`
- Existing data backup: `C:\data\tea-staging\recovery\prod-restore-20261015-pre-render`
- Caddy rollback: `C:\data\tea-staging\recovery\prod-admin-03-caddy-before`

## Verified current state

- Caddy container: `tea-caddy-staging`, bound to `127.0.0.1:8090 -> :80`.
- Caddy now proxies `host.docker.internal:8130`; `/healthz`, `/api/health`, `/admin/orders`, and `/admin/products` returned 200 through HTTPS.
- HTTPS URL currently reachable from the Acer tailnet: `https://acer-v5.tail4d8b5a.ts.net`.
- Backend container: `tea-private-v5-reauth`, image `tea-nextjs:reauth-05f058e`, data mounted from `C:\data\tea-staging\private-accounting-v1-data`.
- The backend image is older than this worktree commit and still exposes the phone-login UI. It is not evidence that commit `0b36c71` is deployed.
- Existing SQLite and media files were not deleted or recreated.

## Verification

- Worktree revision tests: `343/343 PASS`, typecheck PASS, production build PASS (existing dynamic filesystem tracing warnings remain).
- Live HTTPS: health and admin page routes PASS.
- Full authenticated merchant E2E: pending original admin password and deployment of the current worktree revision.

## Blocker / next action

The current task explicitly forbids rebuilding containers. The existing 8130 container cannot load the current worktree revision without a controlled image/service update. Do not claim the four login fixes or full order workflow are live until that deployment is authorized and verified. Preserve the Caddy rollback and existing data.

## 2026-10-15 PROD-ADMIN-03 minimal reversible update

- Source change: `proxy.ts` now permits only the required customer order endpoints in Acer direct mode (`/api/demo/otp` and `/api/demo/orders*`); regression test added in `tests/cloud-demo.test.ts`.
- Verified build image: `tea-nextjs:prod-admin-03-0b36c71-r1`, image ID `sha256:e247f2eb70688627e7b75a7d23ca230f2d4dc59bef3fdf58a30b09deb6f402cc`.
- Live 8130 replacement: `tea-private-v5-prod-admin-03-live`, container ID `9c17dd26d8d42e4c4168fa22893830cc7ba0e11a7ebde9278d772b9742f7ef62`, running on `127.0.0.1:8130 -> 3000`.
- Old rollback container `tea-private-v5-reauth` remains preserved and exited, image `tea-nextjs:reauth-05f058e`; no old SQLite, catalog, or photo mount was deleted or recreated.
- Caddy `tea-caddy-staging` is validated/reloaded and proxies `host.docker.internal:8130`; HTTPS `/api/health` and `/admin/orders` returned 200 after cutover.
- Persistent data mounts remain `C:\data\tea-staging\private-accounting-v1-data -> /app/data` and `C:\data\tea-staging\public-visibility-live -> /app/catalog-sync`.
- Recovery evidence: `C:\data\tea-staging\recovery\prod-admin-03-8130-before`, `C:\data\tea-staging\recovery\prod-admin-03-caddy-before`, and `C:\data\tea-staging\recovery\prod-admin-03-8130-after` (redacted summaries; no secret values).

### Verification evidence

- Regression: focused Acer proxy test 37/37 PASS after a deliberate pre-fix 404 failure.
- Production Docker build: PASS; TypeScript compilation PASS; existing six dynamic filesystem tracing warnings remain.
- Replacement HTTPS E2E: health, catalog, checkout OTP, order creation, password admin login, admin order query, manual payment confirmation, packing photo upload, ship, deliver, and cross-device lookup all PASS using explicitly marked synthetic orders. No password or access secret was printed.
- Restart persistence: replacement restart followed by health 200, password login 200, order query 200; two marked orders remained, one delivered and one packing photo remained.
- Mobile external access: **BLOCKED**. `tailscale serve status` reports `https://acer-v5.tail4d8b5a.ts.net` and `:8443` as `tailnet only`; the only Funnel `:10000` points to unrelated 8131 and was not used. A phone without Tailscale cannot be declared reachable.

### Rollback

Keep old container and image. To roll back, stop `tea-private-v5-prod-admin-03-live`, start `tea-private-v5-reauth`, and reload the saved Caddy configuration from `C:\data\tea-staging\recovery\prod-admin-03-caddy-before`. Do not delete either container or the mounted data.

### Git state

Implementation and documentation are committed at `47b6d26` and pushed to `origin/codex/prod-restore-20261015` (`SYNCED`).
