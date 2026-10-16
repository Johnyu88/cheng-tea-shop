# CLOUD-02-STORAGE-01 物件儲存驗證

## 範圍與隔離

本驗證從 `56189a8e010a89e3bfc422920a738bc708d3742b` 建立獨立 worktree 與候選分支執行。使用一次性本地 PostgreSQL 17 與 RustFS S3-compatible container，所有資料均為合成資料；沒有使用 GCP、Render、正式資料、Acer、4090 或 Tailscale 服務。

`createS3ObjectStorage` 必須明確傳入 `enabled: true`、endpoint、bucket 與 credentials；Demo adapter 仍是預設，未設定候選環境時不會初始化 S3。

## 驗證契約

| 契約 | 結果 | 證據 |
|---|---|---|
| 真實 bytes、MIME、大小、SHA-256 儲存與讀取 | PASS | `tests/cloud-02-storage-01-object-storage.test.ts` 1/9 |
| 私有讀取控制、缺物件與刪除偵測 | PASS | 測試 3/9 |
| 商品照片更換保留舊版本 | PASS | 測試 4/9；immutable key，bucket versioning enabled |
| 包裝照片與 order／actor／checksum 關聯 | PASS | 測試 5/9；先完成 `payment_confirmed` 再進入 `packed` |
| 物件成功、DB 交易失敗的補償清理 | PASS | 測試 6/9 |
| PostgreSQL／物件 manifest、還原與缺漏偵測 | PASS | 測試 8/9 |
| MIME 不符拒絕、Demo 預設不變 | PASS | 測試 7/9、9/9 |
| 真實 GCP Cloud Storage 驗證 | BLOCKED | 本階段禁止建立或部署 GCP 資源 |

## Backup／restore

`cloud02_photo_backup_manifests` 與 `cloud02_photo_backup_manifest_items` 記錄物件 key、version、MIME、byte length、SHA-256、來源 table/id 與時間。建立 manifest 時會逐一以 S3 HEAD 對照資料庫；任一缺漏、大小或 checksum 不符即拒絕 manifest。還原演練讀取原始 bytes、重新驗證 checksum，再寫入隔離 restore prefix；刪除原測試物件後 `verifyManifest` 能回報缺漏。

目前還原 API 是候選演練工具，尚未宣稱 GCP 備份產品已驗收；正式上線前仍需雲端版本保留、跨區／跨 bucket 備份與實際復原演練。

## 部分失敗規則

- 物件先寫、DB 後寫；DB transaction 失敗時刪除剛上傳 object。
- 物件上傳失敗時不建立照片資料列，維持 DB 不變。
- 物件刪除／補償失敗必須記錄並阻擋候選流程升級，不得把資料列標記為已完成。
- 商品更換只停用舊 `product_images` 列，不覆蓋舊 object key。

## 尚未解決／下一階段前置條件

1. 需要正式選定 Cloud Storage bucket、IAM／signed URL 策略與保留政策。
2. 需要在候選雲端完成 PostgreSQL backup 與 object manifest 的實際定期作業及告警。
3. 需要以批准的 staging 資源執行重啟、HTTPS、手機 Safari 與真實 Cloud Storage 驗收。
