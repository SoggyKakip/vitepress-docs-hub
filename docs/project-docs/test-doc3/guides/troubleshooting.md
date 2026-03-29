---
title: トラブルシューティング
order: 2
---

# トラブルシューティング

## よくある問題

### ポートが使用中

```
Error: listen EADDRINUSE :::3000
```

別のプロセスがポート 3000 を使用しています。

```bash
# 使用中のプロセスを確認
lsof -i :3000

# 別のポートで起動
PORT=3001 npm run dev
```

### データベース接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

データベースが起動しているか確認してください。

```bash
# PostgreSQL の状態確認
pg_isready
```

### 依存関係エラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```
