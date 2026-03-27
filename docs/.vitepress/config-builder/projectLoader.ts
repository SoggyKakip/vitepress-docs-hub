/**
 * プロジェクト定義の読み込みと未登録プロジェクト検出
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DocProject } from './types'
import { validateDocProject } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECTS_JSON_PATH = path.resolve(__dirname, '../config-data/projects.json')

/**
 * projects.json を読み込み、DocProject[] を返す。
 * バリデーションエラーがあれば console.warn で警告。
 */
export function loadProjects(): DocProject[] {
  const content = fs.readFileSync(PROJECTS_JSON_PATH, 'utf-8')
  const raw = JSON.parse(content) as DocProject[]

  const projects: DocProject[] = []
  for (const entry of raw) {
    const project: DocProject = {
      name: entry.name,
      label: entry.label,
      path: `/${entry.name}/`,
      category: entry.category,
      description: entry.description,
      icon: entry.icon,
    }
    const result = validateDocProject(project)
    if (!result.valid) {
      console.warn(`[docs-hub] Invalid project "${entry.name}":`, result.errors)
      continue
    }
    projects.push(project)
  }

  return projects
}

/**
 * docs/ 配下のフォルダを走査し、projects.json に未登録のプロジェクトがあれば警告。
 */
export function warnUnregisteredProjects(docsRoot: string, projects: DocProject[]): void {
  if (!fs.existsSync(docsRoot)) return

  const registered = new Set(projects.map(p => p.name))
  const dirs = fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)

  const unregistered = dirs.filter(d => !registered.has(d))
  if (unregistered.length > 0) {
    console.warn(
      `[docs-hub] 未登録プロジェクト: ${unregistered.join(', ')}` +
      '\n  → config-data/projects.json に追加してください'
    )
  }
}
