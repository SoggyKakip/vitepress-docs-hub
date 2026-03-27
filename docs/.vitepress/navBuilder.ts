/**
 * ナビゲーション生成ユーティリティ
 */
import type { DocProject } from './docProject'

/** ナビゲーション項目 */
export interface NavItem {
  text: string
  link: string
}

/**
 * DocProject 配列からナビゲーション項目を生成する。
 *
 * 事前条件: projects は空でない配列
 * 事後条件:
 * - 返却値は projects と同数の NavItem を含む配列
 * - 各 NavItem.link は対応するプロジェクトの index.md パスを指す
 * - 表示順は projects 配列の順序に従う
 */
export function buildNavItems(projects: DocProject[]): NavItem[] {
  return projects.map((project) => ({
    text: project.label,
    link: project.path,
  }))
}
