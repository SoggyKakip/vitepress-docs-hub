import { describe, it, expect, afterEach } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  generateSidebar,
  scanDirectory,
  parseFrontmatter,
} from '../docs/.vitepress/sidebarGenerator'
import type { SidebarItem } from '../docs/.vitepress/sidebarGenerator'

// ── helpers ──────────────────────────────────────────────

/** テンポラリディレクトリを作成し、パスを返す */
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sidebar-test-'))
}

/** ディレクトリを再帰的に削除する */
function rmDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

/** SidebarItem ツリーからリンク（末端ファイル）を全て収集する */
function collectLinks(items: SidebarItem[]): string[] {
  const links: string[] = []
  for (const item of items) {
    if (item.link) links.push(item.link)
    if (item.items) links.push(...collectLinks(item.items))
  }
  return links
}

/** SidebarItem ツリーからグループ（サブディレクトリ）を全て収集する */
function collectGroups(items: SidebarItem[]): SidebarItem[] {
  const groups: SidebarItem[] = []
  for (const item of items) {
    if (item.items && !item.link) {
      groups.push(item)
      groups.push(...collectGroups(item.items))
    }
  }
  return groups
}

// ── arbitraries ──────────────────────────────────────────

/** 安全なファイル名文字列（英小文字のみ、1〜10文字） */
const safeNameArb = fc
  .array(
    fc.integer({ min: 0, max: 25 }).map((v) => String.fromCharCode(0x61 + v)),
    { minLength: 1, maxLength: 10 },
  )
  .map((chars) => chars.join(''))

// ── Property 3: サイドバーの完全性 ──────────────────────

/**
 * Property 3: サイドバーの完全性
 * **Validates: Requirements 4.1, 4.2**
 *
 * *For any* DocProject ディレクトリ構造に対して、サイドバーのリンク数は
 * そのディレクトリ内の `.md` ファイル数（index.md 除く）と一致する。
 */
describe('Property 3: サイドバーの完全性', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) rmDir(d)
    tmpDirs.length = 0
  })

  it('🧪 5.4.1 PBT: サイドバーのリンク数は .md ファイル数（index.md 除く）と一致する', () => {
    // ファイル名リスト（index は除外対象なので含めない）
    const fileListArb = fc.array(safeNameArb, { minLength: 0, maxLength: 5 })

    fc.assert(
      fc.property(fileListArb, fc.boolean(), (fileNames, includeIndex) => {
        const tmpDir = makeTmpDir()
        tmpDirs.push(tmpDir)

        const projectName = 'proj'
        const projectDir = path.join(tmpDir, projectName)
        fs.mkdirSync(projectDir, { recursive: true })

        // ユニークなファイル名を生成
        const uniqueNames = [...new Set(fileNames)]
        let mdCount = 0
        for (const name of uniqueNames) {
          fs.writeFileSync(path.join(projectDir, `${name}.md`), `# ${name}\n`)
          mdCount++
        }
        if (includeIndex) {
          fs.writeFileSync(
            path.join(projectDir, 'index.md'),
            '# Index\n',
          )
        }

        const sidebar = generateSidebar(tmpDir, [
          { name: projectName, label: 'Proj', path: `/${projectName}/` },
        ])

        const links = collectLinks(sidebar[`/${projectName}/`] ?? [])
        expect(links.length).toBe(mdCount)
      }),
      { numRuns: 50 },
    )
  })
})


// ── Property 4: サイドバー表示テキストの決定 ──────────────

/**
 * Property 4: サイドバー表示テキストの決定
 * **Validates: Requirements 4.3, 4.4**
 *
 * *For any* `.md` ファイルに対して、frontmatter に title フィールドが存在する場合は
 * その値がサイドバー項目のテキストとなり、存在しない場合はファイル名から導出されたテキストとなる。
 */
describe('Property 4: サイドバー表示テキストの決定', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) rmDir(d)
    tmpDirs.length = 0
  })

  it('🧪 5.4.2 PBT: frontmatter の title 有無に応じて正しい表示テキストが設定される', () => {
    // YAML round-trip safe な title（英数字・スペース・日本語のみ）
    const safeTitleArb = fc
      .array(
        fc.mapToConstant(
          { num: 26, build: (v) => String.fromCharCode(0x61 + v) }, // a-z
          { num: 26, build: (v) => String.fromCharCode(0x41 + v) }, // A-Z
          { num: 10, build: (v) => String.fromCharCode(0x30 + v) }, // 0-9
          { num: 1, build: () => ' ' },
        ),
        { minLength: 1, maxLength: 20 },
      )
      .map((chars) => chars.join(''))
      .filter((s) => s.trim().length > 0) // 空白のみは除外

    const fileSpecArb = fc.record({
      name: safeNameArb,
      title: fc.option(safeTitleArb, { nil: undefined }),
    })

    fc.assert(
      fc.property(
        fc.array(fileSpecArb, { minLength: 1, maxLength: 5 }),
        (fileSpecs) => {
          const tmpDir = makeTmpDir()
          tmpDirs.push(tmpDir)

          const projectDir = path.join(tmpDir, 'proj')
          fs.mkdirSync(projectDir, { recursive: true })

          // ユニーク化
          const seen = new Set<string>()
          const uniqueSpecs = fileSpecs.filter((s) => {
            if (seen.has(s.name)) return false
            seen.add(s.name)
            return true
          })

          for (const spec of uniqueSpecs) {
            const content = spec.title
              ? `---\ntitle: "${spec.title}"\n---\n# Content\n`
              : `# Content\n`
            fs.writeFileSync(path.join(projectDir, `${spec.name}.md`), content)
          }

          const items = scanDirectory(projectDir, '/proj/')

          for (const spec of uniqueSpecs) {
            const item = items.find((i) => i.link === `/proj/${spec.name}`)
            expect(item).toBeDefined()
            if (spec.title) {
              expect(item!.text).toBe(spec.title)
            } else {
              // ファイル名から導出（toTitleCase）
              const expected = spec.name
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())
              expect(item!.text).toBe(expected)
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})


// ── Property 5: サイドバーの order ソート ──────────────────

/**
 * Property 5: サイドバーの order ソート
 * **Validates: Requirements 4.5, 4.6**
 *
 * *For any* order フィールドを持つファイル集合に対して、サイドバー項目は
 * order 値の昇順でソートされ、order を持たないファイルはソート済み項目の後に配置される。
 */
describe('Property 5: サイドバーの order ソート', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) rmDir(d)
    tmpDirs.length = 0
  })

  it('🧪 5.4.3 PBT: サイドバー項目は order 値の昇順でソートされる', () => {
    const fileWithOrderArb = fc.record({
      name: safeNameArb,
      order: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    })

    fc.assert(
      fc.property(
        fc.array(fileWithOrderArb, { minLength: 1, maxLength: 8 }),
        (fileSpecs) => {
          const tmpDir = makeTmpDir()
          tmpDirs.push(tmpDir)

          const projectDir = path.join(tmpDir, 'proj')
          fs.mkdirSync(projectDir, { recursive: true })

          // ユニーク化
          const seen = new Set<string>()
          const uniqueSpecs = fileSpecs.filter((s) => {
            if (seen.has(s.name)) return false
            seen.add(s.name)
            return true
          })

          for (const spec of uniqueSpecs) {
            const content =
              spec.order !== undefined
                ? `---\norder: ${spec.order}\n---\n# Content\n`
                : `# Content\n`
            fs.writeFileSync(path.join(projectDir, `${spec.name}.md`), content)
          }

          const items = scanDirectory(projectDir, '/proj/')

          // order 値を取得（リンク項目のみ、グループは除外）
          const orders = items
            .filter((i) => i.link)
            .map((i) => i.order ?? Infinity)

          // 昇順であることを検証
          for (let i = 1; i < orders.length; i++) {
            expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1])
          }

          // order を持つ項目は order を持たない項目より前に配置される
          const withOrder = items.filter(
            (i) => i.link && i.order !== undefined && Number.isFinite(i.order),
          )
          const withoutOrder = items.filter(
            (i) => i.link && (i.order === undefined || !Number.isFinite(i.order)),
          )
          if (withOrder.length > 0 && withoutOrder.length > 0) {
            const lastOrderedIdx = items.indexOf(
              withOrder[withOrder.length - 1],
            )
            const firstUnorderedIdx = items.indexOf(withoutOrder[0])
            expect(lastOrderedIdx).toBeLessThan(firstUnorderedIdx)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})


// ── Property 6: サイドバーのネスト構造 ──────────────────

/**
 * Property 6: サイドバーのネスト構造
 * **Validates: Requirement 4.7**
 *
 * *For any* サブディレクトリを含むディレクトリ構造に対して、サブディレクトリは
 * ネストされたサイドバーグループとして表現される。
 */
describe('Property 6: サイドバーのネスト構造', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) rmDir(d)
    tmpDirs.length = 0
  })

  it('🧪 5.4.4 PBT: サブディレクトリはネストされたサイドバーグループとして表現される', () => {
    // サブディレクトリ名とその中のファイル名リスト
    const subDirArb = fc.record({
      dirName: safeNameArb,
      files: fc.array(safeNameArb, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(
        fc.array(safeNameArb, { minLength: 0, maxLength: 3 }),
        fc.array(subDirArb, { minLength: 1, maxLength: 3 }),
        (rootFiles, subDirs) => {
          const tmpDir = makeTmpDir()
          tmpDirs.push(tmpDir)

          const projectDir = path.join(tmpDir, 'proj')
          fs.mkdirSync(projectDir, { recursive: true })

          // ルートレベルのファイル
          const uniqueRootFiles = [...new Set(rootFiles)]
          for (const name of uniqueRootFiles) {
            fs.writeFileSync(
              path.join(projectDir, `${name}.md`),
              `# ${name}\n`,
            )
          }

          // サブディレクトリ（ユニーク化）
          const seenDirs = new Set<string>()
          const uniqueSubDirs = subDirs.filter((sd) => {
            // ルートファイルと名前が被らないようにする
            if (seenDirs.has(sd.dirName) || uniqueRootFiles.includes(sd.dirName))
              return false
            seenDirs.add(sd.dirName)
            return true
          })

          for (const sd of uniqueSubDirs) {
            const subDir = path.join(projectDir, sd.dirName)
            fs.mkdirSync(subDir, { recursive: true })
            const uniqueFiles = [...new Set(sd.files)]
            for (const fname of uniqueFiles) {
              fs.writeFileSync(
                path.join(subDir, `${fname}.md`),
                `# ${fname}\n`,
              )
            }
          }

          const items = scanDirectory(projectDir, '/proj/')
          const groups = collectGroups(items)

          // 各サブディレクトリがグループとして存在する
          for (const sd of uniqueSubDirs) {
            const expectedText = sd.dirName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
            const group = groups.find((g) => g.text === expectedText)
            expect(group).toBeDefined()
            expect(group!.items).toBeDefined()
            expect(group!.items!.length).toBeGreaterThan(0)

            // グループ内のリンクがサブディレクトリのファイルを指す
            const groupLinks = collectLinks(group!.items!)
            const uniqueFiles = [...new Set(sd.files)]
            for (const fname of uniqueFiles) {
              expect(
                groupLinks.some((l) => l === `/proj/${sd.dirName}/${fname}`),
              ).toBe(true)
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})
