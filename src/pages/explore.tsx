import React, { useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import gsap from 'gsap';
import styles from './explore.module.css';

// 目录数据
const categories = [
  {
    title: '前端开发',
    icon: '⚛️',
    description: 'React、Vue、TypeScript 等前端技术学习笔记',
    color: '#61dafb',
    link: '/docs/frontend/intro',
    items: [
      { name: '前端开发简介', link: '/docs/frontend/intro' },
      { name: 'React Hooks 入门指南', link: '/docs/frontend/react-hooks' },
    ]
  },
  {
    title: '后端开发',
    icon: '🐍',
    description: 'Python、Node.js、数据库等后端技术',
    color: '#3776ab',
    link: '/docs/backend/intro',
    items: [
      { name: '后端开发简介', link: '/docs/backend/intro' },
      { name: 'Python 基础语法', link: '/docs/backend/python-basics' },
    ]
  },
  {
    title: '算法学习',
    icon: '🌳',
    description: '数据结构与算法，每日一题',
    color: '#f39c12',
    link: '/docs/algorithm/intro',
    items: [
      { name: '算法学习简介', link: '/docs/algorithm/intro' },
      { name: '二叉树遍历算法', link: '/docs/algorithm/binary-tree' },
    ]
  },
  {
    title: '项目作品',
    icon: '🚀',
    description: '个人项目开发记录与总结',
    color: '#e74c3c',
    link: '/docs/projects/intro',
    items: [
      { name: '项目作品简介', link: '/docs/projects/intro' },
    ]
  }
];

function CategoryCard({ category, index }: { category: typeof categories[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    // 设置初始状态
    gsap.set(cardRef.current, {
      y: 60,
      opacity: 0,
    });

    // 执行入场动画
    gsap.to(cardRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      delay: index * 0.15,
      ease: 'power3.out'
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className={styles.categoryCard}
      style={{
        '--hover-shadow': `0 12px 40px rgba(0,0,0,0.15), 0 0 30px ${category.color}20`
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.15), 0 0 30px ${category.color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Link to={category.link} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            {category.icon}
          </span>
          <div>
            <h3 className={styles.cardTitle}>
              {category.title}
            </h3>
            <p className={styles.cardDescription}>
              {category.description}
            </p>
          </div>
        </div>
      </Link>

      <div className={styles.divider}>
        {category.items.map((item, i) => (
          <Link
            key={i}
            to={item.link}
            className={styles.itemLink}
            style={{
              '--item-color': category.color
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${category.color}15`;
              e.currentTarget.style.color = category.color;
              e.currentTarget.style.paddingLeft = '16px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '';
              e.currentTarget.style.paddingLeft = '12px';
            }}
          >
            <span className={styles.itemDot} style={{ color: category.color }}>●</span>
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    gsap.from(headerRef.current, {
      y: -40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  }, []);

  return (
    <Layout title="探索" description="探索 Ymmcc Blog 的所有内容">
      <div className={styles.explorePage}>
        <div className={styles.container}>
          <div ref={headerRef} className={styles.header}>
            <h1>探索知识库</h1>
            <p>选择你感兴趣的方向，开始学习之旅</p>
          </div>

          <div className={styles.grid}>
            {categories.map((category, index) => (
              <CategoryCard key={index} category={category} index={index} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
