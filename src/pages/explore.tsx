import React, { useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import gsap from 'gsap';
import styles from './explore.module.css';
import blogData from '../data/blog-data.json';

// 目录数据
const categories = blogData.categories;

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
