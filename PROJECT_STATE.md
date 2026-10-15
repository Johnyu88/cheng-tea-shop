# PROJECT_STATE

Updated: 2026-10-15 (Asia/Taipei)

## 2026-10-15 PROD-ADMIN-23 safe deployment utility

- Design: `docs/superpowers/specs/2026-10-15-prod-admin-23-safe-deploy-design.md`.
- Tool: `tools/prod-admin-23/cli.mjs` (Acer absolute path: `C:\Users\alluser\Documents\Codex\2026-10-15\ui-rwd-01-johnyu88-cheng-tea\tools\prod-admin-23\cli.mjs`).
- Default behavior is dry-run against the synthetic allowlist only. Isolation mode uses synthetic source, loopback test port, and non-formal mounts; formal data roots are rejected after Windows/Docker Desktop path normalization.
- Tests: focused Vitest `6/6 PASS`; full Vitest `71 files / 356 tests PASS`; TypeScript and ESLint PASS; production build PASS with six pre-existing dynamic filesystem tracing warnings; synthetic Docker Engine API dry-run/start/health/failure-cleanup lifecycle PASS. No formal Secret was read and no formal container or route changed.
- Stop point: commit and push after fresh lint/full relevant verification; do not proceed to PROD-ADMIN-22 deployment.

## 2026-10-15 PROD-ADMIN-24 formal switch capability

- `tools/prod-admin-23/production-switch.mjs` adds an explicit `production-switch` gate with exact source/candidate image/container identity checks, backup manifest check, RW writer freeze, health verification, and automatic restoration of the original container on failure.
- Formal mode requires `PROD-ADMIN-24-AUTHORIZED`; it was not invoked in this phase. No formal Secret was read and no formal service/data/route changed.
- Focused tool tests: `10/10 PASS`; synthetic production-flow rehearsal PASS with temporary containers cleaned; full Vitest `72 files / 360 tests PASS`; TypeScript and ESLint PASS; production build PASS with six pre-existing tracing warnings. Read-only formal preflight PASS for the verified source/candidate IDs, backup marker, and four known RW writers; formal switch was not invoked.
- First formal switch attempt was automatically rolled back on the immediate public health check; read-only verification confirmed the original container and all three other RW writers running, and 8130/10001/10000 all HTTP 200. No data or route change remained.
- The CLI now uses a bounded 60-second retry window for transient Caddy/Funnel reconnection. Focused tool tests are `10/10 PASS`; retry fix pending commit/push before any second switch attempt.

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

## 2026-10-15 UI-RWD-01 formal frontend release gate

- Isolated worktree UI scope is limited to `app/globals.css`, the two public audio components, and `e2e/ui-rwd-01-photo-integrity.spec.ts`; no backend, Caddy, order, payment, product-data, or original-photo changes.
- Verification: Vitest 344/344 PASS; typecheck PASS; production build PASS; Chromium RWD 5/5 PASS at 390, 412, 768, 1080, and 1440px. WebKit/Safari automation is unavailable in this environment and is not claimed.
- 10000 baseline is Tailscale Funnel `10000 -> 127.0.0.1:8131`, container `tea-public-contact-4837371`, image `tea-nextjs:contact-4837371`, with the read-only catalog publication mount. 10001/backend/Caddy/8130/443/8443 remain out of scope.
- Pre-deploy recovery is `C:\data\tea-staging\recovery\ui-rwd-01-before-10000`; the old image/container and read-only catalog data must remain recoverable.
- Release gate: source is ready for a 10000-only replacement; physical foldable-device confirmation remains pending after deployment.

## 2026-10-15 UI-RWD-01 10000 formal deployment

- Source commit: `f2a2a78d0351f6f0f650a2e511ce79b83d954191`, pushed to `codex/prod-restore-20261015`.
- Deployment time: `2026-10-15T18:58:23+08:00` evidence collection; replacement container created at `2026-10-15T10:56:35Z`.
- New 10000 container: `tea-public-contact-4837371`; image `tea-nextjs:ui-rwd-01-f2a2a78`, image ID `sha256:a3ade5517c5b90a09b693ae69c023882d6b38b3e40d57ed8b1fed44bd9f3c8fa`; target remains `Tailscale Funnel 10000 -> 127.0.0.1:8131`.
- Existing catalog publication mount remains read-only at `C:\data\tea-staging\public-visibility-live -> /app/catalog-sync`. No database, photo, order, admin, Caddy, 10001, 8130, 443, or 8443 changes.
- Formal HTTPS checks: `/`, `/api/public/catalog`, `/cart`, `/checkout`, and a tea detail route all returned 200. Official Playwright metrics passed at 390, 412, 768, 1080, and 1440px: natural/rendered image ratios match, `object-fit=contain`, no horizontal overflow, metadata preload, and single-column story/media through 1080px.
- Screenshots: `test-results/ui-rwd-01-official-phone-390.png`, `...fold-outer.png`, `...tablet-768.png`, `...fold-inner-1080.png`, `...desktop-1440.png`; pre-deploy browser evidence was captured from the old 10000 page before cutover.
- Rollback preserved: stopped old container `tea-public-contact-4837371-ui-rwd-01-rollback`, old image `tea-nextjs:contact-4837371`, plus `C:\data\tea-staging\recovery\ui-rwd-01-before-10000`.
- Physical foldable-phone visual acceptance is still pending; automated/browser checks must not be treated as real-device acceptance.

## 2026-10-15 PROD-ADMIN-07 formal admin deployment consistency audit

- Git HEAD is `2e1dbec`; the live backend remains image `tea-nextjs:prod-admin-03-0b36c71-r1`, container image digest `sha256:e247f2eb70688627e7b75a7d23ca230f2d4dc59bef3fdf58a30b09deb6f402cc`, created from the verified backend baseline.
- `git diff 0b36c71..HEAD` is empty for admin products, publishing, auth, catalog API, and server files. The live `.next` manifest contains both `/admin/products/page` and `/admin/orders/page`.
- Caddy's active mounted file is the expected configuration; Funnel `10001 -> 8090`, Caddy `host.docker.internal:8130`. 10001 and forwarded 8130 returned the expected product/order HTML routes.
- Product and order pages have distinct route assets; every product-specific JS/CSS asset returned HTTP 200. No source/build/route mismatch was found.
- User foldable-phone result remains FAIL for `/admin/products`; this is not replaced by automated evidence. Root cause remains unknown because real-device Console/Network data is unavailable.
- No container, Caddy, SQLite, photo, order, or frontend change was made. No deployment update is authorized by evidence.

## 2026-10-15 PROD-ADMIN-06B foldable product-management blank screen diagnosis

- Production baseline unchanged: `tea-private-v5-prod-admin-03-live`, image `tea-nextjs:prod-admin-03-0b36c71-r1`; Caddy 10001 Funnel remains `10001 -> 8090 -> host.docker.internal:8130`.
- User real-device result is FAIL on both the original browser and Chrome. This is separate from the current Chromium evidence and is not being marked PASS.
- Public `10001/admin/products` and local `8130/admin/products` with the exact forwarded Host/Origin headers returned identical HTML byte count/hash. Every referenced Next static JS asset returned 200.
- Authenticated Playwright diagnostics at 412px and 1080px: `main`, product card, and product list had visible/displayed geometry; session API and authenticated catalog API returned 200; console errors and page exceptions were 0. Cookie attributes were Secure, HttpOnly, SameSite=Strict, Path=/; no value recorded.
- No source, container, Caddy, database, photo, order, or frontend change was made. No repair commit or deployment exists for PROD-ADMIN-06B.
- Blocker: the real phone's failing request/console evidence is unavailable from this host. Minimal next diagnostic is a redacted Chrome DevTools remote capture of the failing page: URL/status, first console exception, failed `/_next/static/*` or `/api/*` request, viewport, and cookie names/attributes only; never share cookie values or password.

## 2026-10-15 PROD-ADMIN-05 public entry Not found fix

- Root cause: `/admin/login` is not an application route. The actual password login UI is client-rendered at `/admin/orders`; the direct Acer proxy intentionally returned plain-text `Not found` for `/` because direct mode did not allow a storefront root.
- Layered evidence before the fix: `8130 /` 404 plain text, `Caddy 8090 /` 404 plain text, and Funnel `10001 /` 404 plain text; all three `/admin/orders` endpoints returned 200; all three `/admin/login` endpoints returned 404.
- Minimal fix: `Caddyfile.prod-admin-04` now redirects only the 10001 Funnel root (`Host *:10001`, `/`) to `/admin/orders`. Existing 443, 8443, and 10000 roots are not matched.
- Caddy additionally normalizes the 10001 forwarded Host/Origin/X-Forwarded-Host to the configured Acer origin; this was required for public API requests and is limited to the 10001 matcher.
- Fresh public checks: root 302 with `Location: /admin/orders`; public `/admin/orders` 200; public unauthenticated admin API 403. In-browser DOM evidence shows title `茶行訂單管理`, heading `密碼登入`, label `管理員密碼`, and disabled `登入` button before a password is entered.
- No database, container, 10000 route, 443 route, 8443 route, formal frontend, or credentials were changed.
- Recovery: `C:\data\tea-staging\recovery\prod-admin-04-before-caddy-origin-fix\Caddyfile.before`; disable the independent Funnel with `tailscale funnel --https=10001 off`.

## 2026-10-15 PROD-ADMIN-09C diagnostic candidate

Status: candidate verified in isolation; formal deployment is not authorized.

- Scope: `/admin/products?diagnostics=1` only. Normal product mode and `/admin/orders` do not load the diagnostic script.
- Evidence: static server HTML marker, independent Vanilla JS startup/error/resource capture, React mount marker, safe Session/Catalog status metadata, and DOM visibility checks. No secrets or application data are emitted.
- Verification: TypeScript PASS; production build PASS with six pre-existing dynamic filesystem tracing warnings; Vitest `347/347 PASS`; Chromium Playwright `26/26 PASS`. WebKit remains unverified because the local Playwright WebKit binary is missing.
- Isolation: local candidate server on port `3109`; formal `10001`, `10000`, Caddy, Funnel, Docker, SQLite, photos, orders, and existing rollback artifacts were not changed.
- Stop point: ChatGPT review required before any formal diagnostic deployment. Revert the candidate commit to remove the tool.
