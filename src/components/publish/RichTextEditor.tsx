import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import styles from '../../pages/publish.module.css';

const lowlight = createLowlight(common);

interface Props {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
}

export default function RichTextEditor({ content, onChange, onImageUpload }: Props) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCodeLang, setShowCodeLang] = useState(false);
  const [resizePopup, setResizePopup] = useState<{ top: number; left: number; node: HTMLElement } | null>(null);
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 用低级扩展替代以支持语法高亮
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'editor-code-block',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Placeholder.configure({
        placeholder: '在这里编写文章内容...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.tiptapContent,
      },
    },
  });

  // 点击图片时显示调整大小弹窗
  useEffect(() => {
    if (!editor) return;
    const editorEl = editor.view.dom;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        const rect = target.getBoundingClientRect();
        const container = editorEl.closest(`.${styles.tiptapEditor}`);
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        setResizePopup({
          top: rect.bottom - containerRect.top + 8,
          left: rect.left - containerRect.left,
          node: target,
        });
        setResizeWidth(target.getAttribute('width') || '');
        setResizeHeight(target.getAttribute('height') || '');
      } else {
        setResizePopup(null);
      }
    };

    editorEl.addEventListener('click', handleClick);
    return () => editorEl.removeEventListener('click', handleClick);
  }, [editor]);

  // 应用图片尺寸调整
  const applyResize = () => {
    if (!resizePopup || !editor) return;
    const { node } = resizePopup;

    // 使用 editor 的 node API 更新属性
    const pos = editor.view.posAtDOM(node, 0);
    if (pos !== null) {
      const resolvedPos = editor.state.doc.resolve(pos);
      const imgNode = resolvedPos.nodeAfter;
      if (imgNode) {
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...imgNode.attrs,
          width: resizeWidth || null,
          height: resizeHeight || null,
        });
        editor.view.dispatch(tr);
      }
    }

    setResizePopup(null);
  };

  // 同步外部内容变化
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // 插入图片到编辑器
  const insertImage = useCallback((url: string, alt?: string, width?: string, height?: string) => {
    if (!editor) return;
    const attrs: Record<string, string> = { src: url, alt: alt || '图片' };
    if (width) attrs.width = width;
    if (height) attrs.height = height;
    editor.chain().focus().setImage(attrs).run();
  }, [editor]);

  // 处理本地文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!onImageUpload) {
      setShowImageDialog(true);
      return;
    }
    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      if (url) {
        const alt = file.name.replace(/\.[^.]+$/, '');
        insertImage(url, alt, imageWidth || undefined, imageHeight || undefined);
      }
    } catch {
      // 错误由父组件处理
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, insertImage, imageWidth, imageHeight]);

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  // 图片 URL 插入
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    insertImage(imageUrl.trim(), imageAlt.trim() || '图片', imageWidth || undefined, imageHeight || undefined);
    setImageUrl('');
    setImageAlt('');
    setImageWidth('');
    setImageHeight('');
    setShowImageDialog(false);
  };

  // 拖拽/粘贴图片
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) handleFileUpload(imageFile);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // 常用编程语言列表
  const codeLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
  ];

  // 字数统计
  const textContent = editor?.state.doc.textContent || '';
  const wordCount = textContent.replace(/\s/g, '').length;
  const readTime = Math.max(1, Math.ceil(wordCount / 300));

  if (!editor) return null;

  return (
    <div
      className={styles.tiptapEditor}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPaste={handlePaste}
    >
      {/* 工具栏 */}
      <div className={styles.tiptapToolbar}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('bold') ? styles.active : ''}`}
          title="加粗 (Ctrl+B)"
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('italic') ? styles.active : ''}`}
          title="斜体 (Ctrl+I)"
          type="button"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('strike') ? styles.active : ''}`}
          title="删除线"
          type="button"
        >
          <s>S</s>
        </button>

        <div className={styles.tiptapDivider} />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${styles.tiptapBtn} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
          title="一级标题"
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${styles.tiptapBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
          title="二级标题"
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${styles.tiptapBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          title="三级标题"
          type="button"
        >
          H3
        </button>

        <div className={styles.tiptapDivider} />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
          title="无序列表"
          type="button"
        >
          • 列表
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
          title="有序列表"
          type="button"
        >
          1. 列表
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${styles.tiptapBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
          title="引用"
          type="button"
        >
          ❝ 引用
        </button>

        <div className={styles.tiptapDivider} />

        {/* 代码块 - 带语言选择 */}
        <div className={styles.codeBlockGroup}>
          <button
            onClick={() => {
              editor.chain().focus().toggleCodeBlock().run();
              setShowCodeLang(false);
            }}
            className={`${styles.tiptapBtn} ${editor.isActive('codeBlock') ? styles.active : ''}`}
            title="代码块"
            type="button"
          >
            {'</>'} 代码块
          </button>
          <button
            onClick={() => setShowCodeLang(!showCodeLang)}
            className={styles.tiptapBtnSmall}
            title="选择代码语言"
            type="button"
          >
            ▾
          </button>
          {showCodeLang && (
            <div className={styles.codeLangDropdown}>
              {codeLanguages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => {
                    editor.chain().focus().toggleCodeBlock().run();
                    // 设置语言需要在 code block 激活后
                    setTimeout(() => {
                      editor.chain().focus().updateAttributes('codeBlock', { language: lang.value }).run();
                    }, 0);
                    setShowCodeLang(false);
                  }}
                  className={styles.codeLangOption}
                  type="button"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={styles.tiptapBtn}
          title="分割线"
          type="button"
        >
          ─ 分割线
        </button>

        <div className={styles.tiptapDivider} />

        <button
          onClick={() => setShowImageDialog(true)}
          className={styles.tiptapBtn}
          title="插入图片"
          type="button"
        >
          🖼 图片
        </button>
        <button
          onClick={() => {
            const url = window.prompt('请输入链接地址：');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`${styles.tiptapBtn} ${editor.isActive('link') ? styles.active : ''}`}
          title="插入链接"
          type="button"
        >
          🔗 链接
        </button>
      </div>

      {/* 编辑器内容 */}
      <EditorContent editor={editor} />

      {/* 字数统计栏 */}
      <div className={styles.editorStats}>
        <span>字数: {wordCount}</span>
        <span>预计阅读: {readTime} 分钟</span>
        {isUploading && <span className={styles.uploadingHint}>⏳ 图片上传中...</span>}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 图片插入对话框 */}
      {showImageDialog && (
        <div className={styles.imageDialogOverlay} onClick={() => setShowImageDialog(false)}>
          <div className={styles.imageDialog} onClick={e => e.stopPropagation()}>
            <h3>插入图片</h3>

            <div className={styles.imageDialogTabs}>
              <button
                className={styles.imageDialogTab}
                onClick={() => fileInputRef.current?.click()}
              >
                📁 上传本地图片
              </button>
              <span className={styles.imageDialogOr}>或</span>
              <button
                className={styles.imageDialogTab}
                onClick={() => { /* URL 输入已在下方 */ }}
              >
                🔗 输入图片链接
              </button>
            </div>

            <div className={styles.imageDialogField}>
              <label>图片 URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className={styles.formInput}
              />
            </div>

            <div className={styles.imageDialogField}>
              <label>图片描述（可选）</label>
              <input
                type="text"
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                placeholder="图片描述"
                className={styles.formInput}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className={styles.imageDialogField} style={{ flex: 1 }}>
                <label>宽度（可选）</label>
                <input
                  type="text"
                  value={imageWidth}
                  onChange={e => setImageWidth(e.target.value)}
                  placeholder="如 300px 或 50%"
                  className={styles.formInput}
                />
              </div>
              <div className={styles.imageDialogField} style={{ flex: 1 }}>
                <label>高度（可选）</label>
                <input
                  type="text"
                  value={imageHeight}
                  onChange={e => setImageHeight(e.target.value)}
                  placeholder="如 200px"
                  className={styles.formInput}
                />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              💡 常用尺寸：小图 200px、中图 400px、大图 600px、全宽 100%
            </p>

            <div className={styles.imageDialogActions}>
              <button onClick={() => setShowImageDialog(false)} className={styles.cancelBtn}>
                取消
              </button>
              <button
                onClick={handleInsertImageUrl}
                disabled={!imageUrl.trim()}
                className={styles.confirmBtn}
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片调整大小弹窗 */}
      {resizePopup && (
        <div
          style={{
            position: 'absolute',
            top: resizePopup.top,
            left: resizePopup.left,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>宽度</label>
            <input
              type="text"
              value={resizeWidth}
              onChange={e => setResizeWidth(e.target.value)}
              placeholder="如 300px"
              style={{ width: '80px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>高度</label>
            <input
              type="text"
              value={resizeHeight}
              onChange={e => setResizeHeight(e.target.value)}
              placeholder="如 200px"
              style={{ width: '80px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            />
          </div>
          <button
            onClick={applyResize}
            style={{ padding: '4px 12px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            应用
          </button>
          <button
            onClick={() => setResizePopup(null)}
            style={{ padding: '4px 8px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
