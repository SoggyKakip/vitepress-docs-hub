import { describe, it, expect, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  generateSidebar,
} from '../docs/.vitepress/sidebarGenerator'
import type { SidebarItem } from '../docs/.vitepress/sidebarGenerator'
import type { DocProject } from '../docs/.vitepress/docProject'

// ── helpers ──────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'err-test-'))
}

function rmDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

function collectLinks(items: SidebarItem[]): string[] {
  const links: string[] = []
  for (const item of items) {
    if (item.link) links.push(item.link)
    if (item.items) links.push(...collectLinks(item.items))
  }
  return links
}

// ── arbitraries ──────────────────────────────────────────

const safeNameArb = fc
  .array(
    fc.integer({ min: 0, max: 25 }).map((v) => String.fromCharCode(0x61 + v)),
    { minLength: 1, maxLength: 10 },
  )
  .map((chars) => chars.join(''))

// ── Property 9: 空ディレクトリ時のサイドバー生成継続 ────

/**
 * Property 9: 空ディレクトリ時のサイドバー生成継続
 * **Validates: Requirement 6.2**
 *
 * *For any* DocProject リストにおいて、一部のディレクトリが空でも、
 * 空でないプロジェクトのサイドバーは正常に生成される。
 */
describe('Property 9: 空ディレクトリ時のサイドバー生成継続', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) rmDir(d)
    tmpDirs.length = 0
  })

  it('🧪 6.3.1 PBT: 一部のディレクトリが空でも、空でないプロジェクトのサイドバーは正常に生成される', () => {
    // プロジェクト定義: 名前とファイルリスト、空フラグ
    const projectSpecArb = fc.record({
      name: safeNameArb,
      files: fc.array(safeNameArb, { minLength: 1, maxLength: 4 }),
      empty: fc.boolean(),
    })

    fc.assert(
      fc.property(
        fc.array(projectSpecArb, { minLength: 2, maxLength: 5 }),
        (projectSpecs) => {
          const tmpDir = makeTmpDir()
          tmpDirs.push(tmpDir)

          // ユニークなプロジェクト名にする
          const seen = new Set<string>()
          const uniqueSpecs = projectSpecs.filter((s) => {
            if (seen.has(s.name)) return false
            seen.add(s.name)
            return true
          })

          // 少なくとも1つは空、1つは空でないことを保証
          if (uniqueSpecs.length < 2) return // skip trivial
          uniqueSpecs[0].empty = true
          uniqueSpecs[uniqueSpecs.length - 1].empty = false

          const projects: DocProject[] = []
          const expectedNonEmpty: { project: DocProject; mdCount: number }[] = []

          // console.warn を抑制
          const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

          for (const spec of uniqueSpecs) {
            const projectDir = path.join(tmpDir, spec.name)
            const project: DocProject = {
              name: spec.name,
              label: spec.name,
              path: `/${spec.name}/`,
            }
            projects.push(project)

            if (spec.empty) {
              // 空ディレクトリを作成（またはディレクトリを作成しない）
              fs.mkdirSync(projectDir, { recursive: true })
              // ファイルを置かない → 空ディレクトリ
            } else {
              fs.mkdirSync(projectDir, { recursive: true })
              const uniqueFiles = [...new Set(spec.files)]
              for (const fname of uniqueFiles) {
                fs.writeFileSync(
                  path.join(projectDir, `${fname}.md`),
                  `# ${fname}\n`,
                )
              }
              expectedNonEmpty.push({ project, mdCount: uniqueFiles.length })
            }
          }

          const sidebar = generateSidebar(tmpDir, projects)

          // 全プロジェクトのキーが存在する
          for (const p of projects) {
            expect(sidebar).toHaveProperty(p.path)
          }

          // 空プロジェクトは空配列
          for (const spec of uniqueSpecs.filter((s) => s.empty)) {
            const items = sidebar[`/${spec.name}/`]
            expect(items).toEqual([])
          }

          // 空でないプロジェクトは正常にサイドバーが生成される
          for (const { project, mdCount } of expectedNonEmpty) {
            const items = sidebar[project.path]
            const links = collectLinks(items)
            expect(links.length).toBe(mdCount)
          }

          warnSpy.mockRestore()
        },
      ),
      { numRuns: 50 },
    )
  })
})
