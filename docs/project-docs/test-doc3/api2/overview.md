---
title: API 概要
order: 1
---

# API 概要

テストプロジェクトは REST API を提供します。

## ベース URL

```
http://localhost:3000/api/v1
```

## 認証

すべての API リクエストには Bearer トークンが必要です。

```
Authorization: Bearer <token>
```

## レスポンス形式

```json
{
  "status": "success",
  "data": { ... }
}
```
