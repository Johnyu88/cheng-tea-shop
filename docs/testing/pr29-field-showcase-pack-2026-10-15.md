# 陳老師茶行 PR #29｜10/14 切換與 10/15 現場展示包

更新基準：2026-10-12（台灣時間）。本文件是現場交付索引與執行稿；現場資料尚待陳老師確認，任何候選茶品、照片、價格與庫存都不是已核准的正式商品資料。

## 目前恢復狀態

- PR #29：open / draft / 未合併；本次文件編製基準 HEAD `364d47c77d2e5f2bea8b19cf516b63fa6d81796b`。候選程式版本 `f3fefc1`。
- Quality #156（run `38229526027`）已完成：lint、typecheck、unit/component、production build、browser/accessibility、synthetic mobile E2E、private demo/order smoke、container build/health 均通過；production audit 通過。完整 dependency audit 唯一失敗為開發依賴路徑中的 `braces@3.0.3` High，因此 Quality 整體為 failure，不能稱完整 audit 通過。
- 8095 新版候選 `tea-nextjs-pr29-session-rev` / `tea-nextjs-staging:pr29-session-rev-f3fefc1` running；8092 舊版備援 `tea-nextjs-pr29-8443-accept` / `tea-nextjs-staging:pr29-8443-3bc3283` running。兩者既有健康與 Session 驗收沿用 HANDOFF 證據，不重跑整套測試。
- Tailscale Serve tailnet-only：443 → 127.0.0.1:8090，8443 → 127.0.0.1:8092；Funnel off。本次未切換。
- 五日監測至 2026-10-16，仍 IN PROGRESS。2026-10-12 17:29 台灣時間檢查時，三個監測程序存活，原始三份 JSONL 仍持續增加。不可把監測中標為完成。
- 8095 Passkey enabled、RP ID 為 `acer-v5.tail4d8b5a.ts.net`；新資料目錄沒有已註冊 Passkey。新版註冊與真機登出重登入尚未完成。
- ORDER-03 實機驗收尚未完成。完整 dependency audit 的 braces High 僅限 Acer 私有展示環境有條件接受；任何新增 audit finding 都是停止切換條件。

## A. 10/14（三）切換檢查表

**現在不可切換。** 只在 10/14 部署驗收時按序執行。每項在工作紀錄留下時間、結果及遮蔽機密後的證據；不可記錄密碼、Token、Cookie、銀行資料。

| 順序 | 檢查／動作 | 通過標準與證據 | 停止條件 |
|---|---|---|---|
| 1 | 確認 PR、分支與 Quality 最新狀態 | PR 仍 open/draft/unmerged；確認最新 HEAD 和 Quality run/job。程式、E2E、容器 smoke、production audit 皆通過；唯一可接受的 Quality 紅燈仍是已核准的 braces High。記下 SHA/run URL。 | 任一新測試或容器失敗、Quality 還未完成、出現 braces 以外 audit finding，停止。 |
| 2 | 檢查候選與備援容器 | 8095 為 f3fefc1 候選、8092 為 3bc3283 舊版；兩者 running，健康端點 200，映像和埠與本文件相符。保存唯讀檢查輸出。 | 任一容器不在、映像不符、健康非 200，停止。不得重建或替換。 |
| 3 | 檢查登入、Origin 與 Passkey 前置條件 | 沿用 8095 已通過的 Basic Auth、商家登入、Session/Cookie、Host/Origin/CSRF 負向、SQLite 撤銷證據；確認正確 Origin 為 `https://acer-v5.tail4d8b5a.ts.net:8443`。Passkey enabled、RP ID 不帶埠且符合 hostname。新站 Passkey 尚未註冊，舊站 Passkey 不會移轉。 | 設定值/Origin/RP ID 不符或登入安全證據有異常，停止。若 Passkey 登錄未完成，只能把它標為待驗證並用已備妥的密碼登入備援；不得冒稱 Passkey 已可用。 |
| 4 | 確認資料隔離 | 確認 8095 可寫資料目錄與 8092、AUTH-02 不同；檢查商品與訂單只讀摘要。切換後測試訂單需明確標示 synthetic。 | 發現共用路徑、資料不明或需要覆蓋/搬移資料，停止。 |
| 5 | 保存 Serve 與監測基準 | 記錄 Tailscale Serve status：tailnet-only 443→8090、8443→8092、Funnel off。記錄監測程序與三份 JSONL 最新時間/大小；日誌保留原檔。 | Serve 基準不符、443 目標不同、Funnel 開啟、監測停擺/日誌不再更新，停止。 |
| 6 | 執行唯一映射變更 | 前 1–5 全通過後，只在 10/14 將 8443 改到 8095：`tailscale serve --https=8443 http://127.0.0.1:8095`。記錄執行時間與變更前後 Serve status。 | 命令結果不明或顯示會改動 443/其他服務時，不要繼續；立即核實，必要時只回退 8443。 |
| 7 | 從 tailnet HTTPS 驗收 | 瀏覽器開 `https://acer-v5.tail4d8b5a.ts.net:8443`。驗首頁、/install、三入口、Basic Auth、商家登入、商品管理、建立一筆合成訂單、訂單管理、登出/撤銷 Cookie。每一項記錄 HTTP/畫面結果。 | 首頁或管理登入失敗、受保護 API 不符、負向安全檢查放行、資料混用、443 被改動，立即執行下方回退。 |
| 8 | 確認展示備援與監測 | 確認 443→8090 不變、8092 舊容器仍 running、兩個候選及資料保留、監測日誌繼續增加。 | 任一關鍵條件失敗，回退並記錄結果。 |

### 失敗回退

只將 8443 回指舊版：

```powershell
tailscale serve --https=8443 http://127.0.0.1:8092
tailscale serve status
```

通過標準：tailnet-only 8443→8092、443→8090，外部 URL 回到 3bc3283 舊版；8095、8092、AUTH-02、Caddy、所有資料與監測均保留。不要關閉容器、搬資料、刪除日誌或啟用 Funnel。回退後記錄時間、狀態碼與簡短原因。

## B. 10/15（四）現場展示操作包

只用合成顧客/電話/訂單資料，不使用真實客戶資料；使用前先確認 8443 實際指向映像版本。

1. **前台商品**：打開 storefront，挑選一項已確認可展示的商品，口頭說明商品名稱、規格與標價；未經陳老師核定的茶品只當樣品資料展示，不對外承諾。
2. **購物車**：加入商品，檢查品項、數量、小計及運費提示，進入結帳。
3. **下單**：使用明確標記為「展示測試」的合成資料建立訂單；記下測試訂單編號，不輸入真實客人個資。
4. **商家登入**：完成 preview Basic Auth，再用候選站商家密碼登入。若新版 Passkey 已在 iPhone/Samsung 完成註冊，可再展示 Passkey；否則清楚標示尚未完成，不假設舊站 Passkey 可沿用。
5. **訂單確認付款**：在商家訂單頁確認剛建立的合成訂單。演示付款狀態操作時明確說明是測試資料，不代表實際入帳；不可使用真實匯款或顧客交易。
6. **包裝拍照**：使用測試包裝/素材拍照或選圖，先預覽再確認；只寫入候選站的展示資料。
7. **出貨**：演示出貨資料/狀態操作；若現場沒有實際交寄，不宣稱已交給物流或已送達。
8. **顧客查單**：以合成訂單的測試資料完成查單流程，確認訂單狀態可見。展示後不刪改原始 Acer 資料、不清空候選資料。
9. **ORDER-03 界線**：ORDER-03 仍未完成實機驗收。如現場另外測試，逐項記錄異常、攔件、更正與顧客提醒證據；未實際完成端到端驗收前，不得標 PASS。

ORDER-01 撤銷付款與 ORDER-02 重新開啟包裝已完成主要 iPhone 真機驗收，不重做已通過驗收。

## C. 正式茶品與商家資料確認清單

`data/tea-samples-2026-09-23.json` 保存的是 9/23 樣品與手寫資料整理；其明文政策指出樣品未確認前不連結網站商品。下列八筆名稱/數值只是來源檔中的候選提示，不是核准價、庫存或上架資料；現場逐項由陳老師確認並記錄確認人/日期。

| # | 來源候選名稱 | 檔案中的候選規格／價格／庫存 | 照片候選 | 現場核對 |
|---|---|---|---|---|
| 1 | 台灣蜜香野生山茶 | 1兩 / NT$800 / 160包 | IMG_9600(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 照片/授權 |
| 2 | 台灣佛手茶 | 1兩 / NT$1,100 / 160包 | IMG_9602(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 照片/授權 |
| 3 | 烏龍綠茶 | 1兩 / NT$450 / 160包 | IMG_9604(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 照片/授權 |
| 4 | 武夷玫瑰紅茶 | 1兩 / NT$900 / 160包 | IMG_9605(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 照片/授權 |
| 5 | 午時金萱黃茶（候選） | 1兩 / NT$800 / 160包 | IMG_9606(1).jpeg | [ ] 與「金萱黃茶」是否同品 [ ] 核對照片 |
| 6 | 白毛猴（候選） | 1兩 / NT$500 / 160包 | IMG_9607(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 核對照片 |
| 7 | 大葉烏龍蜜香紅茶（候選） | 1兩 / NT$980 / 160包 | IMG_9608(1).jpeg | [ ] 名稱/規格 [ ] 價格 [ ] 庫存 [ ] 核對照片 |
| 8 | 藥香老烏龍（候選） | 1兩 / NT$1,000 / 160包 | IMG_9609(1).jpeg | [ ] 與「老茶／老烏龍類」是否同品 [ ] 核對照片 |
| 9 | 黑茶：名稱待陳老師確認 | 未提供 | 未提供 | [ ] 正式名稱 [ ] 規格 [ ] 價格 [ ] 庫存 [ ] 照片 |
| 10 | 特殊茶：名稱待陳老師確認 | 未提供 | 未提供 | [ ] 正式名稱 [ ] 規格 [ ] 價格 [ ] 庫存 [ ] 照片 |

照片對照有衝突風險：分類清單把「金萱黃茶」與「老茶／老烏龍類」列為未拍照候選；圖片索引又將 IMG_9606/9607、IMG_9608/9609 作候選映射，可能與上表樣品名稱互相重疊。現場須實物/包裝逐張核對，不得按檔名推定正式對照。9 張提供照片中 IMG_9610(1).jpeg 是分類參考，不是商品照。確認來源、攝影/使用授權與正式照片後再建立正式商品對照。

另請逐欄確認並留在商家核准的安全位置（勿把機密值寫入 GitHub）：

- [ ] 銀行名稱/分行、戶名、帳號、匯款備註與公開展示授權
- [ ] 對外聯絡電話與公開授權
- [ ] 正式 LINE 帳號、可掃描 QR 原檔與手機掃碼驗證
- [ ] 宅配/其他運費金額、偏遠/離島規則、免運門檻及例外
- [ ] 現金/匯款人工確認方式；不要把測試付款當實際入帳
- [ ] 十品最終主表：品名、分類、產區/來源、規格、單位、現價、可售庫存、上下架狀態、照片與描述由陳老師逐項簽認

## D. Samsung 三入口安裝備案

切換後預期使用的 tailnet HTTPS origin：

- 前台：`https://acer-v5.tail4d8b5a.ts.net:8443/?pwa=storefront`
- 商品管理：`https://acer-v5.tail4d8b5a.ts.net:8443/admin/products?pwa=products`
- 訂單管理：`https://acer-v5.tail4d8b5a.ts.net:8443/admin/orders?pwa=orders`
- 安裝說明：`https://acer-v5.tail4d8b5a.ts.net:8443/install`

候選站已有三個不同 manifest/start URL（storefront、products、orders），但 Samsung Android/Chrome 真機尚未驗證能在同一個 origin 建立三個獨立安裝式 PWA，因此不保證三個都會出現「安裝應用程式」。

Samsung 手機操作：

1. 開啟 Tailscale，登入核准的 tailnet 並確認已連線。
2. 用 Android Chrome 開 `/install`，再逐一開前台、商品管理、訂單管理網址。
3. 若 Chrome 顯示「安裝應用程式」，逐一安裝；每次安裝後開啟圖示，確認起始頁是對應入口。
4. 若只顯示「加到主畫面」，或三個 manifest 有任何一個不能獨立安裝，建立三個主畫面捷徑作備案：在各自入口開 Chrome 選單 →「加到主畫面」→ 分別命名「茶行前台」「茶行商品」「茶行訂單」。逐一點開，確認路由正確；這是捷徑，不宣稱為三個獨立 PWA。
5. 商家管理入口依序完成 Basic Auth 與商家登入。新版 Passkey 尚未註冊：如需驗收，從新版管理介面註冊至 Samsung/Android Credential Manager，使用裝置螢幕鎖，登出後重新登入；記錄裝置型號、Android/Chrome 版本與結果。不可把 iPhone Face ID 結果當 Samsung PASS。
6. 若登入/Passkey 未完成，用商家密碼示範已可用的部分並記錄 Passkey 待驗，不更改密碼。

## E. 剩餘工作與風險

- [ ] ORDER-03 出貨異常、攔件、更正與顧客端提示：仍待實機端到端驗收；CI 合成覆蓋不等於真機 PASS。
- [ ] 新版 Passkey 註冊、登出後重新登入：8095 fresh data 尚無 Passkey；舊註冊不移轉。
- [ ] 完整 dependency audit：High `braces@3.0.3` 未解除，僅限 Acer 私有展示條件接受；Quality #156 仍為 failure；production audit pass。不得略過或標稱 audit clean。
- [ ] 五日監測：仍進行中，完成日 2026-10-16；保留原始日誌，完成後再做收尾標記。
- [ ] 十種正式茶品/照片授權/價格/庫存及商家匯款、電話、LINE、運費政策：均待陳老師逐項核准。
- [ ] 本次未切換；10/14 若閘門不全通過，保留 8443→8092 備援，不延伸為正式上雲或合併 main。

## 交接文件索引

- 本現場包：`docs/testing/pr29-field-showcase-pack-2026-10-15.md`
- 驗收矩陣、歷史證據及先前切換紀錄：`docs/testing/pr29-integration-closeout-2026-10-12.md`
- 當前交接入口：`HANDOFF.md`
- PR #29：`https://github.com/Johnyu88/cheng-tea-shop/pull/29`

只記錄已確認證據。若文件和現場狀態不一致，以 10/14 當天只讀取得的 Acer/Serve/CI 證據為準。
