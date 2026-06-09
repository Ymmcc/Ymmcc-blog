import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';
import { GitHubFile, ArticleMeta, SeriesInfo } from './types';
import { fetchFileList, fetchFileContent, parseFrontmatter, deleteFile, isSeriesContent, parseSeriesContent, upsertFile } from './github-api';

interface Props {
  token: string;
  onTokenChange: (token: string) => void;
  onEditArticle: (content: string, sha: string, path: string) => void;
  onEditSeriesArticle?: (seriesPath: string, seriesSha: string, seriesTitle: string, articleTitle: string, articleContent: string) => void;
}

interface ArticleItem extends GitHubFile {
  meta: ArticleMeta;
}

interface SeriesItem {
  info: SeriesInfo;
  category: string;
}

export default function ManageTab({ token, onTokenChange, onEditArticle, onEditSeriesArticle }: Props) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.set(containerRef.current, { y: 30, opacity: 0 });
    gsap.to(containerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
  }, []);

  // 加载文章列表
  const loadArticles = async () => {
    if (!token) {
      setStatusMsg({ type: 'error', text: '请先输入 GitHub Token' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const files = await fetchFileList(token);
      const articleItems: ArticleItem[] = [];
      const seriesItems: SeriesItem[] = [];

      for (const file of files) {
        try {
          const { content } = await fetchFileContent(token, file.path);
          const meta = parseFrontmatter(content);

          if (isSeriesContent(content)) {
            const parsed = parseSeriesContent(content);
            const catMatch = file.path.match(/^docs\/([^/]+)\//);
            seriesItems.push({
              info: {
                title: parsed.seriesTitle,
                path: file.path,
                sha: file.sha,
                articles: parsed.articles,
                date: parsed.articles.length > 0 ? parsed.articles[parsed.articles.length - 1].date : '',
                tags: parsed.tags,
                description: parsed.description,
              },
              category: catMatch ? catMatch[1] : '',
            });
          } else {
            articleItems.push({ ...file, meta });
          }
        } catch {
          // 跳过无法读取的文件
        }
      }

      setArticles(articleItems);
      setSeriesList(seriesItems);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序
  const filteredArticles = articles
    .filter(a => {
      const matchSearch = a.meta.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || a.path.includes(`/${categoryFilter}/`);
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.meta.date || 0).getTime();
      const dateB = new Date(b.meta.date || 0).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // 编辑文章
  const handleEdit = async (article: ArticleItem) => {
    if (!token) {
      setStatusMsg({ type: 'error', text: '请先输入 GitHub Token' });
      return;
    }

    try {
      const { content, sha } = await fetchFileContent(token, article.path);
      // 去掉 frontmatter，只保留正文
      const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
      onEditArticle(body, sha, article.path);
    } catch (err) {
      setStatusMsg({ type: 'error', text: '加载文章内容失败' });
    }
  };

  // 删除文章
  const handleDelete = async (article: ArticleItem) => {
    if (!token) return;

    try {
      await deleteFile(token, article.path, article.sha);
      setArticles(prev => prev.filter(a => a.path !== article.path));
      setConfirmDelete(null);
      setStatusMsg({ type: 'success', text: `已删除: ${article.meta.title}` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : '删除失败' });
    }
  };

  // 编辑系列文章中的子文章
  const handleEditSeriesArticle = async (series: SeriesItem, article: { title: string; content: string }) => {
    if (!token) {
      setStatusMsg({ type: 'error', text: '请先输入 GitHub Token' });
      return;
    }
    try {
      const { content: fullContent } = await fetchFileContent(token, series.info.path);
      const parsed = parseSeriesContent(fullContent);
      const target = parsed.articles.find(a => a.title === article.title);
      if (!target) {
        setStatusMsg({ type: 'error', text: '找不到该文章' });
        return;
      }
      onEditSeriesArticle?.(series.info.path, series.info.sha, series.info.title, article.title, target.content);
    } catch {
      setStatusMsg({ type: 'error', text: '加载文章内容失败' });
    }
  };

  // 查看系列文章中的子文章
  const handleViewSeriesArticle = (series: SeriesItem, article: { title: string }) => {
    const slug = series.info.path.replace(/^docs\//, '').replace(/\.md$/, '');
    const hash = encodeURIComponent(article.title);
    window.open(`/docs/${slug}?article=${hash}`, '_blank');
  };

  // 批量替换旧图片链接为 CDN 链接
  const REPO_PATH = 'https://cdn.jsdelivr.net/gh/Ymmcc/Ymmcc-blog@main';
  const handleReplaceImageUrls = async () => {
    if (!token) {
      setStatusMsg({ type: 'error', text: '请先输入 GitHub Token' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'success', text: '正在扫描所有文章中的图片链接...' });

    let replacedCount = 0;
    let totalFiles = 0;

    try {
      const files = await fetchFileList(token);

      for (const file of files) {
        try {
          const { content, sha } = await fetchFileContent(token, file.path);

          // 找出旧链接 /img/uploads/xxx → CDN 链接
          const oldPattern = /\/img\/uploads\//g;
          if (!oldPattern.test(content)) continue;

          const newContent = content.replace(
            /\/img\/uploads\//g,
            `${REPO_PATH}/static/img/uploads/`
          );

          await upsertFile(
            token, file.path, newContent,
            `perf: 替换图片链接为 CDN 加速 - ${file.name}`,
            sha
          );

          replacedCount++;
          totalFiles++;
        } catch {
          totalFiles++;
        }
      }

      setStatusMsg({
        type: 'success',
        text: `✅ 替换完成！共处理 ${replacedCount} 个文件中的图片链接为 CDN 加速`
      });

      // 刷新列表
      loadArticles();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : '替换失败' });
    } finally {
      setLoading(false);
    }
  };

  // 查看文章
  const handleView = (article: ArticleItem) => {
    const slug = article.path.replace(/^docs\//, '').replace(/\.md$/, '');
    window.open(`/docs/${slug}`, '_blank');
  };

  const categoryLabels: Record<string, string> = {
    frontend: '前端开发',
    backend: '后端开发',
    algorithm: '算法学习',
    projects: '项目作品'
  };

  return (
    <div ref={containerRef} className={styles.manageTab}>
      {/* Token 输入 */}
      <div className={styles.tokenBar}>
        <input
          type="password"
          value={token}
          onChange={e => onTokenChange(e.target.value)}
          placeholder="输入 GitHub Token 以管理文章"
          className={styles.formInput}
        />
        <button onClick={loadArticles} disabled={loading || !token} className={styles.loadBtn}>
          {loading ? '加载中...' : '加载文章'}
        </button>
        <button
          onClick={handleReplaceImageUrls}
          disabled={loading || !token}
          className={styles.cdnBtn}
          title="将文章中 /img/uploads/ 开头的图片链接替换为 CDN 链接，加速国内访问"
        >
          🚀 图片CDN加速
        </button>
      </div>

      {/* 状态消息 */}
      {statusMsg && (
        <div className={`${styles.statusMessage} ${styles[statusMsg.type]}`}>
          <span>{statusMsg.type === 'success' ? '✅' : '❌'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className={styles.filterBar}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索文章..."
          className={styles.searchInput}
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">全部分类</option>
          <option value="frontend">前端开发</option>
          <option value="backend">后端开发</option>
          <option value="algorithm">算法学习</option>
          <option value="projects">项目作品</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'oldest')} className={styles.filterSelect}>
          <option value="newest">最新发布</option>
          <option value="oldest">最早发布</option>
        </select>
      </div>

      {/* 文章列表 */}
      {seriesList.length === 0 && articles.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <p>{token ? '点击「加载文章」获取已发布文章列表' : '请输入 GitHub Token 以管理文章'}</p>
        </div>
      ) : (
        <div className={styles.articleList}>
          {/* 系列文章 */}
          {seriesList.map((series) => (
            <div key={series.info.path} className={styles.seriesCard}>
              <div
                className={styles.seriesHeader}
                onClick={() => setExpandedSeries(expandedSeries === series.info.path ? null : series.info.path)}
              >
                <div className={styles.seriesHeaderInfo}>
                  <span className={styles.seriesExpandIcon}>
                    {expandedSeries === series.info.path ? '▼' : '▶'}
                  </span>
                  <h4 className={styles.articleTitle}>📚 {series.info.title}</h4>
                  <span className={styles.articleCategory}>
                    {categoryLabels[series.category] || series.category}
                  </span>
                  <span className={styles.draftTags}>({series.info.articles.length} 篇)</span>
                </div>
                <div className={styles.seriesHeaderActions}>
                  <span className={styles.articleDate}>{series.info.date}</span>
                  <button
                    className={styles.editBtn}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!token) {
                        setStatusMsg({ type: 'error', text: '请先输入 GitHub Token' });
                        return;
                      }
                      try {
                        const { content, sha } = await fetchFileContent(token, series.info.path);
                        const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
                        onEditArticle(body, sha, series.info.path);
                      } catch {
                        setStatusMsg({ type: 'error', text: '加载系列文件失败' });
                      }
                    }}
                  >
                    编辑系列
                  </button>
                </div>
              </div>

              {/* 展开的子文章列表 */}
              {expandedSeries === series.info.path && (
                <div className={styles.seriesSubList}>
                  {series.info.articles.map((article, idx) => (
                    <div key={`${series.info.path}_${idx}`} className={styles.seriesSubItem}>
                      <div className={styles.articleInfo}>
                        <span className={styles.seriesSubIndex}>{idx + 1}.</span>
                        <span className={styles.seriesSubTitle}>{article.title}</span>
                        {article.date && (
                          <span className={styles.articleDate}>{article.date}</span>
                        )}
                      </div>
                      <div className={styles.articleActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEditSeriesArticle(series, article)}
                        >
                          编辑
                        </button>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleViewSeriesArticle(series, article)}
                        >
                          查看
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 单篇文章 */}
          {filteredArticles.map((article) => (
            <div key={article.path} className={styles.articleCard}>
              <div className={styles.articleInfo}>
                <h4 className={styles.articleTitle}>{article.meta.title || article.name}</h4>
                <div className={styles.articleMeta}>
                  <span className={styles.articleCategory}>
                    {categoryLabels[article.path.split('/')[1]] || article.path.split('/')[1]}
                  </span>
                  {article.meta.date && <span className={styles.articleDate}>{article.meta.date}</span>}
                </div>
                <span className={styles.articlePath}>{article.path}</span>
              </div>
              <div className={styles.articleActions}>
                <button onClick={() => handleEdit(article)} className={styles.editBtn}>编辑</button>
                {confirmDelete === article.path ? (
                  <div className={styles.confirmActions}>
                    <button onClick={() => handleDelete(article)} className={styles.confirmDeleteBtn}>确认删除</button>
                    <button onClick={() => setConfirmDelete(null)} className={styles.cancelBtn}>取消</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(article.path)} className={styles.deleteBtn}>删除</button>
                )}
                <button onClick={() => handleView(article)} className={styles.viewBtn}>查看</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
