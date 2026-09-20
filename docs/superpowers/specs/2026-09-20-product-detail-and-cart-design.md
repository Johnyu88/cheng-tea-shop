# Wave 5 商品詳情與購物車設計規格

- 日期：2026-09-20
- 狀態：待實作前審閱
- 階段：Phase 2 前端 prototype，Wave 5

## 1. 目標

把 Wave 4.1 的合成商品目錄延伸成可操作的 Mock 購買流程：顧客可以開啟商品詳情、確認購買資訊、選擇目前可用的單一規格與數量、加入購物車，並在購物車中調整數量或移除商品。

本 Wave 只驗證前台互動與既有 project-owned service contracts，不建立正式商品資料、付款、會員、ERP、登入或持久化後端。

## 2. 已確認的產品約束

- 公開品牌仍為「龍映茗茶」；商品內容目前是合成 Mock 資料。
- 商品詳情首屏先顯示照片／品牌預設圖、茶名、口感摘要、價格、供貨狀態與主要購買動作。
- 商品故事、產地、製程與沖泡資訊若沒有資料，不編造；目前可顯示已有的 synthetic summary，其他欄位不強行補齊。
- 售完商品保留展示，但加入購物車按鈕停用，並提供返回目錄或尋找其他口感的入口。
- 第一版每項商品只有一種規格，但介面以 `ProductVariant` 讀取，不把單一規格寫死在元件內。
- 數量只能是正整數，且不得超過 `variant.maxQuantity`；超過時顯示白話錯誤，不清除目前選擇。
- Mock Cart Service 負責購物車計算、售完與購買上限結果；元件不得直接計算或修改 fixture。
- 不把付款卡號、付款憑證或顧客聯絡資料加入本 Wave。

## 3. 使用流程

### 3.1 從目錄到商品詳情

1. 顧客從推薦區或完整目錄選取商品卡。
2. 商品卡使用 `/tea/[slug]` 連結；保留瀏覽器返回與可分享 URL。
3. 詳情頁以 `CatalogService.getProductBySlug(slug)` 載入商品。
4. 載入中使用與詳情內容相同結構的 skeleton；找不到商品顯示清楚錯誤與返回目錄；服務失敗顯示重試。

### 3.2 商品詳情購買

- 詳情頁顯示商品影像區、口感標籤、名稱、摘要、規格、整數 TWD 價格與 available／sold-out 狀態。
- 有貨時顯示數量減少、數量欄、數量增加與一個主要「加入購物車」按鈕；每個操作至少 48×48px，具可見 focus。
- 數量欄使用可理解的標籤與 `min=1`、`max=maxQuantity`；按鈕與輸入同步，不接受非正整數。
- 加入成功後保留商品頁內容，顯示成功訊息與「查看購物車」入口；避免重複送出造成意外加倍，處理中暫停主要按鈕。
- `product-sold-out`、`purchase-limit-exceeded` 與其他服務錯誤以頁內訊息呈現；既有數量與選擇保留。

### 3.3 購物車

- 新增 `/cart` 頁面；空購物車顯示說明、主要「開始選茶」與次要回首頁。
- 每個 line 顯示商品名稱、規格、單價、數量控制、小計與移除動作。
- 購物車顯示整數 TWD subtotal；所有變更透過 `CartService`，成功後以服務回傳的 cart 更新畫面。
- 更新數量失敗時保留原數量並顯示錯誤；移除成功後更新摘要，移除失敗時不假裝完成。
- 顯示「繼續選茶」與「前往結帳」的邊界入口；本 Wave 的 checkout 入口只作為後續 Wave 6 的 disabled／placeholder 連結，不建立結帳流程。
- Cart provider 在 App Router client navigation 間持有單一 Mock Cart Service instance，使商品詳情與購物車頁共享狀態；不使用 localStorage 或 sessionStorage 儲存個資或付款資料。

## 4. 架構與資料流

採用 route + shared provider：

```text
CatalogBrowser / ProductCard
  -> /tea/[slug]
  -> ProductDetailPage
  -> CatalogService.getProductBySlug
  -> CartService.addItem
  -> CartProvider state
  -> /cart
  -> CartService.getCart / updateQuantity / removeItem
```

預計責任邊界：

- `app/tea/[slug]/page.tsx`：只負責 route params 與掛載商品詳情 component。
- `app/cart/page.tsx`：只負責掛載購物車 component。
- `features/commerce/components/commerce-provider.tsx`：建立並共享 Mock Catalog／Cart service；不暴露 fixture。
- `features/product/components/product-detail-page.tsx`：載入商品、購買控制與錯誤狀態。
- `features/cart/components/cart-page.tsx`：購物車 line 編輯、空狀態、錯誤與摘要。
- `features/.../product-card`：將現有無互動的「查看茶品」改為 route link；不在卡片內埋入購物車邏輯。
- `app/globals.css`：只補商品詳情、購物車與響應式控制所需樣式，沿用既有品牌 tokens。

若 `CartService` 的 product id／slug 解析邊界在測試中暴露不一致，先以 adapter contract test 固定預期，再做最小修正；不把 ERP 欄位帶入 UI。

## 5. 狀態與錯誤處理

| 狀態 | 商品詳情 | 購物車 |
|---|---|---|
| loading | skeleton，避免版面跳動 | 讀取中的摘要或空白骨架 |
| not found／empty | 白話說明、回目錄 | 空購物車與開始選茶 |
| service error | alert、重試、保留 URL | alert、重試；保留現有 cart |
| sold out | 保留內容，停用加入購物車 | 顯示服務錯誤，不新增 line |
| limit exceeded | 保留數量，說明上限 | 保留原 line 數量與錯誤 |
| add success | 成功訊息、查看購物車 | 新增或合併 line，更新 subtotal |

錯誤訊息不得只靠顏色；主要錯誤使用 `role="alert"`，載入與成功訊息使用 `role="status"`。所有互動可由鍵盤完成，返回瀏覽器上一頁不應遺失 provider 內購物車狀態。

## 6. 測試與驗收

先測試後實作，每個主要行為先觀察 RED，再寫最小 GREEN：

- 商品詳情載入商品名稱、價格、規格與 placeholder。
- unknown slug 顯示 not-found；catalog error 可重試。
- 售完商品不能送出 add-to-cart。
- 數量加減維持正整數與 maxQuantity；超過上限顯示錯誤並保留數量。
- 成功加入購物車後顯示成功狀態並能前往 `/cart`。
- 購物車顯示空狀態、line、subtotal；更新、移除與服務錯誤均有正確結果。
- 從商品詳情切到購物車後，Cart Service instance 保留新增 line。
- 商品卡 route link、商品詳情主要控制、購物車控制具可存取名稱與 focus。
- 不新增真實商品、付款、顧客資料、登入、ERP 或瀏覽器儲存個資。

Wave 5 exit gate：Vitest、ESLint、TypeScript、production build，並以 Chromium／WebKit e2e 驗證商品詳情與購物車主要流程；Docker smoke 依環境可用性記錄，不以本機缺少 Docker 假裝通過。

## 7. 非目標與後續

- 不建立 checkout 表單、付款 adapter、訂單 API 或真實物流。
- 不加入多規格編輯、批次商品、精確庫存或 persistent database。
- 不在商品詳情補猜產地、療效、年份或其他未提供事實。
- Wave 6 再處理 checkout、付款處理中／失敗／成功與商品草稿發布流程。

## 8. 驗收判準

1. 目錄商品可透過穩定 slug 開啟商品詳情。
2. 顧客可以在有貨且未超過上限時加入購物車。
3. 售完、找不到商品、服務失敗與購買超限均有可理解且可恢復的 UI。
4. 顧客可以在購物車調整數量、移除商品並看到正確 subtotal。
5. 目錄、商品詳情與購物車只經由 project-owned service interfaces 溝通。
6. 所有 Wave 5 測試與 quality checks 有可重跑的驗證證據。
