import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import { loadProjectsWithAutoDetect } from './config-builder/projectLoader'
import { buildNavItems } from './config-builder/navBuilder'
import { buildHomeSidebar } from './config-builder/homeSidebarBuilder'

// 1. プロジェクト定義を読み込み（未登録プロジェクトも自動検出）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsRoot = path.resolve(__dirname, '..')
const projects = loadProjectsWithAutoDetect(docsRoot)

// 2. VitePress 本体の設定
const vitePressOptions = defineConfig({
  title: 'Docs Hub',
  description: '統合ドキュメントハブ',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      ...buildNavItems(projects)
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})

// 3. vitepress-sidebar: 各プロジェクト固有のサイドバーを自動生成
const sidebarOptions = projects.map(project => ({
  documentRootPath: 'docs',
  scanStartPath: project.name,
  resolvePath: project.path,
  useTitleFromFrontmatter: true,
  useTitleFromFileHeading: true,
  useFolderTitleFromIndexFile: true,
  sortMenusByFrontmatterOrder: true,
  collapsed: false,
}))

// 4. 統合: プロジェクト固有サイドバー + トップページ用サイドバー
const result = withSidebar(vitePressOptions, sidebarOptions) as any
result.themeConfig.sidebar['/'] = buildHomeSidebar(projects)

export default result
