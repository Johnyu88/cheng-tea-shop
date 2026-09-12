# cheng-tea-shop

陳老師茶行官方網站、購物系統與可整合 ERP 的開發專案。

## 最高開發原則

**Website First → Mock API → ERP Reuse**

本專案優先把使用者真正看得到、摸得到、感受得到的部分做好：品牌風格、視覺、美感、舒適度、手機版體驗、商品展示與購物流程。

在前台尚未定型前，不先從零打造完整 ERP。前台先透過 Mock Data / Mock API 驗證流程；等網站需求穩定後，再尋找成熟且授權適合的 GitHub 開源 ERP / 電商後端專案，選擇最接近需求者進行裁切與調整，並透過 API Adapter 串接。

## 開發順序

1. 網站風格、品牌與 UX 討論
2. 前台資訊架構與頁面流程
3. 商品、購物車、結帳、會員與訂單等前台功能
4. 使用 Mock API 驗證完整購物體驗
5. 依已確認需求整理後端能力清單
6. 搜尋並比較可重用的 GitHub ERP / Commerce 專案
7. 建立 API Adapter，串接商品、庫存、顧客、訂單、付款與出貨
8. 最後才補齊必要的 ERP 客製功能

## 文件

- `DEVELOPMENT_STRATEGY.md`：工程策略與邊界
- `WHITEPAPER.md`：產品與工程白皮書
- `docs/superpowers/specs/2026-09-12-website-first-architecture-design.md`：Website First 架構設計規格

## 原則

前台不綁死特定 ERP。商品、庫存、訂單、顧客與付款等資料交換應透過穩定介面與 Adapter 層完成，讓後端未來可以替換，而不必重做網站。
