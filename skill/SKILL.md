---
name: tw-judgment-cli
description: Use when searching Taiwan Judicial judgments with structured court filters, batch-reading full text, or exporting result sets for research.
---

# TW Judgment CLI

用這個 skill 時，先走 `opencli judicial ...`，不要自己重抓司法院網站。

## 主要命令

```powershell
opencli judicial search --query "<關鍵字>" --limit 5 -f json
opencli judicial advanced-search --courts "<法院>" --case-types criminal --fulltext "<關鍵字>" --limit 5 -f json
opencli judicial read --id "<judgment-id>" -f json
opencli judicial read-batch --ids "<完整 id 串接字串或逐行 id>" -f json
opencli judicial pdf --id "<judgment-id>" -f json
opencli judicial export-results --input "<json-path>" --export-format md -f json
```

## 工作規則

- 預設先 `search`，不要一開始就猜 `id`
- 有法院 / 地區 / 審級 / 案號條件時，優先用 `advanced-search`
- 結果太多時，先列出候選，再請使用者縮小範圍或指定案件
- 使用者若明確給案號或 `id`，直接 `read`
- 需要一次讀多篇時走 `read-batch`
- 需要 PDF 時走 `pdf`
- 需要後續摘要、比較、整理或交付閱讀材料時，用 `export-results`
- 不要重複抓站，先用 CLI 輸出當資料來源

## 常見任務

### 查某案號全文

1. `opencli judicial search --query "105訴123" --limit 5 -f json`
2. 從結果挑最相關 `id`
3. `opencli judicial read --id "<id>" -f json`

### 搜尋某法律爭點並讀前 3 篇

1. `opencli judicial search --query "<爭點關鍵字>" --limit 3 -f json`
2. 逐篇 `read`
3. 再做比較或摘要

### 用結構化條件查特定法院

1. `opencli judicial advanced-search --courts "嘉義地院" --case-types criminal --fulltext "詐騙" --limit 5 -f json`
2. 從結果挑 `id`
3. `opencli judicial read --id "<id>" -f json`

### 匯出 dossier

1. `opencli judicial read-batch --ids "<完整 id 串接字串或逐行 id>" -f json > reads.json`
2. `opencli judicial export-results --input ".\reads.json" --export-format md -f json`

### 只要 PDF

1. `opencli judicial pdf --id "<id>" -f json`

## 失敗處理

- 若命令報 `UPSTREAM_MAINTENANCE`，告知使用者站方維護中
- 若報 `UPSTREAM_CHANGED`，停止猜測，回報 parser 可能需更新
- 若報 `INVALID_ARGUMENT`，先檢查法院 alias、日期格式、CSV 參數
- 若 `search` 結果過多，不直接亂選，先列候選
