# 手機 Demo 購物車檢查點（2026-09-24）

- 工作樹：`codex/wave-7-shopping-quality-gate`。先檢查並保留其他未提交文件、ERP 規劃及 `next-env.d.ts`；原有商品頁成功導向 `/cart` 三行修改已核實。
- 修復該導向所需的 Vitest Router mock；加入成功路徑斷言；更新 Playwright 從商品頁直接落在購物車的流程。購物車有「繼續購買」連回目錄與「前往結帳」；保留原有合成結帳。
- Corepack 已緩存 pnpm 11.19.0，但 `pnpm` 不在 PATH；`corepack pnpm test:run` 會因無 TTY 的 modules purge 提示停止。使用既有 `node_modules/.bin/vitest.cmd`、`tsc.cmd`、`eslint.cmd`、`next.cmd`、`playwright.cmd`，避免清理其他工作樹依賴。Node 24.21.0 與宣告 24.19.0 有偏差。
- Vitest 18 files／119 tests、typecheck、Next Webpack build 通過；ESLint 0 errors／一項既有 `<img>` warning。Playwright 指定 Chromium v1243 已安裝；獨立埠 3013 的購物車／結帳 10/10 通過。新增 standalone 靜態資源測試啟動腳本；3000 埠既有 Node 進程未碰觸。
- PR #15 的完整手機 Demo S1 門檻尚未達成：OTP、地址驗證與覆核、唯一持久化訂單、安全查單、通知去重及失敗、店家權限／拍照、人工出貨狀態均不存在。固定 `MOCK-ORDER-001` 僅為原型；不得雲端測試部署或宣稱可處理真實顧客／付款。
- 下一段：服務端持久測試訂單、受控模擬 OTP 和安全查單；其後店家待辦、拍照、通知、人工交寄；最後手機驗收。正式金流、main 合併及正式部署均未進行。
