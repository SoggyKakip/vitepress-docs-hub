import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

import { buildHomeSidebar } from './config-builder/rootSidebarBuilder'
import { buildProjectsDropdown, buildRepositoriesDropdown } from './config-builder/navBuilder'
import { loadProjects, PROJECT_DOCS_DIR } from './config-builder/projectCatalog'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(__dirname, '..')
const projects = loadProjects(docsRoot)

const vitePressOptions = defineConfig({
  title: 'Docs Hub',
  description: '統合ドキュメントハブ',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      buildProjectsDropdown(projects),
      buildRepositoriesDropdown(projects),
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
})

const projectSidebarOptions = projects.map(project => ({
  documentRootPath: 'docs',
  scanStartPath: `${PROJECT_DOCS_DIR}/${project.name}`,
  resolvePath: project.path,
  useTitleFromFrontmatter: true,
  useTitleFromFileHeading: true,
  useFolderTitleFromIndexFile: true,
  sortMenusByFrontmatterOrder: true,
  collapsed: false,
}))

const projectSidebar = projectSidebarOptions.length === 0
  ? []
  : generateSidebar(projectSidebarOptions)

const homeSidebar = buildHomeSidebar(docsRoot, projects)

const sidebar: DefaultTheme.Sidebar = Array.isArray(projectSidebar)
  ? { '/': [...homeSidebar, ...projectSidebar] }
  : { ...projectSidebar, '/': homeSidebar }

export default defineConfig({
  ...vitePressOptions,
  themeConfig: {
    ...(vitePressOptions.themeConfig ?? {}),
    sidebar,
  },
})
