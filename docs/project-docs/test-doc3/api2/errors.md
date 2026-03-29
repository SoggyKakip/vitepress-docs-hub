---
title: エラーコード
order: 3
---

# エラーコード

## エラーレスポンス形式

```json
{
  "status": "error",
  "code": "NOT_FOUND",
  "message": "リソースが見つかりません"
}
```

## エラーコード一覧

| コード | HTTP ステータス | 説明 |
|--------|----------------|------|
| `BAD_REQUEST` | 400 | リクエストが不正 |
| `UNAUTHORIZED` | 401 | 認証が必要 |
| `FORBIDDEN` | 403 | アクセス権限なし |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `INTERNAL_ERROR` | 500 | サーバー内部エラー |
