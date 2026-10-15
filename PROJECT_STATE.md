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

## 2026-10-15 PROD-ADMIN-04 mobile external ingress — latest

- Existing routes were preserved: `10000 -> 127.0.0.1:8131` remains `tea-public-contact-4837371`; `443 -> 8090`; `8443 -> 8130`; `8444 -> 8134`; `8445 -> 8138`.
- Added independent Tailscale Funnel: `https://acer-v5.tail4d8b5a.ts.net:10001/ -> 127.0.0.1:8090 -> Caddy -> host.docker.internal:8130`.
- Caddy asset/config: `Caddyfile.prod-admin-04`; only `Host *:10001` normalizes Host, Origin, and X-Forwarded-Host to the existing configured Acer origin. Other routes keep the prior proxy behavior.
- Recovery evidence: `C:\data\tea-staging\recovery\prod-admin-04-before-funnel` and `C:\data\tea-staging\recovery\prod-admin-04-before-caddy-origin-fix`.

### Public ingress verification

- Public 10001 health: PASS (HTTP 200).
- Public unauthenticated admin API: PASS protected (HTTP 403).
- Public password login: PASS (HTTP 200); authenticated admin API: PASS (HTTP 200). Password and cookies were not printed.
- Existing 443 health/admin protection: PASS (200/403).
- Existing 10000 was not overwritten; it remains the unrelated 8131 service and its backend health path returned 404, as expected for that service.
- Safari/LINE on a real phone: **NOT VERIFIED / BLOCKED** in this environment. The independent external probe could not resolve the Tailscale hostname, and no physical non-Tailscale phone evidence is available. Do not mark mobile delivery PASS until Chen's phone completes Safari and LINE checks for login, lookup, payment confirmation, photo upload, and shipping.

### Rollback

Disable only the new ingress with `tailscale funnel --https=10001 off`, restore `C:\data\tea-staging\recovery\prod-admin-04-before-caddy-origin-fix\Caddyfile.before` if needed, and reload Caddy. Existing 10000, 443, 8443, 8130, SQLite, and photos remain independent.

## 2026-10-15 PROD-ADMIN-05 public entry Not found fix

- Root cause: `/admin/login` is not an application route. The actual password login UI is client-rendered at `/admin/orders`; the direct Acer proxy intentionally returned plain-text `Not found` for `/` because direct mode did not allow a storefront root.
- Layered evidence before the fix: `8130 /` 404 plain text, `Caddy 8090 /` 404 plain text, and Funnel `10001 /` 404 plain text; all three `/admin/orders` endpoints returned 200; all three `/admin/login` endpoints returned 404.
- Minimal fix: `Caddyfile.prod-admin-04` now redirects only the 10001 Funnel root (`Host *:10001`, `/`) to `/admin/orders`. Existing 443, 8443, and 10000 roots are not matched.
- Caddy additionally normalizes the 10001 forwarded Host/Origin/X-Forwarded-Host to the configured Acer origin; this was required for public API requests and is limited to the 10001 matcher.
- Fresh public checks: root 302 with `Location: /admin/orders`; public `/admin/orders` 200; public unauthenticated admin API 403. In-browser DOM evidence shows title `茶行訂單管理`, heading `密碼登入`, label `管理員密碼`, and disabled `登入` button before a password is entered.
- No database, container, 10000 route, 443 route, 8443 route, formal frontend, or credentials were changed.
- Recovery: `C:\data\tea-staging\recovery\prod-admin-04-before-caddy-origin-fix\Caddyfile.before`; disable the independent Funnel with `tailscale funnel --https=10001 off`.
