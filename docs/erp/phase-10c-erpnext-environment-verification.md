# Phase 10-C — ERPNext physical environment verification

日期：2026-09-23  
狀態：BLOCKED_EXTERNAL；未啟動 ERPNext、未安裝 Docker、未連線外部服務

## 1. Preflight evidence

| Check | Result | Interpretation |
|---|---|---|
| `docker version` | BLOCKED | PowerShell 回報 `docker` 不是可辨識的命令；Docker CLI／daemon 不可用 |
| `docker info` | BLOCKED | 因 CLI 不存在，無法確認 daemon、Compose、CPU、memory limit 或 volumes |
| Windows memory query | UNAVAILABLE | `Get-CimInstance Win32_ComputerSystem` 與 `Win32_OperatingSystem` 被拒絕存取；未宣稱記憶體足夠 |
| C: filesystem | AVAILABLE | PowerShell 回報約 3.79 TB free；僅代表磁碟空間，不代表 Docker 資源足夠 |
| Git state | PROTECTED | `next-env.d.ts` 是既有未提交變更；本階段未修改、未 stage |

結論：無法進行實體 ERPNext 驗證。沒有啟動 container，也沒有執行任何 Docker install、daemon 設定、系統安全設定或公開網路開放。

## 2. 官方安裝路徑（僅記錄，未執行）

官方維護的 [frappe/frappe_docker](https://github.com/frappe/frappe_docker) 提供 Docker images、Compose 與 ERPNext environment。官方 quick exploration 路徑是 clone 該 repo 後執行 `docker compose -f pwd.yml up -d`；官方文件明確將 `pwd.yml` 定位為 disposable demo，並要求 Docker、Docker Compose v2 與 git。

本機日後若要執行，必須先由使用者／系統管理者完成 Docker Desktop／Docker Engine 與 Compose v2 的受控安裝，再重新確認 CPU、memory limit、磁碟、ports、volume 與 isolation。不可在本 PoC 自動安裝或調整系統安全設定。

## 3. 實體驗證計畫（待環境可用）

只使用 synthetic data 與 localhost／隔離 compose project：

1. 固定 ERPNext image tag 與官方 `pwd.yml`，記錄 ERPNext、Frappe、MariaDB、Redis 版本。
2. 以一次性 site 建立 synthetic item／variant、warehouse stock、customer reference。
3. 用 read-only API 查商品／規格與庫存數量。
4. 建立一筆 synthetic sales order，查詢 order status；不使用真實 customer、payment 或物流資料。
5. 透過目前 `ErpMappingAdapter` contract 驗證 API response → project-owned DTO、錯誤 mapping、認證失敗與 adapter boundary。
6. 測試結束使用 compose project scope 清理；若要保留 evidence，只保留去識別化 response schema、版本、錯誤與 mapping report。

## 4. 無 Docker 時的替代方案

- 已完成的 Phase 10-B synthetic ERPNext-shaped adapter 仍是目前可執行替代：驗證 Product／Variant、Inventory、Order、Customer、error mapping 與 adapter swapping，但不代表 ERP API 可用。
- 可在不安裝 ERP 的情況下補強 contract fixtures、認證錯誤 fixture、版本化 response schema 與 mapping regression；不能驗證真實 endpoint、權限、資料庫 constraints、庫存 reservation 或 order transaction。
- 不使用第三方雲端 ERP、免費試用、公開 tunnel 或外部資料；不購買服務、不公開 localhost、不把正式網站接到 PoC。

## 5. Current result and unresolved questions

本階段 0/4 實體 ERP 測試執行：商品／庫存／訂單／API 認證均未連線驗證。未解決項目包括 Docker 安裝授權、資源限制、固定 ERPNext image／Frappe 版本、官方 API auth scope、Item／Warehouse／Sales Order 必填欄位、庫存 reservation semantics、site backup／restore 與清理策略。

Phase 10-C 停止於 external environment gate；不做正式 ERP 選擇，不修改 ERP，不修改 UI，不接付款／物流。
