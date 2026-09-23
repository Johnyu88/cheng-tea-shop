# Phase 10-C — ERPNext Adapter Layer Design

狀態：設計完成；尚未實作、尚未接正式網站。

## 目標與限制

本設計把 ERPNext v16 的 REST／DocType payload 隔離在 server-side adapter，讓目前前台只依賴既有 Catalog、Inventory、Order service boundary。這不是正式導入決策，也不會把本機 synthetic 驗證視為 production readiness。

本階段不包含付款、物流、登入、資料庫持久化、正式網站連線、真實客戶資料、公開部署或 ERPNext custom app。

## 分層

```text
Website service boundary
        |
ERPNext facade (server-only, no UI imports)
        |
ERPNext transport client  ->  auth provider
        |
REST/DocType request + response DTOs
        |
Catalog / Inventory / Order mappers
        |
normalized domain DTOs + normalized errors
```

### 1. Website boundary

- `CatalogService`: 只回傳專案 Product／Variant DTO。
- `InventoryService`: 只回傳可用數量、倉別與 freshness metadata。
- `OrderService`: 只接收已驗證的 canonical order command，回傳 canonical order reference/status。
- UI 不知道 `item_code`、`Bin`、`Sales Order`、Frappe status 或 ERPNext auth 細節。

### 2. ERPNext facade

建議拆成 `ErpNextCatalogAdapter`、`ErpNextInventoryAdapter`、`ErpNextOrderAdapter`，共用唯讀的 `ErpNextClient` 與 mapping/error helpers。每個 adapter 僅依賴 project-owned interface，方便以 fake adapter 或其他 ERP 替換。

### 3. Transport 與認證

- `ErpNextClient` 只處理 URL、HTTP method、timeout、request id、response decoding 與 status code。
- `ErpNextAuthProvider` 注入 session/token 取得方式；credential 只由 runtime secret manager 提供，絕不進 UI、DTO、log 或 Git。
- 第一個正式切片應採 read-only Catalog／Inventory；Order create 必須另有明確 idempotency 與人工核准 gate。

## Mapping 邊界

| ERPNext shape | Project DTO | 必要轉換 |
|---|---|---|
| `Item.item_code`, `item_name`, `item_group`, `stock_uom` | Product／Variant | SKU、顯示名稱、茶類、單位；缺少網站內容時不得自行生成真實文案 |
| `Item Price.price_list_rate`, `currency` | Money | 價格與幣別正規化；幣別不符時回傳可分類錯誤 |
| `Bin.actual_qty`, `reserved_qty`, `warehouse` | Inventory | `available = actual_qty - reserved_qty`；保留原始倉別與查詢時間 |
| `Customer.name` | CustomerReference | 只保存外部 reference，不在前台建立顧客主檔 |
| `Sales Order.name`, `status`, `grand_total`, `customer` | OrderReference／OrderStatus | 狀態 allowlist、金額與幣別驗證、外部訂單 reference |

所有 mapper 都必須拒絕缺欄位、錯誤型別、未知必要狀態與不一致金額；錯誤統一為 project-owned normalized error，不把 Frappe response 原文傳給 UI。

## 錯誤與可靠性

- 4xx schema／validation：`integration-invalid-request`，不可盲目重試。
- 401／403：`integration-unauthorized`，停止操作並交由認證層處理。
- 404：依 operation 分類為 `catalog-not-found` 或 `order-not-found`。
- 409／重複 idempotency key：`integration-conflict`，必須先查詢既有結果。
- timeout／5xx：`integration-unavailable`，僅由 service policy 控制有限次數 retry。
- 每次請求帶 correlation id；log 僅記錄 operation、external reference、status 與 latency，不記錄 secrets、session cookie 或完整顧客 payload。

## 最小實作順序（待另行批准）

1. server-only transport contract 與 normalized error mapping。
2. read-only Catalog／Inventory adapter，使用 synthetic contract tests 與 local fake。
3. adapter factory／configuration injection，確認 UI 不需變更。
4. Order dry-run command，只建立 synthetic payload，不送出真實請求。
5. 通過授權、secret、backup、rate-limit、audit、rollback 與 sandbox sign-off 後，才評估 real order create。

正式實作前仍需確認 ERPNext GPL 義務、依賴與版本 SBOM、API 權限最小化、部署隔離、備份還原、資料保留與責任歸屬。
