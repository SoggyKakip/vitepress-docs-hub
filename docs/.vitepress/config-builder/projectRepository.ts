import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ProjectRepository } from './types'

export function loadProjectRepositories(repoRoot: string): Map<string, ProjectRepository> {
  const gitmodulesPath = join(repoRoot, '.gitmodules')
  if (!existsSync(gitmodulesPath)) {
    return new Map()
  }

  const content = readFileSync(gitmodulesPath, 'utf-8')
  const entries = parseGitmodules(content)
  const origin = resolveGitOrigin(repoRoot)
  const repositories = new Map<string, ProjectRepository>()

  for (const entry of entries) {
    repositories.set(entry.path, {
      submodulePath: entry.path,
      url: resolveRepoUrl(entry.url, origin),
    })
  }

  return repositories
}

type GitmodulesEntry = {
  path: string
  url: string
}

function parseGitmodules(content: string): GitmodulesEntry[] {
  const lines = content.split(/\r?\n/)
  const entries: GitmodulesEntry[] = []
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
  const configPath = join(repoRoot, '.git', 'config')
  if (!existsSync(configPath)) {
    return undefined
  }

  const content = readFileSync(configPath, 'utf-8')
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

  const originHttps = toHttpsUrl(origin).replace(/\.git$/, '')
  const slashIndex = originHttps.lastIndexOf('/')
  if (slashIndex === -1) {
    return submoduleUrl
  }

  const ownerBase = originHttps.slice(0, slashIndex)
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
