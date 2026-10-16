# PRODUCT-11-PREFLIGHT-05｜正式部署前整備

日期：2026-10-16（Asia/Taipei）  
候選 source：`e6267388377ff51b6f3aaa895d262da4fcf96a68`  
安全事件文件 commit：`914f254792b770533bed95ea0de334f70ca226f2`

## 1. 版本與回退

| 項目 | 結果 | 證據／限制 |
|---|---|---|
| 正式 image 完整 digest | PASS | `tea-nextjs:prod-admin-14-2be6be0` → `sha256:e4be4719acae0837c10c8244f268b220b3b14b12b89b05bcd812d2bb423a7f7f`。 |
| image 在 Acer 本機存在 | PASS | `docker image inspect` 成功；Linux amd64、Node 24.19.0、`docker-entrypoint.sh node server.js`、`/app`。 |
| 原樣重建容器已實際演練 | BLOCKED | 只讀核准不允許 `docker create/run`；已確認 image config 可供核准窗口使用，未建立新容器。 |
| 正式容器非敏感設定 | PASS | `bridge` network、`127.0.0.1:8130 -> 3000/tcp`、restart policy `unless-stopped`、user `nextjs`、兩個 RW bind mounts。 |
| 候選／正式 source 精確對應 | BLOCKED | 正式 image labels 沒有 source commit；只能列出 source-level 差異，不能證明 binary 等價。 |
| 回退 image | PASS／條件 | 本機存在 `tea-nextjs:reauth-05f058e`，digest `sha256:ab3e1e3673aefe55916569852d8246b5501a48c3994905639da61cfa134b2db4`；registry／部署主機可拉取性未驗證，不能視為已核准回退。 |

## 2. 候選與正式功能差異

候選相對基準只涉及：

- 商品 GET／POST／PATCH route：持久化 ID、read-back、sync 狀態及 request/instance diagnostics。
- catalog store：唯一暫存檔、fsync、atomic rename、跨程序 lock。
- publishing service／商品新增頁：POST ID 傳遞與成功提示 gate。
- checkout page：一項 effect scheduling lint 修正。
- 測試、HANDOFF、計畫與證據文件。

未改動 Dockerfile、部署設定、DNS、Caddy、Tailscale、正式資料路徑或照片路徑。未驗證項目：正式 image binary source mapping、正式 Windows bind mount 的實際 lock／fsync／rename 語義、部署主機 registry 回退 image 可拉取性。

## 3. 檔案系統相容性

正式容器 metadata：

- `C:\data\tea-staging\private-accounting-v1-data` → `/app/data`，RW。
- `C:\data\tea-staging\public-visibility-live` → `/app/catalog-sync`，RW。
- catalog lock、temporary file、rename 均應在 `/app/data` 同一目錄完成。

隔離測試結果：

- PASS：獨立 Windows 測試目錄、合成商品、兩個 Node 子程序並發寫入。
- PASS：程序停止後新 store 讀回第 11、12 筆。
- PASS：fsync／atomic replacement、lock timeout、解除 abandoned lock 後恢復。
- BLOCKED：未在正式 Windows bind mount 建立測試檔，也未建立候選 Linux container 來掛載 Windows 目錄；正式 mount 行為仍須核准 staging clone 驗證。

## 4. 資料保護、部署後驗收與回退清單（設計完成，未執行）

1. 備份窗口：停止新增寫入後，由授權人以受控工具備份 `catalog.json`、公開 publication snapshot、照片目錄與 metadata；不得放入 Git 或聊天。
2. 完整性：記錄檔案大小、mtime、SHA-256、商品總數、每筆 ID／publication；備份完成後重新讀取 hash。
3. 部署前：核對候選 image digest、正式 image digest、mount source/destination、ports、network、restart policy；不以 Git SHA 代替 image digest。
4. 部署後：先 health，再以唯讀 API 驗證商品數量、ID、照片 src、draft／published 狀態；以兩筆合成商品驗證 POST ID、同 Session GET、重啟後存在及 sync failure 不重複。
5. 失敗：停止新增操作，保留 request／instance／write／sync diagnostics；遇到 persisted-but-unsynced 不重送 POST。
6. 回退：使用已核准且在部署主機可拉取的原正式 image digest；重掛原 mounts，確認 health、商品清單與 publication snapshot，再開放寫入。

實際備份、部署、停止、切換與正式驗收均為 BLOCKED（本工單未授權）。

## 5. 安全事件隔離

- PASS：歷史 WebCrypto 事件紀錄獨立於 PRODUCT-11；文件位於 `docs/security/product-11-security-04-historical-webcrypto-key.md`。
- PASS：未讀取、輸出、輪替或重建舊金鑰；未接觸舊加密帳務備份；未重寫 Git 歷史。
- PASS：候選 source 不依賴歷史 WebCrypto KEY；正式 image bundle 亦未發現歷史 AES-GCM／PBKDF2 流程。

## 6. Git／秘密檢查與交接

- PASS：`e626738...` 是安全事件文件 commit `914f254...` 的祖先；本地 HEAD 目前只包含文件整理，候選程式保持不變。
- PASS：`git diff --check` 無 whitespace error；文件差異不含金鑰原文、token 或正式資料內容。
- BLOCKED（全 repo）：gitleaks 既有四個歷史命中仍需安全事件處置，不能宣稱全 repo secret scan PASS。
- PASS（候選 delta）：候選程式與本次文件差異未新增秘密；推送前應以已驗證 gitleaks binary 掃描 `e626738.....HEAD` 差異並保存 redacted summary。

## 結論

1. 原正式 image 確實存在且 digest 已確認；原樣重建尚未實演，回退 image 的部署主機可拉取性仍待核准。
2. Linux container＋Windows mount 的隔離等價測試未完成，正式 mount 實測為 BLOCKED；Windows host synthetic process/lock tests PASS。
3. 候選不帶入已知不相關功能變更；正式 binary 對 source 的完整對應因無 image label 而 BLOCKED。
4. 部署前仍需核准：staging mount clone 實測、正式備份窗口、部署窗口、registry 回退 image 可拉取性、歷史帳務資料是否存在，以及 gitleaks 歷史命中處置／例外。
