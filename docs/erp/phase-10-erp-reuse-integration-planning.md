# Phase 10 — ERP reuse & integration planning

日期：2026-09-22
狀態：規劃完成；未導入、未連線、未部署

## 1. 範圍與不可做事項

本文件把現有網站 boundary 對照可重用的 ERP／commerce 平台，建立未來 adapter 的施工圖。它不是 ERP 選型決策，也不是導入授權。

本階段不啟動外部服務、不建立資料庫、不接真實付款或物流、不新增登入與持久化、不改寫現有前台。所有同步、付款、物流與 ERP 行為仍由 local in-memory fake 代表。

## 2. 現有網站 boundary 與 ERP 必要能力

| 現有 boundary | 未來需要的 ERP 能力 | ERP 直接沿用 | 需要 adapter | 網站保留 |
|---|---|---|---|---|
| Catalog | 商品主檔、SKU／變體、價格、分類、上下架、媒體 metadata | SKU、商品主檔、基礎價格、庫存可售狀態 | 欄位／圖片／語言／發布狀態 mapping | 茶故事、前台文案、SEO、呈現排序、真人理解品質 |
| Cart | 可售價格與庫存查詢、保留／釋放規則 | 價格與庫存的權威資料 | cart line、版本、失敗與過期語意 | 訪客購物車 UX、暫態狀態、按鈕與提示 |
| Checkout | 銷售訂單、客戶／收件資料、稅費與總額重算 | 訂單編號、銷售訂單、訂單狀態 | website receipt ↔ ERP order、冪等與重試 | checkout UI、輸入驗證、prototype copy、付款前確認 |
| Payment | payment ledger、退款／對帳狀態 | 付款狀態與對帳參照，不保存卡資料 | 金流 provider、token／webhook、狀態 mapping | 付款選項展示與安全文案；不保存 raw credential |
| Logistics | 出貨、配送方式、包裹、追蹤狀態 | fulfillment／shipment 狀態 | 物流商 quote／label／tracking API | 配送選項 UX、地址提示、錯誤 recovery |
| Publishing | 商品 master 與內容審核／發布流程 | SKU、規格、營運狀態 | draft／媒體／審核版本 mapping | 品牌敘事、公開頁、內容 approval gate |
| ERP | 跨模組權威、權限、稽核、匯入匯出、報表 | 核心營運紀錄 | 版本化 API、error、sync、reconciliation | 前台 contract 與不洩漏 provider 實作 |

### 必要模組

1. 商品／PIM：SKU、變體、茶類、產地、年份、重量、價格、圖片與狀態。
2. 庫存：倉別、可用量、保留量、調整原因、低庫存與同步時間。
3. 訂單：訂單行、價格快照、折扣／運費、狀態轉移、取消與退款參照。
4. 顧客：訪客訂單最小資料、同意與資料保留政策；不可因接 ERP 強迫登入。
5. 付款：只記 provider reference、狀態、金額與對帳結果；原始卡資料永不進網站或 ERP adapter。
6. 物流：配送方式、收件資料、出貨、包裹與追蹤；實際 quote／label 由物流 adapter。
7. 權限：最小權限、服務帳號 scope、店家營運角色與秘密輪替。
8. 稽核：誰在何時以何種來源變更商品、庫存、訂單或發布狀態，含 correlation ID。
9. 匯入／匯出：staging、schema version、dry-run、錯誤報告、hash、rollback；沿用 Phase 9-A 產品素材規格。

## 3. 候選比較（2026-09-22 快照）

| 候選 | 授權／技術／API | 能力相容性 | 主要缺口與風險 | 初步定位 |
|---|---|---|---|---|
| [ERPNext](https://github.com/frappe/erpnext) | GPL-3.0；Python/Frappe；REST API、DocType、token／OAuth 文件 | 商品、庫存、銷售訂單、客戶、出貨、會計最完整，最貼近 ERP reuse | GPL 與商用分發／部署方式需法律審查；欄位與 workflow 需 adapter；導入成本高 | **首選 ERP PoC 候選**，先做 read-only contract mapping |
| [Odoo Community](https://github.com/odoo/odoo) | GPL-3.0 repository；Python；模組化 business apps，外部 API 能力需依版本／edition核對 | 商品、倉儲、銷售、CRM、會計與權限廣 | 社群版／企業版邊界與授權必須先審查；資料模型複雜；API 與版本策略需鎖定 | ERP 備選，需 license／edition gate |
| [Dolibarr](https://github.com/Dolibarr/dolibarr) | GPL-3+；PHP；官方 REST／JSON API 與 explorer | SMB 的產品、客戶、訂單、庫存、發票、物流基礎能力清楚 | GPL 與模組品質／客製深度需審查；茶品內容與媒體需自行 mapping | 輕量 ERP 備選 |
| [Medusa](https://github.com/medusajs/medusa) | 核心 MIT；Node/TypeScript；Store/Admin API 與 OpenAPI；部分 enterprise materials 另有商業授權 | Cart、商品、訂單、付款／配送 extension 與現有前台 stack 相近 | 不是完整 ERP；會計、稽核、採購與營運深度不足；enterprise license 要隔離 | Commerce adapter 基準，不作 ERP 首選 |
| [Saleor](https://github.com/saleor/saleor) | BSD-3-Clause；Python；API-only、GraphQL native | 商品、庫存、訂單、促銷與 headless storefront 相容 | 非 ERP；會計、採購、稽核與店務流程需外接；GraphQL mapping 與現有 DTO 不同 | Headless commerce 比較基準 |
| [Vendure](https://github.com/vendurehq/vendure) | MIT；TypeScript/NestJS；GraphQL、插件化 | Node/TS、商品、庫存、訂單、顧客與 plugin boundary 相近 | 非完整 ERP；財務／稽核／採購要外接；plugin 版本相容性需驗證 | 若日後偏 TypeScript 的 commerce adapter 候選 |

授權只代表候選初篩，不代表適合本專案的法律結論；正式選型前要由專案 owner／法律顧問核對版本、依賴、插件與部署方式。GitHub 的 activity 與 API 文件是研究快照，不能替代 release、security、backup 與供應商審查。

## 4. Website ↔ ERP contract 草案

所有未來呼叫均由 server-side adapter 發出，前台只看 project-owned DTO。每個 request 帶：`schemaVersion`、`correlationId`、`idempotencyKey`（寫入操作）、`sourceSystem`、`occurredAt`。response 只允許 success 或統一 error envelope：`code`、`message`、`retryable`、`providerCode?`、`correlationId`、`retryAfterSeconds?`。

### 最小 contract 與 mapping

| Website DTO / operation | ERP 對應 | 方向 | 必要規則 |
|---|---|---|---|
| Catalog product read | Item／Product／Variant | ERP → Website | 以 stable SKU／content ID mapping；未支援的品牌欄位留網站 sidecar，不丟失、不覆蓋文案 |
| Inventory availability | Warehouse stock／available quantity | ERP → Website | 顯示資料需帶 `asOf`／staleness；庫存未知時採保守不可售，不猜數量 |
| Cart price/availability check | Price list + stock reservation policy | ERP → Website | checkout 前重新驗證；價格／庫存變更回 normalized conflict，不信任瀏覽器金額 |
| Checkout submit | Sales Order draft／confirmed order | Website → ERP | 由 server 重算總額；以 website order reference + idempotency key 防重單 |
| Customer minimal profile | Customer／Contact | Website ↔ ERP | guest 可不建長期帳戶；僅在同意與必要性成立時同步 PII，支援刪除／保留政策 |
| Payment result | Payment entry／transaction reference | Provider → Website → ERP ledger | 只傳 provider reference、狀態、金額與時間；不傳卡號、CVV、secret 或 raw token |
| Fulfillment request/status | Delivery Note／Shipment／Package | Website ↔ ERP；provider ↔ adapter | 物流商仍隔離；ERP 只接業務狀態與 tracking reference |
| Product draft/publish | Item master／publication metadata | 雙向、需人工核准 | ERP master 不得自動覆蓋公開文案；publish 是明確的審核動作 |

### Error、重試與一致性

- `validation`、`conflict`、`not_found`、`unauthorized`、`rate_limited`、`unavailable`、`provider_rejected` 先映射成 project-owned domain code。
- 只有明確 `retryable=true` 的 timeout、暫時不可用或 rate limit 才可退避重試；寫入一定重用同一 idempotency key。
- 接收成功但 response 遺失時，以 correlation／idempotency 查詢，不盲目重送。
- 失敗事件進 reconciliation queue／dead-letter report；人工處理前不得偷偷補寫訂單或庫存。
- 每次同步保存 source、external ID、schema version、request hash、結果與時間；不保存敏感付款資料。

## 5. 功能歸屬決策

### 直接沿用 ERP

SKU／商品 master、倉庫與庫存帳、銷售訂單、出貨業務狀態、營運角色、稽核事件、匯入匯出基礎能力與財務對帳紀錄（不含支付憑證）。

### 需要 adapter

欄位與狀態 mapping、商品圖片／內容 staging、價格與庫存 freshness、cart／checkout DTO、payment provider、logistics provider、guest customer、webhook／polling、retry／idempotency、reconciliation 與錯誤正規化。

### 網站自己保留

茶品牌敘事與前台內容、SEO／metadata、行動版與年長使用者 UX、購物車互動、checkout prototype copy、human validation、placeholder replacement gate，以及不應外洩 ERP 細節的 project-owned UI contract。

## 6. Phase 10 implementation plan

| Slice | 內容 | 閘門 | 本次是否做 |
|---|---|---|---|
| 10-A | 選型與授權／安全／備份／版本審查；確認 ERPNext、Odoo、Dolibarr 的最小候選 | owner 明確批准候選與 license review | ✅ 規劃 |
| 10-B | 只用 fixture 建立 Website DTO ↔ ERP canonical mapping，補 contract tests | 不連線、不改 UI、所有 error／idempotency case 通過 | 下一步 PoC |
| 10-C | local fake 上演練 catalog read、stock stale、order dry-run、reconciliation | adapter 可替換，UI 不知道 provider | 未開始 |
| 10-D | 在取得明確授權後，才可於隔離 sandbox 做 read-only candidate spike | 不含真實客戶、付款、正式資料、正式部署 | 外部 gated |
| 10-E | 通過 sandbox、license、security、backup、rollback 與 owner sign-off 後才評估寫入流程 | 可回放、可重試、可人工 reconciliation | 未授權 |

## 7. 最小 PoC 建議

建議下一個離線切片是 **10-B：ERP fixture mapping contract PoC**，不導入任何 ERP：

1. 以三筆 synthetic product、兩種庫存狀態與一筆 synthetic checkout receipt 驗證 canonical mapping。
2. 驗證 ERPNext-shaped、Odoo-shaped、Dolibarr-shaped payload 都能轉成同一個 project-owned Catalog／Inventory／Order DTO。
3. 驗證缺 SKU、價格衝突、庫存過期、重複訂單、provider timeout 的 normalized error／retry／idempotency 行為。
4. 驗證替換 adapter 不需修改 UI component，且禁止 provider field 逸出到 UI。
5. 產出 mapping report；不寫入資料、不啟動 server、不要求 Docker、secret、付款或物流。

PoC 完成條件：fixture contract tests 通過、mapping coverage 有明確 unmapped list、error matrix 可回放、現有 Vitest／TypeScript／lint／build／Chromium／WebKit regression 維持通過。未達成前不得選定或接通真實 ERP。

## 8. 決策與等待事項

- 本階段不選定最終 ERP；目前建議以 ERPNext 作為第一個 fixture mapping 候選，Odoo／Dolibarr 作為比較候選，Medusa／Saleor／Vendure 作 commerce 基準。
- 任何 GPL／BSD／MIT／企業版材料的商用適用性都需依實際版本與部署方式做正式法律審查。
- 等待店家真實商品資料不影響本規劃，但真實資料仍不得在未經 Phase 9-A staging／證據閘門前送入任何 ERP。
- 等待下一步明確授權後，才開始 10-B；本次不新增 service type、不改 UI、不接資料庫、付款、物流或 ERP。
