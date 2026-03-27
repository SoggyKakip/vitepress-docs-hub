import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import type { VitePressSidebarOptions } from 'vitepress-sidebar'
import type { DocProject } from './lib/types'
import { buildNavItems } from './lib/navBuilder'

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

// トップページ用サイドバー: projects 配列からカテゴリ別に生成
function buildHomeSidebar(projects: DocProject[]) {
  const grouped = new Map<string, { text: string; link: string }[]>()
  for (const p of projects) {
    const cat = p.category ?? 'その他'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push({ text: p.label, link: p.path })
  }
  return [...grouped.entries()].map(([cat, items]) => ({
    text: cat,
    collapsed: false,
    items,
  }))
}

// VitePress 本体の設定
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

// vitepress-sidebar: 各プロジェクト固有のサイドバーを自動生成
const sidebarOptions: VitePressSidebarOptions[] = projects.map(project => ({
  documentRootPath: 'docs',
  scanStartPath: project.name,
  resolvePath: project.path,
  useTitleFromFrontmatter: true,
  useTitleFromFileHeading: true,
  useFolderTitleFromIndexFile: true,
  sortMenusByFrontmatterOrder: true,
  collapsed: false,
}))

// withSidebar でプロジェクト固有サイドバーを生成し、トップページ用を追加
const result = withSidebar(vitePressOptions, sidebarOptions) as any
result.themeConfig.sidebar['/'] = buildHomeSidebar(projects)

export default result
