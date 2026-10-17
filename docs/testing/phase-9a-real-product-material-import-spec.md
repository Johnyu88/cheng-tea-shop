# Phase 9-A 真實商品素材匯入規格

狀態：**規格完成，等待店家提供真實資料。** 本文件只定義格式與驗證規則，不包含任何真實商品內容，也不會自動替換目前的 synthetic fixture 或 placeholder。

## 1. 適用範圍與安全邊界

- 匯入來源可為 CSV 或 JSON；JSON 是 canonical format，CSV 只作店家編輯與交換格式。
- 每筆資料必須能追溯到店家提供者、來源文件、授權狀態與最後審核人。
- 沒有證據的欄位使用 `null`，不得用模型推測、其他商品資料或 synthetic 值填補。
- `draft`／`unpublished` 資料可進本機 staging；只有完成事實與素材驗證、授權、欄位驗證及人工核准，才可轉為 `published`。
- 本規格不授權資料庫、CMS、正式部署、付款、物流、ERP 或外部 API；目前只準備本機受控 fixture 的輸入契約。

## 2. Canonical JSON 格式

JSON 必須是 UTF-8、陣列根節點，檔案只包含商品資料，不包含密碼、API key、付款資料或顧客個資。以下是**空白結構範本**，不代表任何真實商品：

```json
[
  {
    "content_id": null,
    "product_name": null,
    "tea_type": null,
    "origin": null,
    "harvest_year": null,
    "weight_g": null,
    "price_twd": null,
    "aroma": null,
    "taste": null,
    "aftertaste": null,
    "brewing": {
      "water_temperature_c": null,
      "tea_weight_g": null,
      "water_ml": null,
      "steep_seconds": null,
      "instructions": null
    },
    "inventory_status": null,
    "product_image": {
      "file_name": null,
      "alt_text": null,
      "source": null,
      "license_or_permission": null,
      "sha256": null
    },
    "sort_order": null,
    "publication_status": null,
    "evidence": {
      "facts_source": null,
      "photo_permission_source": null,
      "reviewer": null,
      "reviewed_at": null
    }
  }
]
```

CSV 第一列標題必須完全符合下列欄位；巢狀 `brewing.*` 與 `product_image.*` 使用點號欄名：

```text
content_id,product_name,tea_type,origin,harvest_year,weight_g,price_twd,aroma,taste,aftertaste,brewing.water_temperature_c,brewing.tea_weight_g,brewing.water_ml,brewing.steep_seconds,brewing.instructions,inventory_status,product_image.file_name,product_image.alt_text,product_image.source,product_image.license_or_permission,product_image.sha256,sort_order,publication_status,evidence.facts_source,evidence.photo_permission_source,evidence.reviewer,evidence.reviewed_at
```

CSV 空值必須留空並在 staging 轉成 `null`；不可填 `N/A`、`unknown` 或看似正式的 placeholder 文案代替缺資料。

## 3. 欄位契約

| 欄位 | 型別／格式 | 匯入要求 | 缺資料處理 |
|---|---|---|---|
| `content_id` | ASCII `string` | 店家資料中的穩定識別碼；不可重複 | 拒絕匯入，禁止用隨機 id 代替 |
| `product_name` | `string` | 正式商品名稱，去除前後空白 | 拒絕匯入 |
| `tea_type` | enum | `white`／`green`／`oolong`／`black`／`dark`／`other`，需店家確認 | 拒絕匯入，不由模型分類 |
| `origin` | `string | null` | 產地需有可查證來源；可包含地區與國家 | `null`，不得猜測 |
| `harvest_year` | `integer | null` | 四位西元年份；不得大於目前年份；若為多年份需另有明確格式 | `null`，不得由茶名推定 |
| `weight_g` | positive integer | 單位固定為公克；與照片／包裝／規格一致 | 拒絕匯入 |
| `price_twd` | non-negative integer | 整數新台幣；必須有店家核准來源 | staging 可 `null`，不可發布 |
| `aroma` | `string | null` | 店家核准的感官描述，不得包含未證實療效 | `null` |
| `taste` | `string | null` | 店家核准的口感描述；顯示標籤另需映射既有 taste enum | `null`，不自行映射 |
| `aftertaste` | `string | null` | 店家核准的回甘描述 | `null`，不由模型撰寫 |
| `brewing.*` | number／string | null | 水溫、茶量、水量、浸泡秒數與文字建議必須彼此一致 | 可全為 `null`，不顯示未確認建議 |
| `inventory_status` | enum | `available`／`sold-out`；若未確認則 staging 使用 `null` | `null` 不得對外宣稱有貨 |
| `product_image` | object | 至少完成檔名、alt、來源、授權、SHA-256 | 維持 branded placeholder |
| `sort_order` | non-negative integer | 同一展示區不可重複；數字越小越前 | staging 可 `null`，不猜排序 |
| `publication_status` | enum | `draft`／`unpublished`／`published`；只有核准後可 `published` | 預設 `draft` |
| `evidence.*` | string／ISO date | 來源、照片授權、審核人與日期必須可追溯 | 缺任一項不得 `published` |

### 目前 prototype 對應提醒

目前 domain `Product`／`ProductDraft` 已有名稱、茶類、口感、規格、價格、供貨、圖片與發布狀態的部分欄位；`harvest_year`、`weight_g`、`aftertaste`、`sort_order`、完整 `brewing` 與 `evidence` 是本匯入規格保留的資料契約欄位。此階段不修改 TypeScript domain、不擴充 UI、不把未支援欄位假裝已可展示。

## 4. 圖片要求

- 格式：JPEG、PNG 或 WebP；不接受含可執行內容的檔案或不明副檔名。
- 建議長邊 1600–2400 px；檔案大小上限 5 MB；原始檔另存於店家受控位置，不提交 repo。
- 圖片必須是對應商品／規格的實拍或店家核准素材；不得用另一茶品、AI 生成茶包或暗示錯誤產地的影像替代。
- `alt_text` 描述看得到的商品與包裝，不寫未證實產地、功效或品質保證。
- 必須提供來源、公開使用授權與 SHA-256；相同 `sha256` 不得被當成不同商品照片重複匯入。
- 沒有通過圖片驗證時，保留「商品照片準備中」 branded placeholder，並維持 `isPlaceholder: true` 的語意。

## 5. 命名規則

### 商品與資料識別

- `content_id`：`tea-<stable-slug>-<variant>`，只用小寫 ASCII、數字與單一連字號；不得放姓名、電話、地址或價格。
- slug 由已核准的 `product_name` 產生；同名商品必須由店家提供 variant suffix，不可自動覆蓋既有網址。
- 匯入檔：`catalog-YYYYMMDD-vNN.json` 或 `catalog-YYYYMMDD-vNN.csv`。

### 圖片檔名

- 格式：`<content-id>__<view>__vNN.<ext>`。
- `view` 只使用 `front`、`package`、`detail`、`hero`、`story` 其中之一。
- 例子只展示格式，不代表要匯入的商品：`tea-example__front__v01.jpg`。
- 禁止空白、中文檔名、`final-final`、未標版本、個資、外部 URL 作為檔名。

## 6. 驗證規則與匯入閘門

1. **格式**：UTF-8、JSON 可解析或 CSV header 完全匹配；拒絕未知欄位、重複 `content_id`、重複排序值。
2. **型別與範圍**：重量／價格／排序／年份／沖泡數值符合型別與範圍；價格為 TWD 整數。
3. **事實證據**：產地、年份、製程、香氣、口感、回甘、沖泡與庫存都有來源或明確標記 `null`；不得由模型補寫。
4. **圖片**：檔案存在於受控 staging、格式／大小／hash／商品對應／alt／授權通過。
5. **狀態**：新資料一律 `draft` 或 `unpublished`；沒有 reviewer、reviewed_at、facts source 與 photo permission source 不得 `published`。
6. **安全**：掃描密鑰、HTML／script、路徑穿越、外部自動下載 URL 與顧客個資；任何命中即拒絕。
7. **相容性**：通過既有 DTO validator、TypeScript、lint、build、axe、Chromium／WebKit regression 後，才可進行 prototype fixture 替換審查。
8. **真人理解**：商品照片、名稱、價格、口感、placeholder 與文案在真人走查前不得標記為「已驗證易懂」。

驗證失敗時保留原 synthetic fixture 與 placeholder，不部分覆蓋，不刪除可回復資料。

## 7. Placeholder 替換流程

1. 店家提交一批 JSON／CSV、照片與證據索引；不直接修改 `lib/domain/mock`。
2. 主持人或 reviewer 執行欄位、來源、授權、圖片 hash 與安全檢查，產生去識別化 validation report。
3. 失敗欄位維持 `null`／placeholder；只有通過項目可進本機受控 staging fixture，並保留版本與 rollback copy。
4. 先在本機檢查商品卡、詳情、排序、上下架、價格、圖片 alt 與缺欄位狀態；不得把 staging 當正式公開資料。
5. 跑 TypeScript、lint、build、axe、Chromium／WebKit regression；若 UI 需新欄位，另開獨立設計與實作切片，不在匯入工作中偷改。
6. 真人走查直接觀察商品理解與 placeholder 辨識；沒有真人證據，不更新 human-validation 為完成。
7. 通過店家核准、測試與文件回填後，才可提出下一階段的 fixture replacement 或外部內容發布決策。

## 8. 目前狀態

- 本文件沒有填入任何真實商品名稱、價格、產地、年份、照片或文案。
- 目前網站仍使用 synthetic catalog、labeled placeholder、synthetic checkout 與 local publishing prototype。
- 等待店家提供符合本規格的資料包與證據；收到前不進行替換、不部署、不啟動付費服務。
