/**
 * Project / Docs Hub 型定義
 */

/** アプリ内で使用する正規化済みプロジェクトモデル */
export interface DocProject {
  /** プロジェクト識別名（英数字・ハイフンのみ） */
  name: string
  /** サイト内URL（例: "/project-docs/test-doc/"） */
  path: string
  /** ナビゲーション表示名 */
  label: string
  /** カテゴリ名（ナビドロップダウン・サイドバーグルーピング用） */
  category?: string
  /** 説明（Feature カード用） */
  description?: string
  /** 元リポジトリURL（参照用） */
  repoUrl?: string
}

/** index.md frontmatter 由来の入力メタデータ（すべて任意） */
export interface ProjectFrontmatter {
  title?: string
  category?: string
  description?: string
}

/** .gitmodules 等から解決したプロジェクトリポジトリ入力 */
export interface ProjectRepository {
  /** submodule のパス（例: "docs/project-docs/test-doc"） */
  submodulePath: string
  /** リポジトリURL（https 推奨） */
  url: string
}
