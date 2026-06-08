import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';

interface Props {
  title: string;
  content: string;
  onClose: () => void;
}

export default function PreviewModal({ title, content, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
    }
    if (modalRef.current) {
      gsap.set(modalRef.current, { scale: 0.95, opacity: 0 });
      gsap.to(modalRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
    }
  }, []);

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    }
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.95, opacity: 0, duration: 0.2,
        onComplete: onClose
      });
    }
  };

  return (
    <div ref={overlayRef} className={styles.modalOverlay} onClick={handleClose}>
      <div ref={modalRef} className={styles.previewModal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>文章预览</h3>
          <button onClick={handleClose} className={styles.modalCloseBtn}>✕</button>
        </div>
        <div className={styles.previewBody}>
          <h1 className={styles.previewTitle}>{title || '无标题'}</h1>
          <div
            className={styles.previewContent}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}
