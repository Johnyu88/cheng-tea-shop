# 陳老師茶行：正式部署版本真相與驗收門檻（2026-10-12）

## 不可把 GitHub HEAD 當作已部署版本

- GitHub 工作分支 `feat/mobile-three-pwa-entries` HEAD：`b6a59e7`（已建置；**未部署**）。
- 目前正式公開前台 `:10000`：`tea-nextjs-public:visibility-fix-9046616`，代理至 `127.0.0.1:8119`。
- 目前正式私人後台 `:8443`：`tea-nextjs-private:login-ready-55af0cd`，代理至 `127.0.0.1:8122`。
- GitHub PR #29 仍未合併。不得聲稱 HEAD 與正式部署相同。
- 正式前後台各自維持不同的 Docker 映像；不可用一個模糊的「新版」代稱。
- 私人商品實際資料：`C:\data\tea-staging\private-accounting-v1-data\catalog.json`。
- 目前公開發布快照：`C:\data\tea-staging\public-visibility-live\publication.json`，獨立掛載；資料與執行程式版本不同。

## 既有使用者驗收發現（不可標記完成）

1. 正式後台下架後公開前台一度仍顯示：根因為容器遺漏 `PUBLIC_CATALOG_VISIBILITY_PATH`，已補回部署，但須保留回歸測試。
2. 中文茶名曾被錯誤 UTF-8 解碼：已就地修復，已保存修復前備份。
3. 私人後台新增商品 `a` 未出現在公開網站：現有正式前台只讀八款靜態 fixture。
4. 後台更換照片後公開站沒有同步：正式版尚未支持公開媒體發布。
5. 使用者提供的手機截圖表明前台商品區排版品質與後台編輯可用性仍需驗收。
6. Passkey 獨立沙盒通過，但正式後台未完成手機綁定驗收；不可稱正式 Passkey 已完成。

## 尚未發布候選變更

`b6a59e7` 新增發布商品資料快照、公開照片媒體路由，並讓新增商品、編輯和上下架都觸發同步。此版本**僅 Docker build PASS**。尚須隔離環境測試，不能將編譯通過當成使用者可用。

## 正式交付驗收（缺任何一條都不得說完成）

- 手機真機登入正式後台，無額外 Basic Auth、Passkey 或密碼至少一個實際成功。
- 修改同一茶品的照片、茶名、規格、價格並儲存：後台重新整理仍可見變動；前台重新整理同樣顯示新內容與新照片。
- 後台「下架」：公開首頁、茶品明細、購物車和公開 API 均立即不可購買；重新上架後恢復。
- 新增一款有照片商品：公開首頁、商品細節及購物車都可使用；不是只存在後台。
- 手機 390px 寬、常見 iPhone 裝置檢查圖片比例、文字、表單、按鈕與水平捲動。
- 驗證未授權者不能讀取/修改私人資料；公開網站不能存取私人 API。
- 產出每次部署的 Git SHA、Docker image digest、服務 URL/埠、環境設定名稱（不含值與秘密）、測試結果及回退命令。
- 以上通過後由使用者真機驗收，不再以自動化 PASS 代替實機 PASS。

## 部署規則

先測候選版本；保留正式容器、資料與快照備份。正式切換與回退必須有具體紀錄，禁止模糊的「已完成」。不要增建 ERP、客戶查單或與這次需求無關的功能。


## 2026-10-13 凌晨正式切換驗證（已完成部分）

- 正式 `:10000` Funnel 現指向 `127.0.0.1:8129`，容器 `tea-public-v4-ready`，映像 `tea-nextjs:catalog-04dde29`。
- 正式 `:8443` Tailnet Serve 現指向 `127.0.0.1:8128`，容器 `tea-private-v4-ready`，映像 `tea-nextjs:catalog-04dde29`。
- 原本公開容器 `tea-public-visibility-synced`（8119）及私人容器 `tea-private-publication-connected`（8122）保留供回退。
- 已備份舊公開快照 `public-visibility-live/publication.before-v4.json`，重建的發布快照只包含上架商品，單獨複製新增商品的照片。
- 直接使用正式私有商品資料的複本建立發布快照，驗證 6 筆上架商品、含新增商品 `a` 及其 1,072,272 位元組的圖片。
- **正式外部網域**驗證：公開商品 API 共 6 筆，`a` 存在、公開照片 HTTP 200（1,072,272 bytes）、首頁包含 `a` 的商品連結、商品詳情 HTTP 200；私人 API 在公開網域回應 404；私人後台 Session 狀態 ready。
- Playwright 390×844 手機尺寸檢查：6 個商品卡片、`a` 商品卡片存在、無整頁水平溢出。
- 尚未完成：使用者 iPhone 真機換照片兩次的正式版驗收；不能將這部分標為 PASS。商品編輯及新增的自動回歸測試仍須繼續強化。
- 回退指向：公開 `tailscale funnel --https=10000 off` 後 `tailscale funnel --bg --https=10000 http://127.0.0.1:8119`；私人 `tailscale serve --https=8443 off` 後 `tailscale serve --bg --https=8443 http://127.0.0.1:8122`。回退時需要評估新舊公開快照格式的相容性，避免資料不一致。
