import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import type { ProjectFrontmatter } from './types'

export function readProjectFrontmatter(projectDir: string): ProjectFrontmatter {
  const indexPath = path.join(projectDir, 'index.md')
  if (!fs.existsSync(indexPath)) {
    return {}
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8')
    const { data } = matter(content)
    return {
      title: asNonEmptyString(data.title),
      category: asNonEmptyString(data.category),
      description: asNonEmptyString(data.description),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[docs-hub] Failed to read frontmatter: ${indexPath} (${message})`)
    return {}
  }
}

export function toDefaultLabel(projectName: string): string {
  return projectName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
