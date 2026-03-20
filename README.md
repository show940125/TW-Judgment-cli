# TW-Judgment-cli

`TW-Judgment-cli` 是一個以 `opencli` 為 runtime 的 extension pack，專門把司法院裁判書查詢系統包成可在終端與 Codex 中直接操作的命令。

## 上游依賴與授權

本專案是建立在 [opencli](https://github.com/jackwener/opencli) 之上的 extension pack，而不是獨立重做一套 runtime。依我目前機器上安裝的 `@jackwener/opencli 1.0.1` 實查，其授權是 **Apache-2.0**，不是 MIT。

因此，公開 repo 時至少應明確寫出：

- 本專案依賴 `opencli` 作為執行層
- 上游專案：`jackwener/opencli`
- 上游授權：`Apache-2.0`
- 本專案的相容範圍不是「永遠跟上游同步」，而是以 `compatibility.md` 列出的版本矩陣為準

本 repo 自身目前也採用 **Apache-2.0**，見 [LICENSE](./LICENSE)。

如果未來發佈壓縮包、安裝器，或把上游程式碼直接一起再散布，還應一併保留上游授權與 notice。簡單說：**要註明，而且應該主動註明，不要等別人來問。**

## 為什麼不用瀏覽器點擊

司法院裁判書查詢系統在結構上更像「資料庫查詢介面 + WebForms UI」，不是只能靠畫面互動才拿得到資料的網站。以目前這個站來看，`default.aspx`、`Default_AD.aspx`、`qryresultlst.aspx`、`data.aspx`、`FILES/*.pdf` 這幾段路徑就已經足夠把查詢、列表、全文、PDF 串起來。

這也是 `TW-Judgment-cli` 刻意選擇純 HTTP + HTML parsing，而不是 `agent browser`、Playwright 或其他「點擊式」讀取方式的原因：

- 這類 UI 自動化會多一層 DOM / accessibility / screenshot / state 同步成本
- 對 agent 工作流來說，通常更耗 token，也更慢
- 站方只要改一點前端結構，點擊流就更脆弱

所以目前的設計原則是：**能直接走資料請求，就不要模擬人類點擊**。瀏覽器自動化只該當 fallback，不該是主路徑。

V2 目前聚焦七個命令：

- `opencli judicial search`
- `opencli judicial advanced-search`
- `opencli judicial read`
- `opencli judicial read-batch`
- `opencli judicial pdf`
- `opencli judicial open`
- `opencli judicial export-results`

## 安裝

1. 安裝支援版本的 `opencli`

```powershell
npm install -g @jackwener/opencli@1.0.1
```

2. 安裝此 repo 的依賴並建置

```powershell
npm install
npm run build
```

3. 同步 adapters 到 `~/.opencli`

```powershell
npm run install:opencli
```

4. 安裝 Codex skill

```powershell
npm run install:skill
```

5. 檢查安裝狀態

```powershell
npm run doctor
```

## 使用

```powershell
opencli judicial search --query "105訴123" --limit 3 -f json
opencli judicial advanced-search --courts "嘉義地院" --case-types criminal --case-year 115 --case-word "金訴" --case-number 204 -f json
opencli judicial read --id "TPDV,105,訴,123,20200630,4" -f json
opencli judicial read-batch --ids "TPDV,105,訴,123,20200630,4,TPDV,105,訴,123,20200630,4" -f json
opencli judicial pdf --id "TPDV,105,訴,123,20200630,4"
opencli judicial open --id "TPDV,105,訴,123,20200630,4" --target pdf
opencli judicial export-results --input ".\\results.json" --export-format md
```

`read-batch --ids` 可接受：

- 多個完整 id 直接串接成一個字串
- 每行一個 id

## 驗證

```powershell
npm test
npm run verify
```

`verify` 會真的跑一次 `advanced-search -> read -> read-batch -> pdf -> export-results` smoke flow。

## 典型工作流

### 1. 法院 / 審級 / 地區式高階搜尋

```powershell
opencli judicial advanced-search `
  --court-levels district `
  --regions south `
  --case-types criminal `
  --fulltext "詐騙" `
  --limit 5 -f json
```

### 2. 查詢後批次讀前 2 筆

```powershell
opencli judicial advanced-search --courts "嘉義地院" --case-types criminal --fulltext "詐騙" --limit 2 -f json > results.json
opencli judicial read-batch --ids "CYDM,115,金訴,204,20260319,1,CYDM,115,金訴,204,20260319,1" -f json
```

### 3. 匯出 Markdown dossier

```powershell
opencli judicial export-results --input ".\\reads.json" --export-format md
```

## Repo 結構

- `adapters/judicial/`: opencli command adapters 與 runtime support modules
- `fixtures/`: parser 與 service 測試用的 HTML fixtures
- `scripts/`: install、doctor、verify、release 腳本
- `docs/`: 相容政策、故障排查、法律與倫理說明
- `examples/`: 命令範例與示意輸出
- `skill/`: Codex skill

## 限制

- 目前只涵蓋 `Default_AD.aspx` 的核心高階查詢欄位
- 不做大量批次匯出
- 站方 HTML 或路由若改版，可能需要更新 parser

## 相關文件

- [compatibility.md](./compatibility.md)
- [docs/troubleshooting.md](./docs/troubleshooting.md)
- [docs/legal-and-ethics.md](./docs/legal-and-ethics.md)
- [skill/SKILL.md](./skill/SKILL.md)
- [NOTICE](./NOTICE)
