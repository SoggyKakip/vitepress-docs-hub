/**
 * プロジェクト定義の読み込みと未登録プロジェクト検出
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DocProject, ProjectsConfig } from './types'
import { validateDocProject } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECTS_JSON_PATH = path.resolve(__dirname, '../config-data/projects.json')

/**
 * projects.json（カテゴリ階層形式）を読み込み、DocProject[] を返す。
 * カテゴリは JSON のキーから自動付与される。
 */
export function loadProjects(): DocProject[] {
  const content = fs.readFileSync(PROJECTS_JSON_PATH, 'utf-8')
  const config = JSON.parse(content) as ProjectsConfig

  const projects: DocProject[] = []
  for (const [category, entries] of Object.entries(config)) {
    for (const entry of entries) {
      const project: DocProject = {
        name: entry.name,
        label: entry.label,
        path: `/${entry.name}/`,
        category,
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
  }

  return projects
}

/**
 * docs/ 配下のフォルダを走査し、projects.json に未登録のプロジェクトがあれば
 * 警告しつつ、カテゴリ「未登録」の DocProject として自動追加する。
 */
export function loadProjectsWithAutoDetect(docsRoot: string): DocProject[] {
  const registered = loadProjects()
  if (!fs.existsSync(docsRoot)) return registered

  const registeredNames = new Set(registered.map(p => p.name))
  const dirs = fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)

  const unregistered = dirs.filter(d => !registeredNames.has(d))
  for (const dir of unregistered) {
    console.warn(
      `[docs-hub] 未登録プロジェクト "${dir}" を自動検出しました` +
      '\n  → config-data/projects.json に追加するとラベルやカテゴリを設定できます'
    )
    registered.push({
      name: dir,
      label: dir,
      path: `/${dir}/`,
      category: '未登録',
    })
  }

  return registered
}
