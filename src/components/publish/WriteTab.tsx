import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';
import { ArticleData, EditMode, ArticleMode, SeriesInfo, defaultArticleData } from './types';
import { saveDraft } from './storage';
import {
  generateMarkdown, generateSeriesMarkdown, getFilePath, upsertFile, uploadImage,
  fetchFileContent, fetchSeriesList, parseSeriesContent, compressImage, optimizeImageTags
} from './github-api';
import RichTextEditor from './RichTextEditor';
import PublishModal from './PublishModal';
import PreviewModal from './PreviewModal';

interface Props {
  editMode: EditMode | null;
  initialData?: ArticleData;
  initialSha?: string;
  initialPath?: string;
  onClearEditMode: () => void;
  onPublishSuccess: () => void;
  githubToken?: string;
  onGithubTokenChange?: (token: string) => void;
}

export default function WriteTab({
  editMode, initialData, initialSha, initialPath,
  onClearEditMode, onPublishSuccess,
  githubToken: externalToken, onGithubTokenChange
}: Props) {
  const [articleData, setArticleData] = useState<ArticleData>(initialData || defaultArticleData);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(
    editMode?.type === 'draft' ? editMode.id : undefined
  );
  const [editingSha, setEditingSha] = useState(initialSha);
  const [editingPath, setEditingPath] = useState(initialPath);
  const githubToken = externalToken || '';

  // 系列文章模式
  const [articleMode, setArticleMode] = useState<ArticleMode>(
    editMode?.type === 'series-article' ? 'series' : 'single'
  );
  const [seriesTitle, setSeriesTitle] = useState(editMode?.seriesTitle || '');
  const [articleTitle, setArticleTitle] = useState(editMode?.articleTitle || '');
  const [availableSeries, setAvailableSeries] = useState<SeriesInfo[]>([]);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  // 编辑系列子文章时：记录当前编辑的是系列中的哪篇文章
  const [editingSeriesArticleTitle, setEditingSeriesArticleTitle] = useState<string | undefined>(
    editMode?.type === 'series-article' ? editMode.articleTitle : undefined
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载编辑模式数据
  useEffect(() => {
    if (initialData) {
      setArticleData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialSha) setEditingSha(initialSha);
  }, [initialSha]);

  useEffect(() => {
    if (initialPath) setEditingPath(initialPath);
  }, [initialPath]);

  // 当编辑模式为系列子文章时更新系列相关状态
  useEffect(() => {
    if (editMode?.type === 'series-article') {
      setArticleMode('series');
      setSeriesTitle(editMode.seriesTitle || '');
      setArticleTitle(editMode.articleTitle || '');
      setEditingSeriesArticleTitle(editMode.articleTitle);
    } else if (!editMode) {
      // 退出编辑时重置系列状态
      setArticleMode('single');
      setSeriesTitle('');
      setArticleTitle('');
      setEditingSeriesArticleTitle(undefined);
    }
  }, [editMode]);

  // 加载系列列表
  const loadSeriesList = useCallback(() => {
    if (!githubToken || loadingSeries) return;
    setLoadingSeries(true);
    setShowSeriesDropdown(true);
    fetchSeriesList(githubToken)
      .then(list => setAvailableSeries(list))
      .catch(() => {})
      .finally(() => setLoadingSeries(false));
  }, [githubToken, loadingSeries]); // eslint-disable-line react-hooks/exhaustive-deps

  // 入场动画
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.set(containerRef.current, { y: 30, opacity: 0 });
    gsap.to(containerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
  }, []);

  // 切换到系列模式时自动加载已有系列列表
  useEffect(() => {
    if (articleMode === 'series') {
      loadSeriesList();
    }
  }, [articleMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+S 快捷键保存草稿
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [articleData, savedDraftId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (updates: Partial<ArticleData>) => {
    setArticleData(prev => ({ ...prev, ...updates }));
    setStatusMsg(null);
  };

  // 自动保存草稿（30秒防抖）
  useEffect(() => {
    if (!articleData.title) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const draft = saveDraft(articleData, savedDraftId);
      setSavedDraftId(draft.id);
      setStatusMsg({ type: 'success', text: '草稿已自动保存' });
      setTimeout(() => setStatusMsg(null), 2000);
    }, 30000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [articleData, savedDraftId]);

  // 手动保存草稿
  const handleSaveDraft = () => {
    if (!articleData.title) {
      setStatusMsg({ type: 'error', text: '请先输入标题' });
      return;
    }
    const draft = saveDraft(articleData, savedDraftId);
    setSavedDraftId(draft.id);
    setStatusMsg({ type: 'success', text: '草稿已保存' });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  // 图片上传处理：有 Token 直接上传，没有 Token 先用 base64 占位，发布时再上传
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          const base64Raw = e.target?.result as string;

          // 先压缩图片（减小 60-80% 体积）
          setStatusMsg({ type: 'success', text: '正在压缩图片...' });
          const base64 = await compressImage(base64Raw, 1600, 0.8).catch(() => base64Raw);

          // 没有 Token 时，先用 base64 占位，发布时会自动上传替换
          if (!githubToken) {
            setStatusMsg({ type: 'success', text: '图片已插入（已压缩），发布时会自动上传到 GitHub' });
            setTimeout(() => setStatusMsg(null), 2000);
            resolve(base64);
            return;
          }

          const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          try {
            const url = await uploadImage(githubToken, filename, base64);
            setStatusMsg({ type: 'success', text: '图片上传成功' });
            setTimeout(() => setStatusMsg(null), 2000);
            resolve(url);
          } catch (err) {
            setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : '图片上传失败' });
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  }, [githubToken]);

  // 上传内容中的 base64 图片到 GitHub，替换为线上 URL
  const uploadInlineImages = async (html: string, token: string): Promise<string> => {
    const base64Regex = /<img[^>]+src="(data:image\/[^"]+)"[^>]*>/g;
    const matches = [...html.matchAll(base64Regex)];

    if (matches.length === 0) return html;

    setStatusMsg({ type: 'success', text: `正在上传 ${matches.length} 张图片...` });

    let result = html;
    for (let i = 0; i < matches.length; i++) {
      const [fullMatch, base64Data] = matches[i];
      setStatusMsg({ type: 'success', text: `正在上传图片 ${i + 1}/${matches.length}...` });

      try {
        const ext = base64Data.match(/data:image\/([^;]+)/)?.[1] || 'png';
        const filename = `${Date.now()}-${i}.${ext}`;
        const url = await uploadImage(token, filename, base64Data);
        result = result.replace(fullMatch, fullMatch.replace(base64Data, url));
      } catch (err) {
        throw new Error(`图片上传失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }

    return result;
  };

  // 发布
  const handlePublish = async (token: string) => {
    if (articleMode === 'single' && !articleData.title) {
      setPublishError('请输入文章标题');
      return;
    }
    if (articleMode === 'series') {
      if (!seriesTitle) { setPublishError('请输入系列标题'); return; }
      if (!articleTitle) { setPublishError('请输入子文章标题'); return; }
    }

    // 保存 Token 供图片上传使用
    if (onGithubTokenChange) onGithubTokenChange(token);
    setIsPublishing(true);
    setPublishError(null);
    setStatusMsg(null);

    try {
      // 先上传内容中的 base64 图片
      const processedHtml = await uploadInlineImages(articleData.markdownContent, token);
      // 给所有图片添加懒加载属性，提升页面加载速度
      const optimizedHtml = optimizeImageTags(processedHtml);
      const processedData = { ...articleData, markdownContent: optimizedHtml };

      if (articleMode === 'series') {
        // === 系列文章发布 ===
        const isNewSeries = !editingPath;
        let existingArticles: { title: string; content: string }[] = [];
        let shaToUse: string | undefined;

        if (!isNewSeries) {
          // 已有系列：获取当前内容追加
          const { content: existingContent, sha } = await fetchFileContent(token, editingPath!);
          const parsed = parseSeriesContent(existingContent);
          shaToUse = sha;

          if (editingSeriesArticleTitle) {
            // 编辑系列中已有的子文章
            existingArticles = parsed.articles.map(a => {
              if (a.title === editingSeriesArticleTitle) {
                return { ...a, content: optimizedHtml };
              }
              return { title: a.title, content: a.content };
            });
          } else {
            // 追加新子文章到已有系列
            existingArticles = parsed.articles.map(a => ({ title: a.title, content: a.content }));
            existingArticles.push({ title: articleTitle, content: optimizedHtml });
          }
        } else {
          // 新建系列
          existingArticles.push({ title: articleTitle, content: optimizedHtml });
        }

        const seriesContent = generateSeriesMarkdown({
          seriesTitle,
          tags: articleData.tags,
          description: articleData.description,
          articles: existingArticles,
        });
        const path = editingPath || getFilePath(articleData.category, seriesTitle, true);
        await upsertFile(token, path, seriesContent, `feat: ${shaToUse ? '更新' : '添加'}系列文章 "${seriesTitle}"`, shaToUse);

        setStatusMsg({ type: 'success', text: '系列文章发布成功！GitHub Actions 将自动部署' });
        setShowPublish(false);
        setPublishError(null);
        // 重置
        setArticleData(defaultArticleData);
        setSeriesTitle('');
        setArticleTitle('');
        setEditingSeriesArticleTitle(undefined);
        setSavedDraftId(undefined);
        setEditingSha(undefined);
        setEditingPath(undefined);
        onClearEditMode();
        onPublishSuccess();
      } else {
        // === 单篇文章发布（原有逻辑）===
        const content = generateMarkdown(processedData);
        const path = editingPath || getFilePath(articleData.category, articleData.title);
        await upsertFile(token, path, content, `feat: ${editingSha ? '更新' : '添加'}文章 "${articleData.title}"`, editingSha);

        setStatusMsg({ type: 'success', text: '文章发布成功！GitHub Actions 将自动部署' });
        setShowPublish(false);
        setPublishError(null);
        setArticleData(defaultArticleData);
        setSavedDraftId(undefined);
        setEditingSha(undefined);
        setEditingPath(undefined);
        onClearEditMode();
        onPublishSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发布失败';
      setPublishError(msg);
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div ref={containerRef} className={styles.writeTab}>
      {/* 编辑模式提示 */}
      {editMode && (
        <div className={styles.editBanner}>
          <span>
            {editMode.type === 'draft' ? '📝 正在编辑草稿' : '📄 正在编辑已发布文章'}
          </span>
          <button onClick={onClearEditMode} className={styles.editBannerClose}>取消编辑</button>
        </div>
      )}

      {/* 状态消息 */}
      {statusMsg && (
        <div className={`${styles.statusMessage} ${styles[statusMsg.type]}`}>
          <span>{statusMsg.type === 'success' ? '✅' : '❌'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 模式切换 */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${articleMode === 'single' ? styles.modeBtnActive : ''}`}
          onClick={() => {
            setArticleMode('single');
            if (!editMode) onClearEditMode();
          }}
        >
          📄 单篇文章
        </button>
        <button
          className={`${styles.modeBtn} ${articleMode === 'series' ? styles.modeBtnActive : ''}`}
          onClick={() => setArticleMode('series')}
        >
          📚 系列文章
        </button>
      </div>

      {/* 元信息表单 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}><span>📝</span> 文章信息</h3>
        {articleMode === 'single' ? (
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>标题</label>
              <input
                type="text"
                value={articleData.title}
                onChange={e => handleChange({ title: e.target.value })}
                placeholder="请输入文章标题"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>分类</label>
              <select
                value={articleData.category}
                onChange={e => handleChange({ category: e.target.value })}
                className={styles.formInput}
              >
                <option value="frontend">前端开发</option>
                <option value="backend">后端开发</option>
                <option value="algorithm">算法学习</option>
                <option value="projects">项目作品</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>标签（逗号分隔）</label>
              <input
                type="text"
                value={articleData.tags}
                onChange={e => handleChange({ tags: e.target.value })}
                placeholder="例如：React, 前端, Hooks"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>摘要</label>
              <textarea
                value={articleData.description}
                onChange={e => handleChange({ description: e.target.value })}
                placeholder="简短描述文章内容..."
                rows={2}
                className={`${styles.formInput} ${styles.formTextarea}`}
              />
            </div>
          </div>
        ) : (
          <div className={styles.seriesForm}>
            {/* 系列标题 + 选择器 */}
            <div className={styles.seriesTitleRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>系列标题</label>
                <div style={{ position: 'relative' }}>
                  <div className={styles.seriesInputGroup}>
                    <input
                      type="text"
                      value={seriesTitle}
                      onChange={e => {
                        setSeriesTitle(e.target.value);
                        setShowSeriesDropdown(false);
                      }}
                      placeholder="例如：数据库"
                      className={styles.formInput}
                      onFocus={() => githubToken && (setShowSeriesDropdown(true), availableSeries.length === 0 && loadSeriesList())}
                    />
                    {githubToken ? (
                      <button
                        type="button"
                        className={styles.seriesDropdownBtn}
                        onClick={() => {
                          if (availableSeries.length === 0) loadSeriesList();
                          setShowSeriesDropdown(!showSeriesDropdown);
                        }}
                        title="选择已有系列"
                      >
                        ▼
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.seriesDropdownBtn} ${styles.seriesNoTokenBtn}`}
                        onClick={() => setShowSeriesDropdown(!showSeriesDropdown)}
                        title="需要先设置 GitHub Token"
                      >
                        ▼
                      </button>
                    )}
                  </div>
                  {/* 系列下拉列表 */}
                  {showSeriesDropdown && (
                  <div className={styles.seriesDropdown}>
                    {!githubToken ? (
                      <div className={styles.seriesDropdownTokenInput}>
                        <span className={styles.seriesDropdownItemHint}>需要 GitHub Token 加载已有系列</span>
                        <input
                          type="password"
                          placeholder="输入 GitHub Token..."
                          className={styles.seriesTokenInlineInput}
                          onChange={e => onGithubTokenChange?.(e.target.value)}
                        />
                      </div>
                    ) : loadingSeries ? (
                      <div className={styles.seriesDropdownItem}>加载中...</div>
                    ) : availableSeries.length === 0 ? (
                      <div className={styles.seriesDropdownItem}>暂无系列</div>
                    ) : (
                      availableSeries.map(s => (
                        <button
                          key={s.path}
                          className={styles.seriesDropdownItem}
                          onClick={() => {
                            setSeriesTitle(s.title);
                            setEditingSha(s.sha);
                            setEditingPath(s.path);
                            setEditingSeriesArticleTitle(undefined);
                            setShowSeriesDropdown(false);
                            // 同步分类、标签、摘要
                            const catMatch = s.path.match(/^docs\/([^/]+)\//);
                            handleChange({
                              category: catMatch ? catMatch[1] : '',
                              tags: s.tags.join(', '),
                              description: s.description || '',
                            });
                          }}
                        >
                          📚 {s.title}
                          <span className={styles.seriesDropdownMeta}>
                            ({s.articles.length} 篇)
                          </span>
                        </button>
                      ))
                    )}
                    <button
                      className={`${styles.seriesDropdownItem} ${styles.seriesDropdownNew}`}
                      onClick={() => {
                        setSeriesTitle('');
                        setEditingSha(undefined);
                        setEditingPath(undefined);
                        setShowSeriesDropdown(false);
                      }}
                    >
                      ➕ 新建系列
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* 子文章标题 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>文章标题</label>
              <input
                type="text"
                value={articleTitle}
                onChange={e => setArticleTitle(e.target.value)}
                placeholder="例如：SQL语句"
                className={styles.formInput}
              />
            </div>

            {/* 分类、标签、摘要（系列共用） */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>分类</label>
                <select
                  value={articleData.category}
                  onChange={e => handleChange({ category: e.target.value })}
                  className={styles.formInput}
                >
                  <option value="frontend">前端开发</option>
                  <option value="backend">后端开发</option>
                  <option value="algorithm">算法学习</option>
                  <option value="projects">项目作品</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>标签（逗号分隔）</label>
                <input
                  type="text"
                  value={articleData.tags}
                  onChange={e => handleChange({ tags: e.target.value })}
                  placeholder="例如：数据库, SQL"
                  className={styles.formInput}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>系列摘要</label>
              <textarea
                value={articleData.description}
                onChange={e => handleChange({ description: e.target.value })}
                placeholder="简短描述该系列..."
                rows={2}
                className={`${styles.formInput} ${styles.formTextarea}`}
              />
            </div>
            {editingSeriesArticleTitle && (
              <div className={styles.seriesEditNote}>
                ✏️ 正在编辑系列「{seriesTitle}」中的文章「{editingSeriesArticleTitle}」
              </div>
            )}
            {editingPath && !editingSeriesArticleTitle && (
              <div className={styles.seriesEditNote}>
                📚 正在追加文章到系列「{seriesTitle}」
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown 编辑器 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}><span>📄</span> 内容</h3>
        <RichTextEditor
          content={articleData.markdownContent}
          onChange={value => handleChange({ markdownContent: value })}
          onImageUpload={handleImageUpload}
        />
      </div>

      {/* 操作按钮 */}
      <div className={styles.actionBar}>
        <button onClick={handleSaveDraft} className={styles.saveDraftBtn}>
          💾 保存草稿 <span className={styles.shortcutHint}>Ctrl+S</span>
        </button>
        <button onClick={() => setShowPreview(true)} className={styles.previewBtn}>
          👁 预览
        </button>
        <button onClick={() => setShowPublish(true)} className={styles.publishBtn}>
          🚀 发布文章
        </button>
      </div>

      {/* 预览弹窗 */}
      {showPreview && (
        <PreviewModal
          title={articleMode === 'series' ? articleTitle || seriesTitle : articleData.title}
          content={articleData.markdownContent}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* 发布弹窗 */}
      {showPublish && (
        <PublishModal
          onConfirm={handlePublish}
          onClose={() => { setShowPublish(false); setPublishError(null); }}
          isPublishing={isPublishing}
          initialToken={githubToken}
          publishError={publishError}
        />
      )}
    </div>
  );
}
