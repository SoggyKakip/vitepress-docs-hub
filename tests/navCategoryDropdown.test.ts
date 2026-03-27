import { describe, it, expect } from 'vitest'
import { buildNavItems } from '../docs/.vitepress/navBuilder'
import type { NavItem, NavItemWithChildren } from '../docs/.vitepress/navBuilder'
import type { DocProject } from '../docs/.vitepress/docProject'

describe('buildNavItems: カテゴリ対応ドロップダウン', () => {
  it('カテゴリ付きプロジェクトはドロップダウンにグループ化される', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'Project A', path: '/a/', category: 'Cat1' },
      { name: 'b', label: 'Project B', path: '/b/', category: 'Cat1' },
    ]
    const result = buildNavItems(projects)
    expect(result).toHaveLength(1)
    const dropdown = result[0] as NavItemWithChildren
    expect(dropdown.text).toBe('Cat1')
    expect(dropdown.items).toHaveLength(2)
    expect(dropdown.items[0]).toEqual({ text: 'Project A', link: '/a/' })
    expect(dropdown.items[1]).toEqual({ text: 'Project B', link: '/b/' })
  })

  it('カテゴリなしプロジェクトはフラットリンクとして返される', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'Project A', path: '/a/' },
      { name: 'b', label: 'Project B', path: '/b/' },
    ]
    const result = buildNavItems(projects)
    expect(result).toHaveLength(2)
    for (const item of result) {
      expect('link' in item).toBe(true)
    }
  })

  it('カテゴリ付きとカテゴリなしが混在する場合、ドロップダウンが先に来る', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'Flat A', path: '/a/' },
      { name: 'b', label: 'Cat B', path: '/b/', category: 'Tools' },
      { name: 'c', label: 'Flat C', path: '/c/' },
    ]
    const result = buildNavItems(projects)
    // ドロップダウン1つ + フラット2つ = 3
    expect(result).toHaveLength(3)
    // 最初はドロップダウン
    const dropdown = result[0] as NavItemWithChildren
    expect(dropdown.text).toBe('Tools')
    expect(dropdown.items).toHaveLength(1)
    // 残りはフラット
    expect((result[1] as NavItem).link).toBe('/a/')
    expect((result[2] as NavItem).link).toBe('/c/')
  })

  it('複数カテゴリはそれぞれ別のドロップダウンになる', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/', category: 'Cat1' },
      { name: 'b', label: 'B', path: '/b/', category: 'Cat2' },
      { name: 'c', label: 'C', path: '/c/', category: 'Cat1' },
    ]
    const result = buildNavItems(projects)
    expect(result).toHaveLength(2)
    const cat1 = result[0] as NavItemWithChildren
    expect(cat1.text).toBe('Cat1')
    expect(cat1.items).toHaveLength(2)
    const cat2 = result[1] as NavItemWithChildren
    expect(cat2.text).toBe('Cat2')
    expect(cat2.items).toHaveLength(1)
  })

  it('空配列を渡すと空配列が返る', () => {
    expect(buildNavItems([])).toEqual([])
  })
})
