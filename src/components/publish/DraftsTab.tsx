import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';
import { Draft } from './types';
import { getDrafts, deleteDraft, clearDrafts, draftToArticleData } from './storage';

interface Props {
  onEditDraft: (draft: Draft) => void;
}

export default function DraftsTab({ onEditDraft }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.set(containerRef.current, { y: 30, opacity: 0 });
    gsap.to(containerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
  }, []);

  const filteredDrafts = drafts.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteDraft(id);
    setDrafts(getDrafts());
    setConfirmDelete(null);
  };

  const handleClearAll = () => {
    clearDrafts();
    setDrafts([]);
    setConfirmClear(false);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const categoryLabels: Record<string, string> = {
    frontend: '前端开发',
    backend: '后端开发',
    algorithm: '算法学习',
    projects: '项目作品'
  };

  return (
    <div ref={containerRef} className={styles.draftsTab}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>草稿箱 ({drafts.length})</h2>
        <div className={styles.tabHeaderActions}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索草稿..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {filteredDrafts.length === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <p>{search ? '没有找到匹配的草稿' : '暂无草稿，写文章时可以保存草稿'}</p>
        </div>
      ) : (
        <div className={styles.draftList}>
          {filteredDrafts.map((draft) => (
            <div key={draft.id} className={styles.draftCard}>
              <div className={styles.draftInfo}>
                <h4 className={styles.draftTitle}>{draft.title || '无标题'}</h4>
                <div className={styles.draftMeta}>
                  <span className={styles.draftCategory}>{categoryLabels[draft.category] || draft.category}</span>
                  {draft.tags && <span className={styles.draftTags}>{draft.tags}</span>}
                </div>
                <span className={styles.draftDate}>最后编辑: {formatDate(draft.updatedAt)}</span>
              </div>
              <div className={styles.draftActions}>
                <button onClick={() => onEditDraft(draft)} className={styles.editBtn}>编辑</button>
                {confirmDelete === draft.id ? (
                  <div className={styles.confirmActions}>
                    <button onClick={() => handleDelete(draft.id)} className={styles.confirmDeleteBtn}>确认删除</button>
                    <button onClick={() => setConfirmDelete(null)} className={styles.cancelBtn}>取消</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(draft.id)} className={styles.deleteBtn}>删除</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {drafts.length > 0 && (
        <div className={styles.tabFooter}>
          {confirmClear ? (
            <div className={styles.confirmActions}>
              <span>确定清空所有草稿？</span>
              <button onClick={handleClearAll} className={styles.confirmDeleteBtn}>确认清空</button>
              <button onClick={() => setConfirmClear(false)} className={styles.cancelBtn}>取消</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} className={styles.clearAllBtn}>清空所有草稿</button>
          )}
        </div>
      )}
    </div>
  );
}
