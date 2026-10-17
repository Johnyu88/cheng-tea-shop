# PRODUCT-11-SECURITY-04｜歷史 WebCrypto 金鑰隔離調查

日期：2026-10-16（Asia/Taipei）  
候選基準：`e6267388377ff51b6f3aaa895d262da4fcf96a68`

## 事件判定

- 風險等級：歷史安全事件，中度；若仍有舊備份資料，升為高優先資料遷移事件。
- 事件內容：已退役的 `public/private-app/index.html` 曾把一個固定 `KEY` 內嵌在瀏覽器 JavaScript，供本機帳務 PWA 的 WebCrypto 加解密使用。
- 金鑰原文：未讀出、未記錄、未重建。
- 現況：該工具及其 `index.html`、service worker、manifest 已從候選 tree 移除；目前 tree 沒有 WebCrypto AES/PBKDF2 加解密實作。

## 歷史工具用途與格式

歷史工具是 `/private-app/` 下的離線商家帳務 PWA，提供收入／支出紀錄、鎖定、匯出及匯入加密備份。歷史程式使用：

- PBKDF2-SHA256，固定 250,000 iterations，由使用者密語推導 AES-GCM key。
- 每筆備份使用隨機 16-byte salt 及 12-byte IV。
- 加密 envelope 版本為 `1`，含 KDF 名稱、iterations、salt、IV、ciphertext 等 Base64 欄位。
- 解密後資料是本機帳務 rows，包含收入／支出類型、日期、金額、摘要等欄位。
- localStorage 儲存加密 envelope；匯出檔名是加密帳務 JSON，匯入會覆蓋該裝置帳本。

上述格式來自 Git 歷史檔案的結構審查，沒有讀取任何實際備份內容。

## 目前引用與資料存在性

- PASS：候選原始碼沒有 `crypto.subtle`、AES-GCM、PBKDF2 或歷史 `/private-app/` 實作引用；`proxy.ts` 僅保留該舊路徑的拒絕規則。
- PASS：正式 image 的 `/app/public/private-app/index.html` 不存在；bundle 唯一 `crypto.subtle` 命中是 Next.js 內部 SHA-256 cache/prefetch helper，未命中 AES-GCM、PBKDF2、歷史 storage key 或 `/private-app/` 流程。
- PASS：PRODUCT-11 變更檔只涉及商品 API、catalog store、publishing UI、測試與 lint 修正，不依賴歷史 KEY。
- PASS：Git 歷史中該工具只出現程式、manifest、service worker；未發現已提交的帳務備份檔。
- UNKNOWN：正式 Windows 資料掛載目錄中是否仍有人保存舊匯出 JSON 或瀏覽器 localStorage。依安全界線，本次未讀取正式資料、照片、訂單或瀏覽器資料，需由資料所有者在核准流程中確認。

## 建議處置（未執行）

1. 由資料所有者確認舊 PWA 是否已停用，以及是否仍有需要讀取的加密匯出檔。
2. 若有資料：在隔離工具中以原使用者密語解密，建立新格式／新金鑰的遷移副本，逐筆核對後再封存舊檔；不得猜測或重建歷史 KEY。
3. 若無資料：保留事件紀錄，將歷史 KEY 視為已退役暴露材料；是否清理 Git 歷史須另取得明確核准，並先評估所有 clone、備份與審計需求。
4. 不在本工單刪除、輪替、重寫歷史或修改任何加密資料。

## B 階段部署評估

### 正式 image 與候選差異

正式容器 `tea-private-v5-prod-admin-24-live`：

- image：`tea-nextjs:prod-admin-14-2be6be0`
- digest：`sha256:e4be4719acae0837c10c8244f268b220b3b14b12b89b05bcd812d2bb423a7f7f`
- command：`node server.js`
- source commit label：未提供，因此無法僅由 image 證明原始碼 commit。

候選相對基準的程式差異集中於：

- `app/api/demo/catalog/route.ts`：持久化／同步狀態與 request diagnostics。
- `lib/server/demo-catalog-store.ts`：同目錄唯一暫存檔名、fsync、atomic rename、跨程序 lock。
- `lib/domain/demo-catalog-service.ts`、`lib/domain/publishing-service.ts`、`features/publishing/components/product-draft-page.tsx`：商品 ID 回傳與同 Session read-back gate。
- `features/checkout/components/public-order-checkout.tsx`：lint-only 的 effect scheduling 修正。
- 測試與文件；沒有 Dockerfile、部署設定、DNS、Caddy 或 Tailscale 修改。

精確 image binary 與候選 source 的等價性仍是 UNKNOWN，因正式 image 沒有 source label，且本工單禁止重建／部署驗證。

### Windows bind mount、lock、atomic replace

只讀 metadata 顯示正式容器把：

- `C:\data\tea-staging\private-accounting-v1-data` 以 RW bind mount 掛到 `/app/data`。
- `C:\data\tea-staging\public-visibility-live` 以 RW bind mount 掛到 `/app/catalog-sync`。

候選 store 的 lock 與 catalog temp file 均位於 catalog 同一目錄；在 Linux Node formal image 中會使用同一 mount 上的 `open(..., "wx")`、`fsync` 與 `rename`。Windows 原生 fallback `File.Replace` 只在 Node `win32` 執行，正式 Acer image 是 Linux amd64，因此不會走該分支。

- PASS（隔離 Windows runner）：合成資料的跨程序 lock、atomic write、逾時與恢復測試通過。
- UNKNOWN（正式 mount）：未在 Acer bind mount 上做寫入測試；NTFS／Docker Desktop mount 的 `O_EXCL`、fsync 與 rename 語義仍需在核准的 staging clone 驗證。

### 回退 image

已只讀確認回退 image 存在於本機 Docker image store：

- `tea-nextjs:reauth-05f058e`
- digest：`sha256:ab3e1e3673aefe55916569852d8246b5501a48c3994905639da61cfa134b2db4`
- Linux amd64，created `2026-10-12T16:41:38Z`

這只證明本機 image 可被查到；真正部署回退前仍需由核准者確認該 image 在部署主機／registry 可拉取且與正式掛載設定相容。

## 核准後操作清單（未執行）

1. 備份：在停止寫入窗口建立 `catalog.json`、公開 publication snapshot、照片目錄及檔案 metadata 的加密／受控備份；計算 SHA-256，禁止把內容放入 repo 或聊天。
2. 部署：先建立 candidate staging container，使用獨立資料目錄與 publication 目錄；確認 image digest、環境變數名稱、mount RW、單一 writer／lock 行為，再安排正式窗口。
3. 驗收：用合成商品驗證 POST ID、同 Session GET、11／12 筆、重啟後存在、sync failure 不重複、draft 不公開、照片與上下架回歸；正式資料只做 count／ID 唯讀核對。
4. 失敗處置：立即停止新增商品，保留 request／instance／sync diagnostics；先判斷 persisted-but-unsynced，不重送 POST。
5. 回退：停止候選服務後，以已核准且可拉取的正式 image digest 回退，重新掛回原 mount；不得用 Git SHA 代替 image digest；回退後做 health、商品清單與 publication 唯讀驗收。

## 部署條件結論

PRODUCT-11 程式本身不依賴歷史 WebCrypto KEY，且正式回退 image 已在本機確認存在；但正式 mount 相容性、舊加密備份是否存在、以及候選 source 對正式 image 的精確對應仍需核准窗口確認。因此本案具備「條件式部署審查」資料，不構成部署核准。
