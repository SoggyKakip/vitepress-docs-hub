---
title: デプロイガイド
order: 1
---

# デプロイガイド

## Docker でデプロイ

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t test-project .
docker run -p 3000:3000 test-project
```

## 環境別設定

- 開発: `config.development.json`
- ステージング: `config.staging.json`
- 本番: `config.production.json`
