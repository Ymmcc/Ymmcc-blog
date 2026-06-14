import { GitHubFile, ArticleMeta, SeriesArticle, SeriesInfo } from './types';
import TurndownService from 'turndown';

const REPO_OWNER = 'Ymmcc';
const REPO_NAME = 'Ymmcc-blog';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@main`;

// 初始化 Turndown 服务（HTML 转 Markdown）
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// 自定义标题转换规则：去掉标题中的加粗标记
// Docusaurus TOC 中标题有 **bold** 会导致显示异常（如"1."代替完整标题）
turndownService.addRule('headingBold', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: (content, node) => {
    const level = Number(node.nodeName.charAt(1));
    const cleanContent = content.replace(/\*\*/g, '').trim();
    return `\n${'#'.repeat(level)} ${cleanContent}\n\n`;
  },
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
// 返回系列名称（如"数据库"）或 false
export function isSeriesContent(content: string): string | false {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  const seriesMatch = match[1].match(/^series:\s*(.+)$/m);
  if (!seriesMatch) return false;
  const val = seriesMatch[1].replace(/^["']|["']$/g, '').trim();
  return val || false;
}

// 判断是否为旧格式系列文章（series: true + <details>）
export function isOldSeriesFormat(content: string): boolean {
  return isSeriesContent(content) === 'true' && content.includes('<details');
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

  // 返回 GitHub 原始链接
  // 生成 Markdown 时会被替换为 Docusaurus 本地路径（如 /img/uploads/xxx.png）
  return `${RAW_BASE}/${path}`;
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

// 将 Markdown 中的 GitHub 原始图片链接替换为 Docusaurus 本地路径
// 站点部署在子目录 /Ymmcc-blog/ 下，图片路径必须带前缀
export function convertImageUrlToCDN(markdown: string): string {
  return markdown.replace(
    new RegExp(`${RAW_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/static/img/uploads/`, 'g'),
    `/Ymmcc-blog/img/uploads/`
  );
}

// 修复 Markdown 粗体在中文语境下 CommonMark 解析失败的问题
//
// 问题：CommonMark 规范要求 `**text**` 的闭合 `**` 必须满足"右边界"条件。
// 当 `**` 前是中文标点（如 `：`、`。`）、后是中文字符时，它不被认为是右边界，
// 因此无法闭合粗体，导致整个 `**text**` 被当作纯文本渲染。
//
// 修复：在闭合 `**` 和中文字符之间插入一个空格，使其正常解析。
// 对于中文字符，额外空格不影响视觉呈现。
function fixBoldCJK(markdown: string): string {
  return markdown.replace(
    /\*\*(.+?)\*\*(?=[一-鿿㐀-䶿＀-￯　-〿])/g,
    '**$1** '
  );
}

// 将标签字符串转为数组（兼容中文逗号、顿号）
function parseTags(tagsStr: string): string[] {
  return tagsStr
    .replace(/[，、\s]+/g, ',')  // 中文逗号、顿号、空白 → 英文逗号
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

// 生成 Markdown 内容（将 HTML 转换为 Markdown）
export function generateMarkdown(
  data: { title: string; tags: string; description: string; markdownContent: string }
): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const tagsArray = parseTags(data.tags);
  const hhmm = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const sidebarPos = parseInt(date.replace(/-/g, '') + hhmm, 10);

  // 将富文本 HTML 转换为 Markdown
  const markdownBody = fixBoldCJK(convertImageUrlToCDN(turndownService.turndown(data.markdownContent)));

  const md = `---
title: ${data.title}
sidebar_position: ${sidebarPos}
date: ${date}
tags: [${tagsArray.join(', ')}]
description: ${data.description}
---

${markdownBody}
`;

  return md;
}

// 简单拼音映射表（常用字首字母缩写）
// 用于纯中文标题时生成有意义的 slug，避免全部变成 post-xxx
const PINYIN_MAP: Record<string, string> = {
  '并': 'bing', '发': 'fa', '事': 'shi', '务': 'wu', '隔': 'ge', '离': 'li',
  '三': 'san', '层': 'ceng', '模': 'mo', '式': 'shi', '与': 'yu', '二': 'er',
  '级': 'ji', '映': 'ying', '射': 'she', '完': 'wan', '整': 'zheng', '性': 'xing',
  '规': 'gui', '则': 'ze', '数': 'shu', '据': 'ju', '库': 'ku', '基': 'ji',
  '础': 'chu', '结': 'jie', '构': 'gou', '算': 'suan', '法': 'fa',
  '论': 'lun', '文': 'wen', '学': 'xue', '物': 'wu', '理': 'li', '化': 'hua',
  '生': 'sheng', '入': 'ru', '门': 'men', '指': 'zhi', '南': 'nan',
  '简': 'jian', '介': 'jie', '总': 'zong', '实': 'shi', '例': 'li',
  '概': 'gai', '念': 'nian', '具': 'ju', '体': 'ti', '场': 'chang', '景': 'jing',
  '描': 'miao', '述': 'shu', '于': 'yu', '语': 'yu', '言': 'yan', '句': 'ju',
  '相': 'xiang', '关': 'guan', '知': 'zhi', '识': 'shi',
  '创': 'chuang', '建': 'jian', '新': 'xin', '增': 'zeng', '删': 'shan',
  '改': 'gai', '查': 'cha', '添': 'tian', '加': 'jia', '编': 'bian', '辑': 'ji',
  '优': 'you', '提': 'ti', '升': 'sheng', '速': 'su',
  '第': 'di', '一': 'yi', '篇': 'pian', '章': 'zhang', '节': 'jie',
  '使': 'shi', '用': 'yong', '教': 'jiao', '程': 'cheng',
  '初': 'chu', '中': 'zhong', '高': 'gao', '阶': 'jie', '技': 'ji', '巧': 'qiao',
  '代': 'dai', '码': 'ma', '项': 'xiang', '目': 'mu', '框': 'kuang', '架': 'jia',
  '前': 'qian', '端': 'duan', '后': 'hou', '服': 'fu',
  '页': 'ye', '面': 'mian', '组': 'zu', '件': 'jian', '路': 'lu', '由': 'you',
  '部': 'bu', '署': 'shu', '测': 'ce', '试': 'shi', '调': 'tiao',
  '错': 'cuo', '误': 'wu', '异': 'yi', '常': 'chang',
  '处': 'chu', '安': 'an', '全': 'quan', '权': 'quan', '限': 'xian',
  '验': 'yan', '证': 'zheng', '登': 'deng', '录': 'lu', '注': 'zhu', '册': 'ce',
  '户': 'hu', '管': 'guan', '配': 'pei', '置': 'zhi',
};

// 将标题转换为纯英文 slug
// 保留字母数字，中文转简单拼音，其余转为连字符
export function toSlug(title: string): string {
  let slug = title.toLowerCase();

  // 逐字符处理：中文转拼音，非中文保留
  let result = '';
  for (const char of slug) {
    if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (PINYIN_MAP[char]) {
      result += PINYIN_MAP[char];
    }
    // 其他字符（空格、标点等）忽略，后面用连字符统一替换
  }

  // 将连续的非字母数字替换为连字符
  result = result.replace(/[^a-z0-9]+/g, '-');
  // 去掉首尾连字符
  result = result.replace(/(^-|-$)/g, '');

  // 如果结果为空，用简短时间戳作为后备
  return result || `post-${Date.now().toString(36)}`;
}

// 根据分类和标题生成文件路径
export function getFilePath(category: string, title: string): string {
  const slug = toSlug(title);

  switch (category) {
    case 'frontend': return `docs/frontend/${slug}.md`;
    case 'backend': return `docs/backend/${slug}.md`;
    case 'algorithm': return `docs/algorithm/${slug}.md`;
    case 'projects': return `docs/projects/${slug}.md`;
    default: return `docs/${slug}.md`;
  }
}

// 根据分类、系列标题和文章标题生成系列文章子目录路径
// 例如：category=algorithm, seriesTitle="双指针：左右碰撞指针", articleTitle="验证回文串"
// 返回：docs/algorithm/shuang-zhi-zhen/yanzhengwen.md
// 这样 Docusaurus 的 _category_.json 就能自动分组
export function getSeriesFilePath(category: string, seriesTitle: string, articleTitle: string): string {
  const seriesSlug = toSlug(seriesTitle);
  const articleSlug = toSlug(articleTitle);

  switch (category) {
    case 'frontend': return `docs/frontend/${seriesSlug}/${articleSlug}.md`;
    case 'backend': return `docs/backend/${seriesSlug}/${articleSlug}.md`;
    case 'algorithm': return `docs/algorithm/${seriesSlug}/${articleSlug}.md`;
    case 'projects': return `docs/projects/${seriesSlug}/${articleSlug}.md`;
    default: return `docs/${seriesSlug}/${articleSlug}.md`;
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
    // 将 HTML 转为 Markdown 并替换图片链接为 CDN
    const body = fixBoldCJK(convertImageUrlToCDN(turndownService.turndown(article.content)));

    md += `<details${index === 0 ? ' open' : ''}>
<summary><strong>📖 ${article.title}</strong></summary>

${body.trim()}

</details>

`;
  });

  return md;
}

// 生成独立文件系列文章的 Markdown（非 <details> 格式）
// 每个文章是一个独立的 .md 文件，通过 series: <系列名> 关联
// sidebar_position 使用日期数字（如 20260610），实现按发布时间排序
export function generatePerFileSeriesMarkdown(
  data: {
    seriesTitle: string;
    title: string;
    tags: string;
    description: string;
    markdownContent: string;
  }
): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const tagsArray = parseTags(data.tags);
  const hhmm = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const sidebarPos = parseInt(date.replace(/-/g, '') + hhmm, 10);

  // 将富文本 HTML 转换为 Markdown，并将图片链接转为 CDN 加速
  const markdownBody = fixBoldCJK(convertImageUrlToCDN(turndownService.turndown(data.markdownContent)));

  return `---
title: ${data.title}
sidebar_position: ${sidebarPos}
date: ${date}
tags: [${tagsArray.join(', ')}]
description: ${data.description}
series: ${data.seriesTitle}
---

${markdownBody}
`;
}

// 根据已有系列文章路径和新建文章标题，生成同目录下的文件路径
export function getPerFileSeriesPath(existingArticlePath: string, newArticleTitle: string): string {
  const slug = toSlug(newArticleTitle);
  const dir = existingArticlePath.substring(0, existingArticlePath.lastIndexOf('/'));
  return `${dir}/${slug}.md`;
}

/*** 系列列表缓存 ***/

// 简单的哈希函数用于缓存 key（非安全用途）
function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

const SERIES_CACHE_KEY = 'myblog_series_list_cache';
const SERIES_CACHE_TTL = 10 * 60 * 1000; // 10 分钟

interface SeriesCacheEntry {
  tokenHash: string;
  data: SeriesInfo[];
  time: number;
}

function getCachedSeries(token: string): SeriesInfo[] | null {
  try {
    const raw = localStorage.getItem(SERIES_CACHE_KEY);
    if (!raw) return null;
    const entry: SeriesCacheEntry = JSON.parse(raw);
    if (entry.tokenHash !== hashStr(token)) return null;
    if (Date.now() - entry.time > SERIES_CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function saveCachedSeries(token: string, data: SeriesInfo[]) {
  try {
    const entry: SeriesCacheEntry = {
      tokenHash: hashStr(token),
      data,
      time: Date.now(),
    };
    localStorage.setItem(SERIES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage 不可用时忽略
  }
}

// 清除系列列表缓存
export function clearSeriesCache() {
  try {
    localStorage.removeItem(SERIES_CACHE_KEY);
  } catch { /* ignore */ }
}

// 获取所有系列文章（带缓存）
// cache: true（默认）使用 localStorage 缓存，cache: false 强制从 GitHub 重新拉取
// 支持两种格式：
//   1. 旧格式：单文件 series: true + <details> 块
//   2. 新格式：每个文章独立文件，frontmatter 中有 series: <系列名>
export async function fetchSeriesList(token: string, cache = true): Promise<SeriesInfo[]> {
  // 检查缓存
  if (cache) {
    const cached = getCachedSeries(token);
    if (cached) return cached;
  }

  const files = await fetchFileList(token);
  const seriesList: SeriesInfo[] = [];
  // 用于按系列名称聚合独立文件系列
  const perFileSeriesMap = new Map<string, SeriesInfo>();

  for (const file of files) {
    try {
      const { content } = await fetchFileContent(token, file.path);
      const seriesVal = isSeriesContent(content);

      if (!seriesVal) continue;

      if (seriesVal === 'true' && content.includes('<details')) {
        // 旧格式：series: true + <details>
        const parsed = parseSeriesContent(content);
        seriesList.push({
          title: parsed.seriesTitle,
          path: file.path,
          sha: file.sha,
          articles: parsed.articles.map((a, i) => ({
            ...a,
            filePath: file.path,
            fileSha: file.sha,
          })),
          date: parsed.articles.length > 0 ? parsed.articles[parsed.articles.length - 1].date : '',
          tags: parsed.tags,
          description: parsed.description,
        });
      } else if (seriesVal !== 'true') {
        // 新格式：series: <名称> — 每个文章是独立文件
        const meta = parseFrontmatter(content);
        if (!meta.title) continue;

        // 提取正文（去掉 frontmatter）
        const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');

        if (!perFileSeriesMap.has(seriesVal)) {
          perFileSeriesMap.set(seriesVal, {
            title: seriesVal,
            path: '',
            sha: '',
            articles: [],
            date: '',
            tags: [],
            description: '',
          });
        }

        const series = perFileSeriesMap.get(seriesVal)!;
        series.articles.push({
          id: `article_${series.articles.length}`,
          title: meta.title,
          date: meta.date || '',
          content: body,
          filePath: file.path,
          fileSha: file.sha,
        });

        // 合并标签和描述
        series.tags = [...new Set([...series.tags, ...meta.tags])];
        if (meta.description && !series.description) {
          series.description = meta.description;
        }
        if (!series.date || (meta.date && meta.date > series.date)) {
          series.date = meta.date;
        }
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  // 将 per-file 系列加入结果，path/sha 设为第一篇
  for (const [, s] of perFileSeriesMap) {
    const first = s.articles[0];
    if (first) {
      s.path = first.filePath || '';
      s.sha = first.fileSha || '';
    }
    seriesList.push(s);
  }

  // 保存到缓存
  saveCachedSeries(token, seriesList);
  return seriesList;
}
