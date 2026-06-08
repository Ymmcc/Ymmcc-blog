import { Draft, ArticleData, defaultArticleData } from './types';

const DRAFTS_KEY = 'blog_drafts';

// 获取所有草稿
export function getDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Draft[];
  } catch {
    return [];
  }
}

// 保存草稿（新建或更新）
export function saveDraft(data: ArticleData, id?: string): Draft {
  const drafts = getDrafts();
  const now = Date.now();

  if (id) {
    // 更新已有草稿
    const index = drafts.findIndex(d => d.id === id);
    if (index !== -1) {
      drafts[index] = { ...drafts[index], ...data, updatedAt: now };
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return drafts[index];
    }
  }

  // 新建草稿
  const newDraft: Draft = {
    id: `draft_${now}`,
    ...data,
    updatedAt: now
  };
  drafts.unshift(newDraft);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return newDraft;
}

// 删除草稿
export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter(d => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// 清空所有草稿
export function clearDrafts(): void {
  localStorage.removeItem(DRAFTS_KEY);
}

// 根据 ID 获取草稿
export function getDraftById(id: string): Draft | undefined {
  return getDrafts().find(d => d.id === id);
}

// 草稿转为文章数据
export function draftToArticleData(draft: Draft): ArticleData {
  return {
    title: draft.title,
    category: draft.category,
    tags: draft.tags,
    description: draft.description,
    markdownContent: draft.markdownContent
  };
}
