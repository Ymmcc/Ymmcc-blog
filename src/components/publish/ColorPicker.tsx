import React, { useState, useRef, useEffect } from 'react';
import styles from '../../pages/publish.module.css';

interface ColorPickerProps {
  onSelect: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
  type?: 'text' | 'highlight';
}

// 预设颜色
const PRESET_COLORS = [
  // 灰度色系
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7',
  '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  // 彩色系
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00',
  '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
];

export default function ColorPicker({ onSelect, onClose, currentColor, type = 'text' }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor || '#000000');
  const pickerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handlePresetClick = (color: string) => {
    onSelect(color);
    onClose();
  };

  const handleCustomSubmit = () => {
    onSelect(customColor);
    onClose();
  };

  const handleRemoveColor = () => {
    onSelect('');
    onClose();
  };

  return (
    <div ref={pickerRef} className={styles.colorPicker}>
      <div className={styles.colorPickerHeader}>
        <span>{type === 'text' ? '文字颜色' : '背景颜色'}</span>
        <button onClick={onClose} className={styles.colorPickerClose}>×</button>
      </div>

      {/* 预设颜色网格 */}
      <div className={styles.colorGrid}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className={`${styles.colorSwatch} ${currentColor === color ? styles.colorSwatchActive : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handlePresetClick(color)}
            title={color}
          />
        ))}
      </div>

      {/* 自定义颜色 */}
      <div className={styles.colorCustom}>
        <label className={styles.colorCustomLabel}>自定义颜色</label>
        <div className={styles.colorCustomRow}>
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className={styles.colorInput}
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#000000"
            className={styles.colorHexInput}
          />
          <button onClick={handleCustomSubmit} className={styles.colorApplyBtn}>
            应用
          </button>
        </div>
      </div>

      {/* 清除颜色 */}
      <button onClick={handleRemoveColor} className={styles.colorRemoveBtn}>
        清除{type === 'text' ? '文字' : '背景'}颜色
      </button>
    </div>
  );
}
