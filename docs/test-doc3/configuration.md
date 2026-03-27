---
title: 設定ガイド
order: 3
---

# 設定ガイド

## 設定ファイル

プロジェクトルートに `config.json` を作成します。

```json
{
  "port": 3000,
  "debug": false,
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  }
}
```

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `PORT` | サーバーポート | `3000` |
| `DEBUG` | デバッグモード | `false` |
| `DB_HOST` | DB ホスト | `localhost` |
