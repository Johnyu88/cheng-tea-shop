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

初始僅完成官方文件與設計審查；後續已完成項目列於下方。尚未通過的實體手機、正式持久儲存與主站橋接仍不得宣稱完成。

iPhone Face ID／實體裝置 Passkey 註冊與登入尚待游老師驗收。自動化虛擬 authenticator 通過亦不能代替實際手機驗收；瀏覽器可能使用 Face ID、裝置 PIN 或其他 authenticator，不應宣稱必定出現 Face ID。

原站既有訂單保護條件仍有效；未取得一致備份並驗證恢復，不重新部署或變更原服務。

## 已完成來源與依賴審查

- 沙盒已建立獨立 package.json、pnpm-lock.yaml、workspace；allowBuilds: {} 禁止依賴建置腳本。主網站依賴未更動。
- 固定 better-auth 1.7.6、@better-auth/passkey 1.7.6；沙盒 Next 固定 16.3.6。初始 16.3.5 audit 問題已在沙盒版本修正。
- 2026-10-01 獨立審查執行 pnpm audit --audit-level=high，結果 No known vulnerabilities found。
- 來源審查通過：官方 handler／client，requireSession=true、userVerification=required、固定 RP／origin；公開 signup 關閉，bootstrap 僅限啟動腳本與明確旗標。
- merchant-session 只讀官方 server getSession 所驗證 user.id，對照 server merchant ID allowlist；預設空白名單不授權。此端點僅展示結果，尚未串入茶行業務 API。
- 接入主站前仍須在每一筆業務要求的 server 授權層強制 merchantAllowed，不能以 UI 顯示或 client 布林值取代。
- 實體 iPhone Face ID 驗收、正式持久儲存與主站授權橋接均仍待完成；沙盒通過不代表正式茶行登入完成。

## 主站安全版本與沙盒結果分開記錄

2026-10-01 主站 CI 的 audit 發現 GHSA-vcvr-r3jv-pc5j；官方公告修正版為 Next 16.3.6。來源搜尋未發現 next/og 或 ImageResponse，因此目前程式沒有公告所述的 Node ImageResponse 攻擊者控制 SVG 路徑；仍更新 Next 與 eslint-config-next 至 16.3.6，維持 CI 安全門檻。

此項主站更新僅涉及 package.json 與套件管理器產生的 pnpm-lock.yaml。Next/SWC/sharp 與 ESLint 相關間接依賴同步更新，未在主站安裝 Better Auth，也未修改業務或部署既有資料服務。

獨立審查執行主站 pnpm audit --audit-level=high：仍有 2 個 moderate 項目，沒有 high／critical；不得稱主站完全沒有已知漏洞。沙盒 audit 的 No known vulnerabilities found 是另一份独立結果，不能替代主站 audit。主站 patch 後的測試／建置另由主流程記錄。

官方公告：https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j

## Vendor 實際流程驗證與介面

2026-10-01 本機獨立 runtime fixture 共兩組通過，耗時 20.58 秒：一組 vendor user ID 在 merchant allowlist，另一組為已登入但不在 allowlist。每組皆啟動原生 Better Auth handler 與 Playwright CDP 虛擬 CTAP2 authenticator；使用全新臨時 SQLite，不使用茶行訂單資料庫。

通過範圍：私密 Basic 門禁、匿名拒絕授權、首次 vendor 登入、禁止公开 signup、錯誤 Origin 拒絕、vendor Passkey 註冊、連續兩次 Passkey 登入／登出、竄改 session cookie 拒絕、錯誤私鑰簽章拒絕、缺少 authenticator credential 拒絕。merchant allowlist 內回傳 true；外部已登入使用者仍 false。read-only bridge 的 POST 回應 405。

| 介面 | 提供者與用途 |
| --- | --- |
| /api/auth/[...all] | Better Auth 官方 Next handler；帳號、session 與 WebAuthn 驗證 |
| /api/merchant-session GET | server 取得已驗證 vendor session，回傳 authenticated、userId、merchantAllowed；no-store |
| /api/merchant-session POST | 不提供，405；不能修改茶行业務資料 |
| authClient.passkey.addPasskey | 官方 browser client 註冊；必須已有 session |
| authClient.signIn.passkey | 官方 browser client 登入；server 進行驗證 |

此結果是虛擬 CTAP2 實際 vendor 流程驗證，不代表實體 iPhone Face ID 已驗收。手機生物辨識／PIN 選項仍須游老師實機操作。bridge 尚未啟用茶行訂單、付款、圖片與出貨等業務；接入前必須在 server 業務 API 強制 merchant ID 授權。最終 production build 與雲端部署另由主流程確認；文件不宣稱已部署。
