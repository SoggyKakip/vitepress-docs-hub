import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import type { DocProject } from './docProject'
import { buildNavItems } from './navBuilder'

// DocProject 配列: 統合するドキュメントプロジェクトの定義
const projects: DocProject[] = [
  {
    name: 'test-doc',
    label: 'テストドキュメント',
    path: '/test-doc/',
    category: 'テスト'
  },
  {
    name: 'vscode-iris-connection',
    label: 'VS Code IRIS Connection',
    path: '/vscode-iris-connection/',
    category: 'ツール'
  }
]

// VitePress 本体の設定
const vitePressOptions = defineConfig({
  title: 'Docs Hub',
  description: '統合ドキュメントハブ',
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

// vitepress-sidebar: 各プロジェクトごとにマルチサイドバーを生成
const sidebarOptions = projects.map(project => ({
  documentRootPath: 'docs',
  scanStartPath: project.name,
  resolvePath: project.path,
  useTitleFromFrontmatter: true,
  useTitleFromFileHeading: true,
  useFolderTitleFromIndexFile: true,
  sortMenusByFrontmatterOrder: true,
  collapsed: false,
  excludePattern: ['.git'],
  debugPrint: false,
}))

export default withSidebar(vitePressOptions, sidebarOptions)
