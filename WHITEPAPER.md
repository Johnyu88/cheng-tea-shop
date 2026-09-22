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

### Wave 1 implementation status — 2026-09-16

- Branch `feature/wave-1-reproducible-baseline` and draft PR #12 contain a clean Next.js 16.3.5 App Router baseline with Node 24.19.0, pnpm 11.19.0, strict TypeScript, Tailwind 4, shadcn conventions, Vitest/RTL contracts, a minimal health route, standalone non-root Dockerfile, and Chromium/WebKit plus axe checks.
- No candidate-template application code or assets, ERP, real authentication, real payment, real product data, or secrets were added. The lockfile was generated on a clean GitHub runner and the temporary bootstrap workflow was removed.
- The first Quality run exposed pnpm 11's ignored-build policy for `unrs-resolver`; the manifest now permits only that dependency's required build script. A fresh full Quality result is still pending.
- Local frozen-install and Docker checks remain `BLOCKED_EXTERNAL` by the restricted npm/GitHub TCP environment; clean-runner CI is authoritative for those gates.

### Wave 2 initial shell slice — 2026-09-20

- The project-owned homepage now has a semantic header, named primary navigation, responsive hero spacing, mist-green / warm-ivory / tea-brown tokens, visible focus treatment, and reduced-motion handling.
- Product catalog, cart, checkout, orders, payment, ERP, authentication, and real customer data remain intentionally absent.
- Local verification passed for frozen install, Vitest (2 files / 3 tests), ESLint, TypeScript, and production build. Playwright Chromium/WebKit browsers downloaded, but the six-test e2e run hung locally after browser launch and was stopped; e2e and Docker smoke remain unverified. ESLint is pinned to 9.39.1 because the planned 10.10.0 release is incompatible with the installed Next.js React lint plugin API.

## 46. Phase 10 ERP reuse & integration planning — 2026-09-23

- 新增 `docs/erp/phase-10-erp-reuse-integration-planning.md`，整理 Catalog、Cart、Checkout、Payment、Logistics、Publishing、ERP boundary 的 ERP 必要能力、模組、候選、API contract、資料 mapping、同步與錯誤處理。
- 候選僅做比較：ERPNext 為首個 fixture mapping 候選，Odoo／Dolibarr 為 ERP 備選，Medusa／Saleor／Vendure 為 headless commerce 基準；沒有最終導入或授權結論。
- 下一個最小候選是 10-B：只用 synthetic fixture 做 ERP-shaped payload mapping contract PoC；本次不啟動外部服務、不新增 service type、不接資料庫、付款、物流或正式部署。

- Phase 10 選型補充：ERPNext 為 ERP reuse 首選，Vendure 為 TypeScript／headless commerce integration 首選，Dolibarr 為小型 SMB ERP 保守替代；Odoo 因外部 API 方案與 edition／授權限制暫列比較候選，Medusa 為 commerce 基準。
- 比較表已補記技術棧、授權、最近更新、商品／庫存／訂單／顧客、API、Docker、修改難度與 boundary 相容性。上游 activity 以 2026-09-23 官方 GitHub 快照為準；商用授權仍需正式法律審查。
- 只規劃兩個最小 PoC：ERPNext-shaped 與 Vendure-shaped 的 Catalog／Inventory／Order mapping。兩者只使用 synthetic fixture，不接 Payment、Logistics、正式資料庫、正式部署或外部 secrets。

## 47. Phase 10-B minimal mapping PoC — 2026-09-23

- 新增 `lib/domain/erp-mapping-poc.ts`、synthetic fixtures 與 `tests/phase-10b-erp-mapping.test.ts`。ERPNext-shaped 與 Vendure-shaped adapter 都把 Product／variant、Inventory quantity、Order status、Customer reference 轉為同一組 project-owned DTO。
- 驗證包含 DTO translation、`erp-mapping-invalid` 統一錯誤、adapter swapping 與 provider payload 不洩漏到 consumer；未修改 UI，未接真實 ERP、付款、物流、資料庫或外部 API。
- 結論：Vendure mapping 最少、最容易接目前 TypeScript 前台；ERPNext 客製欄位最多，但 ERP 直接沿用能力最廣。兩者都仍需要自有 adapter 處理 freshness、idempotency、retry、reconciliation、安全與內容 sidecar。
- 驗證結果：focused 4/4；完整 Vitest 16 files／100 tests；TypeScript 通過；Webpack production build 通過；ESLint 0 errors，保留既有一項 `<img>` warning。
- Phase 10-B 僅為 mapping PoC，不決定正式導入；正式導入前仍需確認授權／商用義務、版本與 SBOM、Docker／資料庫 backup／restore、secret rotation、網路隔離、API 限流、稽核與 rollback。

## 48. Phase 10-C ERPNext physical environment verification — 2026-09-23

- 實施前置檢查：Docker CLI／daemon 不存在；Windows memory query 被拒絕；C: 約有 3.79 TB free，但不足以判定 Docker 資源足夠。`next-env.d.ts` 既有未提交變更保持原狀。
- 依官方 `frappe/frappe_docker` 的 `pwd.yml` disposable demo 路徑，實體 ERPNext 驗證被標記 `BLOCKED_EXTERNAL`；未安裝 Docker、未啟動 ERPNext、未修改系統安全設定、未開放公開網路。
- 已記錄日後只用 synthetic data 的商品／規格、庫存、訂單／狀態、API 認證與 DTO mapping 驗證步驟，以及無 Docker 時沿用 Phase 10-B fixture contract 的替代方案。
- 實體測試執行數為 0/4；因此沒有任何真實 ERP API、權限、資料庫 constraint、庫存 reservation 或 order transaction 結果可宣稱。
