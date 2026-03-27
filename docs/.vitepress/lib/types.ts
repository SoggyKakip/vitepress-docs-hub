/**
 * DocProject 型定義とバリデーション
 */

/** ドキュメントプロジェクトの設定 */
export interface DocProject {
  /** プロジェクト識別名（英数字・ハイフンのみ） */
  name: string
  /** ナビゲーション表示名 */
  label: string
  /** docs/ 配下の相対パス（例: "/test-doc/"） */
  path: string
  /** 元リポジトリURL（参照用、省略可能） */
  repoUrl?: string
  /** カテゴリ名（ナビドロップダウン・サイドバーグルーピング用、省略可能） */
  category?: string
}

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * name フィールドが英数字・ハイフンのみであることを検証する
 */
export function validateName(name: string): ValidationResult {
  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    return {
      valid: false,
      errors: [
        `Invalid name "${name}": name must contain only alphanumeric characters and hyphens.`,
      ],
    }
  }
  return { valid: true, errors: [] }
}

/**
 * path フィールドが `/` で始まり `/` で終わることを検証する
 */
export function validatePath(path: string): ValidationResult {
  const errors: string[] = []
  if (!path.startsWith('/')) {
    errors.push(`Invalid path "${path}": path must start with "/".`)
  }
  if (!path.endsWith('/')) {
    errors.push(`Invalid path "${path}": path must end with "/".`)
  }
  return { valid: errors.length === 0, errors }
}

/**
 * DocProject 全体のバリデーション
 */
export function validateDocProject(project: DocProject): ValidationResult {
  const nameResult = validateName(project.name)
  const pathResult = validatePath(project.path)
  const errors = [...nameResult.errors, ...pathResult.errors]
  return { valid: errors.length === 0, errors }
}
