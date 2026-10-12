# PR #29 整合收尾交付包
更新日期：2026-10-12（Asia/Taipei）
PR：[29](https://github.com/Johnyu88/cheng-tea-shop/pull/29)，分支 `feat/mobile-three-pwa-entries`。程式基準 `3bc328337c23a7fac95e26bcfe5b036c7d64fd2f`；base `fix/acer-demo-build-flag-regression`。

> 此文件不含密碼、Token、銀行號碼或私人電話。示範資料與合成素材不得當作正式資料。

## 1. iPhone Safari 手動驗收（2026-10-11）

| 流程 | 狀態 | 邊界 |
|---|---|---|
| Passkey 登出後重新登入 | PASS（游老師回報） | iPhone Safari 真機結果，不代表 Samsung 已驗收。 |
| 完整合成訂單閉環 | PASS（游老師回報） | Demo 資料；不代表真實收款、物流或通知。 |
| 商品新增／上架、下架、編輯 | PASS（游老師回報） | Demo Catalog；正式資料仍須核對來源。 |
| ORDER-01 付款確認撤銷 | PASS（游老師回報） | 填原因；出貨前回待人工確認，出貨後阻擋。 |
| ORDER-02 重新開啟包裝 | PASS（游老師回報） | 填原因後重開、重選並確認照片，保留原照片與事件。 |
| ORDER-03 出貨異常／攔件／更正 | **待驗證** | 尚未完成實機端到端驗收，禁止標為通過。 |
| Samsung 三入口安裝及重開 | **待驗證** | 需 Samsung Android Chrome 真機。 |

### 更正原因提示

原畫面只寫「更正原因」；空白時確認按鈕雖停用，但未直說必填及字數上限。此次 PR 文件提交加上「必填，最多 500 字」、說明文字及原生必填屬性；不改訂單轉換或資料。此文字變更需等待新 head 的 CI。Acer 執行中的候選仍是提示修改前的 3bc3283 映像，本次不重建既有容器。

## 2. Quality CI 與安全稽核

- PR #29 當時 head `3bc328337c23a7fac95e26bcfe5b036c7d64fd2f`，base `dce7db10524dee93d35b04571c93e411b13d1ca9`；PR 仍 open/draft。
- Quality run `38149752650`（#133）：lint、typecheck、65 個測試檔／334 個 unit/component tests、production build、browser/accessibility、Playwright 32/32、container build/health 均通過。
- Demo mobile E2E：3 pass、1 fail、1 skipped。失敗是未修改的 `e2e-demo/catalog-persistence.spec.ts:23` 找不到「商品已上架」heading；祖先 dce323c 的 run `38148708620` 在同一行同一 assertion 也失敗，屬已觀察基線失敗。整體 Quality 仍為 failure，不是全綠。
- base 歷史 run `38135906664` 的舊 mobile-order-loop OTP 按鈕停用失敗，在 PR head 對應流程已調整並通過；不得拿它掩蓋目前 catalog failure。
- run #133 的 Dependency audit 與 Production dependency audit 都 skipped，該 SHA 沒有新鮮安全稽核結論。PR files 不含 package manifest／lockfile；狀態是「未重新稽核」，不是 clean。
- HANDOFF 過往一次相關稽核記錄 `braces@3.0.3` 一項 high、兩項 moderate；須在上雲前重跑最新稽核並確認處置。
- 本次提示與文件提交後要依新 PR head 重查 CI；在新 run 完成前不宣稱沒有新增失敗。

## 3. Acer 私網候選、部署與回退

- URL：`https://acer-v5.tail4d8b5a.ts.net:8443`（Tailscale tailnet only，無 Funnel）。
- 容器：`tea-nextjs-pr29-8443-accept`，`127.0.0.1:8092 → 3000`；獨立可寫資料 `C:\\data\\tea-staging\\pr29-8443-accept-v2-data`。
- 映像：`tea-nextjs-staging:pr29-8443-3bc3283`；Image ID `sha256:e6d7cfe92a7ef59b01547e2522c1a0747a42b941cad356ecd58bced0fffb8c33`；revision `3bc328337c23a7fac95e26bcfe5b036c7d64fd2f`；建置標籤 `NEXT_PUBLIC_DEMO_COMMERCE=enabled`。
- 明確 Origin：`https://acer-v5.tail4d8b5a.ts.net:8443`。HTTPS health/login/session 通過；cookie HttpOnly/Secure/SameSite=Strict/Path=/、無 Domain；Passkey RP ID 為 hostname，不含埠。錯 Host、Origin 埠、跨站 CSRF、缺 Origin、缺 preview auth、錯 HTTPS 埠皆拒絕（401）。
- 443 → `127.0.0.1:8090` 保持不變；8443 → `127.0.0.1:8092`。舊候選 f95ba80（8091）、AUTH-02、Caddy 均仍運行。
- 回退只關閉新入口：`tailscale serve --https=8443 off`。之後確認 status JSON 仍是 443 → 8090。保留容器與資料；不動 443。

## 4. 五日監測（仍進行中）

- 原計畫 2026-10-11 08:53:12Z 開始，2026-10-16 08:53:12Z 到期；未完成前不得標記完成。
- `soak-20261011.jsonl` 最近只讀列：2026-10-11T23:49:56Z；本機與 Tailnet API 200、Next/Caddy running、最近 5 分鐘 app errors 0，data 154,973 bytes。
- `auth02-20261011.jsonl` 最近列：2026-10-11T23:45:30Z；running、HTTPS 200、errors 0，data 3,398,368 bytes。
- 監測程序仍存活，原始 JSONL 保留。重開機後自動恢復未證實；若日誌停止增長，先恢復原監測腳本，不覆寫任何記錄。

## 5. 正式茶品資料與素材

### 已有文件資料（正式發布前需陳老師再次核實）

- WHITEPAPER 過去首頁方案列出：陳年白茶（一兩／NT$800）、霜雪龍（二兩／NT$1,000）、東方美人（一兩／NT$1,200）。這是目前找到的文件值，不證明現行價格、庫存或正式上架授權。
- PR branch 有 8 個茶品圖：`public/media/tea-products/bai-mao-hou.png`、`daye-oolong-honey-black-tea.png`、`herbal-aroma-aged-oolong.png`、`oolong-green-tea.png`、`taiwan-fo-shou-tea.png`、`taiwan-mi-xiang-wild-mountain-tea.png`、`wushi-jinxuan-yellow-tea.png`、`wuyi-rose-black-tea.png`。
- Git 有圖片不代表照片—茶品對照、來源或正式公開授權已完成。`tea-sample-composite.png` 是合成 Demo 圖，不可代替實照；teacher hero／portrait 是品牌故事素材，不可當商品照。
- 專案歷史提過 9 種樣茶照片；本 PR tree 可確認 8 張茶品圖，第 9 張原始照片及完整原檔索引尚未核對。

### 未確認來源／缺口

| 資產 | 目前線索 | 缺口 |
|---|---|---|
| 茶名／規格／產地／年份／描述 | Whitepaper 的部分展示文案及合成 catalog | 缺店家逐品簽認主表及產地、年份等聲明證據。 |
| 價格／庫存 | 上述三筆歷史文件值 | 需確認現價、計價單位、庫存與售罄；其他品項未核定。 |
| 照片 | branch 內 8 張圖 | 缺品項對照與來源／使用授權清單。 |
| 銀行帳號 | 舊 HANDOFF 說 PR #26 商家資料未核實 | 尚缺陳老師提供並確認的正式匯款資料；不公開／不複製舊測試值。 |
| 電話 | 文件只確立電話為主要聯絡方式 | 缺商家確認的對外號碼與公開授權。 |
| LINE QR | 文件只提 LINE 為次要聯絡方式 | 缺店家提供的正式 QR 原檔／帳號與掃碼驗證。 |

## 6. Samsung 三入口與 Passkey 操作稿（未驗收）

1. Samsung 開 Tailscale，連入 tailnet；用 Android Chrome 開 `https://acer-v5.tail4d8b5a.ts.net:8443/install`。
2. Basic Auth 輸入帳號 `preview` 及已安全交付的測試密碼；勿把密碼放入截圖或回報。
3. 逐一打開商品管理 `/admin/products?pwa=products`、訂單管理 `/admin/orders?pwa=orders`、前台 `/?pwa=storefront`。建議先安裝兩個管理入口，再安裝前台。
4. 每個 route 分別由 Chrome 選單選「安裝應用程式」或「加到主畫面」。若 Chrome 只提供捷徑，照樣建立三個固定入口。
5. 管理入口商家登入後，使用平台 Passkey／螢幕鎖完成註冊；登出，再以同一 Passkey 登入。兩管理入口共用商家 Session。
6. 強制關閉並從各桌面圖示重開，確認名稱／圖示／起始 route 正確；未登入直接開管理 route 應受保護。
7. 記錄 Samsung 型號、Android/Chrome 版本、三入口結果及 Passkey 註冊、登出／登入結果。這是待測腳本，不是 PASS；iPhone 結果不能替代 Samsung。

## 7. 雲端部署前置條件

- [ ] ORDER-03 完成實機異常／攔件／更正及顧客端提醒驗收。
- [ ] Samsung 三入口安裝、重開、Passkey 登出登入實機驗收完成。
- [ ] 最新 PR head Quality 通過；基線失敗須以同 SHA 證據比較並取得明確接受。
- [ ] 最新 dependency + production audit 真正執行，處理 high／moderate findings。
- [ ] 五日監測到期且原始日誌保留；獨立副本備份／還原演練完成。
- [ ] 陳老師確認正式品項主表、照片映射與公開授權、價格／庫存、銀行資訊、對外電話、LINE QR。
- [ ] Cloud 使用正式 HTTPS、秘密管理、專用持久化資料庫／媒體儲存、加密備份、還原演練、存取稽核及監控。
- [ ] Demo Basic Auth／Demo 密碼不能當正式認證；正式商家授權、Passkey 與跨裝置 Session 設定經安全審查。
- [ ] 明確標示匯款／現金／電話確認等人工付款流程；未接物流不得冒稱已出貨；隱私、個資及商家素材授權確認。

## 8. 剩餘阻塞

1. ORDER-03 iPhone 實機端到端驗收。
2. Samsung Android Chrome 三入口與 Passkey 實機驗收。
3. 更正原因提示的新 head CI；Acer 映像仍未包含此文字修正。
4. catalog persistence 基線 E2E 仍使 Quality workflow 失敗。
5. 最新依賴安全稽核缺失；已知舊 finding 尚待最新版本核實。
6. 五日監測尚未完成，重啟後自動恢復未證實。
7. 茶品正式主表、圖檔對照／授權、現價／庫存、銀行資料、電話與 LINE QR 待店家提供確認。
8. 雲端正式部署未執行；PR 未合併 main。

## 9. 工作界線

未重做 ORDER-01～03；不重建既有 Acer 容器、不覆寫資料／備份／日誌、不合併 main、不正式上雲、不部署 Agent 宿舍成員。
## 10. Latest CI after operation-copy clarification

- Quality run #134 for source/UI commit `a521b3732edf8c5db8f20248c993564f9f9c934a` completed: Quality failure; container job PASS.
- Lint, typecheck, 65 test files / 334 unit-component tests, production build, browser/accessibility all passed.
- Demo mobile E2E: 3 passed / 1 failed / 1 skipped. Failure remains `e2e-demo/catalog-persistence.spec.ts:23`, missing 商品已上架 heading. Exact same assertion failed on ancestor dce323c, so no new application failure identified in the copy change.
- Dependency audit and production dependency audit skipped again. Latest security status remains unverified; do not state audit clean.
- This follow-up only records CI evidence in docs; it changes no application code, runtime, container, data, or monitoring. PR remains Quality-red until the baseline test is resolved or explicitly accepted.



## 10/12 deployment acceptance update and 10/15 field run

PR #29 is still draft/unmerged. Quality run #143 (workflow run 38193685121, source/workflow commit 5b996e8; later branch commits are documentation only) passed lint, typecheck, unit/component, production build, browser/accessibility, both isolated mobile E2E runs, cloud-demo build/smoke, and container health. Overall Quality remains failed because the full dependency audit reports one high and two moderate findings in development dependencies; production audit passed. These findings are existing lockfile/toolchain issues, not newly introduced by PR #29. Do not describe CI as all green or security as clean.

A fresh isolated candidate from PR head 9a53b34 is built as image `tea-nextjs-staging:pr29-8443-9a53b34`, digest `sha256:772bd29ad25e6e22c1cf160364c4f0dabfd5c436425a99273316c56d1619a82d`, build flag `NEXT_PUBLIC_DEMO_COMMERCE=enabled`. Container `tea-nextjs-pr29-8443-1014` listens only on localhost 8093 and uses the new independent path `C:\\data\\tea-staging\\pr29-1014-accept-data`. Its health endpoint returns 200. Preview credentials matched the new candidate configuration without printing secret values; Basic Auth denied an unauthenticated request (401) and accepted the matched credentials (200). A request with Origin port 8444 was rejected (401). Candidate auth status reports password provider ready and Passkey enabled, not yet registered in its fresh data. A valid merchant-password login POST returned 403, so session/cookie, full CSRF/Host negative matrix, and app-level Passkey registration are not verified. Do not expose this candidate on :8443 until login and the remaining gates pass.

The current phone URL `https://acer-v5.tail4d8b5a.ts.net:8443` still reaches the old `pr29-8443-3bc3283` image at localhost 8092. Tailscale Serve remains tailnet-only 443→8090 and 8443→8092; Funnel is off. Existing PR #29 f95ba80 candidate, AUTH-02, Caddy and original data remain running. Local health returned 200 for ports 8090–8093. Five-day monitoring is **IN PROGRESS** through 2026-10-16; known monitor processes were alive, and original JSONL files were retained.

### 10/15 field showcase run sheet

1. Confirm the iPhone and/or Samsung is connected to Tailscale. Open the current 8443 URL and check the HANDOFF's candidate mapping first. Until the new candidate clears login, report the current build as old 3bc3283; do not represent it as the 9a53b34 image.
2. Use only an explicitly disposable synthetic order in the demo environment. Do not edit real or previously accepted orders. Keep customer identifiers and credentials out of screenshots and notes.
3. For ORDER-03, record the shipment as shipped, submit each action separately with a non-empty reason (shipping exception, intercept request, correction), and verify the shipped status remains unchanged, an audit event records the reason/actor, customer lookup shows the warning, and a further ship action is blocked. Capture the device/browser and result for each step.
4. If any action fails or a suitable disposable order is unavailable, stop that physical flow and record it as pending; CI's unit/E2E coverage is synthetic and cannot replace the phone result.
5. Samsung Android Chrome: connect Tailscale; open `/install`; sign in; install or add all three entries (`/?pwa=storefront`, `/admin/products?pwa=products`, `/admin/orders?pwa=orders)); register a Passkey on the device; sign out and sign in with it; force-close and reopen each icon, confirming the correct start route and protected admin access. Record Samsung model, Android/Chrome versions and each outcome. iPhone acceptance does not count for Samsung.
6. Recheck 443→8090 and 8443's intended target, health checks, and monitor log growth after the demonstration. Do not stop monitoring or alter old containers/data. If the new candidate has not cleared all gates, keep 8443 on 8092 and postpone the switch.

### Safe :8443 route switch proposal

After valid merchant login/session/cookie checks and the complete negative matrix pass on 8093, first verify 8092 and 8093 health, current Serve mapping, and monitor status. Change only the 8443 target with `tailscale serve --https=8443 http://127.0.0.1:8093`, then verify the private URL and 443→8090. Roll back only 8443 with `tailscale serve --https=8443 http://127.0.0.1:8092`. Preserve both containers/data; never use Funnel. **No switch has been executed.**

### Next blocking items

- Diagnose why the new candidate returns 403 on a valid merchant-password login even though the secret-free configuration comparisons match; then verify session cookie properties, authenticated session, Passkey RP ID and full Host/Origin/CSRF/port denials.
- Resolve the high/moderate dev dependency audit findings or document an accepted, time-bounded exception before cloud release.
- Complete ORDER-03 iPhone and Samsung three-entry/Passkey real-device acceptance.
- Complete five-day monitoring on 2026-10-16 and retain the original logs.

## 2026-10-12 最新展示版驗收矩陣補遺

本節更新並優先於前文舊的 8095 live Session 尚未驗證描述；只記錄新增證據，不重跑已通過的流程。

| 驗收項目 | 最新結果 | 證據／展示處置 |
|---|---|---|
| SQLite 撤銷讀取錯誤 fail-closed | PASS | 新隔離容器、新空白 SQLite；直接 SELECT 缺少的 signature_hash 欄位失敗；先前有效 Cookie 對受保護 orders API 回 HTTP 403。測後容器及唯一測試資料目錄已刪除。 |
| 8095 候選健康 | PASS | tea-nextjs-pr29-session-rev / pr29-session-rev-f3fefc1，image ID sha256:d92078d35e9a2a9373ce4e30c99b2b836657ce913489b5da5fae0217be0626da；8095 health HTTP 200。第一次綜合測試收尾探測誤打到已刪除的 8096，另以正確 8095 埠完成確認。 |
| braces High / 完整 dependency audit | 未解除／Quality red | eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > braces@3.0.3。patch 與 lockfile hash 一致、MAX_DEPTH=100 深度防護已套用；生產候選無法 resolve braces，production audit PASS。pnpm audit 仍報 GHSA-vfj7-8cjw-p6xm；不得標示安全稽核 clean。 |
| 8095 切至 :8443 | 未執行；暫不建議 | 等 braces High 有上游修正版或明確風險接受後，再另行提出切換。現行 :8443 保持舊版 8092 作展示備援。 |
| 原入口與五日監測 | 保留／進行中 | Serve 443→8090、8443→8092；8092、8091、AUTH-02、Caddy 未動。監測 PID 20756/12000/1932 存活，原始三份 JSONL 存在且近期有寫入；監測仍至 2026-10-16，未標完成。 |

### :8443 回退條件（僅供未來經確認後切換）

若獲確認後切換至 8095，切換後任何 health 非 200、正確登入／受保護 API 失敗、負向拒絕測試放行，或 443→8090 改變，立即只回退 :8443：

    tailscale serve --https=8443 http://127.0.0.1:8092

確認 Serve 狀態仍為 443→8090、8443→8092。保留 8095、8092 容器及資料，不動 AUTH-02、Caddy、監測與原始日誌；Funnel 不得啟用。本次沒有切換或執行回退。
