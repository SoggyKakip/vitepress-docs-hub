import * as fs from 'node:fs'
import * as path from 'node:path'
import type { DocProject, ProjectRepository } from './types'
import { PROJECT_DOCS_DIR, discoverProjectDirs } from './projectDiscovery'
import { readProjectFrontmatter, toDefaultLabel } from './projectFrontmatter'
import { loadProjectRepositories } from './projectRepository'
import { validateDocProject } from './validators'

export { PROJECT_DOCS_DIR } from './projectDiscovery'

export function loadProjects(docsRoot: string): DocProject[] {
  if (!fs.existsSync(docsRoot)) {
    return []
  }

  const projectsRoot = path.join(docsRoot, PROJECT_DOCS_DIR)
  const projectNames = discoverProjectDirs(projectsRoot)
  const repositories = loadProjectRepositories(path.resolve(docsRoot, '..'))
  const projects = projectNames.map((projectName) =>
    buildDocProject(projectName, projectsRoot, repositories),
  )

  return projects.filter((project) => {
    const result = validateDocProject(project)
    if (!result.valid) {
      console.warn(`[docs-hub] Invalid project "${project.name}":`, result.errors)
      return false
    }
    return true
  })
}

function buildDocProject(
  projectName: string,
  projectsRoot: string,
  repositories: Map<string, ProjectRepository>,
): DocProject {
  const projectDir = path.join(projectsRoot, projectName)
  const frontmatter = readProjectFrontmatter(projectDir)
  const submodulePath = `docs/${PROJECT_DOCS_DIR}/${projectName}`

  return {
    name: projectName,
    path: `/${PROJECT_DOCS_DIR}/${projectName}/`,
    label: frontmatter.title ?? toDefaultLabel(projectName),
    category: frontmatter.category,
    description: frontmatter.description,
    repoUrl: repositories.get(submodulePath)?.url,
  }
}
