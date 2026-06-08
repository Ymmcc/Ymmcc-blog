const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const outputDir = path.join(__dirname, '..', 'src', 'data');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 分类配置
const categoryConfig = {
  frontend: { title: '前端开发', icon: '⚛️', description: 'React、Vue、TypeScript 等前端技术学习笔记', color: '#61dafb' },
  backend: { title: '后端开发', icon: '🐍', description: 'Python、Node.js、数据库等后端技术', color: '#3776ab' },
  algorithm: { title: '算法学习', icon: '🌳', description: '数据结构与算法，每日一题', color: '#f39c12' },
  projects: { title: '项目作品', icon: '🚀', description: '个人项目开发记录与总结', color: '#e74c3c' },
};

// 解析 frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = match[1];
  const result = {};

  // 解析 sidebar_position
  const posMatch = fm.match(/sidebar_position:\s*(\d+)/);
  if (posMatch) result.sidebar_position = parseInt(posMatch[1]);

  // 解析 title
  const titleMatch = fm.match(/title:\s*(.+)/);
  if (titleMatch) result.title = titleMatch[1].trim();

  // 解析 description
  const descMatch = fm.match(/description:\s*(.+)/);
  if (descMatch) result.description = descMatch[1].trim();

  // 解析 date
  const dateMatch = fm.match(/date:\s*(.+)/);
  if (dateMatch) result.date = dateMatch[1].trim();

  // 解析 tags
  const tagsMatch = fm.match(/tags:\s*\[(.+)\]/);
  if (tagsMatch) result.tags = tagsMatch[1].split(',').map(t => t.trim());

  return result;
}

// 从 markdown 内容提取描述
function extractDescription(content) {
  // 移除 frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
  // 移除标题
  const withoutTitle = withoutFrontmatter.replace(/^#\s+.+\n*/m, '');
  // 移除代码块
  const withoutCode = withoutTitle.replace(/```[\s\S]*?```/g, '');
  // 移除图片
  const withoutImages = withoutCode.replace(/!\[.*?\]\(.*?\)/g, '');
  // 移除多余空白
  const clean = withoutImages.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  // 取前 100 个字符作为描述
  const desc = clean.substring(0, 100);
  return desc + (desc.length >= 100 ? '...' : '');
}

// 从文件名生成链接
function getLink(dirName, fileName) {
  const slug = fileName.replace(/\.md$/, '');
  return `/docs/${dirName}/${slug}`;
}

// 从子目录文件名生成链接
function getSubDirLink(parentDir, subDir, fileName) {
  const slug = fileName.replace(/\.md$/, '');
  return `/docs/${parentDir}/${subDir}/${slug}`;
}

// 扫描目录（包括子目录）
function scanDirectory(dirName) {
  const dirPath = path.join(docsDir, dirName);
  if (!fs.existsSync(dirPath)) return [];

  const articles = [];

  // 扫描当前目录的 md 文件
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== 'intro.md');
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    const title = frontmatter.title || content.match(/^#\s+(.+)/m)?.[1] || file.replace(/\.md$/, '');
    const description = frontmatter.description || extractDescription(content);

    articles.push({
      title,
      description,
      link: getLink(dirName, file),
      tag: categoryConfig[dirName]?.title?.replace('开发', '').replace('学习', '') || dirName,
      icon: categoryConfig[dirName]?.icon || '📄',
      date: frontmatter.date || null,
      sidebar_position: frontmatter.sidebar_position || 999,
    });
  }

  // 扫描子目录
  const subDirs = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);

  for (const subDir of subDirs) {
    const subDirPath = path.join(dirPath, subDir);
    const subFiles = fs.readdirSync(subDirPath).filter(f => f.endsWith('.md') && f !== 'intro.md');

    for (const file of subFiles) {
      const filePath = path.join(subDirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);
      const title = frontmatter.title || content.match(/^#\s+(.+)/m)?.[1] || file.replace(/\.md$/, '');
      const description = frontmatter.description || extractDescription(content);

      // 读取子目录的 _category_.json 获取标签名
      const categoryPath = path.join(subDirPath, '_category_.json');
      let subDirLabel = subDir;
      if (fs.existsSync(categoryPath)) {
        try {
          const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf-8'));
          subDirLabel = categoryData.label || subDir;
        } catch (e) {
          // 忽略解析错误
        }
      }

      articles.push({
        title,
        description,
        link: getSubDirLink(dirName, subDir, file),
        tag: subDirLabel,
        icon: categoryConfig[dirName]?.icon || '📄',
        date: frontmatter.date || null,
        sidebar_position: frontmatter.sidebar_position || 999,
      });
    }
  }

  // 按 sidebar_position 排序
  articles.sort((a, b) => a.sidebar_position - b.sidebar_position);
  return articles;
}

// 生成统计数据
function generateStats() {
  const categories = Object.keys(categoryConfig);
  let totalNotes = 0;
  let totalProjects = 0;

  for (const cat of categories) {
    const dirPath = path.join(docsDir, cat);
    if (!fs.existsSync(dirPath)) continue;

    // 统计当前目录的 md 文件
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== 'intro.md');
    if (cat === 'projects') {
      totalProjects += files.length;
    } else {
      totalNotes += files.length;
    }

    // 统计子目录中的 md 文件
    const subDirs = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name);

    for (const subDir of subDirs) {
      const subDirPath = path.join(dirPath, subDir);
      const subFiles = fs.readdirSync(subDirPath).filter(f => f.endsWith('.md') && f !== 'intro.md');
      if (cat === 'projects') {
        totalProjects += subFiles.length;
      } else {
        totalNotes += subFiles.length;
      }
    }
  }

  return {
    notes: totalNotes,
    codeSnippets: Math.floor(totalNotes * 2.5), // 估算代码片段数量
    projects: totalProjects,
  };
}

// 生成最新笔记列表
function generateRecentNotes() {
  const allNotes = [];

  for (const dirName of Object.keys(categoryConfig)) {
    if (dirName === 'projects') continue;
    const notes = scanDirectory(dirName);
    allNotes.push(...notes);
  }

  // 按日期排序（如果有日期的话），否则按 sidebar_position
  allNotes.sort((a, b) => {
    if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
    return a.sidebar_position - b.sidebar_position;
  });

  return allNotes.slice(0, 3); // 返回最新的 3 篇
}

// 生成项目列表
function generateProjects() {
  const projects = scanDirectory('projects');
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  ];

  return projects.map((p, i) => ({
    ...p,
    techStack: ['React', 'TypeScript', 'Docusaurus'], // 默认技术栈
    gradient: gradients[i % gradients.length],
  }));
}

// 生成分类数据
function generateCategories() {
  const categories = [];

  for (const [dirName, config] of Object.entries(categoryConfig)) {
    const items = scanDirectory(dirName);
    categories.push({
      ...config,
      link: `/docs/${dirName}/intro`,
      items: items.map(item => ({ name: item.title, link: item.link })),
    });
  }

  return categories;
}

// 主函数
function main() {
  console.log('📊 生成博客数据...');

  const data = {
    stats: generateStats(),
    recentNotes: generateRecentNotes(),
    projects: generateProjects(),
    categories: generateCategories(),
    generatedAt: new Date().toISOString(),
  };

  // 写入 JSON 文件
  const outputPath = path.join(outputDir, 'blog-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ 数据已生成: ${outputPath}`);
  console.log(`   - 学习笔记: ${data.stats.notes} 篇`);
  console.log(`   - 代码片段: ${data.stats.codeSnippets} 个`);
  console.log(`   - 项目作品: ${data.stats.projects} 个`);
  console.log(`   - 最新笔记: ${data.recentNotes.length} 篇`);
  console.log(`   - 分类: ${data.categories.length} 个`);
}

main();
