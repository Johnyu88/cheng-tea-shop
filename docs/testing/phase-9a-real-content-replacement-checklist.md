# Phase 9-A 真實商品照片與文案替換清單

狀態：**待店家提供並確認證據，未替換目前 synthetic data**。

## A. 照片替換矩陣

| 素材位置 | 目前狀態 | 需要的真實素材 | 必要證據／驗收 | 狀態 |
|---|---|---|---|---|
| 首頁／目錄商品圖 | labeled placeholder | 商品正面或包裝照片 | 店家授權、商品對應、alt text、裁切檢查 | 待提供 |
| 商品詳情主圖 | labeled placeholder | 對應規格與包裝照片 | 不得使用其他茶款照片；來源與授權可追溯 | 待提供 |
| 商品草稿暫存預覽 | local preview metadata | 店家提供的可用照片 | 不宣稱已上傳或正式發布；確認檔案權限 | 待提供 |
| 品牌／故事 hero media | 現有 prototype media | 店家核准品牌照片 | 使用權、人物／場景同意、替代文字 | 待確認 |

## B. 文案與事實欄位

| 欄位 | 目前 synthetic / placeholder | 真實替換要求 | 禁止事項 | 狀態 |
|---|---|---|---|---|
| 商品名稱 | mock tea names | 店家正式名稱 | 不用暱稱冒充正式品名 | 待提供 |
| 茶類／口感標籤 | synthetic tags | 店家確認分類與描述 | 不由模型推定產地或功效 | 待確認 |
| 規格／價格 | synthetic TWD integer | 目前販售規格與核准價格 | 不把測試價格視為正式價格 | 待提供 |
| 供貨狀態 | synthetic available/sold-out | 店家或庫存來源確認 | 不宣稱即時庫存 | 待確認 |
| 產地 | optional blank | 可證明的產地資料 | 無證據不得補寫 | 待提供 |
| 發酵／焙火 | optional blank | 店家確認製程描述 | 不創造專業術語或功效 | 待確認 |
| 香氣／沖泡 | optional blank | 店家核准文字 | 不寫醫療或保健宣稱 | 待確認 |
| 商品摘要 | grounded mock copy | 以已確認欄位重寫 | 不加入未提供的故事、功效、產地 | 待撰寫 |
| checkout copy | prototype boundary | 維持合成展示警語直到真實流程核准 | 不暗示已接付款 | 保留 |

## C. 每筆真實內容的交付欄位

提交前逐筆補齊：

- `content-id`：
- 對應商品／規格：
- 來源與授權 owner：
- 事實證據位置：
- alt text：
- 版本／日期：
- 審核人：
- 可公開：是／否
- 已通過真人理解驗證：是／否／未測

## D. 替換閘門

- 缺照片時保留「商品照片準備中」等 labeled placeholder，不使用另一商品照片代替。
- 缺事實證據時保留空欄或合成標記，不讓文案看似真實。
- 真實內容先進本機受控 fixture／preview，再跑 TypeScript、lint、build、axe 與 Chromium/WebKit regression。
- 任何正式公開、網域、preview、外部媒體儲存或付費服務都需要另行授權，不在 Phase 9-A 自動執行。
