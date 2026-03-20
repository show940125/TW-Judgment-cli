# TW-Judgment-cli

`TW-Judgment-cli` 是一個以 `opencli` 為 runtime 的 extension pack，專門把司法院裁判書查詢系統包成可在終端與 Codex 中直接操作的命令。

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
