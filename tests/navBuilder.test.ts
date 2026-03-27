import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
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
          // Flatten all links from groups
          const allLinks = result.items.flatMap((group: any) =>
            group.items ? group.items.map((i: any) => i.link) : [group.link]
          )
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
    expect(result.items[0]).not.toHaveProperty('text')
    expect((result.items[0] as any).items[0].link).toBe('/a/')
  })
})
