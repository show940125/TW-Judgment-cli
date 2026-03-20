# Troubleshooting

## `doctor` 顯示 `UNSUPPORTED_OPENCLI_VERSION`

- 安裝支援版本：

```powershell
npm install -g @jackwener/opencli@1.0.1
```

## `opencli` 找不到 `judicial/search`

- 確認已建置

```powershell
npm run build
```

- 再同步一次

```powershell
npm run sync:opencli
```

- 再跑

```powershell
npm run doctor
```

## 查詢回傳 `UPSTREAM_MAINTENANCE`

- 司法院站正在維護或切機。
- 稍後重試。
- 先用瀏覽器手動確認站台是否正常。

## 查詢回傳 `UPSTREAM_CHANGED` 或 `PARSE_ERROR`

- 很可能是站方 HTML 結構調整。
- 先到裁判書網站手動確認：
  - `default.aspx`
  - `qryresultlst.aspx`
  - `data.aspx`
- 若結構已變，更新 `parser.ts` 與 fixtures，然後重跑測試。

## `verify` 卡在 `search`

- 網路不通
- 站方維護
- 本機 `opencli` 沒安裝好
- adapters 未同步進 `~/.opencli`
