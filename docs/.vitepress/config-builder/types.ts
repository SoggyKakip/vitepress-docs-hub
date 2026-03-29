/**
 * DocProject 型定義
 */

/** projects.json の各プロジェクトエントリ（category は JSON 構造から導出） */
export interface ProjectEntry {
  name: string
  label: string
  description?: string
  icon?: string
}

/** projects.json のルート構造: { カテゴリ名: ProjectEntry[] } */
export interface ProjectsConfig {
  [category: string]: ProjectEntry[]
}

/** ドキュメントプロジェクトの設定（内部で使用） */
export interface DocProject {
  /** プロジェクト識別名（英数字・ハイフンのみ） */
  name: string
  /** ナビゲーション表示名 */
  label: string
  /** サイト内URL（例: "/project-docs/test-doc/"） */
  path: string
  /** 元リポジトリURL（参照用、省略可能） */
  repoUrl?: string
  /** カテゴリ名（ナビドロップダウン・サイドバーグルーピング用、省略可能） */
  category?: string
  /** 説明（Feature カード用、省略可能） */
  description?: string
  /** アイコン（Feature カード用、省略可能） */
  icon?: string
}
