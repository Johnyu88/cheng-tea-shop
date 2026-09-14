# DEVELOPMENT_STRATEGY

## 1. 核心策略

本專案採用：

**Website First → Mock API → ERP Reuse → API Integration**

優先完成網站風格、功能、美感與使用舒適度，再依真正形成的需求補齊後端，不預先打造大量尚未被驗證的 ERP 功能。

## 2. 為什麼這樣做

- 前台體驗可以先快速迭代，不被後端架構拖慢。
- 真實需求會從已完成的購物流程中浮現，減少過度設計。
- 可優先重用成熟開源 ERP / Commerce 專案，縮短工期。
- 透過 API Adapter 隔離前台與 ERP，降低未來替換成本。
- 把工程時間集中在品牌、體驗與差異化，而不是重造通用後台能力。

## 3. Phase 1：前台體驗

先討論與完成：

- 品牌定位與網站氣氛
- 色彩、字體、留白、攝影風格
- 首頁與導覽
- 商品分類與商品詳情
- 購物車
- 結帳流程
- 會員與訂單查詢
- 手機版體驗
- 付款流程的前端介面
- 錯誤、空狀態、成功狀態

此階段允許使用 Mock Data / Mock API。

## 4. Phase 2：介面契約

前台流程穩定後，才整理真正需要的資料與 API 契約，例如：

- Product
- Category
- Inventory
- Customer
- Cart
- Order
- Payment
- Shipment

前台只能依賴這些穩定介面，不直接依賴任何 ERP 的內部資料表或專有模型。

## 5. Phase 3：ERP / Commerce 專案選型

依已確定需求到 GitHub 搜尋成熟開源方案，評估：

- 功能吻合度
- API 完整度
- 授權條款
- 社群活躍度
- 安全性維護
- 部署成本
- 客製難度
- 台灣付款與物流整合難度

優先裁切與重用，不以從零重寫為預設方案。

## 6. Phase 4：Adapter 整合

建立 Integration / Adapter Layer，將網站需要的統一 API 轉換成選定 ERP 的實際 API。

前台 → Unified API → Adapter → ERP / Commerce Backend

支付、物流等外部服務也透過獨立 Adapter 處理，避免散落在前台程式中。

## 7. Phase 5：補齊真正缺少的後端

只有當現成 ERP 無法滿足已驗證需求時，才自行開發必要模組。

原則：

- 不為可能需求預先開發。
- 不重造已有成熟方案的通用能力。
- 自製程式聚焦在陳老師茶行真正具有差異化的流程。

## 8. 架構邊界

### 前台負責

- 品牌與視覺
- UX
- 商品瀏覽
- 購買流程
- 使用者互動

### Unified API / Adapter 負責

- 統一資料契約
- ERP 轉接
- 支付轉接
- 物流轉接
- 錯誤格式統一

### ERP / Commerce Backend 負責

- 商品主資料
- 庫存
- 訂單
- 顧客
- 出貨
- 基礎報表

## 9. 重大決策原則

任何新功能先問：

1. 使用者目前真的需要嗎？
2. 能先在前台用 Mock 驗證嗎？
3. GitHub 是否已有成熟方案？
4. 能否透過 Adapter 整合，而不是綁死？
5. 只有在以上方法都不合理時，才自行開發後端。

## 10. 專案接手規則

任何 AI、Codex 或工程人員接手本專案時，應先讀：

1. `README.md`
2. `DEVELOPMENT_STRATEGY.md`
3. `WHITEPAPER.md`
4. `docs/superpowers/specs/` 內最新相關規格

不得在未確認前台需求前，直接開始打造完整 ERP。


## 11. 已確認的前端技術與交付策略（2026-09-14）

- 技術基線：Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui、pnpm。
- 候選骨架：先稽核 shadcnspace/ecommerce-shadcn-nextjs-template 的授權、固定 commit、依賴、安全與可移除範圍，再選擇性重用。
- 參考範圍：Vercel Commerce 只用於理解可替換供應商的架構；不帶入 Shopify 綁定。已棄用的 Medusa 舊 starter 不採用；Saleor 留待後端選型階段評估。
- 前端元件不得直接依賴 Mock 資料或特定 ERP SDK，統一經由專案自有 Service/API 介面與 Adapter。
- 部署採 Docker 與 Next.js standalone，目標 Google Cloud Run 台灣區 asia-east1；機密只放部署環境，不進 GitHub。
- 原型資料只使用合成 Mock 商品。真實商品大量輸入，須等持久化、身分驗證、權限與備份還原可用後才開始。
- 開發切成八個可驗收 Wave；每個 Wave 採獨立分支、測試、文件更新、審查、PR 與使用者確認合併。
- 詳細計畫：docs/superpowers/plans/2026-09-14-frontend-implementation-plan.md。
