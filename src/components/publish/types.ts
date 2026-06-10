// 文章模式
export type ArticleMode = 'single' | 'series';

// 文章数据
export interface ArticleData {
  title: string;
  category: string;
  tags: string;
  description: string;
  markdownContent: string;
  // 系列模式字段
  seriesTitle?: string;   // 系列标题（如"数据库"）
  articleTitle?: string;  // 子文章标题（如"SQL语句"）
}

// 系列中的子文章
export interface SeriesArticle {
  id: string;
  title: string;
  date: string;
  content: string;
  filePath?: string;   // 独立文件系列的文章文件路径
  fileSha?: string;    // 独立文件系列的文章文件 SHA
}

// 系列信息
export interface SeriesInfo {
  title: string;
  path: string;
  sha: string;
  articles: SeriesArticle[];
  date: string;
  tags: string[];
  description: string;
}

// 草稿
export interface Draft {
  id: string;
  title: string;
  category: string;
  tags: string;
  description: string;
  markdownContent: string;
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
  type: 'draft' | 'article' | 'series-article';
  id?: string;       // 草稿 ID
  sha?: string;      // GitHub 文件 SHA
  path?: string;     // GitHub 文件路径
  seriesTitle?: string;   // 系列标题（编辑子文章时使用）
  articleTitle?: string;  // 子文章标题（编辑子文章时使用）
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
  seriesTitle: '',
  articleTitle: '',
};
