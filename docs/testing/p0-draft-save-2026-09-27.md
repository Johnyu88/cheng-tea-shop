# P0 草稿儲存與返回入口修復（2026-09-27）

## 使用者實機發現
新增商品按儲存後沒有清楚的成功確認、返回商品管理或取消新增入口。
根因是 Demo PublishingService.saveDraft 僅做記憶體內資料驗證，沒有寫入 file-backed Catalog。

## 本次修正
- 現有 Demo Catalog POST 明確支援 publication=draft；預設公開流程保持原樣。
- 使用原本 serialized + atomic rename 的 Catalog Store 儲存新草稿，照片仍走原有媒體儲存路徑。
- 成功後顯示「儲存成功／尚未上架」、返回商品管理及繼續新增商品，移除重複儲存按鈕。
- 儲存前加入取消新增／返回商品管理入口；儲存失敗保留欄位。
- 不啟用正式權限、金流、ERP 或雲端公開部署。

## 驗證證據
- 新增持久化及 API 草稿隔離測試（2項），成功後介面/取消/不可重複儲存測試（1項）。
- 全部 Vitest：36 files / 179 tests PASS；TypeScript PASS；修改檔 ESLint PASS；git diff --check PASS。
- LAN GET /admin/products/new 200，頁面含取消新增及儲存商品，公開商品總數仍9筆。
- 所有新增 API 測試使用獨立暫存目錄；沒有更動原本9筆商品。
- 實體 iPhone 的「保存後返回清單、重整與上下架」仍等待游老師重新驗收；測試通過不代表真人驗收 PASS。
- 保留既有未提交 AGENTS.md、next-env.d.ts，未納入本次提交。
