import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { DefaultTheme } from 'vitepress'
import { buildProjectsDropdown } from '../docs/.vitepress/config-builder/navBuilder'
import type { DocProject } from '../docs/.vitepress/config-builder/types'

const docProjectArb: fc.Arbitrary<DocProject> = fc
  .record({
    name: fc
      .array(
        fc.mapToConstant(
          { num: 26, build: (v) => String.fromCharCode(0x61 + v) },
          { num: 10, build: (v) => String.fromCharCode(0x30 + v) },
          { num: 1, build: () => '-' },
        ),
        { minLength: 1, maxLength: 30 },
      )
      .map((chars) => chars.join('')),
    label: fc.string({ minLength: 1, maxLength: 50 }),
    path: fc
      .array(
        fc.mapToConstant(
          { num: 26, build: (v) => String.fromCharCode(0x61 + v) },
          { num: 10, build: (v) => String.fromCharCode(0x30 + v) },
          { num: 1, build: () => '-' },
        ),
        { minLength: 1, maxLength: 20 },
      )
      .map((chars) => '/' + chars.join('') + '/'),
    category: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  })
  .map(({ name, label, path, category }) => ({ name, label, path, category }))

describe('buildProjectsDropdown', () => {
  it('returns a single dropdown with text "プロジェクト"', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/', category: 'Cat1' },
    ]
    const result = buildProjectsDropdown(projects)
    expect(result.text).toBe('プロジェクト')
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('PBT: all projects appear in the dropdown items', () => {
    fc.assert(
      fc.property(
        fc.array(docProjectArb, { minLength: 1, maxLength: 20 }),
        (projects) => {
          const result = buildProjectsDropdown(projects)
          const allLinks = collectDropdownLinks(result)
          for (const p of projects) {
            expect(allLinks).toContain(p.path)
          }
        },
      ),
    )
  })

  it('groups projects by category with category text as header', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/', category: 'テスト' },
      { name: 'b', label: 'B', path: '/b/', category: 'ツール' },
    ]
    const result = buildProjectsDropdown(projects)
    expect(result.items[0]).toMatchObject({ text: 'テスト' })
    expect(result.items[1]).toMatchObject({ text: 'ツール' })
  })

  it('uncategorized projects appear without category header', () => {
    const projects: DocProject[] = [
      { name: 'a', label: 'A', path: '/a/' },
    ]
    const result = buildProjectsDropdown(projects)
    const firstGroup = result.items[0]
    expect(firstGroup).not.toHaveProperty('text')
    expect(hasNestedItems(firstGroup)).toBe(true)
    if (!hasNestedItems(firstGroup)) {
      throw new Error('Expected uncategorized group to contain nested items.')
    }
    const firstItem = firstGroup.items[0]
    expect(hasLink(firstItem)).toBe(true)
    if (!hasLink(firstItem)) {
      throw new Error('Expected first uncategorized item to have a link.')
    }
    expect(firstItem.link).toBe('/a/')
  })
})

type NavNodeLike = {
  link?: string
  items?: NavNodeLike[]
}

function collectDropdownLinks(dropdown: DefaultTheme.NavItemWithChildren): string[] {
  return dropdown.items.flatMap((item) => collectLinksFromNode(item as NavNodeLike))
}

function collectLinksFromNode(node: NavNodeLike): string[] {
  const ownLink = node.link ? [node.link] : []
  if (!node.items) {
    return ownLink
  }
  return [...ownLink, ...node.items.flatMap(collectLinksFromNode)]
}

function hasNestedItems(
  item: DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren | DefaultTheme.NavItemWithChildren,
): item is DefaultTheme.NavItemChildren | DefaultTheme.NavItemWithChildren {
  return 'items' in item && Array.isArray(item.items)
}

function hasLink(
  item: DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren | DefaultTheme.NavItemWithChildren,
): item is DefaultTheme.NavItemWithLink {
  return 'link' in item && typeof item.link === 'string'
}
