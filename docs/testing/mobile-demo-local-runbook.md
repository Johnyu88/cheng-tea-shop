# 手機購物／店家訂單本機 Demo

此流程只供 `next dev` 的本機合成展示。它不支援 production，不會連接簡訊、Email、Web Push、付款、物流或客戶資料服務。

## 啟動邊界

- 只綁定 `127.0.0.1`，不要使用 `0.0.0.0`。
- 設定 `DEMO_COMMERCE_LOCAL=enabled` 與 `NEXT_PUBLIC_DEMO_COMMERCE=enabled`。
- 每次執行產生至少 32 bytes 的隨機十六進位 `DEMO_MERCHANT_SECRET`，不要寫入檔案或提交 Git。
- `DEMO_DATA_DIR` 指向 `.demo-data/` 下的本機資料夾；該目錄已被 Git 忽略。
- 因 managed worktree 的 `node_modules` symlink，使用 `next dev --webpack`。

## 合成資料

- 可用手機：`0912000000`、`0912000001`。
- 畫面顯示的本機 OTP：`123456`；沒有傳送簡訊。
- 可自動通過 Demo 人工覆核回呼的地址：`台北市中正區測試路 1 號`。
- 其他宅配地址一律停在「需要人工介入」，不會硬判有效。

## 操作順序

1. 商品頁加入購物車，確認直接進入 `/cart`；可「繼續購買」或「前往結帳」。
2. `/checkout` 完成合成 OTP、地址與訂單建立；保留成功頁提供的查單連結。
3. `/admin/orders` 使用當次啟動的獨立店家密碼登入，模擬付款、上傳包裝照，再由店家明確按下人工出貨。
4. `/orders` 使用訂單編號、查單 token、下單手機後三碼與一次性 OTP 查詢狀態。
5. 通知可在店家頁模擬成功／失敗／重試；手機推送只有 payload 預覽，狀態固定為 `preview-only`，不代表送達。

## 清理與限制

停止開發伺服器後，可在確認目標位於本專案 `.demo-data/` 內再移除該次合成資料。不要上傳 `.demo-data/`、包裝照、查單 token 或店家密碼。會員名單、正式部署、真實付款與外部整合不在本階段。
