---
title: Getting Started
---

# Getting Started

このページは、Docs Hub を初めて使う人向けの手順書です。
上から順に実行すれば、ローカル表示と運用開始まで進められます。

## 対象読者

- Hub 利用者
- 各プロジェクトのドキュメント管理者
- Hub の運用担当者

## 前提

- Git / Node.js / npm が使えること
- （任意）`gh` コマンドが使えること

## まずはローカル表示（Quick Start）

1. Hub を clone

```bash
git clone https://github.com/SoggyKakip/vitepress-docs-hub.git
cd vitepress-docs-hub
```

2. submodule を取得

```bash
git submodule sync --recursive
git submodule update --init --recursive
```

- `git submodule sync --recursive`
  - `.gitmodules` の URL 設定をローカル submodule 設定へ同期します。
- `git submodule update --init --recursive`
  - 未初期化 submodule を初期化し、親リポジトリが指す固定 SHA を再帰的に checkout します。

3. 依存関係をインストール

```bash
npm ci
```

4. 起動

```bash
npm run docs:dev
```

5. ブラウザで確認

- `http://localhost:5173/`

---

## Use Case 1: 新規プロジェクトを追加する

目的:
- 新しい docs リポジトリを作成し、Hub に集約する

手順:

1. ひな形を生成

```powershell
./scripts/new-project.ps1
```

2. 生成されたプロジェクトを GitHub に作成して push

`gh` を使う場合:

```bash
cd <generated-project-dir>
git init
git add .
git commit -m "chore: bootstrap docs project"
gh repo create <owner>/<repo> --private --source . --remote origin --push
```

3. プロジェクト側に Secret を設定

- `HUB_REPO_DISPATCH_TOKEN`

`gh` を使う場合:

```bash
gh secret set HUB_REPO_DISPATCH_TOKEN --repo <owner>/<repo>
```

4. Hub 側に初回 submodule 登録

```bash
git submodule add https://github.com/<owner>/<repo>.git docs/project-docs/<repo>
git add .gitmodules docs/project-docs/<repo>
git commit -m "chore(submodule): add <repo>"
git push
```

完了条件:
- Hub 上でプロジェクトが表示される

---

## Use Case 2: 既存プロジェクトのドキュメントを更新する

目的:
- 各 docs repo の更新を Hub に自動反映する

手順:

1. 各 docs repo で編集して `main` または `master` に push
2. プロジェクト側 Actions が `repository_dispatch` を Hub に送信
3. Hub 側 Actions が対象 submodule を更新し、自動 PR を作成
4. Hub の PR をマージ

完了条件:
- GitHub Pages 上の Hub が更新される

---

## Use Case 3: Hub 自体を更新する

目的:
- ナビゲーション、サイドバー、CI、共通ページなどを更新する

手順:

1. `vitepress-docs-hub` で変更
2. PR 作成・レビュー
3. `main` にマージ
4. Pages のデプロイ結果を確認

完了条件:
- 変更が公開サイトに反映される

---

## submodule を手動で最新化したい場合

特定プロジェクトだけ更新:

```bash
git submodule sync --recursive
git submodule update --init --recursive
git submodule update --remote -- docs/project-docs/<repo>
```

全 submodule を更新:

```bash
git submodule update --remote --recursive
```

---

## 必要な設定

プロジェクト側（dispatch 送信）:
- Secret: `HUB_REPO_DISPATCH_TOKEN`
- Token 権限（fine-grained PAT）:
- `Contents: Read and write`
- `Metadata: Read`

Hub 側（PR 作成）:
- Actions > Workflow permissions: `Read and write permissions`
- `Allow GitHub Actions to create and approve pull requests`: ON

---

## よくあるエラー

- `Parameter token or opts.auth is required`
- 原因: `HUB_REPO_DISPATCH_TOKEN` 未設定

- `GitHub Actions is not permitted to create or approve pull requests`
- 原因: Hub 側で PR 作成許可が OFF

- `repository not found`（submodule clone）
- 原因: `.gitmodules` の URL 誤り、または対象 repo 未作成/権限不足
