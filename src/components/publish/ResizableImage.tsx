import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from '../../pages/publish.module.css';

// 可拖拽调整大小的图片组件
export default function ResizableImage({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const aspectRatio = useRef(1);

  const { src, alt, width, height } = node.attrs;

  // 获取图片实际尺寸和宽高比
  useEffect(() => {
    const img = imageRef.current;
    if (img && img.naturalWidth && img.naturalHeight) {
      aspectRatio.current = img.naturalWidth / img.naturalHeight;
    }
  }, [src]);

  // 开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    const img = imageRef.current;
    if (!img) return;

    // 记录当前图片的实际显示尺寸
    const rect = img.getBoundingClientRect();
    const currentWidth = width ? parseInt(width) : rect.width;
    const currentHeight = height ? parseInt(height) : rect.height;

    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: currentWidth, height: currentHeight });
    aspectRatio.current = currentWidth / currentHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaY = moveEvent.clientY - e.clientY;

      let newWidth = currentWidth;
      let newHeight = currentHeight;

      // 根据拖拽方向计算新尺寸
      if (direction.includes('e')) {
        newWidth = Math.max(50, currentWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(50, currentWidth - deltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(50, currentHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(50, currentHeight - deltaY);
      }

      // 四角拖拽时保持宽高比
      if (direction.length === 2) {
        if (direction === 'se' || direction === 'nw') {
          newHeight = newWidth / aspectRatio.current;
        } else {
          newWidth = newHeight * aspectRatio.current;
        }
      }

      // 实时更新图片尺寸
      if (img) {
        img.style.width = `${Math.round(newWidth)}px`;
        img.style.height = `${Math.round(newHeight)}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - e.clientX;
      const deltaY = upEvent.clientY - e.clientY;

      let newWidth = currentWidth;
      let newHeight = currentHeight;

      if (direction.includes('e')) {
        newWidth = Math.max(50, currentWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(50, currentWidth - deltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(50, currentHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(50, currentHeight - deltaY);
      }

      if (direction.length === 2) {
        if (direction === 'se' || direction === 'nw') {
          newHeight = newWidth / aspectRatio.current;
        } else {
          newWidth = newHeight * aspectRatio.current;
        }
      }

      // 保存最终尺寸
      updateAttributes({
        width: `${Math.round(newWidth)}`,
        height: `${Math.round(newHeight)}`,
      });

      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, height, updateAttributes]);

  // 8个拖拽手柄的位置
  const handles = [
    { direction: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
    { direction: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
    { direction: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
    { direction: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
    { direction: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { direction: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
    { direction: 'w', style: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' } },
    { direction: 'e', style: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' } },
  ];

  const imgStyle: React.CSSProperties = {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    display: 'block',
  };

  if (width) imgStyle.width = typeof width === 'string' ? width : `${width}px`;
  if (height) imgStyle.height = typeof height === 'string' ? height : `${height}px`;

  return (
    <NodeViewWrapper className={styles.resizableImageWrapper}>
      <div
        className={`${styles.resizableImageContainer} ${selected ? styles.selected : ''}`}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          style={imgStyle}
          draggable={false}
        />

        {/* 选中时显示拖拽手柄 */}
        {selected && (
          <>
            {/* 选中边框 */}
            <div className={styles.selectionBorder} />

            {/* 8个拖拽手柄 */}
            {handles.map(({ direction, style }) => (
              <div
                key={direction}
                className={styles.resizeHandle}
                style={style as React.CSSProperties}
                onMouseDown={(e) => handleMouseDown(e, direction)}
              />
            ))}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
