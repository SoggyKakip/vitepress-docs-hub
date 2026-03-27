import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateName, validatePath } from '../docs/.vitepress/config-builder/types'

/**
 * Property 7: DocProject name バリデーション
 * **Validates: Requirements 5.1, 5.3**
 *
 * *For any* 文字列に対して、name バリデーションは英数字・ハイフンのみの文字列を受け入れ、
 * それ以外の文字を含む文字列をエラーメッセージ付きで拒否する。
 */
describe('Property 7: DocProject name バリデーション', () => {
  it('🧪 3.5.1 PBT: 英数字・ハイフンのみの文字列を受け入れ、それ以外を拒否する', () => {
    // 有効な name: 英数字・ハイフンのみ
    const validNameArb = fc
      .array(
        fc.mapToConstant(
          { num: 26, build: (v) => String.fromCharCode(0x61 + v) }, // a-z
          { num: 26, build: (v) => String.fromCharCode(0x41 + v) }, // A-Z
          { num: 10, build: (v) => String.fromCharCode(0x30 + v) }, // 0-9
          { num: 1, build: () => '-' },
        ),
        { minLength: 1 },
      )
      .map((chars) => chars.join(''))

    // 有効な name は受け入れられる
    fc.assert(
      fc.property(validNameArb, (name) => {
        const result = validateName(name)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
    )

    // 無効な文字を含む name は拒否される
    const invalidCharArb = fc
      .integer({ min: 0x20, max: 0x7e })
      .map((n) => String.fromCharCode(n))
      .filter((c) => !/^[a-zA-Z0-9-]$/.test(c))
    const invalidNameArb = fc
      .tuple(fc.string(), invalidCharArb, fc.string())
      .map(([pre, invalid, post]) => pre + invalid + post)

    fc.assert(
      fc.property(invalidNameArb, (name) => {
        const result = validateName(name)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toContain('Invalid name')
      }),
    )
  })
})

/**
 * Property 8: DocProject path バリデーション
 * **Validates: Requirements 5.2, 5.4**
 *
 * *For any* 文字列に対して、path バリデーションは `/` で始まり `/` で終わる文字列を受け入れ、
 * そうでない文字列をエラーメッセージ付きで拒否する。
 */
describe('Property 8: DocProject path バリデーション', () => {
  it('🧪 3.5.2 PBT: `/` で始まり `/` で終わる文字列を受け入れ、それ以外を拒否する', () => {
    // 有効な path: `/` で始まり `/` で終わる
    const validPathArb = fc
      .string()
      .map((s) => '/' + s.replace(/\//g, '') + '/')

    fc.assert(
      fc.property(validPathArb, (path) => {
        const result = validatePath(path)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
    )

    // `/` で始まらない path は拒否される
    const noLeadingSlashArb = fc
      .string({ minLength: 1 })
      .filter((s) => !s.startsWith('/'))

    fc.assert(
      fc.property(noLeadingSlashArb, (path) => {
        const result = validatePath(path)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('must start with'))).toBe(
          true,
        )
      }),
    )

    // `/` で終わらない path は拒否される
    const noTrailingSlashArb = fc
      .string({ minLength: 1 })
      .filter((s) => !s.endsWith('/'))

    fc.assert(
      fc.property(noTrailingSlashArb, (path) => {
        const result = validatePath(path)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('must end with'))).toBe(
          true,
        )
      }),
    )
  })
})
