import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { buildNavItems } from '../docs/.vitepress/lib/navBuilder'
import type { DocProject } from '../docs/.vitepress/lib/types'

/**
 * 有効な DocProject を生成する arbitrary
 */
const docProjectArb: fc.Arbitrary<DocProject> = fc
  .record({
    name: fc
      .array(
        fc.mapToConstant(
          { num: 26, build: (v) => String.fromCharCode(0x61 + v) }, // a-z
          { num: 10, build: (v) => String.fromCharCode(0x30 + v) }, // 0-9
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
  })
  .map(({ name, label, path }) => ({ name, label, path }))

const docProjectListArb = fc.array(docProjectArb, {
  minLength: 1,
  maxLength: 20,
})

/**
 * Property 1: ナビゲーション項目数の一致
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * *For any* DocProject リストに対して、生成されるナビゲーション項目数はプロジェクト数と一致し、
 * 各リンクは対応する index.md パスを指す。
 */
describe('Property 1: ナビゲーション項目数の一致', () => {
  it('🧪 4.2.1 PBT: 生成されるナビゲーション項目数はプロジェクト数と一致し、各リンクは対応する index.md パスを指す', () => {
    fc.assert(
      fc.property(docProjectListArb, (projects) => {
        const navItems = buildNavItems(projects)

        // 項目数がプロジェクト数と一致する
        expect(navItems).toHaveLength(projects.length)

        // 各リンクは対応するプロジェクトの path を指す
        for (let i = 0; i < projects.length; i++) {
          expect(navItems[i].link).toBe(projects[i].path)
          expect(navItems[i].text).toBe(projects[i].label)
        }
      }),
    )
  })
})

/**
 * Property 2: ナビゲーション順序の保存
 * **Validates: Requirement 3.4**
 *
 * *For any* 順序付き DocProject リストに対して、生成されるナビゲーション項目の順序は
 * 入力リストの順序と一致する。
 */
describe('Property 2: ナビゲーション順序の保存', () => {
  it('🧪 4.2.2 PBT: 生成されるナビゲーション項目の順序は入力リストの順序と一致する', () => {
    fc.assert(
      fc.property(docProjectListArb, (projects) => {
        const navItems = buildNavItems(projects)

        // 各ナビゲーション項目が入力順序と一致する
        const navLabels = navItems.map((item) => item.text)
        const projectLabels = projects.map((p) => p.label)
        expect(navLabels).toEqual(projectLabels)

        const navLinks = navItems.map((item) => item.link)
        const projectPaths = projects.map((p) => p.path)
        expect(navLinks).toEqual(projectPaths)
      }),
    )
  })
})
