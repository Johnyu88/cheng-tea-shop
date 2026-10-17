# Acer 備份與雲端主機搬遷 runbook（2026-10-17 草擬，尚未執行）

> 決定（使用者，2026-10-17）：Acer 測試完會整台重置；網站改放**雲端主機（VM）**，沿用 Docker + Caddy，讓客人與陳老師不裝 Tailscale、直接用手機 HTTPS 測試。完整正式架構（`codex/cloud-02-*`：PostgreSQL + 物件儲存）之後再做。
> 原則：雲端帳號、付款、網域、密碼都由使用者本人建立與保管；agent 只能用使用者提供的權限操作，且不得把任何機密寫進 repo、log 或聊天。

## 第一部分：Acer 重置前備份（重置前必做）

在 Acer 上執行，**全部完成並驗證後才可以重置**。備份目的地必須在 Acer 以外（外接硬碟或使用者自己的雲端硬碟），**不可放進 GitHub**。

### 1.1 停寫

通知陳老師與測試者暫停後台操作；確認沒有進行中的新增／修改。

### 1.2 要備份的項目

| 項目 | 位置（依 HANDOFF 紀錄，執行前先唯讀確認） | 說明 |
|---|---|---|
| 後台資料 | `C:\data\tea-staging\private-accounting-v1-data` | `catalog.json`、`catalog-media`、`packing-photos`、訂單／登入／通知 SQLite 等，整個資料夾 |
| 公開目錄 | `C:\data\tea-staging\public-visibility-live` | `publication.json`、`media` |
| Caddy 設定 | Caddy 容器 `tea-caddy-staging` 使用的 Caddyfile | repo 已有 `Caddyfile.prod-admin-04` 可對照 |
| 舊回退備份 | `C:\data\tea-staging\recovery\` | 視空間決定是否保留 |
| 環境變數**名稱**清單 | 兩個正式容器 | 只記名稱（例：`PUBLIC_CATALOG_VISIBILITY_PATH`）；**不匯出值**，雲端上重新產生機密 |
| 舊帳務 PWA 匯出檔（若有） | 由使用者確認 | 見 `docs/security/product-11-security-04-historical-webcrypto-key.md` |

取得環境變數名稱（只列名稱）：

```powershell
foreach ($n in "tea-public-adbe430-live","tea-private-v5-prod-admin-24-live") {
  "== $n"; (docker inspect $n | ConvertFrom-Json).Config.Env | ForEach-Object { $_.Split('=')[0] }
}
```

### 1.3 驗證備份

- 每個備份檔／壓縮檔記錄：UTC 時間、大小、SHA-256。
- 實際把備份解到另一個暫存位置，確認 `catalog.json` 能讀、商品數量與 ID 和正式一致、照片能開。
- 記錄「商品總數、每個商品 ID、草稿／上架狀態」（不記內容），搬遷後比對用。

### 1.4 重置前最後確認

- [ ] 備份在 Acer 以外至少一份，且驗證可讀
- [ ] 商品 ID 清單已記錄
- [ ] 環境變數名稱清單已記錄
- [ ] 使用者確認可以重置（重置期間網站停擺）

## 第二部分：建立雲端主機

### 2.1 使用者要準備的（agent 不代辦）

1. 選一家雲端主機商並開帳號、綁付款。台灣客人為主，建議選**台灣或日本**機房（例如 GCP `asia-east1` 彰化、或其他廠商東京）。
2. 建一台 **Ubuntu 24.04 LTS** 主機：建議 **2 vCPU、4 GB RAM、40 GB 以上磁碟**（Next.js 在主機上 build 需要記憶體；若選 2 GB 要加 swap）。
3. 防火牆只開 **22（SSH，最好限制來源）、80、443**。
4. 網址二選一：
   - 有網域：建兩筆 DNS A 記錄指到主機 IP，例如 `shop.<網域>`（前台）、`admin.<網域>`（後台）。
   - 沒網域：可先用免費的 `<IP>.sslip.io` 形式名稱測試（例：`shop-1-2-3-4.sslip.io`），Caddy 一樣能申請 HTTPS 憑證；正式營運建議買網域。
5. 決定讓誰操作主機（例如之後用 Claude Code 透過 SSH），SSH 金鑰由使用者保管。

### 2.2 主機基本設定

```bash
sudo apt update && sudo apt -y upgrade
# 安裝 Docker（官方說明：https://docs.docker.com/engine/install/ubuntu/）
sudo usermod -aG docker $USER
sudo mkdir -p /srv/tea/{data,catalog-sync,backups} /srv/caddy
git clone https://github.com/Johnyu88/cheng-tea-shop.git /srv/tea/app
```

### 2.3 還原資料

把第一部分的備份傳到主機（`scp` 或使用者的雲端硬碟），還原到：

- 後台資料 → `/srv/tea/data`（容器內 `/app/data`）
- 公開目錄 → `/srv/tea/catalog-sync`（容器內 `/app/catalog-sync`）
- 擁有者設為容器使用者 uid/gid `1001`（Dockerfile 的 `nextjs`）：`sudo chown -R 1001:1001 /srv/tea/data /srv/tea/catalog-sync`

還原後比對商品數量與 ID 清單。

### 2.4 建置 image

依 `docs/operations/deploy-main-605e806-2026-10-17.md` 第 2 節：build 參數必須和 Acer 正式 image 相同（先在 Acer 查出並記錄在 HANDOFF；查不到就停）。在主機上：

```bash
cd /srv/tea/app && git checkout main && rev=$(git rev-parse HEAD)
docker build -t tea-nextjs:front-$rev --label org.opencontainers.image.revision=$rev --build-arg ...(前台參數) .
docker build -t tea-nextjs:admin-$rev --label org.opencontainers.image.revision=$rev --build-arg ...(後台參數) .
```

### 2.5 機密與環境變數

- 依 1.2 的**名稱清單**，在主機上建立兩個只有 root 可讀的 env 檔（`/srv/tea/front.env`、`/srv/tea/admin.env`，權限 `600`），**不放進 repo**。
- 機密類（商家密鑰、session secret、管理員密碼等）**全部重新產生**，不沿用 Acer 的值；新的後台密碼由使用者設定並交給陳老師。
- 路徑類改成容器內路徑（例：`PUBLIC_CATALOG_VISIBILITY_PATH=/app/catalog-sync/publication.json`），與 Acer 相同。
- 原本為 Acer/Tailscale 設定的 origin／host 白名單類變數，改成新的 HTTPS 網址。
- 後台：`DEMO_ACER_ORIGIN` 設為後台的完整 HTTPS 網址（例：`https://admin.<網域>`，不可帶埠號或路徑），並另外設定 `DEMO_ACER_PUBLIC_HOST` 為**同一個主機名稱**（例：`admin.<網域>`）。兩者必須一致才會接受公開網域；Origin／Host 檢查照常運作，Caddy 不需要改寫標頭。

### 2.6 啟動容器

兩個容器只綁本機埠，由 Caddy 對外：

```bash
docker run -d --name tea-front --restart unless-stopped -p 127.0.0.1:8131:3000 \
  --env-file /srv/tea/front.env -v /srv/tea/catalog-sync:/app/catalog-sync:ro tea-nextjs:front-$rev
docker run -d --name tea-admin --restart unless-stopped -p 127.0.0.1:8130:3000 \
  --env-file /srv/tea/admin.env -v /srv/tea/data:/app/data -v /srv/tea/catalog-sync:/app/catalog-sync tea-nextjs:admin-$rev
```

（前台只讀公開目錄；只有後台能寫資料，與 Acer 一致。）

### 2.7 Caddy（自動 HTTPS）

`/srv/caddy/Caddyfile`：

```
shop.<網域> {
    reverse_proxy 127.0.0.1:8131
}
admin.<網域> {
    reverse_proxy 127.0.0.1:8130
}
```

以 host network 執行 Caddy（才能連到 127.0.0.1）：

```bash
docker run -d --name caddy --restart unless-stopped --network host \
  -v /srv/caddy/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data -v caddy_config:/config caddy:2
```

對照 repo 的 `Caddyfile.prod-admin-04`，保留原本對 origin／forwarded header 的處理需求。

### 2.8 每日備份

- 每天把 `/srv/tea/data` 與 `/srv/tea/catalog-sync` 打包到 `/srv/tea/backups`，保留 14 天，並同步一份到主機以外（雲端廠商的快照或物件儲存）。
- 開啟雲端廠商的磁碟每日快照（若有）。
- 每月做一次還原演練。

## 第三部分：上線驗收（使用者 iPhone）

1. 前台 `https://shop.<網域>`：首頁、十大茶類、商品照片、購物車、LINE／電話／匯款、放棄購買；**沒有「訂單查詢」**。
2. 後台 `https://admin.<網域>`：用新密碼登入；商品數量與 ID 和備份一致；新增一款商品看到「儲存成功」與編號；重新整理仍在；上架後前台看得到；換照片兩次後前台同步。
3. 用一般 iPhone、**不開 Tailscale** 也能打開。
4. 通過後在 `HANDOFF.md` 記錄：主機商與機房、IP／網址、兩個 image 與 digest、容器名稱、備份位置（不含機密）、驗收結果；Acer 正式服務正式退役。
