import React, { useState, useRef, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';
import { ArticleData, CodeBlock, EditMode, defaultArticleData } from './types';
import { saveDraft } from './storage';
import { generateMarkdown, getFilePath, upsertFile } from './github-api';
import EditorToolbar from './EditorToolbar';
import ImageUploader, { useImageDropPaste } from './ImageUploader';
import PreviewModal from './PreviewModal';
import PublishModal from './PublishModal';

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
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(
    editMode?.type === 'draft' ? editMode.id : undefined
  );
  const [editingSha, setEditingSha] = useState(initialSha);
  const [editingPath, setEditingPath] = useState(initialPath);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  }, [articleData]);

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

  // 插入文本到编辑器
  const handleInsert = (text: string) => {
    handleChange({ markdownContent: articleData.markdownContent + text });
  };

  // 图片上传
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = useCallback(async (file: File) => {
    // 图片上传需要 Token，在发布弹窗中处理
    setStatusMsg({ type: 'error', text: '请通过发布弹窗输入 Token 后上传图片' });
  }, []);

  // 拖拽/粘贴处理
  const { handleDrop, handleDragOver, handlePaste } = useImageDropPaste(handleImageFile);

  // 生成预览内容
  const getPreviewContent = (): string => {
    let content = articleData.markdownContent;
    if (articleData.codeBlocks.length > 0) {
      content += '\n\n## 代码片段\n\n';
      articleData.codeBlocks.forEach((block, i) => {
        content += `### 代码块 ${i + 1}\n\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
      });
    }
    return content;
  };

  // 发布
  const handlePublish = async (token: string) => {
    if (!articleData.title) {
      setStatusMsg({ type: 'error', text: '请输入文章标题' });
      return;
    }

    setIsPublishing(true);
    setStatusMsg(null);

    try {
      const content = generateMarkdown(articleData, articleData.codeBlocks);
      const path = editingPath || getFilePath(articleData.category, articleData.title);
      await upsertFile(token, path, content, `feat: ${editingSha ? '更新' : '添加'}文章 "${articleData.title}"`, editingSha);

      setStatusMsg({ type: 'success', text: '文章发布成功！GitHub Actions 将自动部署' });
      setShowPublish(false);
      setArticleData(defaultArticleData);
      setSavedDraftId(undefined);
      setEditingSha(undefined);
      setEditingPath(undefined);
      onClearEditMode();
      onPublishSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : '发布失败' });
    } finally {
      setIsPublishing(false);
    }
  };

  // 代码块管理
  const addCodeBlock = () => {
    const newBlock: CodeBlock = {
      id: Date.now().toString(),
      language: 'javascript',
      code: '// 在这里编写代码\n',
      isCollapsed: false
    };
    handleChange({ codeBlocks: [...articleData.codeBlocks, newBlock] });
  };

  const updateCodeBlock = (id: string, updates: Partial<CodeBlock>) => {
    handleChange({
      codeBlocks: articleData.codeBlocks.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const deleteCodeBlock = (id: string) => {
    handleChange({ codeBlocks: articleData.codeBlocks.filter(b => b.id !== id) });
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
        <h3 className={styles.cardTitle}><span>📄</span> Markdown 内容</h3>
        <EditorToolbar
          onInsert={handleInsert}
          onImageUpload={handleImageUpload}
          onPreview={() => setShowPreview(true)}
        />
        <div
          className={styles.editorWrapper}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
        >
          <MDEditor
            value={articleData.markdownContent}
            onChange={value => handleChange({ markdownContent: value || '' })}
            height={400}
            preview="edit"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
          style={{ display: 'none' }}
        />
      </div>

      {/* 代码块 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}><span>💻</span> 代码片段</h3>
          <button onClick={addCodeBlock} className={styles.addCodeBtn}>+ 添加代码块</button>
        </div>
        {articleData.codeBlocks.length === 0 ? (
          <div className={styles.emptyCode}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p style={{ margin: 0 }}>暂无代码块，点击上方按钮添加</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {articleData.codeBlocks.map((block, index) => (
              <div key={block.id} className={styles.codeBlock}>
                <div className={styles.codeBlockHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                      value={block.language}
                      onChange={e => updateCodeBlock(block.id, { language: e.target.value })}
                      className={styles.codeSelect}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash</option>
                    </select>
                    <span style={{ fontSize: '13px', color: '#666' }}>代码块 {index + 1}</span>
                  </div>
                  <div className={styles.codeBlockActions}>
                    <button onClick={() => updateCodeBlock(block.id, { isCollapsed: !block.isCollapsed })} className={styles.codeBtn}>
                      {block.isCollapsed ? '展开' : '折叠'}
                    </button>
                    <button onClick={() => deleteCodeBlock(block.id)} className={`${styles.codeBtn} ${styles.danger}`}>
                      删除
                    </button>
                  </div>
                </div>
                {!block.isCollapsed && (
                  <MDEditor
                    value={block.code}
                    onChange={value => updateCodeBlock(block.id, { code: value || '' })}
                    height={150}
                    preview="edit"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actionBar}>
        <button onClick={handleSaveDraft} className={styles.saveDraftBtn}>
          💾 保存草稿
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
        <PreviewModal content={getPreviewContent()} onClose={() => setShowPreview(false)} />
      )}

      {/* 发布弹窗 */}
      {showPublish && (
        <PublishModal
          onConfirm={handlePublish}
          onClose={() => setShowPublish(false)}
          isPublishing={isPublishing}
        />
      )}
    </div>
  );
}
