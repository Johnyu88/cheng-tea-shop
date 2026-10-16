# CLOUD-02 無 Tailscale iPhone Safari 八項驗收腳本

這是驗收準備文件，不代表任何測試已執行或通過。測試者使用一般 iPhone Safari，關閉 Wi‑Fi 私有網路依賴並確認 Tailscale 未連線；使用核准的 staging URL，禁止使用 Acer tailnet URL、Render Demo URL 或 production 真實資料。

## 共通證據規則

- 每項記錄：時間、環境 URL、Git/image digest、Safari/iOS 版本、PASS/FAIL/BLOCKED。
- 截圖遮蔽姓名、電話、地址、訂單查詢密碼、cookie、signed URL 與 token。
- 網路證據只記錄 method、path、status、response class；不保存 Authorization、cookie 或完整個資。
- 任何未完成項目保持 `BLOCKED`，不得用 Chromium、Tailscale 或 Render log 代替實機 Safari 證據。

## 1. Safari 開啟公開前台

1. 關閉 Tailscale，使用行動網路開啟 staging HTTPS URL。
2. 確認瀏覽器顯示有效 TLS、品牌首頁、無登入或 Basic Auth 提示。
3. 重新整理一次，記錄首屏、`/api/health` 類別與無混合內容。

PASS：HTTPS 可達、首頁可讀、無 Tailscale/Basic Auth 依賴、重新整理不失敗。

## 2. 商品加入購物車

1. 開啟一個已核准 published 商品。
2. 選擇有效規格並加入購物車。
3. 返回前台、重新整理、確認商品名稱/規格/數量/金額一致。

PASS：購物車狀態正確，無水平溢出，未保存顧客敏感資料。

## 3. 結帳與人工付款

1. 使用 staging synthetic customer identity。
2. 填寫姓名、電話、配送方式與人工付款選項。
3. 送出一次，確認按鈕防重複提交與成功頁訂單號。
4. 確認狀態是待人工付款確認，不聲稱已收款。

PASS：訂單建立一次、金額由 server 計算、人工付款狀態正確、無卡號/CVV欄位或紀錄。

## 4. 顧客跨裝置查詢訂單

1. 在另一個 iPhone Safari 私人瀏覽視窗，不使用原 session。
2. 輸入核准的訂單號、姓名／電話末三碼及 staging OTP 流程。
3. 查詢並確認訂單狀態與商品 snapshot。

PASS：跨裝置查單成功；請求不含完整電話、access secret 或 cookie 值；錯誤身份只得到泛化錯誤。

## 5. 商家登入後台

1. 使用行動網路開啟 staging merchant URL。
2. 以已註冊 passkey 登入；若測 recovery，使用一次性核准 recovery 流程。
3. 關閉分頁後重新開啟，確認 session expiry/logout/revoke 行為。

PASS：後台可達、未登入 API 為 401/403、登入後僅可見授權資料、cookie 為 Secure/HttpOnly，無 Tailscale。

## 6. 商品上架、下架及編輯

1. 建立或選擇 synthetic draft。
2. 編輯名稱、規格、價格、庫存狀態與照片。
3. 儲存、發布、從前台確認；再下架並確認前台隱藏、歷史資料不消失。

PASS：權限正確、價格由 server 驗證、照片經 checksum/metadata 驗證、發布狀態跨重新登入保持一致。

## 7. 付款確認、包裝照片及出貨

1. 後台開啟待付款 synthetic order。
2. 確認付款；嘗試未付款直接出貨應被拒絕。
3. 上傳、取消、重新選取並確認包裝照片；檢查照片只在商家授權下可讀。
4. 標記 packed → shipped，記錄物流參考值。

PASS：狀態 gate、照片私有權限、替換不破壞原版本、事件與 actor audit 可追溯。

## 8. 送達、資料持久性及重新登入

1. 標記 delivered。
2. 登出、關閉 Safari、重新登入並重新查詢訂單、商品與照片 metadata。
3. 由測試人員執行一次 staging restore proof，再重做唯讀查詢。

PASS：狀態、商品、付款事件、照片 metadata、audit event 在重登與受控 restore 後一致；沒有把未完成 restore 或資料丟失隱藏為 PASS。

## GCP 追加驗收（維持同一八項流程，另記錄以下五項）

以下項目只能在核准的 GCP staging、無 Tailscale、一般 iPhone Safari 上執行；目前均為 `PREPARED / NOT RUN`。

## 9. GCP HTTPS 公開存取

1. 使用行動網路開啟 GCP Cloud Run staging HTTPS URL，不使用 Tailscale、VPN 或內網 DNS。
2. 檢查憑證、HTTPS redirect、前台與後台 host boundary；嘗試 HTTP 應被導向 HTTPS。

PASS：Cloud Run 公開入口可達、TLS 正常、後台仍需登入，沒有 Cloud Run IAM token 被錯誤要求給顧客前台。

## 10. PostgreSQL 資料持久化

1. 執行八項流程中產生一筆 synthetic order、付款事件與商品變更。
2. 重新部署／重啟 Cloud Run revision，不變更 Cloud SQL。
3. 重新登入並查詢相同 order id、event sequence 與 product version。

PASS：資料不在容器檔案系統；重啟後資料與事件順序一致，沒有重複訂單或遺失狀態轉換。

## 11. Cloud Storage 照片存取

1. 在後台上傳商品照片與包裝照片，記錄 object key、checksum、content type 與版本。
2. 以顧客、未登入商家及已授權商家三種身分嘗試讀取。
3. 等待 signed URL 過期後重新請求。

PASS：bucket/object 不公開；只有授權商家取得短效 URL；顧客只看到允許的商品照片；過期 URL 失效；替換保留可追溯版本。

## 12. GCP 服務重啟後資料保留

1. 對 Cloud Run 執行 controlled restart 或切換至已驗證 revision；不重建或刪除 Cloud SQL／Storage。
2. 重新執行前台查單、後台付款確認、包裝照片與出貨唯讀查詢。

PASS：資料庫、物件 metadata、audit event 與登入狀態的預期行為符合規格；若 session 被撤銷，重新登入後仍能查到相同業務資料。

## 13. GCP 故障復原與備份還原

1. 以隔離 restore target 驗證 Cloud SQL backup/PITR 或 approved logical dump；禁止覆蓋 production。
2. 驗證 Storage object manifest、checksum 與照片版本數量。
3. 比對 order total、payment event、packing photo、shipment event、audit event count。

PASS：restore target 通過一致性檢查並保留證據；任何 backup、PITR、object restore 或 GCP trial expiry 未實測時，保持 `BLOCKED`，不得標為 PASS。
