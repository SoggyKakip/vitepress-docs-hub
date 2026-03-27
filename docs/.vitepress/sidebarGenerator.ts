/**
 * サイドバー自動生成ユーティリティ
 *
 * ファイルシステムを走査し、各 DocProject のサイドバー構造を自動生成する。
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import type { DocProject } from './docProject'

/** サイドバー項目 */
export interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
  order?: number // ソート用（内部使用）
}

/** サイドバー設定（パスをキーとした辞書） */
export interface SidebarConfig {
  [path: string]: SidebarItem[]
}

/**
 * DocProject 配列からサイドバー設定を生成する。
 *
 * 事前条件:
 * - docsRoot は存在する有効なディレクトリパス
 * - projects は1つ以上の DocProject を含む配列
 *
 * 事後条件:
 * - 返却値は各プロジェクトパスをキーとした SidebarConfig オブジェクト
 * - .md ファイル（index.md 除く）のみがリンク対象
 * - order frontmatter がある場合はその順序でソート
 */
export function generateSidebar(
  docsRoot: string,
  projects: DocProject[],
): SidebarConfig {
  const config: SidebarConfig = {}

  // タスク 9.4: トップページ用サイドバーを追加
  config['/'] = buildHomeSidebar(projects)

  for (const project of projects) {
    const projectDir = path.join(docsRoot, project.name)

    // タスク 6.1 / 6.2: 空ディレクトリ・未取得サブモジュールの検出
    if (!fs.existsSync(projectDir)) {
      console.warn(
        `[docs-hub] Warning: Project directory "${project.name}" does not exist at ${projectDir}. ` +
        `Run: git submodule update --init --recursive`,
      )
      config[project.path] = []
      continue
    }

    const entries = fs.readdirSync(projectDir)
    if (entries.length === 0) {
      console.warn(
        `[docs-hub] Warning: Project directory "${project.name}" is empty (submodule not initialized?). ` +
        `Run: git submodule update --init --recursive`,
      )
      config[project.path] = []
      continue
    }

    config[project.path] = scanDirectory(projectDir, project.path)
  }

  return config
}

/**
 * トップページ用サイドバーを生成する。
 *
 * - 全プロジェクトをカテゴリ別にグルーピング
 * - カテゴリがあるプロジェクトはカテゴリ名のグループ配下に配置
 * - カテゴリがないプロジェクトは「その他」グループに配置
 * - 各プロジェクトは label と path（index.md へのリンク）で表示
 */
export function buildHomeSidebar(projects: DocProject[]): SidebarItem[] {
  const categoryMap = new Map<string, SidebarItem[]>()
  const categoryOrder: string[] = []

  for (const project of projects) {
    const category = project.category ?? 'その他'
    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
      categoryOrder.push(category)
    }
    categoryMap.get(category)!.push({
      text: project.label,
      link: project.path,
    })
  }

  return categoryOrder.map((category) => ({
    text: category,
    items: categoryMap.get(category)!,
    collapsed: false,
  }))
}


/**
 * ディレクトリを再帰的に走査し、SidebarItem 配列を生成する。
 *
 * - .md ファイル（index.md 除く）をリンク項目として追加
 * - サブディレクトリはネストされたサイドバーグループとして表現
 * - ディレクトリ名はタイトルケースに変換
 * - frontmatter の title / order を読み取り
 */
export function scanDirectory(dir: string, basePath: string): SidebarItem[] {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const items: SidebarItem[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const children = scanDirectory(
        path.join(dir, entry.name),
        `${basePath}${entry.name}/`,
      )
      if (children.length > 0) {
        items.push({
          text: toTitleCase(entry.name),
          items: children,
          collapsed: false,
        })
      }
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const filePath = path.join(dir, entry.name)
      const { title, order } = parseFrontmatter(filePath)
      const stem = entry.name.replace(/\.md$/, '')
      items.push({
        text: title ?? toTitleCase(stem),
        link: `${basePath}${stem}`,
        order,
      })
    }
  }

  return items.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

/**
 * Markdown ファイルの frontmatter から title と order を読み取る。
 *
 * - title がある場合はその値を返す
 * - order が有効な数値の場合はその値を返す
 * - パースエラーや不正値の場合はデフォルト値にフォールバック
 */
export function parseFrontmatter(filePath: string): {
  title: string | undefined
  order: number
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)

    const title =
      typeof data.title === 'string' && data.title.length > 0
        ? data.title
        : undefined

    let order = Infinity
    if (data.order !== undefined && data.order !== null) {
      const parsed = Number(data.order)
      if (Number.isFinite(parsed)) {
        order = parsed
      }
    }

    return { title, order }
  } catch {
    return { title: undefined, order: Infinity }
  }
}

/**
 * 文字列をタイトルケースに変換する（先頭大文字）。
 * ハイフンやアンダースコアはスペースに変換。
 */
export function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
