/**
 * トップページ用サイドバー生成（カテゴリ別プロジェクト一覧）
 */
import type { DocProject } from './types'

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * projects 配列からカテゴリ別にグルーピングしたサイドバーを生成する。
 * カテゴリ未指定のプロジェクトは「その他」グループに配置。
 */
export function buildHomeSidebar(projects: DocProject[]): SidebarItem[] {
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
