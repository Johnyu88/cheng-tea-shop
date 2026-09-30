# Passkey 成熟模組評估

## 選型與隔離

選用 Better Auth 與官方 @better-auth/passkey 外掛，目標固定版本 1.7.6。官方外掛以 SimpleWebAuthn 處理 WebAuthn/FIDO2 驗證；本專案不得自行實作簽章、challenge、origin 或 authenticator counter 驗證。

官方依據：https://better-auth.com/docs/plugins/passkey
採用官方 server plugin、vendor handler 及原生 client plugin。首次註冊保留預設 requireSession=true；不开放匿名註冊，也不使用未驗證的 resolveUser。

第二展示沙盒位於 sandboxes/passkey-lock，獨立 package.json、lockfile、Next 與 SQLite 資料目錄。主網站的依賴、既有雲端服務與訂單不變。密碼展示站繼續作備援，不把它的訂單宣稱遷移至 Passkey 站。

## 安全验收條件

- 安裝須停用未審查的 lifecycle scripts；保留固定依賴與完整 lockfile。驗證 audit 結果與 transitive dependencies。
- 固定 HTTPS origin 與 RP ID；首次綁定由已授權管理員協助陳老師本人完成，不能讓任何訪客註冊成商家。
- 登入結果必須取自 Better Auth server 已驗證 session，再比對明確 merchant user ID allowlist；不可相信 browser 傳入角色或單憑 email 顯示值。
- vendor session 與商家授權分開：未允許的已登入使用者也不得呼叫訂單、圖片、付款或出貨 API。
- 關閉公開 sign-up、不暴露初始設定秘密；資料庫、session、備份與環境機密不進 Git 或公開頁面。
- 若橋接既有商家 session，必須保留同一業務 API 授權層、撤銷、有效期與禁止跨站要求。

## 驗證狀態

目前僅完成官方文件與設計審查。沙盒安裝、audit、型別檢查、production build、vendor handler 與授權橋接測試尚待執行，不宣稱完成。

iPhone Face ID／實體裝置 Passkey 註冊與登入尚待游老師驗收。自動化虛擬 authenticator 通過亦不能代替實際手機驗收；瀏覽器可能使用 Face ID、裝置 PIN 或其他 authenticator，不應宣稱必定出現 Face ID。

原站既有訂單保護條件仍有效；未取得一致備份並驗證恢復，不重新部署或變更原服務。
