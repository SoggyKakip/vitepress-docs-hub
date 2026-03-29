import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import type { DocProject } from './types'

type SidebarItem = DefaultTheme.SidebarItem

type ProjectLink = {
  text: string
  link: string
}

const UNCATEGORIZED_LABEL = 'カテゴリーなし'

export function buildHomeSidebar(docsRoot: string, projects: DocProject[]): SidebarItem[] {
  return [...scanTopPages(docsRoot), ...groupByCategory(projects)]
}

function scanTopPages(docsRoot: string): SidebarItem[] {
  if (!existsSync(docsRoot)) {
    return []
  }

  return readdirSync(docsRoot)
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const stem = fileName.replace(/\.md$/, '')
      const filePath = join(docsRoot, fileName)
      const title = readTitleFromFrontmatter(filePath) ?? toTitleFromFileName(stem)
      return { text: title, link: `/${stem}` }
    })
}

function readTitleFromFrontmatter(filePath: string): string | undefined {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    if (typeof data.title !== 'string') {
      return undefined
    }
    const title = data.title.trim()
    return title.length > 0 ? title : undefined
  } catch {
    return undefined
  }
}

function groupByCategory(projects: DocProject[]): SidebarItem[] {
  const groups: Array<{ text: string; items: ProjectLink[] }> = []

  for (const project of projects) {
    const category = project.category?.trim() || UNCATEGORIZED_LABEL
    const link: ProjectLink = { text: project.label, link: project.path }

    const existing = groups.find((group) => group.text === category)
    if (existing) {
      existing.items.push(link)
      continue
    }

    groups.push({ text: category, items: [link] })
  }

  return groups.map((group) => ({
    text: group.text,
    collapsed: false,
    items: group.items,
  }))
}

function toTitleFromFileName(stem: string): string {
  return stem
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

