import { defineConfig } from 'vitepress'
import * as path from 'node:path'
import type { DocProject } from './docProject'
import { buildNavItems } from './navBuilder'
import { generateSidebar } from './sidebarGenerator'

// DocProject 配列: 統合するドキュメントプロジェクトの定義
const projects: DocProject[] = [
  {
    name: 'test-doc',
    label: 'テストドキュメント',
    path: '/test-doc/'
  },
  {
    name: 'vscode-iris-connection',
    label: 'VS Code IRIS Connection',
    path: '/vscode-iris-connection/'
  }
]

// docs/ ディレクトリ（config.mts は docs/.vitepress/ にあるため親ディレクトリ）
const docsRoot = path.resolve(__dirname, '..')

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Docs Hub",
  description: "統合ドキュメントハブ",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'ホーム', link: '/' },
      ...buildNavItems(projects)
    ],

    sidebar: generateSidebar(docsRoot, projects),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
