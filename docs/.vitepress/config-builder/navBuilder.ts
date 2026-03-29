/**
 * ナビゲーション生成ユーティリティ
 *
 * VitePress DefaultTheme の NavItem 型に準拠:
 * - NavItemWithLink: { text, link }
 * - NavItemChildren: { text?, items: NavItemWithLink[] } ← カテゴリ見出し付きグループ
 * - NavItemWithChildren: { text?, items: (NavItemChildren | NavItemWithLink)[] } ← ドロップダウン
 */
import type { DefaultTheme } from 'vitepress'
import type { DocProject } from './types'

/**
 * DocProject 配列から「プロジェクト」ドロップダウンを生成する。
 *
 * 出力形式:
 * {
 *   text: 'プロジェクト',
 *   items: [
 *     { text: 'カテゴリA', items: [{ text: 'プロジェクト1', link: '...' }] },
 *     { text: 'カテゴリB', items: [{ text: 'プロジェクト2', link: '...' }] },
 *   ]
 * }
 */
export function buildProjectsDropdown(projects: DocProject[]): DefaultTheme.NavItemWithChildren {
  const groups: DefaultTheme.NavItemChildren[] = []
  const categoryMap = new Map<string, DefaultTheme.NavItemWithLink[]>()
  const categoryOrder: string[] = []
  const uncategorized: DefaultTheme.NavItemWithLink[] = []

  for (const project of projects) {
    const link: DefaultTheme.NavItemWithLink = {
      text: project.label,
      link: project.path,
    }
    if (project.category) {
      if (!categoryMap.has(project.category)) {
        categoryMap.set(project.category, [])
        categoryOrder.push(project.category)
      }
      categoryMap.get(project.category)!.push(link)
    } else {
      uncategorized.push(link)
    }
  }

  // カテゴリ付きグループ
  for (const category of categoryOrder) {
    groups.push({
      text: category,
      items: categoryMap.get(category)!,
    })
  }

  // カテゴリなしプロジェクト
  if (uncategorized.length > 0) {
    groups.push({
      items: uncategorized,
    })
  }

  return {
    text: 'プロジェクト',
    items: groups,
  }
}

export function buildRepositoriesDropdown(
  projects: DocProject[],
): DefaultTheme.NavItemWithChildren | undefined {
  const items: DefaultTheme.NavItemWithLink[] = projects
    .filter(hasRepoUrl)
    .map((project) => ({
      text: project.label,
      link: project.repoUrl,
      target: '_blank',
      rel: 'noreferrer',
    }))

  if (items.length === 0) {
    return undefined
  }

  return {
    text: 'Repositories',
    items,
  }
}

function hasRepoUrl(project: DocProject): project is DocProject & { repoUrl: string } {
  return typeof project.repoUrl === 'string' && project.repoUrl.length > 0
}
