# 網站 log：記什麼、在哪裡、怎麼查

> 對象：維護的人和 AI agent。陳老師不需要操作任何東西，畫面出錯時截圖（含錯誤代碼）用 LINE 傳給維護的人即可。
> 狀態（2026-10-17）：程式端已完成並有測試（本文件同一個 PR）。VM 端的 Ops Agent、log 輪替、唯讀帳號**尚未設定**，照第 3、4 節做完後，把結果記進 `HANDOFF.md`。

## 1. 程式會記什麼

所有 server log 都是**一行一筆 JSON**，寫到 container 的 stdout（`lib/server/logger.ts`，使用 pino）。

| 欄位 | 意思 |
|---|---|
| `severity` | `INFO`／`WARNING`／`ERROR`／`CRITICAL`，Cloud Logging 直接用來分級 |
| `message` | 一句話說明 |
| `time` | ISO 時間（UTC） |
| `service` | `tea-front` 或 `tea-admin`（由環境變數 `LOG_SERVICE` 決定，見 3.3） |
| `scope` | 事件類別，見下表 |
| `errorCode` | 6 碼錯誤代碼，跟畫面上顯示的相同 |
| `err` | 錯誤內容：`message`、`stack`，以及原本被包起來的真正原因（cause） |

| `scope` | 何時出現 |
|---|---|
| `api-failure` | 任何 API 回傳失敗。4xx 記 `WARNING`、5xx 記 `ERROR`，帶 `errorCode` 和真正原因 |
| `demo-catalog` | 後台新增／修改／刪除／讀取商品：`received`、`completed`，含 `requestId`、`httpStatus`、`writeStatus`、`syncStatus`、`durationMs`，**不含**商品內容 |
| `merchant-session` | 後台登入被拒，含被拒的階段 `stage`（不含輸入的密碼） |
| `merchant-auth` | 密碼驗證成功／失敗；簡訊登入事件（手機只記雜湊） |
| `public-catalog` | 前台讀不到公開商品目錄 |
| `preview-proxy` | 預覽站擋下未授權的請求 |
| `unhandled-request-error` | 頁面或 API 發生未預期錯誤（`instrumentation.ts`），含 Next.js 的 `digest` |

### 錯誤代碼怎麼對應

API 失敗時，回應內容有 `errorCode`，header 有 `x-error-code`，畫面訊息會帶上「（錯誤代碼：K7F2QM）」。同一個代碼會出現在那一筆 `api-failure` log 裡。

頁面整個壞掉時，Next.js 的錯誤頁會顯示一串 `Digest`，去查 `jsonPayload.digest`。

### 絕對不記的東西

- 密碼、passkey 資料、OTP 驗證碼、cookie、session、token、任何密鑰；
- 客戶的姓名、電話、地址；
- 商品照片內容（`imageDataUrl`）；
- request body 原文。JSON 解析錯誤的訊息會引用 body 原文，所以 logger 會把它換成 `Invalid JSON input (content not logged)`。

logger 另外有自動遮蔽：`password`、`credential`、`phone`、`cookie`、`authorization`、`token`、`secret`、`accessSecret`、`imageDataUrl` 這些欄位，就算不小心傳進去，也會變成 `[REDACTED]`。新增 log 時仍然要自己守住上面的規則，自動遮蔽只是最後一道防線。

## 2. 怎麼查

### 2.1 GCP 主控台（不用 SSH）

Logs Explorer：<https://console.cloud.google.com/logs/query?project=cheng-tea-shop>。在查詢框貼上：

```
logName="projects/cheng-tea-shop/logs/tea_docker"
jsonPayload.errorCode="K7F2QM"
```

常用條件（換掉第二行即可）：

| 想找 | 條件 |
|---|---|
| 某個錯誤代碼 | `jsonPayload.errorCode="K7F2QM"` |
| 所有警告和錯誤 | `severity>=WARNING` |
| 只看錯誤 | `severity>=ERROR` |
| 後台登入失敗 | `jsonPayload.scope="merchant-session"` |
| 商品新增／修改的過程 | `jsonPayload.scope="demo-catalog"` |
| 頁面錯誤的 Digest | `jsonPayload.digest="1234567890"` |
| 只看後台 | `jsonPayload.service="tea-admin"` |

保留 30 天（Cloud Logging `_Default` 預設）。每月前 50 GiB 免費，這個網站遠低於這個量。

### 2.2 指令（維護的人或 agent）

```bash
gcloud logging read \
  'logName="projects/cheng-tea-shop/logs/tea_docker" AND jsonPayload.errorCode="K7F2QM"' \
  --project=cheng-tea-shop --freshness=7d --format=json
```

最近一天的錯誤：

```bash
gcloud logging read 'logName="projects/cheng-tea-shop/logs/tea_docker" AND severity>=ERROR' \
  --project=cheng-tea-shop --freshness=1d --limit=50 \
  --format='table(timestamp, jsonPayload.service, jsonPayload.scope, jsonPayload.message)'
```

### 2.3 備用：直接在 VM 上看

Cloud Logging 還沒設定好或收不到 log 時使用：

```bash
sudo docker logs --since 24h tea-admin 2>&1 | grep K7F2QM
sudo docker logs --since 1h tea-front 2>&1 | grep '"severity":"ERROR"'
```

## 3. VM 端設定（使用者或有 VM 權限的維護者執行一次）

> 以下步驟還沒在 VM 上執行過。做完請在 `HANDOFF.md` 記錄結果，包含 3.4 的驗證輸出。

### 3.1 Docker log 輪替（避免 log 塞滿硬碟）

`/etc/docker/daemon.json`（檔案已存在就合併，不要覆蓋別的設定）：

```json
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "5" } }
```

```bash
sudo systemctl restart docker   # 會重啟所有 container，網站中斷約數秒，選離峰時間
```

這個設定只對**之後新建**的 container 生效，下次部署重建 `tea-front`／`tea-admin` 時就會套用。

### 3.2 安裝 Ops Agent，把 container log 送到 Cloud Logging

```bash
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

VM 的服務帳號需要 `roles/logging.logWriter`。預設 Compute Engine 服務帳號通常已經有，沒有的話在 IAM 加上。

`/etc/google-cloud-ops-agent/config.yaml`：

```yaml
logging:
  receivers:
    tea_docker:
      type: files
      include_paths:
        - /var/lib/docker/containers/*/*-json.log
  processors:
    docker_line:
      type: parse_json
    app_json:
      type: parse_json
      field: log
    app_severity:
      type: modify_fields
      fields:
        severity:
          move_from: jsonPayload.severity
  service:
    pipelines:
      tea:
        receivers: [tea_docker]
        processors: [docker_line, app_json, app_severity]
```

```bash
sudo systemctl restart google-cloud-ops-agent
```

說明：Docker 會把每行 log 包成 `{"log": "...", "stream": "stdout", "time": "..."}`。第一個 `parse_json` 拆掉這層外殼，第二個解析程式寫的 JSON，最後把 `severity` 搬到 Cloud Logging 的嚴重程度欄位。log 名稱就是 receiver 名稱 `tea_docker`。

### 3.3 標記是哪個 container

在 `/srv/tea/front.env` 加 `LOG_SERVICE=tea-front`，在 `/srv/tea/admin.env` 加 `LOG_SERVICE=tea-admin`（runbook 2.6 的 `docker run` 也已加上 `-e LOG_SERVICE`）。

沒設定時，前台會自動標成 `tea-front`，後台會標成 `tea-app`。

### 3.4 驗證

1. 部署含本功能的 image 後，用手機在後台登入頁故意輸入錯誤密碼，畫面應顯示「（錯誤代碼：XXXXXX）」。
2. `sudo docker logs --since 5m tea-admin 2>&1 | grep XXXXXX`，應看到一筆 `"scope":"api-failure"`，而且**不含**輸入的密碼。
3. 1～2 分鐘後，到 Logs Explorer 用 2.1 的查詢找 `XXXXXX`，應找到同一筆，嚴重程度顯示為 Warning。
4. 如果第 3 步找不到：`sudo systemctl status google-cloud-ops-agent*`，並查看 `/var/log/google-cloud-ops-agent/subagents/logging-module.log`。

## 4. 讓 AI agent 能查 log（唯讀）

agent 只拿到**讀 log** 的權限，不能改 VM、不能讀網站資料。

1. GCP 主控台 → IAM 與管理 → 服務帳號 → 建立 `tea-logs-reader`，角色只給 **Logs Viewer（`roles/logging.viewer`）**。
2. 在該服務帳號建立 JSON 金鑰並下載。如果主控台不允許建立金鑰（組織政策），先記在 `HANDOFF.md`，改由維護的人代查。
3. 在 Claude Code 雲端環境設定（session 標題列的環境選單 → Edit）新增環境變數 `GCP_LOGS_READER_KEY`，值為整份 JSON 金鑰內容。新開的 session 才會讀到。
4. **金鑰不可貼進聊天、不可 commit、不可寫進任何文件**。外洩或不再需要時，到服務帳號頁面刪除該金鑰。

agent 使用方式（金鑰檔放在 scratchpad，不放 repo）：

```bash
key_file="$SCRATCHPAD/gcp-logs-reader.json"   # 任何不在 repo 內的暫存路徑
printf '%s' "$GCP_LOGS_READER_KEY" > "$key_file" && chmod 600 "$key_file"
gcloud auth activate-service-account --key-file="$key_file"
gcloud logging read 'logName="projects/cheng-tea-shop/logs/tea_docker" AND jsonPayload.errorCode="K7F2QM"' \
  --project=cheng-tea-shop --freshness=7d --format=json
rm -f "$key_file"
```

如果雲端環境的網路政策擋住 `logging.googleapis.com`，需要在環境的網路設定允許這個網域。

## 5. 改程式時的規則

- server 端一律用 `logger`（`@/lib/server/logger`），不要用 `console.*`。
- 會影響回應的地方要包在 `safeLog(() => ...)` 裡：log 失敗不能讓請求失敗。
- 把錯誤包成給使用者看的訊息時，要保留原因：`new Error("給使用者的訊息", { cause: error })`。
- API 失敗一律走 `demoFailure()`，它會產生錯誤代碼並記 log。
- 錯誤物件放在 `err` 欄位，才會套用上述序列化與過濾。
