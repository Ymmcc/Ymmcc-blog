import React, { useRef, useCallback } from 'react';
import { uploadImage } from './github-api';

interface Props {
  token: string;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
  triggerRef?: React.RefObject<HTMLInputElement>;
}

export default function ImageUploader({ token, onUpload, onError, triggerRef }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!token) {
      onError('请先输入 GitHub Token');
      return;
    }

    if (!file.type.startsWith('image/')) {
      onError('请选择图片文件');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const ext = file.name.split('.').pop() || 'png';
        const filename = `${Date.now()}.${ext}`;
        const url = await uploadImage(token, filename, base64);
        onUpload(url);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      onError(err instanceof Error ? err.message : '图片上传失败');
    }
  }, [token, onUpload, onError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {/* 暴露触发方法给父组件 */}
      <input
        ref={triggerRef}
        type="hidden"
        data-trigger-upload="true"
        onClick={triggerUpload}
      />
    </>
  );
}

// 拖拽/粘贴处理 Hook
export function useImageDropPaste(
  onFile: (file: File) => void
) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) onFile(imageFile);
  }, [onFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) onFile(file);
    }
  }, [onFile]);

  return { handleDrop, handleDragOver, handlePaste };
}
