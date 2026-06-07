import React, { useState, useRef, useEffect } from 'react';
import Layout from '@theme/Layout';
import gsap from 'gsap';
import styles from './publish.module.css';
import { TabType, EditMode, ArticleData, Draft, defaultArticleData } from '../components/publish/types';
import { draftToArticleData } from '../components/publish/storage';
import PasswordVerify from '../components/publish/PasswordVerify';
import WriteTab from '../components/publish/WriteTab';
import DraftsTab from '../components/publish/DraftsTab';
import ManageTab from '../components/publish/ManageTab';

export default function PublishPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [editData, setEditData] = useState<ArticleData | undefined>(undefined);
  const [editSha, setEditSha] = useState<string | undefined>(undefined);
  const [editPath, setEditPath] = useState<string | undefined>(undefined);
  const [githubToken, setGithubToken] = useState('');

  const tabsRef = useRef<HTMLDivElement>(null);

  // Tab 切换动画
  useEffect(() => {
    if (!tabsRef.current) return;
    gsap.set(tabsRef.current, { y: -20, opacity: 0 });
    gsap.to(tabsRef.current, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  }, [activeTab]);

  // 从草稿箱编辑
  const handleEditDraft = (draft: Draft) => {
    setEditMode({ type: 'draft', id: draft.id });
    setEditData(draftToArticleData(draft));
    setEditSha(undefined);
    setEditPath(undefined);
    setActiveTab('write');
  };

  // 从文章管理编辑
  const handleEditArticle = (content: string, sha: string, path: string) => {
    // 从内容中提取元信息
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1] : '';

    setEditMode({ type: 'article', sha, path });
    setEditData({
      ...defaultArticleData,
      title,
      markdownContent: content
    });
    setEditSha(sha);
    setEditPath(path);
    setActiveTab('write');
  };

  // 清除编辑模式
  const handleClearEditMode = () => {
    setEditMode(null);
    setEditData(undefined);
    setEditSha(undefined);
    setEditPath(undefined);
  };

  // 发布成功回调
  const handlePublishSuccess = () => {
    // 可以在这里触发一些通知或刷新操作
  };

  const tabs = [
    { key: 'write' as TabType, label: '写文章', icon: '✏️' },
    { key: 'drafts' as TabType, label: '草稿箱', icon: '📋' },
    { key: 'manage' as TabType, label: '文章管理', icon: '📚' },
  ];

  if (!isVerified) {
    return <PasswordVerify onVerified={() => setIsVerified(true)} />;
  }

  return (
    <Layout title="发布文章" description="发布新的博客文章">
      <div className={styles.publishPage}>
        <div className={styles.publishContainer}>
          {/* 页面标题 */}
          <div className={styles.publishHeader}>
            <h1>发布管理</h1>
            <p>编写、管理你的博客文章</p>
          </div>

          {/* Tab 导航 */}
          <div className={styles.tabNav}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div ref={tabsRef} className={styles.tabContent}>
            {activeTab === 'write' && (
              <WriteTab
                editMode={editMode}
                initialData={editData}
                initialSha={editSha}
                initialPath={editPath}
                onClearEditMode={handleClearEditMode}
                onPublishSuccess={handlePublishSuccess}
              />
            )}

            {activeTab === 'drafts' && (
              <DraftsTab onEditDraft={handleEditDraft} />
            )}

            {activeTab === 'manage' && (
              <ManageTab
                token={githubToken}
                onTokenChange={setGithubToken}
                onEditArticle={handleEditArticle}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
