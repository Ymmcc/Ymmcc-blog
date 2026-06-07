import React from 'react';
import styles from '../../pages/publish.module.css';

interface Props {
  onInsert: (text: string) => void;
  onImageUpload: () => void;
  onPreview: () => void;
}

export default function EditorToolbar({ onInsert, onImageUpload, onPreview }: Props) {
  const tools = [
    { label: 'B', title: '加粗', action: () => onInsert('**粗体文字**') },
    { label: 'I', title: '斜体', action: () => onInsert('*斜体文字*') },
    { label: 'H1', title: '一级标题', action: () => onInsert('\n# 标题\n') },
    { label: 'H2', title: '二级标题', action: () => onInsert('\n## 标题\n') },
    { label: '🔗', title: '链接', action: () => onInsert('[链接文字](https://)') },
    { label: '📷', title: '上传图片', action: onImageUpload },
    { label: '💻', title: '插入代码块', action: () => onInsert('\n```javascript\n// 代码\n```\n') },
    { label: '👁', title: '预览', action: onPreview },
  ];

  return (
    <div className={styles.toolbar}>
      {tools.map((tool) => (
        <button
          key={tool.label}
          onClick={tool.action}
          className={styles.toolbarBtn}
          title={tool.title}
          type="button"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
