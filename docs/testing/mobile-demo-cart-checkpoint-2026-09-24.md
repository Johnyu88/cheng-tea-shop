# 手機 Demo 購物車檢查點（2026-09-24）

- 工作樹：`codex/wave-7-shopping-quality-gate`。先檢查並保留其他未提交文件、ERP 規劃及 `next-env.d.ts`；原有商品頁成功導向 `/cart` 三行修改已核實。
- 修復該導向所需的 Vitest Router mock；加入成功路徑斷言；更新 Playwright 從商品頁直接落在購物車的流程。購物車有「繼續購買」連回目錄與「前往結帳」；保留原有合成結帳。
- Corepack 已緩存 pnpm 11.19.0，但 `pnpm` 不在 PATH；`corepack pnpm test:run` 會因無 TTY 的 modules purge 提示停止。使用既有 `node_modules/.bin/vitest.cmd`、`tsc.cmd`、`eslint.cmd`、`next.cmd`、`playwright.cmd`，避免清理其他工作樹依賴。Node 24.21.0 與宣告 24.19.0 有偏差。
- Vitest 18 files／119 tests、typecheck、Next Webpack build 通過；ESLint 0 errors／一項既有 `<img>` warning。Playwright 指定 Chromium v1243 已安裝；獨立埠 3013 的購物車／結帳 10/10 通過。新增 standalone 靜態資源測試啟動腳本；3000 埠既有 Node 進程未碰觸。
- PR #15 的完整手機 Demo S1 門檻尚未達成：OTP、地址驗證與覆核、唯一持久化訂單、安全查單、通知去重及失敗、店家權限／拍照、人工出貨狀態均不存在。固定 `MOCK-ORDER-001` 僅為原型；不得雲端測試部署或宣稱可處理真實顧客／付款。
- 下一段：服務端持久測試訂單、受控模擬 OTP 和安全查單；其後店家待辦、拍照、通知、人工交寄；最後手機驗收。正式金流、main 合併及正式部署均未進行。

## 後續本機切片

- 聯絡資料步驟新增台灣手機號碼 `09` 加八位數的檢查，可移除空白與連字號；Mock checkout service 同步執行並回傳正規化號碼。這只檢查格式，不代表持有人已通過 OTP。
- 測試環境可用 `corepack pnpm --config.verifyDepsBeforeRun=false test:run` 呼叫緩存的 pnpm 11.19.0，並略過舊依賴工作樹的自動清理；不得將此視為新的 frozen install 證據。
- Server-only 的 Demo 訂單契約以記憶體假資料測試唯一編號／高熵查單密鑰、狀態次序、照片 metadata 與模擬通知去重。未接入結帳、API 或畫面；沒有持久化、店家權限、真實照片上傳及實際發信。此切片只建立實作邊界，不能解除 PR #15 的 S1 阻塞。
- 後續測試：Vitest 19 files／128 tests、Chromium 與 WebKit 購物車／結帳各 10/10 通過；TypeScript／build、ESLint 的最終結果以階段提交前複測為準。這不是實體 iPhone 驗收。

## 地址覆核切片

- 宅配地址新增長度（6 至 200 字）與控制字元檢查，收件前會整理空白；到店取貨不用地址。格式通過仍明示「店家人工覆核」，沒有外部地址服務或可配送保證。
- 結帳頁及 Mock service 均採相同檢查；30 個相關 Vitest 測試通過。持久化訂單、OTP 與通知尚未接入頁面，本階段仍只展示原型。

## 本機訂單持久化切片

- Demo 訂單新增 SQLite 本機保存，重開服務仍可用 32-byte 隨機密鑰查詢訂單、維持模擬付款／照片狀態及通知去重；只存密鑰雜湊與照片參照，不存影像、地址或真實付款資料。
- Vitest 20 檔／134 測、TypeScript 與相關 ESLint 通過。資料庫僅供單一程序本機展示，沒有 API、權限、真實通知或照片上傳；檔案需受作業系統權限保護。實際手機驗收與雲端測試部署仍未進行。

## 模擬 OTP 契約切片

- 新增僅允許兩組合成手機號碼的服務內 OTP 挑戰：5 分鐘效期、5 次錯誤鎖定、60 秒重發冷卻、每小時 3 次、重發作廢舊碼、驗證後不可重用；回傳值沒有 OTP 本文。
- OTP 尚未接到結帳或可安全收取模擬碼的通道，不能當成已完成手機驗證。Vitest 21 檔／140 測、TypeScript 通過；無 SMS 發送。

## 最新整體回歸

- `corepack pnpm --config.verifyDepsBeforeRun=false test:run`：21 檔／140 測通過；`tsc --noEmit --incremental false` 與 `next build --webpack` 通過。ESLint 0 error，僅商品頁原有 `<img>` warning。
- 獨立 3017 埠重跑 Chromium 與 WebKit 的商品／購物車／結帳／商品草稿 Playwright：20/20 通過。這是瀏覽器模擬，不是實體手機或持久訂單端到端驗收。

## 本機服務端結帳整合切片

- 新增僅 Node 本機 `DEMO_COMMERCE_LOCAL=enabled`、production 禁用的純服務。合成 OTP 驗過且不可重用後，按伺服器商品 fixture 重算單價、庫存與限購，再建立唯一持久測試訂單；查單需完整密鑰。宅配人工覆核由受信任的 server callback 判斷，顧客偽造旗標會拒絕；通知隊列故障會回傳明確的 `queue-failed`，仍保留已成立訂單密鑰。
- Vitest 22 檔／146 測、TypeScript 與相關 ESLint 通過。沒有 HTTP route、手機 OTP 收碼通道或店家身份入口；頁面目前仍以原型 Mock 訂單結帳，不能宣稱端到端或實體手機驗收完成。

## 本機營運安全底層切片

- 訂單服務新增僅供已授權店家入口呼叫的內部列單拷貝，沒有查單密鑰；重啟後仍可列出。
- 新增本機操作員一次性 OTP 收碼箱、真實 socket peer + 同源 POST 驗證器，以及獨立高熵店家憑證的 30 分鐘 HttpOnly／Secure／SameSite=Strict cookie 契約；沒有開 HTTP 路由，Next Request 本身無法證明 peer。
- 包裝照片儲存在非 public 私有目錄，限制 5 MiB 與 JPEG／PNG／WebP magic/MIME、隨機 ID、訂單綁定及授權，記錄訂單失敗時清除檔案；照片不會自動標記出貨。模擬通知 SQLite outbox 記錄排隊／模擬送達／失敗重試與無 Email 的查單替代，重複事件去重，分離資料庫故障後可 reconcile；沒有真實訊息發送。
- 全套 Vitest 25 檔／159 測、TypeScript、Next Webpack build 通過；ESLint 0 error／一個既有 `<img>` warning。安全底層尚未接入已驗證的店家待辦／顧客 API 與手機介面；未做實體手機驗收，仍不得雲端測試部署。
