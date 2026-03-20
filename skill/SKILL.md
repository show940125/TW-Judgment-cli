---
name: tw-judgment-cli
description: Use the opencli judicial commands to search Taiwan Judicial judgments, read full text, fetch PDF links, and narrow result sets before deeper analysis.
---

# TW Judgment CLI

用這個 skill 時，先走 `opencli judicial ...`，不要自己重抓司法院網站。

## 主要命令

```powershell
opencli judicial search --query "<關鍵字>" --limit 5 -f json
opencli judicial read --id "<judgment-id>" -f json
opencli judicial pdf --id "<judgment-id>" -f json
```

## 工作規則

- 預設先 `search`，不要一開始就猜 `id`
- 結果太多時，先列出候選，再請使用者縮小範圍或指定案件
- 使用者若明確給案號或 `id`，直接 `read`
- 需要 PDF 時走 `pdf`
- 需要後續摘要、比較、整理時，用 CLI 結果當輸入，不要重複抓站

## 常見任務

### 查某案號全文

1. `opencli judicial search --query "105訴123" --limit 5 -f json`
2. 從結果挑最相關 `id`
3. `opencli judicial read --id "<id>" -f json`

### 搜尋某法律爭點並讀前 3 篇

1. `opencli judicial search --query "<爭點關鍵字>" --limit 3 -f json`
2. 逐篇 `read`
3. 再做比較或摘要

### 只要 PDF

1. `opencli judicial pdf --id "<id>" -f json`

## 失敗處理

- 若命令報 `UPSTREAM_MAINTENANCE`，告知使用者站方維護中
- 若報 `UPSTREAM_CHANGED`，停止猜測，回報 parser 可能需更新
- 若 `search` 結果過多，不直接亂選，先列候選
