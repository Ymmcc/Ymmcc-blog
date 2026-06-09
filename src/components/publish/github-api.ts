import { GitHubFile, ArticleMeta, SeriesArticle, SeriesInfo } from './types';
import TurndownService from 'turndown';

const REPO_OWNER = 'Ymmcc';
const REPO_NAME = 'Ymmcc-blog';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// 初始化 Turndown 服务（HTML 转 Markdown）
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// 自定义代码块转换规则（保留语言标识）
turndownService.addRule('codeBlock', {
  filter: (node) => {
    return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE';
  },
  replacement: (content, node) => {
    const codeNode = node.firstChild as HTMLElement;
    const language = codeNode.className.replace('language-', '') || '';
    const code = codeNode.textContent || '';
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  },
});

// 解析 frontmatter
export function parseFrontmatter(content: string): ArticleMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { title: '', date: '', tags: [], description: '' };

  const fm = match[1];
  const title = fm.match(/title:\s*(.+)/)?.[1]?.trim() || '';
  const date = fm.match(/date:\s*(.+)/)?.[1]?.trim() || '';
  const tagsMatch = fm.match(/tags:\s*\[(.+)\]/)?.[1];
  const tags = tagsMatch ? tagsMatch.split(',').map(t => t.trim()) : [];
  const description = fm.match(/description:\s*(.+)/)?.[1]?.trim() || '';

  return { title, date, tags, description };
}

// 判断是否为系列文章
export function isSeriesContent(content: string): boolean {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  return match[1].includes('series: true');
}

// 解析系列文章内容
export function parseSeriesContent(content: string): {
  seriesTitle: string;
  tags: string[];
  description: string;
  articles: SeriesArticle[];
} {
  const meta = parseFrontmatter(content);

  // 提取所有 <details> 块
  const articles: SeriesArticle[] = [];
  const detailsRegex = /<details\s*[^>]*>([\s\S]*?)<\/details>/g;
  let match;
  let index = 0;

  while ((match = detailsRegex.exec(content)) !== null) {
    const block = match[1];

    // 提取 summary 作为标题
    const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
    let title = summaryMatch ? summaryMatch[1].trim() : `文章 ${index + 1}`;
    // 清理 HTML 标签和装饰字符
    title = title.replace(/<[^>]+>/g, '').replace(/^[^\w一-龥]+/, '').trim();

    // 提取正文（</summary> 之后的内容）
    const contentMatch = block.match(/<\/summary>([\s\S]*)$/);
    const articleContent = contentMatch ? contentMatch[1].trim() : '';

    // 尝试提取日期
    const dateMatch = articleContent.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch ? dateMatch[0] : (meta.date || '');

    articles.push({
      id: `article_${index++}`,
      title,
      date,
      content: articleContent,
    });
  }

  return {
    seriesTitle: meta.title,
    tags: meta.tags,
    description: meta.description,
    articles,
  };
}

// 获取文件列表（递归）
export async function fetchFileList(token: string, path = 'docs'): Promise<GitHubFile[]> {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token 无效或已过期，请检查后重新输入');
    if (response.status === 403) throw new Error('Token 权限不足，需要 repo 权限');
    if (response.status === 404) throw new Error(`仓库或路径不存在: ${REPO_OWNER}/${REPO_NAME}/${path}`);
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `获取文件列表失败 (${response.status})`);
  }

  const items = await response.json() as GitHubFile[];
  let files: GitHubFile[] = [];

  for (const item of items) {
    if (item.type === 'file' && item.name.endsWith('.md')) {
      files.push(item);
    } else if (item.type === 'dir') {
      try {
        const subFiles = await fetchFileList(token, item.path);
        files = files.concat(subFiles);
      } catch {
        // 跳过无法访问的目录
      }
    }
  }

  return files;
}

// 获取文件内容
export async function fetchFileContent(token: string, path: string): Promise<{ content: string; sha: string }> {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token 无效或已过期');
    if (response.status === 404) throw new Error(`文件不存在: ${path}`);
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `获取文件内容失败 (${response.status})`);
  }

  const data = await response.json();
  const content = decodeURIComponent(escape(atob(data.content)));
  return { content, sha: data.sha };
}

// 创建或更新文件
export async function upsertFile(
  token: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  const body: Record<string, string> = {
    message,
    content: encodedContent
  };
  if (sha) body.sha = sha;

  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '操作失败');
  }
}

// 删除文件
export async function deleteFile(token: string, path: string, sha: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `feat: 删除文章 ${path}`,
      sha
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '删除失败');
  }
}

// 上传图片到 GitHub 仓库（base64Data 已经是 base64 编码，直接发送）
export async function uploadImage(token: string, filename: string, base64Data: string): Promise<string> {
  const path = `static/img/uploads/${filename}`;
  const content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `feat: 上传图片 ${filename}`,
      content: content  // 已经是 base64，直接发送
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '图片上传失败');
  }

  // 返回 jsDelivr CDN 链接加速国内访问
  // 图片存储在 GitHub 仓库中，通过 CDN 分发速度更快
  return `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@main/${path}`;
}

/*** 图片优化 ***/

// 客户端图片压缩（上传前压缩，减小体积）
// maxWidth: 最大宽度（默认 1920），quality: 压缩质量 0-1（默认 0.8）
export function compressImage(
  base64Data: string,
  maxWidth = 1920,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算缩放尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // 用 Canvas 压缩
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Data); return; }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = base64Data;
  });
}

// 给 HTML 中的所有 <img> 添加懒加载和渐进式加载效果
export function optimizeImageTags(html: string): string {
  return html
    // 添加 loading="lazy"
    .replace(/<img\s/g, '<img loading="lazy" ')
    // 添加解码方式（渐进式渲染）
    .replace(/<img\s/g, '<img decoding="async" ');
}

// 生成 Markdown 内容（将 HTML 转换为 Markdown）
export function generateMarkdown(
  data: { title: string; tags: string; description: string; markdownContent: string }
): string {
  const date = new Date().toISOString().split('T')[0];
  const tagsArray = data.tags.split(',').map(t => t.trim()).filter(Boolean);

  // 将富文本 HTML 转换为 Markdown
  const markdownBody = turndownService.turndown(data.markdownContent);

  const md = `---
title: ${data.title}
date: ${date}
tags: [${tagsArray.join(', ')}]
description: ${data.description}
---

${markdownBody}
`;

  return md;
}

// 根据分类和标题生成文件路径
export function getFilePath(category: string, title: string, isSeries = false): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // 系列文章存为目录结构，侧边栏自动成为独立分类
  if (isSeries) {
    switch (category) {
      case 'frontend': return `docs/frontend/${slug}/index.md`;
      case 'backend': return `docs/backend/${slug}/index.md`;
      case 'algorithm': return `docs/algorithm/${slug}/index.md`;
      case 'projects': return `docs/projects/${slug}/index.md`;
      default: return `docs/${slug}/index.md`;
    }
  }

  switch (category) {
    case 'frontend': return `docs/frontend/${slug}.md`;
    case 'backend': return `docs/backend/${slug}.md`;
    case 'algorithm': return `docs/algorithm/${slug}.md`;
    case 'projects': return `docs/projects/${slug}.md`;
    default: return `docs/${slug}.md`;
  }
}

/*** 系列文章相关 ***/

// 生成系列文章 Markdown
export function generateSeriesMarkdown(
  data: {
    seriesTitle: string;
    tags: string;
    description: string;
    articles: { title: string; content: string }[];
  }
): string {
  const date = new Date().toISOString().split('T')[0];
  const tagsArray = data.tags.split(',').map(t => t.trim()).filter(Boolean);

  let md = `---
title: ${data.seriesTitle}
date: ${date}
tags: [${tagsArray.join(', ')}]
description: ${data.description}
series: true
---

# ${data.seriesTitle}

`;

  data.articles.forEach((article, index) => {
    const body = turndownService.turndown(article.content);

    md += `<details${index === 0 ? ' open' : ''}>
<summary><strong>📖 ${article.title}</strong></summary>

${body.trim()}

</details>

`;
  });

  return md;
}

// 获取所有系列文章
export async function fetchSeriesList(token: string): Promise<SeriesInfo[]> {
  const files = await fetchFileList(token);
  const seriesList: SeriesInfo[] = [];

  for (const file of files) {
    try {
      const { content } = await fetchFileContent(token, file.path);
      if (isSeriesContent(content)) {
        const parsed = parseSeriesContent(content);
        seriesList.push({
          title: parsed.seriesTitle,
          path: file.path,
          sha: file.sha,
          articles: parsed.articles,
          date: parsed.articles.length > 0 ? parsed.articles[parsed.articles.length - 1].date : '',
          tags: parsed.tags,
          description: parsed.description,
        });
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  return seriesList;
}
