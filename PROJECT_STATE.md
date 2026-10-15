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
