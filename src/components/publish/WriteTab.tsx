import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';
import { ArticleData, EditMode, defaultArticleData } from './types';
import { saveDraft } from './storage';
import { generateMarkdown, getFilePath, upsertFile, uploadImage } from './github-api';
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
}

export default function WriteTab({
  editMode, initialData, initialSha, initialPath,
  onClearEditMode, onPublishSuccess
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
  const [githubToken, setGithubToken] = useState('');

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

  // 入场动画
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.set(containerRef.current, { y: 30, opacity: 0 });
    gsap.to(containerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
  }, []);

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
          const base64 = e.target?.result as string;

          // 没有 Token 时，先用 base64 占位，发布时会自动上传替换
          if (!githubToken) {
            setStatusMsg({ type: 'success', text: '图片已插入，发布时会自动上传到 GitHub' });
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
    if (!articleData.title) {
      setPublishError('请输入文章标题');
      return;
    }

    // 保存 Token 供图片上传使用
    setGithubToken(token);
    setIsPublishing(true);
    setPublishError(null);
    setStatusMsg(null);

    try {
      // 先上传内容中的 base64 图片
      const processedHtml = await uploadInlineImages(articleData.markdownContent, token);
      const processedData = { ...articleData, markdownContent: processedHtml };

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

      {/* 元信息表单 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}><span>📝</span> 文章信息</h3>
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
          title={articleData.title}
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
