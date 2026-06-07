import React, { useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';

interface Props {
  content: string;
  onClose: () => void;
}

export default function PreviewModal({ content, onClose }: Props) {
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

  return (
    <div ref={overlayRef} className={styles.modalOverlay} onClick={handleClose}>
      <div ref={modalRef} className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>文章预览</h3>
          <button onClick={handleClose} className={styles.modalCloseBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <MDEditor.Markdown source={content} />
        </div>
      </div>
    </div>
  );
}
