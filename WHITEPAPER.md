# 陳老師茶行網站開發白皮書

## 1. 專案目標

建立一個具品牌感、舒服、易用、適合手機操作的茶行官方購物網站，並在前台體驗確認後，以最少必要開發成本整合商品、庫存、顧客、訂單、付款、出貨與簡易 ERP 能力。

## 2. 核心工程原則

本專案採用：

**Website First → Mock API → ERP Reuse → API Integration**

前期優先處理品牌感、視覺、功能流程、美感、舒適度、商品展示、購物體驗與手機版操作。後端與 ERP 不作為第一階段阻塞條件。

同時採用「完成目標優先、成熟方案優先」：

- 開發前先評估可重用的成熟模板、元件、工作流與開源功能。
- 能安全修改既有方案時，不從零重造。
- 只保留符合需求的部分，移除不必要模組。
- 使用前檢查授權、維護狀態、安全性、架構吻合度、修改成本與供應商綁定。
- 模板不得反過來限制已確認的產品目標與使用者體驗。
- 重用或拒絕候選方案的理由必須記錄在規格、PR 或決策文件中。

## 3. 前台優先策略

第一階段以可操作前台為主要成果，後端資料可以先由 Mock Data / Mock API 提供。

前台階段優先回答：

- 顧客進站後看見什麼？
- 如何理解與挑選茶品？
- 如何加入購物車並完成結帳？
- 手機操作是否舒服？
- 品牌是否具有陳老師茶行自己的氣質？

## 4. 初步前台能力

- 首頁
- 品牌 / 茶行介紹
- 商品分類與詳情
- 購物車與結帳
- 會員 / 顧客資料
- 訂單查詢
- 付款介面
- 配送資訊
- 聯絡方式與實體體驗資訊
- 手機版與完整互動狀態

實際內容以後續 UX 與視覺討論結果為準。

## 5. 後端策略

前台完成並驗證後，再由實際需要反推後端能力。不預設自行從零打造 ERP。

1. 整理前台實際需要的資料與功能。
2. 建立統一 API 契約。
3. 搜尋成熟開源 ERP / Commerce 專案。
4. 比較功能、授權、維護、安全、部署與整合難度。
5. 選擇最接近需求的方案。
6. 停用不需要模組。
7. 透過 Adapter / Integration Layer 串接。
8. 只自行開發現成方案真正缺少的部分。

## 6. 架構概念

```text
顧客
  ↓
陳老師茶行網站 Frontend
  ↓
Frontend Service / Unified API
  ├─ Mock API（前期）
  ├─ ERP / Commerce Adapter（後期）
  ├─ Payment Adapter
  └─ Logistics Adapter
          ↓
ERP / Commerce Backend + 外部服務
```

網站不得直接綁定某一套 ERP。

## 7. ERP 預期能力

- 商品與分類管理
- 價格與庫存
- 顧客與訂單
- 付款狀態
- 出貨
- 基礎報表

更多 ERP 能力必須由實際營運需求決定，而不是預先假設。

## 8. 支付與物流

付款預計保留信用卡與 LINE Pay。物流、超商或宅配方案於前台流程確認後再決定串接方式。所有第三方服務經由 Adapter 層整合。

## 9. 開發階段

### Phase 0 — 方向與規格

品牌目標、網站氣質、使用者需求、頁面與購物流程。

### Phase 1 — UX / UI

Wireframe、視覺方向、手機版、互動與狀態設計。

### Phase 2 — Frontend Prototype

可操作頁面、Mock Data、Mock API、完整購物流程演示。

### Phase 3 — Backend Capability Map

由前台需求反推資料與後端功能，定義 Unified API。

### Phase 4 — Open-source ERP Selection

搜尋候選專案，比較功能、授權、安全、維護與整合成本。

### Phase 5 — Integration

整合 Adapter、ERP、支付與物流。

### Phase 6 — Production Hardening

完成權限、安全、備份、監控、效能、測試與上線。

## 10. 不做的事情

前台需求尚未穩定前：

- 不打造完整 ERP。
- 不設計大量可能用不到的資料表。
- 不因某套 ERP 的限制改變前台 UX。
- 不重造已有成熟方案的通用功能。

## 11. Agent 協作模式

Codex 是唯一總管，負責讀取狀態、拆解任務、動態選擇兩至四個專業 Agent、整合、驗證、更新文件與建立 PR。

專業角色包含規格、UI/UX、前端、API／資料、ERP／整合、金流／物流、QA／資安與部署。每項任務都要有單一負責人、檔案範圍、依賴、驗收條件與驗證方法。

本機 35B 作為第二複核者，負責第二意見、測試案例及文件／程式一致性。35B 的調用方式尚未驗證時，改由第二個 QA／資安 Agent 複核。35B 與其他 Agent 都沒有合併權限。

## 12. Git 與人工控制點

工作可自動進行到：

**建立分支 → 執行 → 測試 → Codex 整合 → 第二次複核 → 更新文件 → Commit → PR**

PR 建立後必須停止。只有游老師明確同意後，才合併到 `main`。測試失敗、規格不明或高風險問題不得繞過控制點。

## 13. 文件同步原則

每個重要階段同步更新：

- `WHITEPAPER.md`：方向、架構、重大決策與階段狀態
- `CAPABILITY_MAP.md`：能力和完成度
- `HANDOFF.md`：最近完成、阻礙與下一步
- 相關設計規格或實作計畫

GitHub 是正式文件與程式來源。聊天中的新指令若尚未寫入 GitHub，必須在下一個經確認的文件更新中同步。

## 14. 晨間會報

每天台灣時間 08:00 檢查 GitHub。只有新 Commit、PR、階段狀態改變、測試失敗、阻礙或待決策事項時才傳送會報；沒有變化就不通知。

會報包含：狀態、最新完成、目前工作、驗證結果、待確認 PR、待決策事項與今天下一步。GitHub 無法讀取時只回報存取失敗，不猜測進度。

## 15. 模板演進

先完成陳老師茶行網站。完成後才抽離品牌中立的通用網站模板，再依序用於五柳莊（醋）與一茶三訪（茶具）網站。未到模板階段前，不讓後續網站擴張本專案範圍。

## 16. 長輩友善商品上架

商品後台必須讓不熟悉電腦的長輩，也能在手機或電腦上一次完成一項商品上架。

已確認流程：

1. 新增商品。
2. 可選擇拍攝或上傳 1～3 張照片；尚未提供照片時使用統一品牌預設圖。
3. 系統非破壞性地統一比例、適度調亮並提供前後預覽。
4. 填寫茶名、單一規格、價格與茶類，選擇「有貨／售完」。
5. 選擇產地、發酵／烘焙程度、香氣、口感與沖泡方式等簡單標籤。
6. AI 依已輸入資料產生介紹草稿。
7. 預覽手機版與電腦版商品頁。
8. 儲存草稿或確認上架。

介面採大字體、大按鈕、白話用語與單頁簡表；茶名、規格、價格、茶類及供貨狀態集中顯示，其餘欄位可日後補充。系統自動儲存且錯誤可復原，照片上傳失敗不得清除已填內容。AI 草稿不得編造產地、療效或其他未提供資訊，並且必須由陳老師確認後才能發布。

第一版每項商品只有一種規格，不提供多規格、精確庫存或批次匯入。系統須穩定支援至少 40 種茶品且不設定 40 筆硬上限；每完成一筆即可公開，其餘保留草稿，不必先建立 40 筆空白商品。庫存只顯示「有貨／售完」。若顧客下單後發現實際數量不足，茶行須在 24 小時內電話聯絡，提供換貨或退款。

詳細規格見 `docs/superpowers/specs/2026-09-14-elder-friendly-product-publishing-design.md`。

## 17. 品牌與前台購物體驗

已確認網站採「山霧自然」方向：霧綠、米白與茶褐為主要色系；標題使用具茶文化氣質的明體，內文、價格、表單與按鈕使用清楚黑體。主視覺以自然光拍攝的真實台灣茶山為主，不過度修圖，也不使用可能被誤認為真實產地的 AI 茶山影像。

首頁依序呈現：

1. 茶山雲霧主圖、簡短品牌話與「開始選茶」。
2. 清香、甘甜、濃郁、焙火四張大口感卡。
3. 三款精選茶品。
4. 陳老師與茶行的簡短故事。
5. 以電話或 LINE 聯絡的「來店喝茶」次要入口。
6. 付款、配送與安心購買說明。
7. 地址、營業資訊、地圖與聯絡方式。

商品卡只顯示照片、茶名、價格與一句口感。商品詳情頁先顯示照片、茶名、口感、價格、庫存與加入購物車按鈕，再提供故事、產地、製程與沖泡說明。售完商品保留展示，但不得加入購物車。

顧客不必註冊即可購買。手機結帳分成聯絡資料、配送、付款三步驟；手機號碼必填、Email 選填。第一版提供宅配與到店取貨：宅配保留信用卡與 LINE Pay；到店取貨可線上付款或到店付款。固定運費與滿額免運門檻由後台設定，不寫死在前台。

網站文字像陳老師親自介紹：平實、溫暖、清楚、不誇張。不得使用療效或無證據宣稱，也不使用倒數計時、搶購彈窗、自動播放影音或其他壓迫式促銷。

詳細規格見 `docs/superpowers/specs/2026-09-14-storefront-brand-and-shopping-experience-design.md`。

## 18. Phase 1 手機 Wireframe 與設計系統

手機優先的核心體驗已完成 Wireframe 確認，包括首頁、商品詳情、購物車，以及聯絡資料、配送與付款的三步驟結帳。顧客不必註冊即可購買，手機號碼必填、Email 選填；錯誤或網路中斷時不得清除已填資料。

小型設計系統已確認使用深墨綠、霧綠、暖米白、紙白、茶褐及清楚的錯誤色；標題使用明體，內文與表單使用黑體。手機內文以 18px 為基準，可編輯欄位至少 16px，觸控目標至少 48 × 48px，並要求可見標籤、鍵盤焦點與語意化控制元件。

首頁高擬真階段可評估低干擾的山林霧氣或微風動態；使用者偏好減少動態時必須停止。鳥叫與蟲鳴只能作為預設關閉的選配環境聲音，須由使用者明確開啟、可隨時停止、離開首頁即停止，且不得妨礙載入或輔助科技。

此成果只是 Phase 1 的部分里程碑。桌機／響應式 Wireframe、完整錯誤與成功狀態、真實圖文驗證及年長使用者走查尚待完成。詳細規格見 `docs/superpowers/specs/2026-09-14-mobile-wireframes-and-design-system.md`。

## 19. Phase 1 桌機、響應式與狀態設計

桌機首頁採平衡清楚型：品牌文字與主要選茶入口在左，真實茶山主視覺在右。桌機商品詳情採左側照片、右側購買資訊；桌機結帳採左側三步驟表單、右側訂單摘要。平板結帳切換單欄，訂單摘要放在表單上方並可展開。

多商品訂單在 1～3 項時全部顯示；4 項以上先顯示前三項，再由顧客展開其餘內容。摘要分成商品、配送與金額三區，保留修改購物車入口。

載入、空購物車、網路錯誤、售完、表單錯誤、付款處理中、付款失敗及訂購成功狀態已確認。錯誤不得清除有效資料；付款處理中不得重複送出；付款失敗可重試或更換付款方式。

年長使用者求助以一鍵打電話為主要入口，LINE 為次要入口。購物車可以保留，但姓名、電話、Email、地址等個人資料只在本次瀏覽期間暫存，完成、取消或瀏覽階段失效後清除；不得在前端暫存付款卡號或付款憑證。

此成果是 Phase 1 的第二個部分里程碑。真實圖文版面驗證、可操作原型的實際年長使用者測試，以及前端實作計畫仍待完成。詳細規格見 `docs/superpowers/specs/2026-09-14-desktop-responsive-and-state-design.md`。

## 20. Phase 1 首頁真實圖文驗證

首頁第一屏已確認使用「慢慢選一杯好茶」，說明文字為「從喜歡的香氣與口感開始，不必先懂茶，也能找到適合自己的茶。」主要按鈕維持「開始選茶」。茶山照片在驗證稿中只作待替換素材，不得冒充實際產地。

品牌故事以陳老師泡茶人物為主，茶行木架與茶罐為輔。故事語氣採「像坐下喝茶」的方向：親切、自然、不催促。游老師已確認目前提供的店家與人物照片由店家拍攝／上傳，並取得網站公開使用同意；網站實作時優先採用店家原始檔。

首頁三款精選茶品已使用真實長度資料驗證：

| 茶品 | 規格與價格 | 首頁口感 |
|---|---|---|
| 陳年白茶 | 一兩／NT$800 | 清甜柔順 |
| 霜雪龍 | 二兩／NT$1,000 | 清香甘甜 |
| 東方美人 | 一兩／NT$1,200 | 花果香柔順 |

商品卡固定依序呈現照片、口感、茶名、規格與價格及「查看茶品」，首頁不直接放複雜規格選單。桌機採左右主視覺與三欄商品，平板主圖在上並使用兩欄商品，手機採單欄、大字與大按鈕。三種版面方向已確認。

缺少正式茶山或商品照片時，可先使用來源清楚的中性替代素材；商品圖統一使用品牌預設圖並標示「商品照片準備中」，不得使用相近茶品照片冒充實物或暗示虛假產地。店家現有照片的公開使用權已確認；第三方素材仍須保留授權與署名要求。「無毒」或類似商品宣稱須有可查證依據才可公開。

此成果完成首頁真實長度文案與構圖驗證，但尚未完成全部正式素材。Wave 1 已建立技術基線，正式前台內容仍待後續 Wave 實作。詳細規格見 `docs/superpowers/specs/2026-09-14-homepage-real-content-validation-design.md`。

## 21. 龍映茗茶品牌與漸進式商品目錄

網站對外主名稱使用「龍映茗茶」；「陳老師茶行」作為熟客稱呼，保留於品牌故事、搜尋說明及必要的輔助文字中。

商品目錄以至少 40 種茶品為實際營運目標，系統不設定 40 筆硬上限。陳老師使用長輩友善的單頁簡表逐筆建立商品，最低必要欄位為茶名、單一規格、價格、茶類與供貨狀態。商品先自動儲存為草稿，每完成一筆即可個別公開，其餘草稿不讓顧客看到。

顧客可同時依口感與茶類尋找商品：首頁以清香、甘甜、濃郁、焙火等口感作新手入口，完整商品目錄另提供茶類篩選。單一商品可有一個主要茶類及多個口感標籤。首頁固定只呈現三款人工指定的精選茶品，不因目錄增加而把所有商品塞入首頁。

沒有實拍照片的商品仍可公開，但必須使用統一的龍映茗茶品牌預設圖並清楚標示「商品照片準備中」；不得借用其他茶品照片造成誤認。日後補上實拍照時只替換媒體資料，不重建商品或改變商品網址。

詳細規格見 `docs/superpowers/specs/2026-09-14-brand-and-progressive-catalog-design.md`。

## 22. 前端技術選型與實作計畫

- 採混合重用：以 Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui 建立專案自有前端；候選 MIT 模板必須先稽核與固定 commit，不能整包直接覆蓋專案。
- Vercel Commerce 僅作可替換後端的架構參考，不引入 Shopify 綁定。
- 資料流固定為：頁面／元件 → Frontend Service/API Interface → Mock Adapter → 未來 ERP Adapter。
- 原型只放少量合成 Mock 商品；真實 40 種以上商品，等持久化後端、登入權限與備份還原完成後才由陳老師逐步輸入。
- 部署保持 Docker 可攜性，使用 Next.js standalone，目標 Google Cloud Run 台灣區 asia-east1。
- 實作分八個 Wave：模板稽核、基線、設計系統、領域介面與 Mock、首頁與目錄、商品與購物車、結帳與商品草稿、完整 QA 與容器部署。
- 詳細驗收與測試門檻見 docs/superpowers/plans/2026-09-14-frontend-implementation-plan.md。
- Wave 0 已固定稽核 shadcnspace/ecommerce-shadcn-nextjs-template commit 2df689427f1c22c6ed558ba59e13ac34965e6cec。結論為禁止整包匯入，只能逐項重用通過審查的 MIT UI primitive 或版面概念。
- 候選快照的 Next.js 16.1.7 已低於 2026-09-14 官方安全基準，且缺少測試、CI、standalone 與 Docker 設定；Nova 品牌、假結帳、靜態商品、遠端圖片及假登入不得沿用。
- Wave 1 改採乾淨基線，以官方當日已修補的穩定版 Next.js 建立專案；2026-09-14 的已知最低目標為 16.3.3，實作時仍須再次查核官方安全公告。
- 完整紀錄見 docs/audits/2026-09-14-wave-0-template-audit.md。

## 24. Wave 3 領域介面與 Mock Adapter — 2026-09-20

- 專案自有 TypeScript contracts 現在定義 `Money`、商品與規格、庫存狀態、購物車、結帳草稿及商品草稿。
- Catalog、cart、checkout 與 publishing service interfaces 已與 fixture 和 adapter 實作分離。
- deterministic Mock Adapter 包含 48 筆合成商品、cursor 分頁、茶類／口感篩選、空結果與目錄錯誤、售完處理、購買上限、整數 TWD 金額、結帳驗證及單規格草稿發布。
- Mock Adapter 不包含真實顧客資料、付款憑證、登入、ERP、持久化或未經證實的產地／療效宣稱。
- Wave 3 本地驗證通過：Vitest 6 個檔案／14 個測試、ESLint、TypeScript 與 production build。
- 商品頁、目錄 UI 整合、購物車 UI、真實結帳／付款、ERP、瀏覽器 e2e 與 Docker smoke 仍是後續或外部 gate。
- 詳細規格見 `docs/superpowers/specs/2026-09-20-domain-interfaces-and-mock-adapter-design.md`；實作計畫見 `docs/superpowers/plans/2026-09-20-domain-interfaces-and-mock-adapter-implementation-plan.md`。

## 23. 目前狀態

- Agent 工作流設計已確認。
- 長輩友善商品上架設計已確認。
- Phase 0 品牌、首頁、商品瀏覽與核心結帳體驗已完成規格確認。
- Phase 1 手機核心 Wireframe 與小型設計系統已確認。
- Phase 1 桌機／平板響應式 Wireframe、必要狀態與年長操作保護已確認。
- Phase 1 首頁真實長度文案與手機／平板／桌機構圖已確認。
- Phase 1 仍在進行；現有店家照片公開使用權已確認，缺圖商品可使用有標示的品牌預設圖。前端技術選型與實作計畫已確認，可操作原型的實際年長使用者測試仍待完成。
- Wave 1 已建立乾淨、可測試、可容器化的前端基線；沒有任何候選模板程式或素材整包進入專案。
- Wave 0 模板稽核已完成並判定不可整包匯入。下一步是完成 Wave 1 quality gate，再以小範圍進入 Wave 2 品牌 shell。

## 25. Wave 4 首頁目錄展示 — 2026-09-20

- 首頁現在透過 project-owned `CatalogService` 取得前三筆商品，不直接依賴 fixture 或特定 ERP SDK。
- 商品卡顯示名稱、口感標籤、摘要、規格、整數 TWD 價格與「商品照片準備中」placeholder；目前「查看茶品」仍是 prototype 文案，不建立商品詳情頁。
- 首頁保留 loading、empty 與 catalog error 狀態，錯誤訊息不會假裝有商品資料。
- Wave 4 本地驗證通過：Vitest 6 個檔案／17 個測試、ESLint、TypeScript 與 production build。
- 購物車 UI、產品詳情、checkout UI、真實付款、ERP、登入、持久化與真實商品資料仍不在本切片範圍。

## 26. 陳老師品牌故事媒體 — 2026-09-20

- 使用者提供並核准將陳老師照片與短片用於網站品牌故事區，不作為商品照片或商品真實性證據。
- 網站只提交最佳化後的 `public/media/teacher-portrait.webp` 與 `public/media/teacher-story.mp4`；原始 JPG／MOV 不進 Git。
- 影片轉為無音軌 MP4，預設靜音、手動播放、保留 controls，並清除 GPS、裝置與拍攝 metadata。
- 照片以可存取的替代文字呈現；影片提供 aria label、poster 與瀏覽器不支援時的 fallback 文案。

## 27. Wave 4.1 完整目錄瀏覽 — 2026-09-20

- 首頁保留三款人工精選，並新增完整目錄瀏覽區；UI 只依賴 project-owned `CatalogService`，不直接讀取 fixture 或 ERP SDK。
- 目錄以 cursor 分頁載入，使用「載入更多茶品」追加結果，不設定 40 筆上限。
- 提供清香、甘甜、濃郁、焙火四種口感篩選；切換篩選會重置 cursor 並重新載入。
- 商品卡延續合成資料與「商品照片準備中」標示；保留 loading、空結果、錯誤及重試狀態。
- Wave 4.1 本地驗證通過：Vitest 7 個檔案／22 個測試、ESLint、TypeScript、Webpack production build、Chromium smoke/axe e2e（3/3）與 headless Chromium 目錄互動檢查（初始 12 筆、焙火篩選、載入更多至 24 筆）。
- Visual browser surface 因 computer-use request-header policy 無法載入而未完成；Docker smoke 仍待 clean runner 或可用 Docker 環境。
- 未加入商品詳情、購物車、結帳、付款、ERP、登入、持久化、真實商品或顧客資料。

## 28. Wave 5 商品詳情與購物車 — 2026-09-21

- 目錄商品卡現在以穩定 slug 連到 `/tea/[slug]`；商品詳情透過 project-owned `CatalogService` 讀取商品，首屏顯示品牌預設圖、茶名、口感摘要、規格、整數 TWD 價格與供貨狀態。
- 有貨商品提供單一 `ProductVariant` 的正整數數量控制與 `maxQuantity` 限制；售完、找不到商品、服務失敗與超過購買上限均保留既有選擇並以頁內可理解訊息處理。
- `/cart` 透過 `CartService` 處理新增／合併、數量更新、移除與 subtotal；共享 `CommerceProvider` 在 client navigation 間保留同一個 Mock service instance。Wave 5 不使用瀏覽器儲存個資或付款資料。
- 這一 Wave 只驗證合成商品的前台購買互動。結帳、付款 adapter、訂單 API、物流、會員／登入、ERP、持久化資料庫、多規格、精確庫存與真實商品資料仍是後續範圍。
- 實作與驗證限制詳見 `.superpowers/sdd/2026-09-20-product-detail-and-cart/task-7-report.md`；未將尚未通過的 typecheck、production build 或 Chromium／WebKit e2e 寫成通過。

## 29. Wave 6 checkout prototype slice — 2026-09-21

- Wave 6 的 domain contracts、checkout／publishing Mock services、購物車到 `/checkout` 邊界、guest checkout prototype 與商品草稿發布 UI 都已完成；最終 build/browser/container gate 的結果另行如實記錄。
- Checkout 透過 `CommerceProvider` 注入 project-owned `CheckoutService`，提供聯絡資料、宅配／到店取貨、付款方式、確認訂單、處理中、失敗重試與成功狀態；手機必填、Email 選填。
- 付款仍是 deterministic Mock。原型不渲染信用卡欄位、不保存付款憑證、不使用瀏覽器儲存、不加入登入、持久化、訂單後端、ERP 或真實金流。
- 有限庫存提示保留電話作為主要聯絡方式、LINE 作為次要聯絡方式；checkout 的個人資料只存在當前 React flow。
- 已完成 accessible step-heading focus、live status／error alert、四項以上摘要展開狀態、重複提交保護與 provider-boundary failure recovery 測試。
- Wave 6 checkout 驗證：focused Vitest 18/18、TypeScript、scoped ESLint 與 diff check 通過。Chromium acceptance 因 standalone hydration／靜態資產環境問題未完成，未宣稱通過；WebKit 與 Docker 留待最後品質 gate。
- 下一個切片是長輩友善商品草稿：單頁最低欄位、0～3 張暫時預覽圖、grounded Mock 文案、草稿儲存、預覽與人工確認後發布。

## 30. Wave 6 商品草稿原型 — 2026-09-21

- `/admin/products/new` 已完成單頁、手機優先的商品草稿原型，最低欄位為茶名、單一規格、整數 TWD 價格、茶類與供貨狀態；另提供可選事實欄位、口感標籤與 0～3 張本機預覽圖。
- 頁面只透過 `CommerceProvider` 的 `PublishingService` 產生 grounded Mock 介紹、儲存草稿與確認後發布；所有失敗都保留目前草稿與預覽，發布確認會在任何可發布內容變更後失效。
- 圖片只保留 object URL 與非敏感 metadata，超量／非圖片拒絕時不清除既有資料，移除與卸載時撤銷 object URL；不使用登入、瀏覽器儲存、上傳、ERP、憑證或正式持久化。
- 操作狀態透過 live region 宣告，save／generate／publish 均有同步重複操作防護；成功狀態顯示 Mock 商品名稱與規格資訊。
- 商品草稿驗證：focused Vitest 19/19、TypeScript、scoped ESLint、`git diff --check` 與獨立修正輪審查通過。Chromium acceptance 仍因既有 `.next/standalone` 鎖定／建置環境問題未執行，未宣稱通過；WebKit 與 Docker 留待最後 quality gate。
- 完整 local Vitest 已通過 15 個檔案／96 個測試，TypeScript 通過，full ESLint 以 0 errors 結束（另有 Wave 6 diff 外的一項既有 `no-img-element` warning）。Webpack sandbox 嘗試因 `.next/trace` 的 `EPERM` 未能完成，核准重試則因 `.next/standalone` 鎖定而 `EBUSY`；未在非 fresh build 上啟動 Chromium。WebKit executable 與 Docker CLI 均不可用；spec header whitespace 已修正，完整 `git diff --check` 通過。
- 下一步是在可寫入、無鎖定的 clean environment 重跑 build 和 Chromium，並在安裝 WebKit/Docker 的環境中補齊對應 gate；真實管理員驗證、持久化、照片上傳、付款、ERP 與正式發布仍維持後續範圍。

## 31. Wave 6 quality gate — 2026-09-21

- 完整 Vitest 15 個檔案／96 個測試、TypeScript、全域 ESLint 與完整 branch diff check 通過；獨立 QA/Security 複審無 Critical、Important 或 Minor 發現。
- Production webpack build 受本機檔案鎖定環境阻擋，Chromium 因無 fresh standalone build 未啟動；WebKit 執行檔與 Docker CLI 不在目前環境。
- 最終原型仍明確不包含真實身份驗證、付款、持久化、照片上傳、ERP、顧客或訂單資料；完整證據與限制見 `final-verification-report.md`。

## 32. Wave 7-A 前台購物品質關卡 — 2026-09-22

- 在隔離的 `codex/wave-7-shopping-quality-gate` 分支，以 clean production build 執行前台購物品質關卡；完整 Vitest 15 個檔案／96 個測試、TypeScript、Webpack production build 與 diff check 通過。
- Chromium 與 WebKit storefront gate 均通過 14/14：首頁、健康檢查、首頁 axe、商品詳情、購物車、checkout、重複提交保護、手機版 overflow 與商品草稿流程；`/tea/mock-tea-001`、`/cart`、`/checkout`、`/admin/products/new` 均無 detectable axe violations。
- 實際修正品質問題：`.catalog-count` 改用符合對比要求的前景色；購物車 e2e 更新為 Wave 6 已實作的 `/checkout` link contract；checkout e2e 的 alert assertion 排除 Next route-announcer 空 alert；商品草稿與 axe e2e 等待 React hydration／主要 h1 完成，避免 WebKit 在 loading 狀態誤判。
- 依 Playwright 官方方式安裝 WebKit：`node node_modules/@playwright/test/cli.js install webkit`，因本機憑證鏈要求使用 Node `--use-system-ca`；未關閉 TLS 驗證、未修改系統安全設定。WebKit 26.6／playwright webkit v2359 安裝至使用者 Playwright cache 後通過 14/14。
- 全域 ESLint 以 0 errors 結束，保留既有 `product-detail-page.tsx` 一項 `@next/next/no-img-element` warning。Docker CLI 仍不可用，列為環境待辦，不阻擋前台品質關卡。
- 本階段仍不擴充真實付款、登入、持久化、ERP、顧客資料或付費雲端部署；正式 preview 與真實年長使用者走查仍需明確授權、參與者與環境條件。

## 33. 年長使用者參與走查本機準備 — 2026-09-22

- 新增 `docs/testing/older-user-walkthrough.md`，包含主持人開場腳本、T1–T8 購物與商品草稿任務、字體／按鈕／導覽／商品理解／購物車／checkout／錯誤提示觀察表、問題紀錄格式及 P0–P3 判定標準。
- 新增 `docs/superpowers/plans/2026-09-22-older-user-walkthrough-preparation.md`，定義只使用 localhost、Mock 資料與合成聯絡資料的離線執行方式；不保存真人個資、不啟動 preview、不使用付費服務。
- 本階段只完成測試準備，不宣稱已完成真人可用性驗證。Wave 7-B 的準備通過線為主要 T1–T5 任務各有完整成功紀錄、無阻斷購物路徑的 P0，且不得誤解 placeholder、Mock checkout 或合成上架結果。

## 34. 年長使用者走查主持人 dry run — 2026-09-22

- 以本機 standalone server、headless Chromium 及 `360×800`／`1280×800` 兩種尺寸完整執行 T1–T8，兩種尺寸均 8/8 PASS，合計 16/16；此為主持流程與路徑驗證，不是真人研究結果。
- 新增 `docs/testing/older-user-walkthrough-dry-run.mjs` 與紀錄文件；dry run 修正了 loading 等待、購物車商品列定位與 standalone localhost 執行方式，沒有修改前台產品行為。
- 客觀觀察：checkout 的 T4 返回路徑包含「返回配送方式」與「上一步」兩層；真人走查時需觀察是否理解兩者差異。按鈕是否直覺、文字是否容易理解，仍不可由自動化 dry run 判定。
- 隔離工作樹的 dev server 受 `node_modules` junction／Turbopack 限制；改用已驗證的本機 standalone server 完成驗證。正式真人走查、preview deployment、付費服務與 Docker 仍暫緩。

## 35. 真人驗證邊界與下一個離線前台項目 — 2026-09-22

- 年長使用者易懂性、按鈕直覺性、導覽理解及商品資訊／placeholder 理解，均標記為必須由真人走查驗證；自動化 dry run 只證明預定路徑可操作，不取代真人研究。
- 目前前台仍使用 deterministic Mock catalog/cart/checkout/publishing service；商品、購物車、checkout、商品草稿與發布結果都是 prototype／synthetic／transient 邊界，不代表真實資料、真實付款或正式上架。
- 尚未完成且受外部條件限制的能力：真實內容與素材證據、真人走查、Docker smoke、正式 preview、持久化資料、登入權限、真實付款、物流與 ERP。
- 下一個可離線完成的前台品質項目候選為 checkout 的 prototype boundary copy：明確說明付款選項只是合成展示、尚未送出真實付款；不接金流、不保存付款資料、不改變 checkout flow。

## 36. Checkout prototype boundary copy — 2026-09-22

- Checkout 的初始步驟與 synthetic success 都顯示「此頁為合成展示／原型，不會送出真實付款，也不會保存付款資料。」；這是前台理解邊界，不是付款流程或資料持久化。
- 以 TDD 新增兩個 checkout component tests，並在 checkout e2e 驗證 Chromium／WebKit 的初始與成功狀態；未新增 payment provider、credential、storage、API 或流程步驟。
- 驗證結果：完整 Vitest 15 files／98 tests、TypeScript、Webpack build、lint 0 errors（保留既有一項 `<img>` warning）、Chromium checkout e2e 6/6、WebKit checkout e2e 6/6；完整 Wave 7 storefront gate 仍為 Chromium/WebKit 各 14/14。
- 真人必驗證的易懂性、按鈕直覺性與商品資訊理解仍不由自動化推論；下一個低風險前台項目尚未選定，避免在沒有實際缺陷或明確設計需求時擴大範圍。

## 37. 下一階段施工圖 — 2026-09-22

### 已完成且驗證通過

- 品牌首頁、陳老師故事媒體、完整合成目錄、口感篩選、cursor 載入、商品詳情與購物車。
- Guest checkout prototype：聯絡、配送、確認三步，欄位驗證、錯誤保留、重試、重複送出保護與合成成功畫面。
- Checkout prototype boundary copy：初始、確認與合成成功狀態都明示不會送出真實付款、不會保存付款資料。
- 長輩友善商品草稿 prototype：最低欄位、暫時照片預覽、grounded Mock 文案、草稿、預覽、人工確認與合成發布。
- Wave 7-A 驗證：Vitest 98/98、TypeScript、Webpack build、lint 0 errors、Chromium/WebKit storefront gate 各 14/14、主要路由 axe coverage 通過。

### 仍屬 mock／stub／draft

- 所有 Catalog、Cart、Checkout、Publishing 都是 project-owned deterministic Mock adapters。
- 商品、價格、庫存、照片、訂單編號與發布結果都是合成或暫存資料；購物車與聯絡資料不持久化。
- 付款選項只是 checkout UI state，沒有 payment intent、token、卡號欄位或 provider call。
- 商品上架頁沒有管理員登入、權限、媒體上傳、版本、稽核或正式發布。

### 可純本機繼續

- 維護 unit／axe／Chromium／WebKit／TypeScript／lint／build regression gates。
- 在既有 service interfaces 上增加 local fake adapter 與 DTO/error contract tests，不加入網路或憑證。
- 只有遇到可重現問題或已核准的設計需求時，才改善 loading、retry、錯誤文案與 prototype boundary copy。
- 保持 facilitator dry run 可重跑，但不把它當作真人研究證據。

### 必須等真人走查

- 年長使用者與首次購物者是否真正理解文字、價格、供貨狀態、placeholder 與合成提示。
- 按鈕與導覽是否直覺，尤其 checkout 的「返回配送方式」／「上一步」差異。
- 任務成功率、停頓、誤觸、求助、錯誤修正與口語理解。

### 必須等 preview／Docker／外部服務

- Docker smoke、容器 release gate、preview、網域、Secrets、預算、log 與 rollback。
- 真實商品／素材／產地證據、持久化、登入權限、真實付款、物流、ERP、備份與監控。

### 未來 API boundary

- `CatalogService`：未來接 versioned catalog DTO、媒體、庫存與 normalized errors；UI 不直接呼叫 ERP。
- `CartService`：未來加入 server cart identity、版本／併發檢查、idempotency、權威價格與庫存。
- `CheckoutService`：未來建立 checkout/order session，server-side 重算金額並只回傳安全 receipt。
- Payment：新增 tokenized provider adapter，只傳 provider token／狀態，絕不在本 app 接收或保存 raw card data。
- Logistics：獨立 quote／fulfillment adapter，處理配送可服務性、地址同意與 tracking。
- `PublishingService`：未來接 authenticated draft/version/media/audit boundary，發布內容必須有證據與狀態。
- ERP：獨立 domain-to-ERP adapter，處理重試、對帳與 dead-letter；前台不直接依賴 ERP SDK。

### 建議下一個 Phase 與最小可驗證切片

**Phase 8：Integration-readiness contract hardening。** 最小切片是使用 in-memory fake adapters，為四個既有 service interface 補 DTO mapping、normalized error、版本與可替換 adapter 的 contract tests。這個 Phase 不實作真實付款、登入、持久化、物流、ERP 或 preview。

### 未提交檔案來源記錄

- `AGENTS.md`：目前無內容 diff，Git 狀態的 M 為工作樹／換行／索引狀態；內容 hash 與 HEAD 一致，未由本次施工圖工作修改或提交。Next dev 曾自動插入規則，但已不保留該內容。
- `next-env.d.ts`：包含 Next.js 產生的 `.next/types` references 與 generated comment；在前一階段本機 Next build/dev 後已存在，並非本次文件整理產生。維持未提交，不覆蓋、不提交。

## 38. Phase 8 integration-readiness contract hardening — 2026-09-22

- 建立 `CatalogProductDto`、`CatalogPageDto`、`CartDto`、`CheckoutRequestDto`、`CheckoutReceiptDto`、`ProductDraftDto`，並建立 Payment、Logistics、ERP 的窄化 request/result DTO。Payment DTO 僅接受訂單參照、付款方式與金額，不接收 raw card number、security code、token 或其他付款憑證。
- 新增 `PaymentService`、`LogisticsService`、`ErpService`，所有 adapter 操作回傳既有 `ServiceResult`；`mapAdapterError` 將 adapter source 正規化為 `payment-unavailable`、`logistics-unavailable`、`erp-unavailable`，保留訊息與 retryable 語意。
- 新增 `createInMemoryCommerceServices`，將既有 Catalog、Cart、Checkout、Publishing mock 組成可替換 bundle；新增本機合成 Payment、Logistics、ERP fake adapters。這些 fake 只回傳 `simulated` 結果，不連線、不保存、不代表真實交易或同步成功。
- 另以 `createInMemoryIntegrationAdapters` 將三個外部邊界 fake 集中成可整組替換的 local bundle，仍不接入前台 checkout。
- `CommerceProvider` 的預設服務改由 in-memory bundle 建立，既有前台注入介面與 UI 行為不變；未把 Payment、Logistics、ERP 接入 checkout UI，避免擴大付款或流程範圍。
- TDD 契約測試覆蓋 DTO shape、付款敏感欄位排除、錯誤映射、fake adapter 結果、adapter swapping 與可替換 interface。驗證結果：Vitest 16 files／103 tests、TypeScript 通過、ESLint 0 errors（保留既有 `no-img-element` warning）、Webpack production build 通過，Chromium/WebKit storefront regression 各 14/14 通過。
- 本切片不新增真實付款、登入、持久化、物流、ERP、preview、Docker 或付費服務；真人走查仍是年長使用者易懂性、按鈕直覺性與商品資訊理解的唯一驗證方式。

## 39. Phase 8 Catalog / Cart / Checkout boundary hardening — 2026-09-22

- 新增本機 runtime DTO validators：`validateCatalogQuery`、`validateCartDto`、`validateCheckoutRequestDto`。它們只驗證 service boundary 的資料形狀與基本不變量，不改變現有 UI 流程，也不保存資料。
- Catalog query 的非法 filter、cursor、limit 會回傳 `invalid-catalog-query`；Cart 會拒絕非法金額、數量、庫存狀態或 line shape；Checkout request 會拒絕不完整聯絡、配送／付款方式或購物車 shape。錯誤均為 project-owned、non-retryable domain errors。
- `createInMemoryCommerceServices` 仍以注入的 Catalog 建立預設 Cart，契約測試證明替換 Catalog 後 Cart 仍透過替換後的 adapter 解析商品；Checkout 也能獨立替換而不改變 provider contract。
- TDD／regression 結果：focused integration contracts 9/9；完整 Vitest 16 files／107 tests；TypeScript 通過；ESLint 0 errors（既有 `product-detail-page.tsx` 一項 `<img>` warning）；Webpack production build 通過；Chromium/WebKit 各 14/14 通過（單 worker）。
- 曾嘗試兩個瀏覽器平行跑 28 tests，出現 1 個共享 standalone mock 狀態的 URL race；單 worker 重跑相關與完整 suite 均通過，未將它誤修成產品行為。未接真實資料庫、付款、物流、ERP 或外部服務。

## 40. Phase 8 Payment / Logistics contract slice — 2026-09-22

- 延續既有 Payment／Logistics DTO、error model 與 service interfaces，新增 `validatePaymentRequestDto`、`validateShippingQuoteRequestDto`、`validateFulfillmentRequestDto`。付款 validation 只接受訂單參照、付款方式與 TWD 金額，沒有 raw card、CVV、token 或 provider credential。
- 新增 `invalid-payment-request` 與 `invalid-logistics-request`，錯誤在進入 adapter 前被正規化為不可重試的本機 domain error。配送 DTO 要求 home delivery 有 destination；store pickup 可使用 null destination。
- `createInMemoryIntegrationAdapters` 現在接受 typed overrides，可獨立替換 Payment／Logistics／ERP。測試驗證替換後的 adapter identity 保留，並沒有把 fake 接入前台 checkout。
- 驗證結果：focused integration contracts 11/11；完整 Vitest 16 files／109 tests；TypeScript 通過；ESLint 0 errors（既有 `<img>` warning）；Webpack production build 通過；Chromium/WebKit 各 14/14 通過（單 worker）。
- 本階段仍不實作金流、LINE Pay、信用卡、物流 API、資料庫、ERP、登入、持久化、preview 或付費服務；fake 結果維持 `simulated`，不可視為付款授權或物流建立成功。

## 41. Phase 8 Publishing / ERP consistency and coverage matrix — 2026-09-22

- Publishing contract 以 `ProductDraftDto` 與既有 `PublishingService` 為 boundary；ERP contract 以 `ErpProductUpsertDto`、`ErpOrderSyncDto` 與既有 `ErpService` 為 boundary。兩者都透過 `ServiceResult` 回傳，不引入 CMS／ERP SDK。
- 新增 `validateProductDraftDto`、`validateErpProductUpsertDto`、`validateErpOrderSyncDto`，錯誤分別為 `invalid-publishing-request` 與 `invalid-erp-request`。Publishing adapter error source 也納入 normalized mapping，對應 `publishing-unavailable`；既有 draft validation 的 `invalid-draft` 行為不變。
- `CommerceProvider` 的 Publishing override 與 integration bundle 的 ERP override 均有 identity-preserving swapping tests；跨服務測試確認所有 local failure 都維持 `{ code, message, retryable }` error shape。
- Phase 8 contract coverage：Catalog、Cart、Checkout、Payment、Logistics、Publishing、ERP 均已完成 DTO／interface、runtime validation、error model、local fake、override／swapping test 與 UI regression coverage。這只代表本機 contract hardening，不代表真實 provider readiness。
- 驗證結果：focused integration contracts 14/14；完整 Vitest 16 files／112 tests；TypeScript 通過；ESLint 0 errors（既有 `<img>` warning）；Webpack production build 通過；Chromium/WebKit 各 14/14 通過（單 worker）。
- 明確未完成：真實 ERP、CMS、資料庫、登入、持久化、付款授權、物流建立、preview、Docker 與真人走查。

## 42. Phase 8 closure — completed / integration-ready prototype — 2026-09-22

- 新增最小 integration smoke test：`tests/phase-8-integration-smoke.test.tsx`。它以預設 in-memory factories 完整跑 Catalog → Cart → Checkout，並呼叫 Payment、Logistics、Publishing、ERP local fakes。
- Smoke 同時驗證任一 boundary adapter 可由 typed override 替換、替換後仍使用相同 `ServiceResult`／error mapping，且 `CommerceProvider` UI probe 只看 service contract，不渲染 `mock`、`simulated` 或 provider 細節。
- Phase 8 收尾驗證：smoke 2/2；Vitest 17 files／114 tests；TypeScript 通過；ESLint 0 errors（既有 `<img>` warning）；Webpack production build 通過；Chromium 14/14；WebKit 14/14，均以單 worker 執行。
- Phase 8 狀態標記為 **completed / integration-ready prototype**。此名稱只代表本機 adapter contract 已可替換與驗證，不代表 production-ready 或任何真實服務已接通。
- Phase 9 僅整理候選：真人年長使用者走查、真實內容證據、preview／Docker／release readiness、身份驗證與持久化、可觀測性與備份，以及未來 tokenized payment／logistics／CMS／ERP integration planning。未開始任何 Phase 9 實作。

## 43. Phase 9-A 真人走查與真實素材驗證準備 — 2026-09-22

- 建立正式執行包 `docs/testing/phase-9a-older-user-and-content-validation-pack.md`：最終主持開場與中性提示、T1–T8 任務、字體／按鈕／導覽／商品理解／購物車／checkout／錯誤提示觀察、同意與停止規則、P0–P3 分級、完成條件與文件回填方式。
- 建立 `phase-9a-observation-template.md` 作為去識別化 session record；建立 `phase-9a-real-content-replacement-checklist.md`，逐項要求照片來源／授權／alt text、商品事實證據、文案 owner 與公開核准。
- 清楚列出目前 placeholder／synthetic data：商品照片準備中、合成商品／價格／供貨狀態、合成 checkout／payment boundary、Mock order receipt、合成 draft publish、local fulfillment 與 ERP references。這些在真實證據前不可冒充正式資料或交易結果。
- 新增 `phase-9a-preflight.mjs`；本機執行通過，僅檢查執行包文件與 marker，不啟動 server、不聯絡真人、不使用付費服務、不部署。
- Phase 9-A 目前狀態為「準備完成，真人走查與真實素材驗證尚未執行」。不得填寫假想成功率、可用性結論、參與者偏好或真實內容通過結果。
- 真人完成後只回填去識別化摘要：WHITEPAPER 記研究範圍與限制、HANDOFF 記 issue／commit／複測、CAPABILITY_MAP 只依直接證據更新 human-validation 與 real-content 狀態。

### Wave 1 implementation status — 2026-09-16

- Branch `feature/wave-1-reproducible-baseline` and draft PR #12 contain a clean Next.js 16.3.5 App Router baseline with Node 24.19.0, pnpm 11.19.0, strict TypeScript, Tailwind 4, shadcn conventions, Vitest/RTL contracts, a minimal health route, standalone non-root Dockerfile, and Chromium/WebKit plus axe checks.
- No candidate-template application code or assets, ERP, real authentication, real payment, real product data, or secrets were added. The lockfile was generated on a clean GitHub runner and the temporary bootstrap workflow was removed.
- The first Quality run exposed pnpm 11's ignored-build policy for `unrs-resolver`; the manifest now permits only that dependency's required build script. A fresh full Quality result is still pending.
- Local frozen-install and Docker checks remain `BLOCKED_EXTERNAL` by the restricted npm/GitHub TCP environment; clean-runner CI is authoritative for those gates.

### Wave 2 initial shell slice — 2026-09-20

- The project-owned homepage now has a semantic header, named primary navigation, responsive hero spacing, mist-green / warm-ivory / tea-brown tokens, visible focus treatment, and reduced-motion handling.
- Product catalog, cart, checkout, orders, payment, ERP, authentication, and real customer data remain intentionally absent.
- Local verification passed for frozen install, Vitest (2 files / 3 tests), ESLint, TypeScript, and production build. Playwright Chromium/WebKit browsers downloaded, but the six-test e2e run hung locally after browser launch and was stopped; e2e and Docker smoke remain unverified. ESLint is pinned to 9.39.1 because the planned 10.10.0 release is incompatible with the installed Next.js React lint plugin API.

## 44. Phase 9-A 真實商品素材匯入規格 — 2026-09-22

- 建立 `docs/testing/phase-9a-real-product-material-import-spec.md`，只定義真實商品素材的 JSON canonical shape、CSV header、欄位型別／空值規則、圖片格式／尺寸／授權／hash、檔案命名、排序、上下架與證據欄位。
- 規格涵蓋商品名稱、茶類、產地、年份、重量、價格、香氣、口感、回甘、沖泡建議、庫存、商品圖、排序與上下架狀態；未提供或未證實的值必須是 `null`，不得以 synthetic 值或模型推測代替。
- 圖片必須能追溯商品對應、來源、公開授權、alt text 與 SHA-256；未通過驗證時維持「商品照片準備中」placeholder。匯入一律先進受控 staging，失敗不覆蓋原 fixture。
- `harvest_year`、`weight_g`、`aftertaste`、完整 brewing、evidence、sort 等欄位目前只是匯入規格保留欄位；沒有修改現有 TypeScript domain、UI、資料庫或外部 adapter。
- 驗證流程已定義格式／型別／事實證據／圖片／安全／發布核准／TypeScript／lint／build／axe／Chromium／WebKit 與真人理解閘門。本次沒有填寫任何真實商品內容，也沒有替換 placeholder。
- 等待店家提供符合規格的資料包與證據後再進行審查；在此之前不匯入、不部署、不啟動付費服務。

## 45. Phase 9-A 商品資料匯入工具鏈 — 2026-09-22

- 建立空白 CSV／JSON 匯入模板與 placeholder／synthetic data 對照表；模板只有 canonical header 或空陣列，不包含任何真實或新增的商品內容。
- 新增 `scripts/phase-9a-product-import.mjs`：支援 CSV／JSON parsing、必要欄位／enum／型別檢查、缺漏、重複 `content_id`／`sort_order`、價格／重量格式、圖片檔名與 `content_id` 對應、圖片 metadata／SHA-256、可選圖片目錄存在性與 published evidence 檢查。
- 工具預設為 dry-run，輸出含 row／field／code／message 的清楚 JSON error report、warnings、accepted IDs 與 `wouldWrite: false`；`--apply` 明確拒絕，不會覆蓋既有 fixture、圖片或 placeholder。
- `phase-9a-product-import.test.ts` focused 5/5 通過；preflight 會檢查模板、對照表、工具與關鍵安全 marker。此工具鏈不接外部服務、不上傳圖片、不新增業務功能。
- 等待店家提供符合匯入規格的真實資料與證據後，才可另行審查 staging；目前 synthetic catalog 與 placeholder 完全不變。

## 46. Phase 10 ERP reuse & integration planning — 2026-09-22

- 建立 `docs/erp/phase-10-erp-reuse-integration-planning.md`，把目前 Catalog、Cart、Checkout、Payment、Logistics、Publishing、ERP boundary 對照 ERP 必要模組、功能歸屬、API contract、資料 mapping、同步方向與錯誤處理。
- 候選只做研究比較，不導入：ERPNext（首選 ERP fixture 候選）、Odoo、Dolibarr；Medusa、Saleor、Vendure 作為 headless commerce 技術基準。授權與商用適用性仍需依實際版本與部署方式正式審查。
- 明確分出 ERP 可直接沿用的商品／庫存／訂單／營運稽核能力、必須由 adapter 處理的 DTO／狀態／付款／物流／重試 mapping，以及網站保留的品牌內容、UX、SEO、真人驗證與發布閘門。
- 定義未來 server-side adapter 的 schema version、correlation ID、idempotency key、normalized error、retry／reconciliation 規則；不保存 raw payment credential，不讓 ERP provider field 洩漏到 UI。
- Phase 10 下一個最小候選為 10-B：只用 synthetic fixture 做 ERP-shaped payload mapping contract PoC；本次不啟動外部服務、不新增 service type、不接資料庫、付款、物流、ERP 或正式部署。

## 47. 手機 Demo 購物主線檢查點（2026-09-24）

- 商品加入成功後直接前往購物車，保留繼續購買與前往結帳；測試須檢查畫面導向，不能依賴商品頁轉場前的成功訊息。
- 目前仍是前端合成原型：固定訂單編號、無 OTP、無後端持久化或權限，不具備安全查單、店家營運處理與通知送達的條件。PR #15 中關於完整手機 Demo 的目標維持待實作，不能以現有 build 通過替代實機與流程驗收。

## 48. 手機驗證與合成訂單服務邊界（2026-09-24）

- 前台及 Mock Checkout 將台灣手機號碼做格式檢查與正規化；這只排除顯然錯誤的輸入，沒有發送或驗證 SMS OTP。
- 新增獨立的伺服端 Demo 訂單記憶體假服務契約：唯一不可猜的編號、高熵查單密鑰、只存茶品快照、模擬通知去重、包裝照片 metadata、模擬付款確認及出貨轉移。未暴露 API，未接入現有結帳或管理頁；沒有持久化、授權、真實照片或訊息送達，不能宣稱符合 PR #15 的手機 Demo 驗收門檻。

## 49. 手機購物與店家訂單的 local-only 閉環（2026-09-26）

- 將既有 SQLite 訂單、通知 outbox、合成 OTP、地址評估、店家 cookie、包裝照片與狀態機組成單一 local runtime；沒有新增第二套訂單模型。HTTP boundary 限制為明確啟用、非 production、loopback、同埠同源與受控 Next 內部 loopback headers。
- Demo checkout 以 feature flag 接入現有 `/checkout`，完成合成手機 OTP、聯絡資料、配送／地址與合成付款選項，再由服務端以 authoritative catalog 重算購物車。未啟用 flag 時，既有前台 prototype 行為不變。
- 查單必須同時持有不可猜 token、下單手機、手機後三碼與一次性 OTP；手機以摘要綁定訂單，不保存真實客戶資料。後三碼不能單獨當作驗證因素。
- 店家端使用與顧客 token 分離的高熵憑證及短效 HttpOnly cookie。付款僅為模擬確認；包裝照片寫入 Git 排除的私有本機目錄；`packed → shipped → delivered` 皆維持明確狀態門檻，包裝不等於出貨。
- Email／店家通知只進入可觀察、可失敗及重試的本機 outbox。手機推送只提供 `preview-only` DTO 與畫面預覽，沒有 service worker、provider、裝置註冊或送達宣稱。
- 會員名單仍延後；真實付款、物流、SMS、Email、Push、production、公開部署與正式資料均不在本階段。此結果只能稱為本機合成 Demo 閉環，不是 production readiness 或真人驗收。

## 50. 同一區域網路手機驗收準備（2026-09-26）

- 新增 `DEMO_COMMERCE_LAN=enabled` opt-in；僅允許 RFC1918 私有 IPv4、非 production、HTTP 同源請求，預設 loopback 模式仍不變。伺服器應綁定明確私有 IP，不使用 `0.0.0.0`，不修改 Windows 防火牆。
- LAN 驗收使用 `172.20.10.4:3013`（實際 IP 以當日 `ipconfig` 為準），手機與電腦需在同一可信私有網路。必要頁面為 `/`、`/cart`、`/checkout`、`/orders`、`/admin/orders`。
- 為相容純 HTTP 手機測試，LAN 店家 cookie 為 HttpOnly／SameSite=Strict 的合成 cookie，loopback 預設仍為 Secure `__Host-` cookie。此差異只允許假資料 Demo，不能複製到 production。
- 目前已啟動主機端 Demo 並完成可達性準備；真實手機由陳老師執行完整流程後，才可記錄真人／店家驗收結果。Pixel 7 Chromium 1/1 仍只代表自動化腳本證據。
- 已以同一 LAN URL `http://172.20.10.4:3013` 執行 Pixel 7 Chromium synthetic flow，1/1 通過；此為 LAN host/origin 的自動化證據，不替代真實手機或真人走查。
- 已以同一 LAN URL `http://172.20.10.4:3013` 執行 Pixel 7 Chromium synthetic flow，1/1 通過；此為 LAN host/origin 的自動化證據，不替代真實手機或真人走查。

## V. Real-phone acceptance repair — 2026-09-27

Wave 7 的修復只補本機 Demo 的資料與素材邊界：八款 2026-09-23 sample fixture、保留商品照片、首頁合成圖與鳥鳴 WAV 均可由 LAN server 讀取。音效改為明確點擊播放，不假設手機允許 autoplay。

管理端新增商品透過 guarded Catalog API 寫入被 Git 忽略的 `.demo-data`，重新整理或重啟後可讀回；UI 仍只依 Catalog／Cart／Publishing service boundary，不接 ERP、付款、物流、Email、SMS、Push 或外部 API。此資料夾與既有 synthetic data 均不提交。

本次證據為 Vitest 30 files／173 tests、TypeScript、ESLint（4 個既有 image warning）、webpack build，以及乾淨資料目錄上的 LAN Pixel 7 Chromium 2/2。真實手機與真人走查仍待執行，不能宣稱真人驗收或 production readiness。

## W. 第三輪真人驗收修正 — 2026-09-27

## X. 第四輪實際 UI 與完整商品流程修正 — 2026-09-27

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Homepage desktop/mobile candidate composite | ✅ browser-rendered candidate | `teacher-hero-desktop-candidate.png`／`teacher-hero-mobile-candidate.png` are generated from the existing portrait for layout validation; store approval and final source evidence are still pending |
| Homepage video removal | ✅ | No `<video>` is rendered; original MP4 remains in the repository only as preserved source material |
| Bird-call interaction | ✅ local UI | WAV remains an explicit controls-based click-to-play resource; no autoplay claim |
| Primary order lookup entry | ✅ | Desktop/mobile responsive header links to `/orders` |
| Checkout success boundary | ✅ local Demo | Independent `/checkout/success` shows order receipt/status and navigation; access secret is not rendered or placed in the lookup href |
| Existing eight-product admin list | ✅ local Demo | Same file-backed Demo Catalog as storefront; evidence screenshot shows eight initial products |
| Existing-product edit entry | ✅ local Demo | Bounded edit updates name/category/specification/price/inventory through guarded Catalog API; no ERP or database |
| Ninth-product publication sync | ✅ automated local Demo | Synthetic publish/reload/frontend visibility and unpublish/foreground hiding are covered; historical data is retained |
| Ninth-product image recognition/composition | ⚠️ explicit Mock | Workflow labels identify/compose as Mock; no actual vision or composition service is connected |
| Screenshot evidence | ✅ browser evidence | Stored under `docs/testing/evidence/fourth-round-2026-09-27/`; not real-phone or participant evidence |
| Physical phone / human acceptance | ⬜ pending | Final decision remains with Chen Tea Shop operator on a real phone |

The generated hero images are not a substitute for store-approved photography. The implementation intentionally keeps the approval boundary visible: generated layout candidates can validate UI composition, while final publication still requires the owner’s source, permission, identity, and copy confirmation. No payment, logistics, ERP, public deployment, or external notification service was added.

本輪只修正前台與本機 Demo 驗收阻塞：不再把 synthetic `tea-sample-composite.png` 當店家正式合成照；首頁在正式素材缺失時顯示待提供提示。原始人物照、影片及鳥鳴 WAV 維持，鳥鳴由使用者點擊播放。

購物車／checkout 已提供返回與取消路徑；Demo OTP 仍由服務端驗證，cooldown 重用有效 challenge，錯誤碼有明確提示。`/admin/products` 提供本機商品清單與上下架，publication 變更不刪資料，前台與 authoritative order boundary 同步拒絕下架商品。

第九種茶的素材處理以明確標示的 Mock pipeline 呈現原始、檢查、辨識／拆解、合成預覽、人工確認、儲存與上架狀態；沒有影像 AI、付款、簡訊、物流、ERP 或正式服務串接。原始檔目前只在瀏覽器草稿預覽，publish 會保存首張 catalog media；raw archive 與 derived manifest 仍是未完成項。LAN Pixel 7 Chromium 2/2 與 webpack build 通過，但不等同真人手機驗收；正式合成照與真人操作仍待店家提供／執行。

## 52. P0 Catalog data recovery diagnosis — 2026-09-27

- The active LAN server at `172.20.10.4:3013` returned HTTP 200 for `/api/demo/catalog?limit=50` with 8 published products. Its file-backed data directory contains those 8 published products and one pre-existing synthetic ninth draft; no catalog reset or fixture rebuild was performed.
- Storefront and `/admin/products` both consume the same guarded `/api/demo/catalog` endpoint and `getDemoCatalogStore()` file boundary. Current 360×800 browser evidence found all 8 storefront products and all 9 admin records, with no console, page, request, hydration, or API failures. The active server log also records 200 responses for both public and unpublished-inclusive catalog reads.
- The reported empty phone screen is therefore not reproduced as an application/data-loss failure in the verified process. The operational risk is stale server/worktree, wrong phone origin, disabled LAN/demo flags, or a different `DEMO_DATA_DIR`. `docs/testing/mobile-demo-local-runbook.md` now requires PID, explicit data-directory, API 200, and catalog-count checks before physical-phone use.
- This remains a local synthetic Demo boundary. The screenshots under `docs/testing/evidence/p0-catalog-recovery-2026-09-27/` are browser evidence only; real-phone acceptance is still pending. No payment, ERP, logistics, external notification, or production change was made.
- Verification note: focused Vitest 31 files／175 tests、TypeScript、ESLint 0 errors、Webpack production build and Chromium e2e 14/14 passed. WebKit locally reached 8/14 and hung in the managed Windows environment, so it was stopped and remains an environment limitation rather than a claimed pass. The P0 API and browser catalog checks themselves remained 200／clean.

## 53. 第五輪 P0 前後台閉環修正 — 2026-09-27

- Catalog mutation was verified against the single file-backed boundary: price `1500 → 1555 → 1500`, publication `published → draft → published`, public GET hid the draft, admin GET retained it, and the existing ninth product remained present after server restart.
- The active restarted LAN server returned HTTP 200. Public catalog total is 9 (original 8 plus synthetic `台灣野生紅茶`); admin-inclusive total is 10 because one synthetic ninth draft is retained. Both surfaces read the same `/api/demo/catalog` store.
- The checkout P0 root cause was an empty optional Email string serialized from the Demo UI. The server correctly rejects malformed non-empty email; the UI now removes blank optional Email before `placeOrder`, preserves non-empty Email, and retains OTP／address／server validation.
- Current LAN browser evidence completed homepage → product → cart → checkout → OTP → order → `/checkout/success`: order creation returned 200; the success page showed thanks, received order, status, home link, and explicit lookup link. It remains synthetic browser evidence and does not replace real-phone acceptance.
- P1 image processing remains blocked and explicitly unclaimed: no `raw-data/` source photos or OCR／vision／composition provider exists in this worktree. The available built-in image generation tool is not a tea-fact recognition system; no generated image was substituted for real material.
- Verification: Vitest 32 files／177 tests, TypeScript, Webpack build, ESLint 0 errors with 5 existing warnings, and Chromium 14/14. WebKit remains locally limited by the previously recorded hang／Avast environment constraint. No real payment, logistics, ERP, SMS, external notification, or production deployment was added.

## 54. 第五輪補充驗收 — 2026-09-27

- 以同一份 file-backed Demo Catalog 驗證第九種測試茶 `台灣野生紅茶`：價格 `888 → 999`、下架後公開 GET 隱藏、重新上架後恢復；重啟目前 Wave 7 3013 server 後仍為 `999`／`published`。這是本機合成資料證據，不是真人手機驗收。
- 首頁導覽新增固定 360×800 viewport regression：`訂單查詢` link 可見，且整個 bounding box 在 viewport 內。現行 3013 LAN 瀏覽器截圖顯示品牌導覽列實際包含「訂單查詢」；手機若仍看不到，需在實體機重新載入 `http://172.20.10.4:3013/` 並回傳截圖，以排除舊 server、瀏覽器快取或連到錯誤工作樹。
- 本輪未任意修改 CSS，因目前 Wave 7 版本已能重現並通過實際瀏覽器渲染；避免用無證據的版面變更掩蓋實體機環境問題。
- 第九種茶的完整「原圖上傳→實際影像辨識→資料提取→合成主圖」仍未完成；只有可替換、清楚標示的 Mock pipeline。缺少店家 raw-data、授權 OCR／vision／composition 工具與人工確認產物前，不可宣稱 PASS。

## 55. 2026-09-27 收尾修復

- 公開品牌決策以最新需求為準：「陳老師茶行」是唯一對外品牌；metadata、首頁 header、aria-label 與測試已同步。歷史設計規格與舊證據不回寫，避免改變歷史紀錄。
- Checkout success 的跨邊界修復：訂單 API 建立成功後，server route 從 query 取得 order id，直接交給 success component；只把查單所需 secret 留在同一瀏覽器 sessionStorage，不把 secret 放進 URL、DOM 或連結。這不是繞過 OTP，也沒有製造假成功。
- Catalog 與 admin fields 仍沿用單一 file-backed Demo Catalog；商品編輯新增 aroma、taste、teaRegion、summary 的受控欄位，分類以中文顯示。未接 ERP、資料庫、付款、物流或外部服務。
- 真實影像辨識／資訊提取／主體合成仍是 BLOCKED，而非 prototype PASS。需要店家原始照片、授權、可調用的 OCR／vision／image-processing 工具、輸出 schema 與人工確認流程。
- 明日驗收邊界：先用同一 3013 URL 在實體手機重跑首頁查單入口與購物→OTP→建立訂單→感謝頁；自動化瀏覽器只能作工程證據，不能取代真人手機結果。

## 56. 後台商品管理簡化決策 — 2026-09-27

- 產品策略正式取消網站內建影像辨識、資訊自動提取、主體拆解、圖片合成、Mock 辨識與假進度流程；店家可在外部完成照片處理後再上傳。這是範圍決策，不是待修復的 P1 blocker。
- 新增／編輯商品共用 `ProductFields` 與 `minimumProblems`，欄位順序固定為茶名、規格、價格、茶類、庫存、香氣、口感、產地、商品介紹；新增為空白表單，編輯從同一 Catalog Store 載入。
- `/admin/products` 的清單、編輯、上下架與 `/admin/products/new` 的新增均透過 `/api/demo/catalog`；不建立第二份前台商品陣列。Catalog Store 的 file-backed persistence、歷史訂單保留與既有八種茶不變。
- `PublishingService` contract 不再包含 `generateSummary`，service adapter 只負責驗證、保存與發布店家已確認的資料。
- 驗證結果：Vitest 35 files／176 tests、TypeScript、ESLint（0 errors／5 個既有 warning）與 Webpack production build 通過；未啟動正式服務，真人手機仍需另行驗收。

## 57. 2026-09-27 真人手機完整購物查單與按鈕視覺驗收

- 游老師手機使用同一 3013 LAN Demo 建立新合成訂單：結帳三步（姓名與合成 OTP、配送資料、總額確認）、感謝購買與訂單編號、主動查看訂單均依序通過。查單自動帶入同分頁憑證、顧客 Yu 和手機末三碼 000；再次取得本機 OTP 後成功查到「訂單成立／待模擬付款確認」。此為使用者提供截圖的真人手機驗收，不只是自動化測試。
- 同分頁憑證不放入 URL／DOM；缺少憑證時先停用取得 OTP。姓名及手機末三碼不能取代查單憑證，也未完成失憑證補發機制。
- 查單頁頂端固定有返回首頁，成功結果卡片底部也增設返回首頁，以免使用者捲到下方看不到出口。全站共用按鈕已改深綠色實心、白色粗體字，保留焦點、選中及停用視覺差異；游老師手機回饋「舒服多了」。底部新增入口通過程式測試，但尚待真人另行點擊確認。
- 實際 Email／手機推送、金流及物流均未接入；queued／preview-only 為合成通知。內建影像辨識與合成依第 56 節決策取消，圖片由外部處理後上傳。紅色 Next.js 開發 Issues 尚未取得完整詳細錯誤，不宣稱已修復。
- 主要提交：9b6de1f、b93fe0f、cd3d447、2870803。最後修正 focused Vitest 3 files／6 tests 及 TypeScript 通過。下一輪檢查 dev Issues、資料目錄及導覽，逐步測店家包裝／出貨與顧客狀態；勿要求重做已通過的顧客新訂單。

## 2026-09-28 查單導覽安全補強（待實機驗收）
- 成功頁若缺少同分頁 sessionStorage 查單憑證，顯示補填及聯絡店家說明，入口改為「前往安全的訂單查詢」；不將秘密放入 URL、公開 DOM 或 localStorage，也不繞過 OTP、姓名、末三碼與限流。
- 查單錯誤提供明確重試、成功後可查另一筆；結帳離開導覽加強深色按鈕及手機寬度排列。只改 UI／提示及其測試，沒有清理 Demo 資料。
- 先前 Codex 執行 Vitest 遇 spawn EPERM；重新以現有 vitest.cmd 啟動後完成 41 files / 196 tests，TypeScript 與 focused ESLint 均通過，git diff --check 通過。新分頁缺憑證的提示與安全查單入口已增加回歸斷言。
- edea 3013 LAN dev server 已恢復並讀到既有 catalog 8 件 published；沿用 .demo-data/lan-demo-third-round-final-2，不重建 catalog、orders 或 outbox；非正式對外部署。
- 待游老師實體手機確認：同分頁下單查詢、新分頁缺憑證復原、查詢另一筆、返回首頁、店家包裝及出貨。正式付款、簡訊、Email/Web Push、ERP 仍未啟用。
- AGENTS.md 和 next-env.d.ts 是進場前未提交的環境變更，本階段不修改、不 stage、不 commit。


## 58. 2026-09-28 查單憑證遺失時的 Demo 店家人工補發

- 原始查單密語僅存雜湊，無法找回明文；採單筆隨機密語輪替，舊密語失效、持久化失敗回滾，不變更訂單狀態與通知。
- 補發只接受通過現有 HttpOnly 店家 session 驗證且明確勾選「已透過店外方式確認顧客身分」的操作。密語只在當次授權 API 回應／店家介面顯示，禁止 URL、public list、日誌、localStorage 或通知；回應 Cache-Control: no-store。顧客後續仍須完整身份資料、密語及 OTP。
- 這是合成資料／LAN Demo；正式上線前須另設可稽核的核身、交付方式、權限、撤銷/重放與資安審核，不能直接沿用勾選框作為真實身分驗證。
- 2026-09-28 程式驗證：41 files / 205 tests、tsc passed；實機補發與顧客已出貨同步仍待驗收。原有茶行資料未重建。

## 59. 2026-09-28 訂單進度燈號
- 顧客與店家共用唯讀五階段進度燈號，完成綠色／未完成紅色，另有明確文字與無障礙標籤。以後端狀態及包裝照片為準；本機 Demo 不代表真實付款、物流或通知送達。顧客須先通過既有密語、OTP。全套 42 files / 208 tests 通過，實機視覺驗收待確認。

## 60. 2026-09-30 Wave 7 shopping quality gate / issue #17

The storefront payment boundary is explicitly traditional and manual: bank transfer, cash, phone confirmation, or LINE voice confirmation. Credit-card and LINE Pay integration are outside the confirmed product scope. Every synthetic order begins in `pending-manual-verification`; an authenticated merchant explicitly moves it to `manual-confirmed` before shipment, while `packed`, `shipped`, and `delivered` remain distinct states.

The mobile demo path is product → cart → three-step checkout → thank-you page → secure order lookup. The selected traditional payment method is persisted in the local synthetic order record and shown on lookup. File-backed image replacement remains the single catalog boundary and is covered by persistence tests. Navigation links used as primary mobile exits use dark, high-contrast controls.

This remains a local synthetic Demo. No AI image composition, image-recognition provider, ERP expansion, external payment service, real notification service, or production deployment was added. TypeScript, focused lint, and diff checks passed for this change; Vitest/build environment failures are documented in `HANDOFF.md` and are not represented as product passes.

## 61. 2026-09-30 私人雲端手機測試版（尚未部署）

- 為兩台電腦關機時仍可測試，新增明確啟用且隔離的 Render 雲端 Demo 模式：HTTPS 固定來源、私人預覽 Basic 登入、獨立店家憑證與 Secure/HttpOnly cookie；所有 Demo API 另行驗證權限及來源。商品管理與未發布商品須店家登入。
- 程式提交55c5c34通過完整 Quality run36669259766：232單元測試、32瀏覽器測試、2合成手機測試、雲端正式建置/API完整訂單流程/手機尺寸瀏覽器流程、Docker建置與健康檢查。匯款訂單仍先待人工確認，再由店家確認、包裝、出貨、送達與安全查單。這些均為合成自動化證據。
- 生產依賴稽核無已知漏洞；整體稽核仍有2項開發依賴中度問題，未宣稱全部依賴無漏洞。
- Render插件已連線並確認工作區，但建立免費測試站時回報私人GitHub倉庫無法讀取，目前無服務、無可交付測試網址。需先完成Render的GitHub部署授權並允許cheng-tea-shop，再重試部署及檢查實際HTTPS。
- 雲端預覽資料會隨重啟或部署消失，只供合成測試；沒有真實付款、物流或通知。未合併main、未正式上線。**新匯款流程仍未經游老師親自測試，人工驗收待完成。**

### 第61節更新：免費私人雲端預覽已上線

- 使用者確認GitHub部署憑證及Render app授權後，建立免費新加坡測試站 https://cheng-tea-private-preview.onrender.com 。部署dep-dau9s7hsrm7s73bd3jp0已LIVE，版本efd047f（程式與通過CI的55c5c34相同，其後只有文件更新），自動部署關閉。
- 實際HTTPS驗證通過：健康檢查、私人頁面/API/圖片保護、登入後首頁、安全來源限制、店家Secure cookie、合成匯款訂單→人工付款確認→包裝照片→出貨→送達→OTP與密語安全查單。這解除前述倉庫存取阻塞。
- 測試站獨立於兩台個人電腦；登入憑證不存Git、不放URL。資料仍為可隨重啟消失的合成測試資料，沒有真實金流或通知。
- **游老師的新匯款流程真人手機驗收仍未完成。** 未合併main、未正式上線。

## 62. Issue #24：手機登入與短訂單編號
顧客顯示 YYMMDD-NNN 短編號並可一鍵複製；內部 UUID 與安全憑證保留。SQLite 以唯一約束和原子每日序號產生編號，舊訂單以非破壞方式補編號。查詢仍須原有安全憑證、姓名、手機末三碼與一次性驗證。
商家介面移除工程憑證輸入，改用本人確認後綁定的手機與六位數驗證碼。驗證碼五分鐘有效、單次使用、限制重試與重送；工作階段使用安全 Cookie，綁定設定變動後舊登入失效。目前僅模擬簡訊，碼由受保護的操作員收件匣交付；真實 SMS 串接與陳老師首次授權待完成。
為避免原 Render /tmp 訂單在部署時消失，新版本使用獨立免費測試站；原站、原訂單與設定不變動。新站可重建 Yu NT$800 合成展示訂單，但不是原站备份。免費儲存仍會隨重啟消失，不能宣稱已具備正式持久化。

## 63. 首次商家綁定與真實簡訊（2026-10-01）

游老師已驗收短編號 261001-001 建立與查詢。首次綁定由已授權 Render 工作區管理員協助陳老師本人確認同意，受限紀錄保留操作者／時間／方式／手機末三碼；預覽共用帳密不具有綁定權限。本人自行輸入收到的驗證碼，管理員不得代收或代填。
真實 SMS 採獨立 Twilio Messages adapter，固定 HTTPS 端點、逾時限制、無 redirect；程式介面不回傳 OTP，真實模式不提供模擬收件匣。本人確認與供應商設定未完成時維持拒絕登入。
部署資料保護：現站 free /tmp 已含驗收訂單，不重部署／改環境直到完整資料備份與還原驗證完成。重建種子不代替原始訂單。操作詳見 docs/merchant-first-binding.md。

## 64. Demo 認證 Provider 與隔離驗收（2026-10-01）

最新決策：Demo 暫停手機綁定／簡訊作為登入前置。商家以單一密碼欄位登入；DemoPasswordProvider 與保留的 SmsOtpProvider 使用一致簽名商家工作階段，下游訂單／付款／包裝照片／出貨／送達 API 不依賴登入方式。正式站禁止簡易密碼 Provider。
密碼僅配置於 Render 私密環境變數，獨立於 Cookie 簽名金鑰與站點存取憑證；驗證具節流、錯誤次數限制與鎖定，使用 HttpOnly／Secure／SameSite=Strict Cookie。切換 Provider 或撤銷設定使舊工作階段失效。
原 issue24 測試站已含 261001-001、261001-002，無完整備份途徑前不變更其部署或環境。另建 cheng-tea-password-demo 隔離驗收站，使用獨立資料目錄與憑證；新站從新資料開始，不宣稱既有訂單已遷移。新 free 站資料也屬暫存，不作正式營運儲存。

## 65. 現成 Passkey 模組沙盒驗證（2026-10-01）

最新策略停止擴寫自行開發認證，採維護中的 Better Auth 與官方 @better-auth/passkey 1.7.6。先在 sandboxes/passkey-lock 獨立 Next.js 應用、套件安裝與資料庫測試，驗證成功後才透過既有 AuthProvider 對接，不修改訂單／付款／照片／出貨 API。獨立 Demo 密碼 Provider 保留作備援，實際密碼只由私密環境注入。
供應商 native handler/client 負責 WebAuthn 驗證及 Session；受驗證 Session 與店家權限分開，沙盒帳號不自動取得茶行店家權限。虛擬驗證器測試不等於手機 Face ID／指紋通過，實機驗收需另列結果。
