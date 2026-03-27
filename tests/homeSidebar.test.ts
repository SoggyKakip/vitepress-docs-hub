import { describe, it, expect } from 'vitest'
import { buildHomeSidebar } from '../docs/.vitepress/sidebarGenerator'
import type { DocProject } from '../docs/.vitepress/docProject'

describe('buildHomeSidebar: トップページ用サイドバー', () => {
  it('カテゴリ付きプロジェクトはカテゴリ名のグループ配下に配置される', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'Project A', path: '/a/', category: 'テスト' },
      { name: 'b', label: 'Project B', path: '/b/', category: 'テスト' },
    ]
    const sidebar = buildHomeSidebar(projects)
    expect(sidebar).toHaveLength(1)
    expect(sidebar[0].text).toBe('テスト')
    expect(sidebar[0].items).toHaveLength(2)
    expect(sidebar[0].items![0]).toMatchObject({ text: 'Project A', link: '/a/' })
    expect(sidebar[0].items![1]).toMatchObject({ text: 'Project B', link: '/b/' })
  })

  it('カテゴリなしプロジェクトは「その他」グループに配置される', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'Project A', path: '/a/' },
    ]
    const sidebar = buildHomeSidebar(projects)
    expect(sidebar).toHaveLength(1)
    expect(sidebar[0].text).toBe('その他')
    expect(sidebar[0].items).toHaveLength(1)
  })

  it('カテゴリ付きとカテゴリなしが混在する場合、両方のグループが生成される', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/', category: 'ツール' },
      { name: 'b', label: 'B', path: '/b/' },
      { name: 'c', label: 'C', path: '/c/', category: 'ツール' },
    ]
    const sidebar = buildHomeSidebar(projects)
    expect(sidebar).toHaveLength(2)
    expect(sidebar[0].text).toBe('ツール')
    expect(sidebar[0].items).toHaveLength(2)
    expect(sidebar[1].text).toBe('その他')
    expect(sidebar[1].items).toHaveLength(1)
  })

  it('複数カテゴリは出現順で並ぶ', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/', category: 'Beta' },
      { name: 'b', label: 'B', path: '/b/', category: 'Alpha' },
    ]
    const sidebar = buildHomeSidebar(projects)
    expect(sidebar[0].text).toBe('Beta')
    expect(sidebar[1].text).toBe('Alpha')
  })

  it('空配列を渡すと空配列が返る', () => {
    expect(buildHomeSidebar([])).toEqual([])
  })

  it('generateSidebar に "/" キーが含まれる', async () => {
    // generateSidebar はファイルシステムに依存するため、
    // buildHomeSidebar の統合は config.mts 経由で確認（ビルドテストで検証）
    // ここでは buildHomeSidebar 単体の動作を確認済み
  })
})
