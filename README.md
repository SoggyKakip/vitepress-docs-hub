# VitePress Docs Hub

複数プロジェクトのドキュメントを 1 つの VitePress サイトに集約するためのドキュメントハブです。  
`project-docs` 配下を自動検出し、ナビゲーションとサイドバーを構築します。

## 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [使い方](#使い方)
- [ドキュメント追加手順](#ドキュメント追加手順)
- [開発者向け情報](#開発者向け情報)
- [要件と設計](#要件と設計)

## 概要

このリポジトリは、以下を目的としたドキュメント基盤です。

- 複数プロジェクトのドキュメントを単一サイトで横断閲覧する
- プロジェクト一覧ナビゲーションを設定ファイルから自動生成する
- 各プロジェクトのサイドバーをドキュメント構造から自動生成する

## 主な機能

- `docs/project-docs/` 配下のプロジェクトを自動検出
- カテゴリ付きの「プロジェクト」ドロップダウンを自動生成
- `.gitmodules` からリポジトリURLを解決し、「Repositories」ドロップダウンを自動生成
- `vitepress-sidebar` によるプロジェクト別サイドバー自動生成
- トップページ向けサイドバー（`docs/` 直下ページ + カテゴリ別プロジェクト一覧）を自動生成

## 技術スタック

- [VitePress](https://vitepress.dev/)
- [vitepress-sidebar](https://www.npmjs.com/package/vitepress-sidebar)
- TypeScript (`.mts` / `.ts`)
- [gray-matter](https://www.npmjs.com/package/gray-matter)
- [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.dev/)

## 使い方

### 1. 前提

- Node.js 20 以上を推奨
- npm
- Git submodule を利用する場合は Git 2.3+ を推奨

### 2. セットアップ

```bash
git clone <your-repo-url>
cd vitepress-docs-hub
git submodule update --init --recursive
npm install
```

### 3. ローカル起動

```bash
npm run docs:dev
```

起動後、表示された URL（通常 `http://localhost:5173`）を開いて確認します。

### 4. 本番ビルド

```bash
npm run docs:build
```

### 5. ビルド結果プレビュー

```bash
npm run docs:preview
```

### 6. テスト実行（任意）

`package.json` に test script は未定義のため、直接 Vitest を実行します。

```bash
npx vitest run
```

## ドキュメント追加手順

### 運用方針（推奨）

各ドキュメントは **独立した Git リポジトリ** で管理し、このハブには `docs/project-docs/<project-name>` として **Git submodule** で取り込みます。

### 追加手順（独立リポジトリ）

1. ドキュメント用の新規リポジトリを作成し、`index.md` を含む構成を用意する
2. ハブに submodule として追加する

```bash
git submodule add <doc-repo-url> docs/project-docs/<project-name>
git submodule update --init --recursive
```

3. `npm run docs:dev` でナビゲーションとサイドバーを確認する

### 更新手順（既存 submodule）

```bash
git submodule update --remote --recursive
```

必要に応じて対象 submodule ディレクトリでブランチ/タグを固定してください。

### 削除手順（submodule）

```bash
git submodule deinit -f docs/project-docs/<project-name>
git rm docs/project-docs/<project-name>
```

### frontmatter での表示制御（任意）

`docs/project-docs/<project-name>/index.md` の frontmatter で表示情報を指定できます。  
未指定でもエラーにはならず、ディレクトリ名から自動補完されます。

```md
---
title: My Project
category: ツール
description: プロジェクト説明
icon: 🛠️
---
```

### 注意点

- `docs/project-docs/` 直下に新しいディレクトリを追加すると、未登録であっても自動検出されてナビゲーションに出ます
- `index.md` の frontmatter から `title/category/description/icon` を読み取ります（無くても可）
- submodule の URL が `.gitmodules` に設定されていると、上部ナビの `Repositories` から各リポジトリへ移動できます

## 開発者向け情報

### 主要ディレクトリ

```text
.
├─ docs/
│  ├─ .vitepress/
│  │  ├─ config.mts
│  │  └─ config-builder/
│  │     ├─ types.ts
│  │     ├─ validators.ts
│  │     ├─ projectCatalog.ts
│  │     ├─ projectDiscovery.ts
│  │     ├─ projectFrontmatter.ts
│  │     ├─ projectRepository.ts
│  │     ├─ navBuilder.ts
│  │     └─ rootSidebarBuilder.ts
│  └─ project-docs/
│     └─ <project-name>/
└─ tests/
   ├─ docProject.test.ts
   └─ navBuilder.test.ts
```

### サブモジュール運用

このリポジトリは `docs/project-docs/test-doc` と `docs/project-docs/vscode-iris-connection` を Git submodule として参照します。  
クローン直後は `git submodule update --init --recursive` を実行してください。

## 要件と設計

- 要件定義: [REQUIREMENTS.md](./REQUIREMENTS.md)
- 設計詳細: [ARCHITECTURE.md](./ARCHITECTURE.md)
