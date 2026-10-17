# 手機購物／店家訂單本機 Demo

此流程只供 `next dev` 的本機合成展示。它不支援 production，不會連接簡訊、Email、Web Push、付款、物流或客戶資料服務。

## 啟動邊界

- 預設只綁定 `127.0.0.1`。真實手機測試才可明確啟用私有 LAN：`DEMO_COMMERCE_LAN=enabled`，並綁定目前的 RFC1918 私有 IPv4（例如 `172.20.10.4`）；不要使用 `0.0.0.0` 或公開／訪客網路。
- 設定 `DEMO_COMMERCE_LOCAL=enabled` 與 `NEXT_PUBLIC_DEMO_COMMERCE=enabled`。
- 每次執行產生至少 32 bytes 的隨機十六進位 `DEMO_MERCHANT_SECRET`，不要寫入檔案或提交 Git。
- `DEMO_DATA_DIR` 指向 `.demo-data/` 下的本機資料夾；該目錄已被 Git 忽略。
- 因 managed worktree 的 `node_modules` symlink，使用 `next dev --webpack`。

## 同一區域網路的手機測試

在電腦 PowerShell 中執行下列流程；先用 `ipconfig` 找到與手機相同 Wi‑Fi／區網介面的 IPv4，將 `<LAN_IP>` 替換為該值。每次啟動都產生新的合成店家密碼，主機終端會印出並只在本次測試使用；不要把它寫入檔案。

```powershell
$env:DEMO_COMMERCE_LOCAL = "enabled"
$env:DEMO_COMMERCE_LAN = "enabled"
$env:NEXT_PUBLIC_DEMO_COMMERCE = "enabled"
$demoSecretBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($demoSecretBytes)
$env:DEMO_MERCHANT_SECRET = ([Convert]::ToHexString($demoSecretBytes)).ToLowerInvariant()
$env:DEMO_DATA_DIR = (Join-Path (Get-Location) ".demo-data\lan-demo")
corepack pnpm --config.verifyDepsBeforeRun=false dev --webpack --hostname <LAN_IP> --port 3013
```

手機與電腦必須在同一個可信任私有網路，開啟 `http://<LAN_IP>:3013/`。若 Windows 防火牆阻擋，先停止；不要自行放寬系統安全設定。可改用已核准的私有網路規則或由管理者處理。

LAN 模式的店家 cookie 為 HTTP 可用的 HttpOnly／SameSite=Strict 合成 cookie，因而只可使用假資料、假訂單與假密碼；不得輸入真實付款、客戶或正式通知資料。Demo 結束後停止伺服器並清理 `.demo-data\lan-demo` 前，先確認目標仍位於專案目錄。

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

必要網址：首頁 `/`、購物車 `/cart`、結帳 `/checkout`、查單 `/orders`、店家端 `/admin/orders`。訂單建立成功頁會產生含查單 token 的一次性連結，勿分享或截圖外流。

## P0 Catalog recovery preflight

若手機看到空白商品，先不要重建或清空 `.demo-data`。在同一個啟動 PowerShell 視窗確認：

1. `netstat -ano | Select-String ':3013.*LISTENING'` 的 PID 是本次啟動的 Node 程序。
2. server 使用目前工作樹、明確的 `DEMO_DATA_DIR` 與 `--hostname <LAN_IP>`；不要使用舊 terminal、`localhost`（手機上的 localhost 是手機本身）或 `0.0.0.0`。
3. 在提供手機網址前先執行 `curl.exe --noproxy "*" -i http://<LAN_IP>:3013/api/demo/catalog?limit=50`，必須是 HTTP 200，且 `value.total` 為目前 published 商品數。
4. 若 API 不是 200，先修正 server／環境變數，不要以靜態卡片或另一份 fixture 掩蓋問題。
5. 同一份 file-backed Catalog 位於 `$DEMO_DATA_DIR/catalog.json`；前台只顯示 published，`/admin/products` 以 `includeUnpublished=true` 讀取同一檔案。

本次 P0 診斷確認 `http://172.20.10.4:3013` 的 API 及前後台瀏覽器讀取均正常；真實手機仍須重新載入此明確 LAN URL 才能完成實機驗收。

## 清理與限制

停止開發伺服器後，可在確認目標位於本專案 `.demo-data/` 內再移除該次合成資料。不要上傳 `.demo-data/`、包裝照、查單 token 或店家密碼。會員名單、正式部署、真實付款與外部整合不在本階段。
