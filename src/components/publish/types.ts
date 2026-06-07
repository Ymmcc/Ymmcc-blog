// 代码块
export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  isCollapsed: boolean;
}

// 文章数据
export interface ArticleData {
  title: string;
  category: string;
  tags: string;
  description: string;
  markdownContent: string;
  codeBlocks: CodeBlock[];
}

// 草稿
export interface Draft {
  id: string;
  title: string;
  category: string;
  tags: string;
  description: string;
  markdownContent: string;
  codeBlocks: CodeBlock[];
  updatedAt: number;
}

// GitHub 文件信息
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
}

// 解析后的文章元信息
export interface ArticleMeta {
  title: string;
  date: string;
  tags: string[];
  description: string;
}

// Tab 类型
export type TabType = 'write' | 'drafts' | 'manage';

// 编辑模式
export interface EditMode {
  type: 'draft' | 'article';
  id?: string;       // 草稿 ID
  sha?: string;      // GitHub 文件 SHA
  path?: string;     // GitHub 文件路径
}

// 发布状态
export type PublishStatus = 'idle' | 'success' | 'error';

// 默认文章数据
export const defaultArticleData: ArticleData = {
  title: '',
  category: 'frontend',
  tags: '',
  description: '',
  markdownContent: '# 在这里编写文章内容\n\n支持标准 Markdown 语法\n',
  codeBlocks: []
};
