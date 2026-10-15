# PROD-ADMIN-08｜正式部署現況交接與原始證據

蒐集時間：2026-10-15 20:59（Asia/Taipei）。本文件只記錄證據；未修改程式、Caddy、Funnel、Docker、SQLite、照片或其他路由，未重新部署，未宣稱實機 PASS。

## 1. 實際網路拓樸

已驗證請求路徑：

`HTTPS client → Tailscale Funnel :10001 → 127.0.0.1:8090 → Caddy :80 → host.docker.internal:8130 → Docker container :3000 → Node server.js / Next.js → API → /app/data SQLite/files`

| 層 | 實際服務／設定 | 證據摘要 |
|---|---|---|
| Client | 使用者回報折疊手機原瀏覽器與 Chrome 均白畫面 | 真實手機只取得 FAIL 回報，未取得 Console/Network 原始檔 |
| DNS/Tailscale | `acer-v5.tail4d8b5a.ts.net` | 本機 HTTPS 請求成功；DNS 封包細節未擷取 |
| TLS/Funnel | `https://acer-v5.tail4d8b5a.ts.net:10001`; Funnel `10001 -> http://127.0.0.1:8090` | `tailscale serve status`，20:59。TLS 在 Funnel 終止是依 HTTPS 對外與 Caddy :80 的間接判定，未做封包級證明 |
| Caddy | `tea-caddy-staging`, `127.0.0.1:8090 -> :80` | `@publicAdmin Host *:10001`; reverse proxy `host.docker.internal:8130`; Host/Origin/X-Forwarded-* 覆寫為 Acer HTTPS origin |
| Docker/Node | `tea-private-v5-prod-admin-03-live`, `127.0.0.1:8130 -> :3000`, `node server.js` | container running，20:59 |
| Next.js/API | build `BJXN_icbTMWQIQD7UVdoB`; `/admin/products/page`、`/admin/orders/page` 存在 | live `.next` manifests；API 為 `/api/demo/...` |
| SQLite/files | `/app/data`、`/app/catalog-sync` | mount listing 顯示 SQLite、`packing-photos/`、`publication.json`、`media/`；未讀取 DB 內容 |

最後健康摘要（20:59）：Caddy `/healthz` 本機 200；公開 `/admin/products`、`/admin/orders` 均 200；後台 container running。公開 `/healthz` 為 404，因 10001 matcher 轉送到後台，不是 Caddy health endpoint。

## 2. 部署版本與容器

- Git branch：`codex/prod-restore-20261015`
- Git HEAD：`2e1dbec1408f62d45eb67989fcc1381bcf6b2eb0`
- 後台 source 比對：`git diff 0b36c71..HEAD -- app/admin/products/page.tsx features/publishing app/api/demo lib/server features/demo` 無輸出。
- Backend container ID：`9c17dd26d8d42e4c4168fa22893830cc7ba0e11a7ebde9278d772b9742f7ef62`
- Image：`tea-nextjs:prod-admin-03-0b36c71-r1`
- Image ID/digest：`sha256:e247f2eb70688627e7b75a7d23ca230f2d4dc59bef3fdf58a30b09deb6f402cc`
- Image created：`2026-10-15T09:47:50.583949763Z`
- Container created/started：`2026-10-15T09:53:58.878092713Z` / `2026-10-15T09:53:59.117966681Z`
- Bind mounts：`C:\data\tea-staging\private-accounting-v1-data -> /app/data`、`C:\data\tea-staging\public-visibility-live -> /app/catalog-sync`；Docker reports RW=true。
- Build ID：`BJXN_icbTMWQIQD7UVdoB`
- Caddy container：`tea-caddy-staging`, ID `170de57a94b86e40cf14b10160b1753a232618486ba3aaea06fb61665e085f61`, image `sha256:d8542f48…`, started `2026-10-14T01:06:03.640555194Z`。
- Caddy active mount：`C:/data/tea-staging/Caddyfile -> /etc/caddy/Caddyfile`, RW=false。
- Funnel：10000→8131（前台，未改）；10001→8090（後台）；tailnet-only 443→8090、8443→8130、8444→8134、8445→8138。

## 3. 商品／訂單管理差異

| 項目 | `/admin/products` | `/admin/orders` |
|---|---|---|
| HTML | 200，`text/html; charset=utf-8`，title `茶行商品管理` | 200，`text/html; charset=utf-8`，title `茶行訂單管理` |
| Route manifest | `app/admin/products/page.js` | `app/admin/orders/page.js` |
| 專屬 JS | `40u0m5q-vcg80.js` | `40lg5h7xzesb6.js` |
| 專屬 CSS | `3ie7...` shared/route CSS listed in HTML | `3cyl_wca04td1.css` plus shared CSS |
| 登入流程 | `merchantStatus()`；密碼登入後載入 catalog | `merchantStatus()`；再載入 admin orders API |
| 主要 API | `/api/demo/catalog?limit=50&includeUnpublished=true` | `/api/demo/admin/orders` 與 order action routes |
| 靜態資源 | 本次列出的 10 個 JS/CSS 全部 200 | 本次列出的 10 個 JS/CSS 全部 200 |

已確認差異是 route chunk/API 不同；尚無證據證明商品專屬 chunk 在真機初始化失敗。

## 4. 原始診斷證據

### A. 未登入商品管理

命令：`curl.exe -sk -D - -o NUL https://acer-v5.tail4d8b5a.ts.net:10001/admin/products`（20:59）。

- HTTP 200；Content-Type `text/html; charset=utf-8`；Cache-Control `private, no-store`。
- 直接開 `/admin/products` 無 redirect；根路徑 `/` 302 到 `/admin/orders`。
- HTML title `茶行商品管理`，登入頁預期內容存在。
- 10 個 Next JS/CSS 資源全部 200。
- 公開 `/api/demo/admin/session` 200；未登入 catalog API 400（受保護，未帶 Session）。

### B. 登入後商品管理

來源：PROD-ADMIN-06B focused Playwright 證據，非本階段完整測試；檔案位置：

- `test-results/prod-admin-products-after-login.png`
- `test-results/prod-admin-products-after-login-fold-inner.png`
- `test-results/prod-admin-products-mobile-412.png`
- `test-results/prod-admin-products-mobile-1080.png`

檔案時間約 2026-10-15 19:45–19:49。

- 412px、1080px：`main`、商品 card、商品 list 均有非零可見 geometry；顯示 10 筆商品。
- Console errors：0；Page exceptions：0。
- 登入後 session API 200；登入後 catalog API 200。
- Cookie 僅記錄 metadata：`__Host-demo_merchant`、Secure、HttpOnly、SameSite=Strict、Path=/；未記錄值。
- 這是 Playwright 證據，不是真實折疊手機證據。

### C. 登入後訂單管理

- 本次路由/資源檢查：HTML 200、title `茶行訂單管理`，10 個 JS/CSS 資源全部 200。
- 歷史後台驗收紀錄有 authenticated admin API 200 與訂單流程 PASS；本階段未重新執行會改資料的訂單操作。
- 沒有取得真實手機訂單頁 DOM/Console/Network 證據。

## 5. 尚未取得的關鍵證據

1. 折疊手機型號、OS、瀏覽器版本、layout viewport，以及一般分頁或已安裝 PWA（`?pwa=products`）。
2. 手機第一個 Console exception/stack trace。
3. 手機第一個失敗或中斷的 `/_next/static/*`、`/api/*` request、status 與 redirect chain。
4. 手機 cookie 名稱/attributes；不可提供 cookie 值或密碼。
5. 白畫面截圖對應的 DOM 是否為空、CSS 不可見、瀏覽器錯誤頁或 PWA stale document。

## 6. 已排除與尚未排除

已降低可能性：錯誤 8130 image、錯誤 Caddy target、route 未編譯、Next JS/CSS 缺失、一般 Host/Origin mismatch、一般 Chromium mobile CSS `display:none`、測試瀏覽器的初始化 JavaScript exception。

尚未排除：真機專屬 runtime exception、真機 request abort、PWA scope/cache/document mismatch、裝置 cookie/session partition、商品 route chunk 或 API 在真機上的差異。

## 7. 最後成功點與目前阻塞

- 最後成功部署點：8130 container `tea-private-v5-prod-admin-03-live`，image `tea-nextjs:prod-admin-03-0b36c71-r1`，Caddy/Funnel topology 未變。
- 最後成功工程證據：Playwright 在 412px/1080px 登入後顯示商品列表，無 Console/Page exception；訂單 route/API 可用。
- 實機驗收：**FAIL，不能宣稱後台部署完成**。
- 目前阻塞：缺少真實折疊手機 Console/Network 原始證據；本階段不自行修復、不重新部署、不提出架構變更。

## Evidence command index

- Runtime：`docker ps`、`docker inspect`、`docker image inspect`。
- Build：`docker exec ... cat /app/.next/BUILD_ID`、`cat /app/.next/server/app-paths-manifest.json`。
- Caddy：`docker exec tea-caddy-staging cat /etc/caddy/Caddyfile`。
- Funnel：`tailscale serve status`。
- HTTP/assets：`curl.exe -sk -D -`，並對 HTML 中每個 `/_next/static/*` 以 HTTP status probe。
- Browser evidence：上述 `test-results/prod-admin-products-*.png`；明確標示為 Playwright，不是真機。
