import * as fs from 'node:fs'

export const PROJECT_DOCS_DIR = 'project-docs'

export function discoverProjectDirs(projectsRoot: string): string[] {
  if (!fs.existsSync(projectsRoot)) {
    return []
  }

  return fs.readdirSync(projectsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}
