# PHASE2-DESIGN-01 候選施工紀錄（2026-10-16）

狀態：候選施工完成，等待人工確認；未進入下一小階段。

## 範圍

- 建立字體大小、字重、行高、間距與色彩語意 tokens。
- 統一 primary／secondary／quiet／danger 操作層級。
- 提升商品卡標題、摘要、價格的閱讀差異。
- 保留 `#faf8f2`、`#20352e`、`#dbe6dc`、`#8b6446`；未修改照片、音訊、首頁段落順序、訂單或商品資料。
- 保留 PHASE1 按鈕並列、放棄購買、購物車數量／移除／計算與保存行為。

## 修改差異

- `app/globals.css`：新增 display/title/body/caption 字級、regular/semibold/bold 字重、body/tight 行高、section/card/control 間距與四種 action semantic color tokens。
- `app/globals.css`：新增 `.button-primary`、`.button-secondary`、`.button-quiet`、`.button-danger`；現有品牌色只以語意 token 重用。
- 首頁／目錄商品卡：標題、摘要、價格加入獨立閱讀層級 class。
- StorefrontShell、首頁 CTA、商品連結、載入更多、購物車操作與 manual checkout 加入語意按鈕 class；沒有改變路由或資料流程。
- 新增 `tests/phase2-design-tokens.test.ts`，測試 token 與語意 class 存在。

## 截圖證據

- 修改前基準：`phase1-checkout-03-screenshots/`，含 390／412／768／1080／1440px 的首頁、購物車、結帳與 390px 確認視窗。
- 修改後：`phase2-design-01-screenshots/`，含相同五種寬度與 `checkout-abandon-dialog-390.png`。
- 修改後 Playwright 檢查：五種寬度首頁／購物車／結帳均 `scrollWidth <= viewport`；首頁仍有 10 張圖片、人物文字與 1 個音訊控制。
- 390px：兩個正式 checkout 操作各 `152x82.38px`，左右並列、文字完整。
- 412px：各 `163x82.38px`；768px：各 `322.28x55.19px`，確認 768px 過渡未折成窄版。
- 1080／1440px：各 `345x55.19px`，頁面無水平捲動。

## 驗證矩陣

- TDD red：新增 token 測試在實作前 `2 failed / 0 passed`。
- 定向回歸：tokens 2/2、StorefrontShell 1/1、首頁 9/9、購物車 7/7、目錄 3/3、正式結帳 6/6 PASS。
- 完整 Vitest：75 files／371 tests PASS，Exit 0，Vitest 237.12 秒，外層 241.326 秒。
- TypeScript：PASS。
- 修改檔案 ESLint：0 errors／6 warnings；warnings 為既有 image、unused import 與 CSS ignored 訊息，未修無關技術債。
- Production build：PASS，20/20 static pages；保留既有 6 個 dynamic filesystem tracing warnings。

## 閘門

- 正式前台 10000、正式後台 10001 未修改或部署。
- PHASE1 人工驗收是 PASS；PHASE1 正式部署是 NOT DEPLOYED，兩者分開記錄。
- 10002 未重新開啟；目前只保留本機候選服務與截圖。
- 本紀錄完成後停止，等待人工確認；未進入 PHASE2 下一小階段。
