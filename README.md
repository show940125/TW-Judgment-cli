# TW-Judgment-cli

`TW-Judgment-cli` 是一個以 `opencli` 為 runtime 的 extension pack，專門把司法院裁判書查詢系統包成可在終端與 Codex 中直接操作的命令。

第一版聚焦四個命令：

- `opencli judicial search`
- `opencli judicial read`
- `opencli judicial pdf`
- `opencli judicial open`

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
opencli judicial read --id "TPDV,105,訴,123,20200630,4" -f json
opencli judicial pdf --id "TPDV,105,訴,123,20200630,4"
opencli judicial open --id "TPDV,105,訴,123,20200630,4" --target pdf
```

## 驗證

```powershell
npm test
npm run verify
```

`verify` 會真的跑一次 `search -> read -> pdf` smoke flow。

## Repo 結構

- `adapters/judicial/`: opencli command adapters 與 runtime support modules
- `fixtures/`: parser 與 service 測試用的 HTML fixtures
- `scripts/`: install、doctor、verify、release 腳本
- `docs/`: 相容政策、故障排查、法律與倫理說明
- `examples/`: 命令範例與示意輸出
- `skill/`: Codex skill

## 限制

- V1 只做一欄式簡易查詢與單篇全文/PDF 讀取
- 不含 `Default_AD.aspx` 進階查詢
- 不做大量批次匯出
- 站方 HTML 或路由若改版，可能需要更新 parser

## 相關文件

- [compatibility.md](./compatibility.md)
- [docs/troubleshooting.md](./docs/troubleshooting.md)
- [docs/legal-and-ethics.md](./docs/legal-and-ethics.md)
- [skill/SKILL.md](./skill/SKILL.md)
