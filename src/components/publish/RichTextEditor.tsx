import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import ResizableImageExtension from './ResizableImageExtension';
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
  const [isUploading, setIsUploading] = useState(false);
  const [showCodeLang, setShowCodeLang] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'editor-code-block',
        },
      }),
      ResizableImageExtension.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'editor-table' },
      }),
      TableRow,
      TableCell,
      TableHeader,
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

  // 同步外部内容变化
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // 插入图片到编辑器
  const insertImage = useCallback((url: string, alt?: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url, alt: alt || '图片' }).run();
  }, [editor]);

  // 处理本地文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!onImageUpload) {
      setShowImageDialog(true);
      return;
    }
    setIsUploading(true);
    setShowImageDialog(false); // 关闭弹窗
    try {
      const url = await onImageUpload(file);
      if (url) {
        const alt = file.name.replace(/\.[^.]+$/, '');
        insertImage(url, alt);
      }
    } catch {
      // 错误由父组件处理
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, insertImage]);

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  // 图片 URL 插入
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    insertImage(imageUrl.trim(), imageAlt.trim() || '图片');
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
  };

  // 解析 HTML 表格并插入编辑器
  const parseAndInsertTable = useCallback((html: string) => {
    if (!editor) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return;

    const rows: string[][] = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells: string[] = [];
      tr.querySelectorAll('th, td').forEach(cell => {
        cells.push(cell.textContent?.trim() || '');
      });
      if (cells.length > 0) rows.push(cells);
    });

    if (rows.length === 0) return;

    // 标准化列数（取最大列数）
    const maxCols = Math.max(...rows.map(r => r.length));
    const normalizedRows = rows.map(r => {
      while (r.length < maxCols) r.push('');
      return r;
    });

    // 构建 HTML 表格
    let tableHtml = '<table><tbody>';
    normalizedRows.forEach((row, rowIdx) => {
      tableHtml += '<tr>';
      row.forEach(cell => {
        const tag = rowIdx === 0 ? 'th' : 'td';
        tableHtml += `<${tag}><p>${cell}</p></${tag}>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    editor.chain().focus().insertContent(tableHtml).run();
  }, [editor]);

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

    // 粘贴图片
    const imageItem = items.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handleFileUpload(file);
      return;
    }

    // 同步检测粘贴的 HTML 表格（getData 是同步的，可立即 preventDefault）
    const html = e.clipboardData.getData('text/html');
    if (html && /<table[\s>]/i.test(html) && editor) {
      e.preventDefault();
      parseAndInsertTable(html);
      return;
    }
  }, [handleFileUpload, editor, parseAndInsertTable]);

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

        <div className={styles.tiptapDivider} />

        {/* 表格操作 */}
        <div className={styles.codeBlockGroup}>
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className={`${styles.tiptapBtn} ${editor.isActive('table') ? styles.active : ''}`}
            title="插入表格"
            type="button"
          >
            ⊞ 表格
          </button>
          <button
            onClick={() => setShowTableMenu(!showTableMenu)}
            className={styles.tiptapBtnSmall}
            title="表格操作"
            type="button"
          >
            ▾
          </button>
          {showTableMenu && (
            <div className={styles.codeLangDropdown}>
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">插入 3×3 表格</button>
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">插入 2×2 表格</button>
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 4, cols: 5, withHeaderRow: true }).run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">插入 4×5 表格</button>
              {editor.isActive('table') && (
                <>
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
                  <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">右侧添加列</button>
                  <button onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">下方添加行</button>
                  <button onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">删除当前列</button>
                  <button onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">删除当前行</button>
                  <button onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className={styles.codeLangOption} type="button">删除整个表格</button>
                </>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
}
