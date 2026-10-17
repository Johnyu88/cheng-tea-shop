# Phase 9-A Placeholder／Synthetic data 對照表

本表是現況 inventory，不是可直接匯入的商品資料；真實資料到達前不得用它填補匯入檔。

| 現況項目 | 目前呈現／來源 | 真實資料到達前的規則 | 替換證據 |
|---|---|---|---|
| 商品名稱、茶類、口感 | deterministic Mock catalog | 保留 synthetic；不可對外宣稱店家正式商品 | 店家核准資料與真人理解驗證 |
| 價格、重量、規格 | synthetic integer TWD／prototype specification | 不視為正式價格或包裝規格 | 店家核准價目／包裝證據 |
| 產地、年份、香氣、口感、回甘 | optional facts／synthetic copy | 缺證據保持 null 或不顯示 | 店家事實來源與 reviewer |
| 沖泡建議 | 未完整支援的保留欄位 | 不自行補寫 | 店家核准沖泡資料 |
| 庫存 | Mock available／sold-out | 不視為即時庫存 | 店家或核准庫存來源 |
| 商品照片 | 「商品照片準備中」branded placeholder | 不借用另一商品圖，不暗示產地 | 商品對應、授權、alt、SHA-256 |
| 排序 | fixture／prototype 順序 | 不視為店家正式排序 | 店家展示排序核准 |
| 上下架狀態 | draft／published prototype | synthetic publish 不代表正式上架 | 店家核准與發布紀錄 |
| checkout／付款 | synthetic prototype boundary | 不送出真實付款、不保存付款資料 | 不允許用匯入工具改變 |
| order／物流／ERP reference | local fake／Mock reference | 不視為真實訂單、配送或同步 | 外部整合不在本工具鏈 |
