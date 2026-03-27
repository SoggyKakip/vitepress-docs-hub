/**
 * ナビゲーション生成ユーティリティ
 */
import type { DocProject } from './docProject'

/** フラットなナビゲーション項目 */
export interface NavItem {
  text: string
  link: string
}

/** ドロップダウン（子項目付き）ナビゲーション項目 */
export interface NavItemWithChildren {
  text: string
  items: { text: string; link: string }[]
}

/**
 * DocProject 配列からナビゲーション項目を生成する。
 *
 * - カテゴリが設定されているプロジェクトはカテゴリ名でグループ化し、
 *   VitePress のドロップダウンメニュー形式（NavItemWithChildren）で返す
 * - カテゴリが未設定のプロジェクトはフラットなリンク（NavItem）として返す
 * - カテゴリグループの出現順は、そのカテゴリに属する最初のプロジェクトの入力順に従う
 */
export function buildNavItems(projects: DocProject[]): (NavItem | NavItemWithChildren)[] {
  const result: (NavItem | NavItemWithChildren)[] = []
  const categoryMap = new Map<string, { text: string; link: string }[]>()
  const categoryOrder: string[] = []

  for (const project of projects) {
    if (project.category) {
      if (!categoryMap.has(project.category)) {
        categoryMap.set(project.category, [])
        categoryOrder.push(project.category)
      }
      categoryMap.get(project.category)!.push({
        text: project.label,
        link: project.path,
      })
    } else {
      result.push({
        text: project.label,
        link: project.path,
      })
    }
  }

  // カテゴリグループをドロップダウンとして追加
  const dropdowns: NavItemWithChildren[] = categoryOrder.map((category) => ({
    text: category,
    items: categoryMap.get(category)!,
  }))

  return [...dropdowns, ...result]
}
