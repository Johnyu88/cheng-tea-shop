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

## 5. Phase 10 shortlist comparison — 2026-09-23

最近更新以 GitHub organization／repository activity 或官方 release／issue 頁面為快照；「修改難度」與「boundary 相容性」是本專案評估，不是上游承諾。

| 候選 | 技術棧 | 授權 | 最近更新（快照） | 商品 | 庫存 | 訂單 | 顧客 | API | Docker | 修改難度 | 與 cheng-tea-shop boundary 相容性 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [ERPNext](https://github.com/frappe/erpnext) | Python／Frappe／MariaDB | GPL-3.0；商用部署需法律審查 | 2026-09-21 activity；v16.35.0 2026-09-15 | 強 | 強 | 強 | 強 | REST／DocType；[Frappe REST](https://docs.frappe.io/framework/user/en/api/rest) | 有 Frappe Docker 路線 | 中高：模組完整但資料模型重 | 高：Catalog／Inventory／Order 對應最佳；需 ERP adapter |
| [Odoo Community](https://github.com/odoo/odoo) | Python／Odoo ORM／PostgreSQL | GPL-3.0 repository；API 方案與 edition 需審查 | 2026-09-21 activity；19.0 issue／PR 持續更新 | 強 | 強 | 強 | 強 | XML-RPC／JSON-2；外部 API 目前限 Custom 方案 | 有官方 [odoo/docker](https://github.com/odoo/docker) | 中高：模組多、版本與 edition 差異大 | 高：domain coverage 強；API 存取與授權成本是主要風險 |
| [Dolibarr](https://github.com/Dolibarr/dolibarr) | PHP／JavaScript／MariaDB／MySQL | GPL-3+；商用分發需法律審查 | 2026-09-21 activity；official docker 2026-09-12 | 強 | 強 | 強 | 強 | 官方 REST／JSON [API](https://github.com/Dolibarr/dolibarr/blob/develop/htdocs/api/README.md) | 官方 [dolibarr-docker](https://github.com/Dolibarr/dolibarr-docker) | 中：SMB 模組較直接，但 PHP adapter 需另維護 | 中高：小型茶行能力足；內容／圖片要自行 mapping |
| [Medusa](https://github.com/medusajs/medusa) | Node.js／TypeScript／PostgreSQL／Redis | 核心 MIT；enterprise materials 另有商業授權 | 2026-09-22 activity | 強 | 中強 | 強 | 強 | Store／Admin REST、OpenAPI | 社群 `docker-medusa`；官方不承諾 Docker 支援 | 低中：與前台 TS boundary 接近 | 高：Catalog／Cart／Order mapping 最容易；ERP／會計不是強項 |
| [Vendure](https://github.com/vendurehq/vendure) | TypeScript／NestJS／GraphQL／SQL | GPLv3 + plugin exception／商業方案；需法律審查 | 2026-09-21 activity | 強 | 強 | 強 | 強 | Shop／Admin GraphQL、plugin API | repo 含 compose／self-host Docker 路線 | 低中：TS／plugin 便於 adapter，但 GPL 核心需審查 | 高：Catalog／Inventory／Order 與現有 service boundary 最貼近；非完整 ERP |

### Shortlist 決策

- **ERP reuse 首選：ERPNext**。能力最接近真正 ERP，可承接商品、庫存、訂單、顧客；PoC 先限定 read-only Catalog／Inventory，再做 order dry-run。GPL 與部署維運是進入下一 gate 的必要審查。
- **前台 integration 首選：Vendure**。TypeScript／NestJS／GraphQL／plugin 與現有前台 adapter 思路最接近，Catalog／Inventory／Order PoC 修改面較小；它是 commerce backend，不取代財務、稽核或完整 ERP。
- **保守替代：Dolibarr**。若小型茶行優先需要成熟 SMB ERP 與簡單 REST／Docker，列為第二 ERP 候選；PHP／GPL 與內容 mapping 仍需確認。
- Odoo 暫列比較候選，不列第一 PoC，因外部 API 方案限制與 edition／授權邊界會直接影響串接成本。Medusa 保留作 Node/TS commerce comparison，不當 ERP。

## 6. 兩個候選的最小 PoC（只規劃）

### PoC A — ERPNext-shaped Catalog / Inventory / Order

1. 以三筆 synthetic product 對應 Item／SKU、價格、active 狀態與圖片 metadata。
2. 以兩個 synthetic warehouse state 對應 available quantity、reserved quantity、`asOf` 與 stale 判定。
3. 以一筆 synthetic checkout receipt 做 Sales Order dry-run；只產生 mapping report，不建立真實訂單。
4. 驗證 REST response 可轉成 project-owned DTO；缺 SKU、庫存過期、重複 order reference、timeout 均轉成統一 error envelope。

### PoC B — Vendure-shaped Catalog / Inventory / Order

1. 以 GraphQL fixture 對應 Product／ProductVariant、stock level、Order／OrderLine。
2. 驗證 plugin／GraphQL payload 不會洩漏到 UI；前台仍只呼叫目前 service interface。
3. 驗證 price／stock conflict、order idempotency、provider unavailable 與 adapter swapping。
4. 比較 PoC A 的 unmapped fields、測試成本、部署依賴、授權限制與維護責任。

兩個 PoC 都不接 Payment、Logistics、Customer persistence、資料庫正式資料、真實商品、正式部署或外部 secrets。通過 contract tests、TypeScript、lint、build、既有 regression 後，才有資格進入 sandbox read-only review；不代表可直接導入。

## 7. Phase 10-B PoC result — 2026-09-23

| 驗證項目 | 結果 |
|---|---|
| Product／variant mapping | 通過；ERPNext `item_code`／Vendure `id`、variant SKU、名稱與 TWD 價格均轉成同一 Product DTO |
| Inventory quantity mapping | 通過；`actual_qty - reserved_qty` 與 `stockOnHand - stockAllocated` 均轉成 available quantity／status |
| Order create／status mapping | 通過 synthetic dry-run；兩邊 order reference、total、customer reference 與 confirmed／cancelled／fulfilled status 可正規化 |
| Customer reference mapping | 通過；ERPNext `customer.name` 與 Vendure `customer.id` 均轉成 `externalId` |
| DTO translation | 通過；adapter 輸出 project-owned Product／Inventory／Order／Customer DTO，不洩漏 provider payload |
| Error mapping | 通過；malformed product payload 統一為 `erp-mapping-invalid`、non-retryable |
| Adapter swapping | 通過；替換 customer mapping adapter 不需修改 consumer 或 UI |
| Regression | Vitest 16 files／100 tests、TypeScript、Webpack build 通過；ESLint 0 errors，保留既有 1 warning |

### 結論

- **mapping 最少／最容易接目前前台：Vendure**。TypeScript、Product／Variant、Inventory、Order 概念與現有 service boundary 最接近；代價是它是 commerce backend，不是完整 ERP。
- **客製欄位最多：ERPNext**。ERP 能力最廣，但 Item／Warehouse／Sales Order／Customer 的 ERP 欄位與前台 DTO 差距較大，需要較完整 adapter、狀態 mapping、權限與 reconciliation。
- **ERP 可直接沿用**：商品 master、variant／SKU、庫存帳、銷售訂單、顧客 reference、營運狀態與 ERP 內部稽核／權限能力。
- **仍需自有 adapter**：DTO translation、圖片／內容 sidecar、價格／庫存 freshness、idempotency、retry／dead-letter／reconciliation、provider error mapping，以及不把 ERP 欄位洩漏至 UI 的安全邊界。
- **真正導入前**：確認 GPL／plugin exception／enterprise material 的商用義務；鎖定版本與依賴 SBOM；確認 Docker／資料庫 backup、restore、upgrade、secret rotation、network isolation、API rate limit、audit log、rollback 與正式維運責任。

本 PoC 不做正式導入決策，不安裝完整 ERP，不連線外部 API，不接付款／物流，也不代表任何候選已 production-ready。
