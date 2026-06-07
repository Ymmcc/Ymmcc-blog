import { GitHubFile, ArticleMeta } from './types';

const REPO_OWNER = 'yymmcc';
const REPO_NAME = 'Ymmcc-blog';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

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

// 获取文件列表（递归）
export async function fetchFileList(token: string, path = 'docs'): Promise<GitHubFile[]> {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!response.ok) {
    throw new Error('获取文件列表失败');
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
    throw new Error('获取文件内容失败');
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

// 上传图片
export async function uploadImage(token: string, filename: string, base64Data: string): Promise<string> {
  const path = `static/img/${filename}`;
  const content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  await upsertFile(token, path, content, `feat: 上传图片 ${filename}`);
  return `/img/${filename}`;
}

// 生成 Markdown 内容
export function generateMarkdown(
  data: { title: string; tags: string; description: string; markdownContent: string },
  codeBlocks: Array<{ language: string; code: string }>
): string {
  const date = new Date().toISOString().split('T')[0];
  const tagsArray = data.tags.split(',').map(t => t.trim()).filter(Boolean);

  let md = `---
title: ${data.title}
date: ${date}
tags: [${tagsArray.join(', ')}]
description: ${data.description}
---

${data.markdownContent}
`;

  if (codeBlocks.length > 0) {
    md += '\n## 代码片段\n\n';
    codeBlocks.forEach((block, index) => {
      md += `### 代码块 ${index + 1}\n\n`;
      md += '```' + block.language + '\n';
      md += block.code;
      md += '\n```\n\n';
    });
  }

  return md;
}

// 根据分类和标题生成文件路径
export function getFilePath(category: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/(^-|-$)/g, '');

  switch (category) {
    case 'frontend': return `docs/frontend/${slug}.md`;
    case 'backend': return `docs/backend/${slug}.md`;
    case 'algorithm': return `docs/algorithm/${slug}.md`;
    case 'projects': return `docs/projects/${slug}.md`;
    default: return `docs/${slug}.md`;
  }
}
