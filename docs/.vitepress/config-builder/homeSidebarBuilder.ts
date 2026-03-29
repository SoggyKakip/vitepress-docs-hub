/**
 * トップページ用サイドバー生成
 * - docs/ 直下の .md ファイル（トップ層ページ）
 * - カテゴリ別プロジェクト一覧
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type { DocProject } from './types'

type SidebarItem = DefaultTheme.SidebarItem

/**
 * docs/ 直下の .md ファイル + プロジェクト一覧からサイドバーを生成する。
 */
export function buildHomeSidebar(docsRoot: string, projects: DocProject[]): SidebarItem[] {
  const topPages = scanTopPages(docsRoot)
  const projectGroups = groupByCategory(projects)
  return [...topPages, ...projectGroups]
}

/**
 * docs/ 直下の .md ファイルを走査してサイドバー項目を生成する。
 * index.md は除外。frontmatter の title があればそれを使用。
 */
function scanTopPages(docsRoot: string): SidebarItem[] {
  if (!fs.existsSync(docsRoot)) return []

  return fs.readdirSync(docsRoot)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort((a, b) => a.localeCompare(b))
    .map(f => {
      const filePath = path.join(docsRoot, f)
      const stem = f.replace(/\.md$/, '')
      let text = stem.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data } = matter(content)
        if (typeof data.title === 'string' && data.title.length > 0) {
          text = data.title
        }
      } catch { /* frontmatter 読み取り失敗時はファイル名を使用 */ }

      return { text, link: `/${stem}` }
    })
}

/**
 * projects 配列からカテゴリ別にグルーピングしたサイドバーを生成する。
 */
function groupByCategory(projects: DocProject[]): SidebarItem[] {
  const grouped = new Map<string, { text: string; link: string }[]>()
  for (const p of projects) {
    const cat = p.category ?? 'その他'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push({ text: p.label, link: p.path })
  }
  return [...grouped.entries()].map(([cat, items]) => ({
    text: cat,
    collapsed: false,
    items,
  }))
}
