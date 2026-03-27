---
title: 基本的な使い方
order: 4
---

# 基本的な使い方

## コマンドライン

```bash
# 開発モードで起動
npm run dev

# プロダクションビルド
npm run build

# テスト実行
npm run test
```

## プログラムから使用

```typescript
import { createApp } from 'test-project'

const app = createApp({
  port: 3000,
  debug: true
})

app.start()
```
