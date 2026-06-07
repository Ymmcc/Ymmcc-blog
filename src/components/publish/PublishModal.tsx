import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';

interface Props {
  onConfirm: (token: string) => void;
  onClose: () => void;
  isPublishing: boolean;
}

export default function PublishModal({ onConfirm, onClose, isPublishing }: Props) {
  const [token, setToken] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
    }
    if (modalRef.current) {
      gsap.set(modalRef.current, { scale: 0.9, opacity: 0 });
      gsap.to(modalRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
    }
  }, []);

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    }
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.9, opacity: 0, duration: 0.2,
        onComplete: onClose
      });
    }
  };

  const handleConfirm = () => {
    if (token.trim()) {
      onConfirm(token.trim());
    }
  };

  return (
    <div ref={overlayRef} className={styles.modalOverlay} onClick={handleClose}>
      <div ref={modalRef} className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>确认发布</h3>
          <button onClick={handleClose} className={styles.modalCloseBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalText}>文章将发布到 GitHub 仓库，并自动触发部署。</p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GitHub Token</label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="请输入 GitHub Personal Access Token"
              className={styles.formInput}
            />
            <p className={styles.tokenNote}>
              <span>🔒</span> Token 仅用于本次发布，不会被存储
            </p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={handleClose} className={styles.modalCancelBtn} disabled={isPublishing}>
            取消
          </button>
          <button onClick={handleConfirm} className={styles.modalConfirmBtn} disabled={!token || isPublishing}>
            {isPublishing ? '发布中...' : '确认发布'}
          </button>
        </div>
      </div>
    </div>
  );
}
