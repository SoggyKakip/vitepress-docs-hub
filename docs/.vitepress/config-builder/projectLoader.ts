/**
 * プロジェクト定義の読み込みと未登録プロジェクト検出
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import type { DocProject } from './types'
import { validateDocProject } from './validators'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_DOCS_DIR = 'project-docs'

/**
 * docs/project-docs/ 配下を走査してプロジェクト一覧を生成する。
 * frontmatter の title/category/description/icon を優先して利用する。
 * frontmatter が無い場合もエラーにせず、ディレクトリ名から補完する。
 */
export function loadProjectsWithAutoDetect(docsRoot: string): DocProject[] {
  if (!fs.existsSync(docsRoot)) return []

  const projectsRoot = path.join(docsRoot, PROJECT_DOCS_DIR)
  if (!fs.existsSync(projectsRoot)) return []

  const repoRoot = path.resolve(docsRoot, '..')
  const repoUrls = loadSubmoduleRepoUrls(repoRoot)
  const discovered = discoverProjects(projectsRoot, repoUrls)

  const validProjects: DocProject[] = []
  for (const project of discovered) {
    const result = validateDocProject(project)
    if (!result.valid) {
      console.warn(`[docs-hub] Invalid project "${project.name}":`, result.errors)
      continue
    }
    validProjects.push(project)
  }
  return validProjects
}

function discoverProjects(projectsRoot: string, repoUrls: Map<string, string>): DocProject[] {
  const dirs = fs.readdirSync(projectsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)

  return dirs.map((dirName) => {
    const submodulePath = `docs/${PROJECT_DOCS_DIR}/${dirName}`
    const metadata = readProjectMetadata(path.join(projectsRoot, dirName))
    return {
      name: dirName,
      label: metadata.label ?? toLabel(dirName),
      path: `/${PROJECT_DOCS_DIR}/${dirName}/`,
      category: metadata.category,
      description: metadata.description,
      icon: metadata.icon,
      repoUrl: repoUrls.get(submodulePath),
    }
  })
}

type ProjectMetadata = {
  label?: string
  category?: string
  description?: string
  icon?: string
}

function readProjectMetadata(projectDir: string): ProjectMetadata {
  const indexPath = path.join(projectDir, 'index.md')
  if (!fs.existsSync(indexPath)) {
    return {}
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8')
    const { data } = matter(content)
    return {
      label: asNonEmptyString(data.title),
      category: asNonEmptyString(data.category),
      description: asNonEmptyString(data.description),
      icon: asNonEmptyString(data.icon),
    }
  } catch {
    return {}
  }
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toLabel(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function loadSubmoduleRepoUrls(repoRoot: string): Map<string, string> {
  const gitmodulesPath = path.join(repoRoot, '.gitmodules')
  if (!fs.existsSync(gitmodulesPath)) {
    return new Map()
  }

  const content = fs.readFileSync(gitmodulesPath, 'utf-8')
  const entries = parseGitmodules(content)
  const origin = resolveGitOrigin(repoRoot)
  const result = new Map<string, string>()

  for (const entry of entries) {
    result.set(entry.path, resolveRepoUrl(entry.url, origin))
  }
  return result
}

function parseGitmodules(content: string): Array<{ path: string; url: string }> {
  const lines = content.split(/\r?\n/)
  const entries: Array<{ path: string; url: string }> = []
  let currentPath: string | undefined
  let currentUrl: string | undefined

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('[submodule ')) {
      if (currentPath && currentUrl) {
        entries.push({ path: currentPath, url: currentUrl })
      }
      currentPath = undefined
      currentUrl = undefined
      continue
    }
    if (line.startsWith('path = ')) {
      currentPath = line.replace('path = ', '').trim()
      continue
    }
    if (line.startsWith('url = ')) {
      currentUrl = line.replace('url = ', '').trim()
      continue
    }
  }

  if (currentPath && currentUrl) {
    entries.push({ path: currentPath, url: currentUrl })
  }

  return entries
}

function resolveGitOrigin(repoRoot: string): string | undefined {
  const configPath = path.join(repoRoot, '.git', 'config')
  if (!fs.existsSync(configPath)) {
    return undefined
  }

  const content = fs.readFileSync(configPath, 'utf-8')
  const lines = content.split(/\r?\n/)
  let inOrigin = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('[')) {
      inOrigin = line === '[remote "origin"]'
      continue
    }
    if (inOrigin && line.startsWith('url = ')) {
      return line.replace('url = ', '').trim()
    }
  }
  return undefined
}

function resolveRepoUrl(submoduleUrl: string, origin?: string): string {
  if (/^(https?:\/\/|git@)/.test(submoduleUrl)) {
    return toHttpsUrl(submoduleUrl)
  }
  if (!origin || !submoduleUrl.startsWith('../')) {
    return submoduleUrl
  }

  const originHttps = toHttpsUrl(origin)
  const trimmedOrigin = originHttps.replace(/\.git$/, '')
  const slashIndex = trimmedOrigin.lastIndexOf('/')
  if (slashIndex === -1) {
    return submoduleUrl
  }
  const ownerBase = trimmedOrigin.slice(0, slashIndex)
  const repoName = submoduleUrl.replace(/^\.\.\//, '')
  return `${ownerBase}/${repoName}`
}

function toHttpsUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/\.git$/, '')
  }
  const sshMatch = /^git@([^:]+):(.+)$/.exec(url)
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`.replace(/\.git$/, '')
  }
  return url
}
