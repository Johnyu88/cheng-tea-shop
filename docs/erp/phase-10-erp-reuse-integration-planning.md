# Phase 10 — ERP reuse & integration planning

日期：2026-09-23；狀態：規劃完成，未導入、未連線、未部署。

> 本文件是選型與整合施工圖，不是 ERP 導入決策。現階段不啟動外部服務、資料庫、付款、物流、登入、持久化、Docker 或正式部署，也不改寫前台。

## 1. Boundary 到 ERP 能力

| Boundary | 必要 ERP 能力 | 直接沿用 ERP | Adapter | 網站保留 |
|---|---|---|---|---|
| Catalog | 商品／SKU／變體、價格、分類、媒體、上下架 | SKU、基礎價格、營運狀態 | 欄位、圖片、語言、發布 mapping | 茶故事、SEO、前台排序與呈現 |
| Cart | 可售價格／庫存、保留與釋放 | 價格與庫存權威資料 | line、版本、過期／衝突語意 | 訪客購物車 UX 與提示 |
| Checkout | 銷售訂單、地址、總額重算、狀態 | 訂單編號與訂單紀錄 | receipt↔order、冪等、重試 | checkout UX 與 prototype copy |
| Payment | ledger、退款／對帳狀態 | 狀態、金額、provider reference | 金流 provider、webhook、狀態 mapping | 選項與安全文案；不存卡資料 |
| Logistics | 出貨、配送、包裹、追蹤 | fulfillment／shipment 狀態 | quote、label、tracking provider | 配送 UX、地址提示、recovery |
| Publishing | 商品 master、內容審核／發布 | SKU、規格、營運狀態 | draft、媒體、版本 mapping | 品牌文案、公開頁、approval gate |
| ERP | 權限、稽核、匯入／匯出、對帳 | 核心營運紀錄 | API、同步、錯誤、reconciliation | 不洩漏 provider 的 project DTO |

必要模組為 PIM、庫存／倉別、訂單、顧客、付款 ledger、物流、權限、稽核、staging-first 匯入／匯出。顧客資料需最小化、同意與保留政策；原始卡號、CVV、secret、raw token 永不進網站或 adapter。

## 2. GitHub 候選比較（2026-09-23 快照）

| 候選 | 授權／技術／API | 適配與缺口 | 定位 |
|---|---|---|---|
| [ERPNext](https://github.com/frappe/erpnext) | GPL-3.0；Python/Frappe；REST、DocType、token／OAuth 文件 | 商品、庫存、銷售、客戶、出貨、會計完整；GPL、欄位與 workflow 需審查 | **首選 ERP fixture PoC** |
| [Odoo Community](https://github.com/odoo/odoo) | GPL-3.0 repository；Python；模組化 business apps | ERP 廣；社群／企業版邊界、授權與 API 版本需核對 | ERP 備選 |
| [Dolibarr](https://github.com/Dolibarr/dolibarr) | GPL-3+；PHP；REST／JSON API explorer | SMB 商品、訂單、庫存、發票清楚；客製與媒體 mapping 需審查 | 輕量 ERP 備選 |
| [Medusa](https://github.com/medusajs/medusa) | 核心 MIT；Node/TypeScript；Store/Admin API、OpenAPI | Commerce 相近但非完整 ERP；部分 enterprise materials 另有商業授權 | Commerce 基準 |
| [Saleor](https://github.com/saleor/saleor) | BSD-3-Clause；Python；API-only、GraphQL | 商品／庫存／訂單相容；財務、採購、稽核需外接 | Commerce 基準 |
| [Vendure](https://github.com/vendurehq/vendure) | MIT；TypeScript/NestJS；GraphQL、plugin | 與 TS boundary 相近但非完整 ERP | TS commerce 備選 |

授權為初篩，不是法律結論；正式選型須核對實際版本、依賴、插件、部署與商用分發，另做 security、backup、release 與維運審查。

## 3. Website ↔ ERP contract 草案

未來只允許 server-side adapter 呼叫 ERP；前台只看 project-owned DTO。request 帶 `schemaVersion`、`correlationId`、寫入用 `idempotencyKey`、`sourceSystem`、`occurredAt`；response 統一為 success 或 `{ code, message, retryable, providerCode?, correlationId, retryAfterSeconds? }`。

| Website operation | ERP 對應 | 方向 | 規則 |
|---|---|---|---|
| Catalog read | Item／Product／Variant | ERP→Website | stable SKU／content ID；品牌欄位留 website sidecar |
| Inventory | Warehouse stock | ERP→Website | 帶 `asOf`／staleness；未知庫存保守不可售 |
| Cart price check | Price list + stock policy | ERP→Website | checkout 前重驗，不信任瀏覽器金額 |
| Checkout submit | Sales Order draft／confirmed | Website→ERP | server 重算；reference + key 防重單 |
| Customer | Customer／Contact | Website↔ERP | guest 可不建帳戶；只同步必要且獲同意的 PII |
| Payment result | Payment entry／transaction ref | Provider→Website→ERP | 只傳 reference、狀態、金額、時間 |
| Fulfillment | Shipment／Package | Website↔ERP；provider↔adapter | ERP 只接狀態與 tracking reference |
| Publishing | Item master／publication metadata | 雙向、需核准 | ERP 不自動覆蓋公開文案 |

錯誤先映射為 `validation`、`conflict`、`not_found`、`unauthorized`、`rate_limited`、`unavailable`、`provider_rejected`。只有 `retryable=true` 才退避重試；寫入重用同一 key；response 遺失先查 idempotency。失敗進 reconciliation／dead-letter report，不偷偷補寫訂單或庫存。

## 4. Implementation plan 與最小 PoC

| Slice | 內容 | 狀態 |
|---|---|---|
| 10-A | 候選、授權、安全、備份、版本審查 | 本次規劃完成 |
| 10-B | synthetic ERPNext／Odoo／Dolibarr-shaped payload mapping contract | 下一個最小 PoC 候選 |
| 10-C | local fake 演練 catalog、stock stale、order dry-run、reconciliation | 未開始 |
| 10-D | 明確授權後隔離 sandbox read-only spike | 外部 gated |
| 10-E | 通過 license／security／backup／rollback／owner sign-off 才評估寫入 | 未授權 |

10-B 只用三筆 synthetic product、兩種庫存狀態與一筆 synthetic receipt，驗證三種 payload 能轉成同一 Catalog／Inventory／Order DTO，並回放缺 SKU、價格衝突、庫存過期、重複訂單、timeout 的 normalized error／retry／idempotency。驗收為 contract tests、unmapped list、error matrix、adapter swapping 與既有 UI regression 全通過；不啟動 ERP、資料庫、Docker、secret、付款、物流或正式部署。

目前不選定最終 ERP；等待明確授權後才開始 10-B，不新增 service type，不送入真實商品或顧客資料。
