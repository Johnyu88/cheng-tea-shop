# Phase 9-A 商品匯入模板

- `phase-9a-product-import-template.csv`：只有 canonical header，沒有商品列。
- `phase-9a-product-import-template.json`：空商品陣列，沒有 synthetic 或真實商品內容。
- 欄位定義與驗證規則：`phase-9a-real-product-material-import-spec.md`。

執行 dry-run：

```powershell
node scripts/phase-9a-product-import.mjs --input docs/testing/phase-9a-product-import-template.csv --format csv
node scripts/phase-9a-product-import.mjs --input docs/testing/phase-9a-product-import-template.json --format json
```

工具預設只輸出 JSON report，不會覆蓋 catalog、fixture、圖片或其他既有資料。`--apply` 明確不支援。
