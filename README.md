# cheng-tea-shop

陳老師茶行官方網站、購物系統與可整合 ERP 的開發專案。

## 最高開發原則

**Website First → Mock API → ERP Reuse → API Integration**

本專案優先把顧客真正看得到、摸得到、感受得到的部分做好：品牌風格、視覺、美感、舒適度、手機版體驗、商品展示與購物流程。

前台尚未定型前，不從零打造完整 ERP。先以 Mock Data / Mock API 驗證流程；需求穩定後，再選擇授權合適、維護成熟的開源 ERP / 電商後端，透過 Adapter 串接。

**完成目標優先，不重複造輪子。** 開發前先評估成熟模板、元件與開源功能；確認授權、維護、安全與架構吻合後，優先修改重用。

## 新工作階段的閱讀順序

1. `RESUME_PROMPT.md`
2. `AGENTS.md`
3. `WORKFLOW.md`
4. `HANDOFF.md`
5. `CAPABILITY_MAP.md`
6. `WHITEPAPER.md`
7. `DEVELOPMENT_STRATEGY.md`
8. `docs/superpowers/specs/` 內最新相關規格
9. 最近的 Git commit 與開啟中的 Pull Request

先回報現況與下一步。未獲得明確批准前，不開始寫程式或修改 GitHub。

## 開發順序

1. 網站風格、品牌與 UX 討論
2. 前台資訊架構與頁面流程
3. 商品、購物車、結帳、會員與訂單等前台功能
4. 使用 Mock API 驗證完整購物體驗
5. 依已確認需求整理後端能力清單
6. 搜尋並比較可重用的 GitHub ERP / Commerce 專案
7. 建立 API Adapter，串接商品、庫存、顧客、訂單、付款與出貨
8. 最後才補齊必要的 ERP 客製功能

## 文件

- `RESUME_PROMPT.md`：每次接續專案的精簡提示
- `AGENTS.md`：Codex、35B 與專業 Agent 的責任和權限
- `WORKFLOW.md`：拆解、執行、測試、PR 與合併規則
- `HANDOFF.md`：最新進度、阻礙與下一步
- `CAPABILITY_MAP.md`：能力與階段狀態
- `DEVELOPMENT_STRATEGY.md`：工程策略與邊界
- `WHITEPAPER.md`：產品與工程白皮書
- `docs/superpowers/specs/`：已確認的設計規格

## Git 與安全原則

- 所有修改使用獨立 Branch／Worktree。
- Agent 可以自動工作到建立 PR，但不得自行合併。
- 只有游老師明確確認後才合併到 `main`。
- 不得提交密碼、API Key、付款金鑰、Token、私人顧客資料或其他機密資訊。
- 每個重要階段都要同步更新白皮書、能力地圖和交接狀態。
