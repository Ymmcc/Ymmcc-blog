import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import gsap from 'gsap';

import styles from './index.module.css';

// 最新笔记数据
const recentNotes = [
  {
    title: 'React Hooks 入门指南',
    description: '深入理解 React Hooks 的核心概念，掌握 useState、useEffect 等常用 Hook 的最佳实践',
    link: '/docs/frontend/react-hooks',
    tag: '前端',
    icon: '⚛️',
  },
  {
    title: 'Python 基础语法',
    description: 'Python 语言核心语法详解，包括数据类型、控制流、函数和面向对象编程',
    link: '/docs/backend/python-basics',
    tag: '后端',
    icon: '🐍',
  },
  {
    title: '二叉树遍历算法',
    description: '系统学习前序、中序、后序和层序遍历的递归与迭代实现',
    link: '/docs/algorithm/binary-tree',
    tag: '算法',
    icon: '🌳',
  },
];

// 代码片段数据
const codeSnippets = [
  {
    title: 'JavaScript 防抖函数',
    language: 'javascript',
    code: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
  },
  {
    title: 'Python 列表推导式',
    language: 'python',
    code: `# 生成偶数平方列表
squares = [x**2 for x in range(10) if x % 2 == 0]
print(squares)  # [0, 4, 16, 36, 64]`,
  },
];

// 项目数据
const projects = [
  {
    title: '个人博客系统',
    description: '基于 Docusaurus 的现代化学习博客，集成 GSAP 动画和响应式设计',
    techStack: ['React', 'TypeScript', 'Docusaurus', 'GSAP'],
    link: '/docs/projects/intro',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    title: '待办事项应用',
    description: '全栈待办事项管理工具，支持实时同步和数据可视化',
    techStack: ['Vue', 'Node.js', 'MongoDB', 'Socket.io'],
    link: '/docs/projects/intro',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
];

// 统计数据
const stats = [
  { label: '学习笔记', value: '12+', icon: '📝' },
  { label: '代码片段', value: '20+', icon: '💻' },
  { label: '项目作品', value: '5+', icon: '🚀' },
  { label: '学习天数', value: '100+', icon: '📅' },
];

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({x: 0, y: 0});

  useEffect(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({defaults: {ease: 'power3.out'}});

    // 标题动画 - 分词而非逐字
    if (titleRef.current) {
      const text = titleRef.current.textContent || '';
      const words = text.split('');
      titleRef.current.innerHTML = words
        .map((char, i) => {
          if (char === ' ') return ' ';
          return `<span class="${styles.heroChar}" style="--char-index: ${i}">${char}</span>`;
        })
        .join('');

      tl.from(`.${styles.heroChar}`, {
        opacity: 0,
        y: 60,
        rotateX: -90,
        stagger: 0.04,
        duration: 0.8,
        ease: 'back.out(1.7)',
      });
    }

    // 副标题淡入
    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.7,
      }, '-=0.4');
    }

    // 按钮淡入
    if (buttonsRef.current) {
      const buttons = buttonsRef.current.children;
      tl.from(buttons, {
        opacity: 0,
        y: 30,
        stagger: 0.15,
        duration: 0.6,
      }, '-=0.3');
    }

    // 统计数字淡入
    if (statsRef.current) {
      tl.from(statsRef.current.children, {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
      }, '-=0.2');
    }

    // 鼠标视差效果
    const handleMouseMove = (e: MouseEvent) => {
      const {clientX, clientY} = e;
      const {innerWidth, innerHeight} = window;
      const x = (clientX - innerWidth / 2) / innerWidth * 2;
      const y = (clientY - innerHeight / 2) / innerHeight * 2;
      setMousePos({x, y});

      gsap.to(`.${styles.heroDecorCircle}`, {
        x: x * 30,
        y: y * 30,
        duration: 1,
        ease: 'power2.out',
      });

      gsap.to(`.${styles.heroDecorSquare}`, {
        x: x * -20,
        y: y * -20,
        duration: 1.2,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <header ref={heroRef} className={styles.heroBanner}>
      {/* 背景装饰 */}
      <div className={styles.heroBgCircle1} />
      <div className={styles.heroBgCircle2} />
      <div className={clsx(styles.heroDecor, styles.heroDecorCircle)} />
      <div className={clsx(styles.heroDecor, styles.heroDecorSquare)} />
      <div className={clsx(styles.heroDecor, styles.heroDecorTriangle)} />

      {/* 粒子效果容器 */}
      <div className={styles.particles}>
        {Array.from({length: 30}).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--duration': `${15 + Math.random() * 20}s`,
              '--delay': `${Math.random() * 5}s`,
              '--size': `${2 + Math.random() * 4}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={styles.heroContent}>
        <Heading ref={titleRef} as="h1" className={styles.heroTitle}>
          <span className={styles.heroTitleGradient}>Ymmcc Blog</span>
        </Heading>
        <p ref={subtitleRef} className={styles.heroSubtitle}>
          记录学习历程，分享技术知识，探索无限可能
        </p>
        <div ref={buttonsRef} className={styles.heroButtons}>
          <Link className={styles.heroBtn} to="/docs/intro">
            <span>开始探索</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link className={clsx(styles.heroBtn, styles.heroBtnSecondary)} to="/blog">
            <span>查看日志</span>
          </Link>
        </div>

        {/* 统计数据 */}
        <div ref={statsRef} className={styles.heroStats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <span className={styles.statIcon}>{stat.icon}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 滚动指示器 */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollMouse} />
        <span>向下滚动</span>
      </div>
    </header>
  );
}

function RecentNotesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(`.${styles.noteCard}`);
            gsap.from(cards, {
              opacity: 0,
              y: 40,
              stagger: 0.15,
              duration: 0.8,
              ease: 'power3.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.1}
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          最新笔记
        </Heading>
        <div className={styles.notesGrid}>
          {recentNotes.map((note, index) => (
            <Link key={index} to={note.link} className={styles.noteCard}>
              <div className={styles.noteCardHeader}>
                <span className={styles.noteTag}>{note.tag}</span>
                <span className={styles.noteIcon}>{note.icon}</span>
              </div>
              <Heading as="h3" className={styles.noteTitle}>
                {note.title}
              </Heading>
              <p className={styles.noteDescription}>{note.description}</p>
              <div className={styles.cardArrow}>
                <span>阅读全文</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.viewAll}>
          <Link to="/docs/intro" className={styles.viewAllBtn}>
            <span>查看全部笔记</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CodeSnippetsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(`.${styles.snippetCard}`);
            gsap.from(cards, {
              opacity: 0,
              x: -40,
              stagger: 0.2,
              duration: 0.8,
              ease: 'power3.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.1}
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={clsx(styles.section, styles.sectionAlt)}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          代码片段
        </Heading>
        <div className={styles.snippetsGrid}>
          {codeSnippets.map((snippet, index) => (
            <div key={index} className={styles.snippetCard}>
              <div className={styles.snippetHeader}>
                <Heading as="h3" className={styles.snippetTitle}>
                  {snippet.title}
                </Heading>
                <span className={styles.snippetLang}>{snippet.language}</span>
              </div>
              <pre className={styles.snippetCode}>
                <code>{snippet.code}</code>
              </pre>
            </div>
          ))}
        </div>
        <div className={styles.viewAll}>
          <Link to="/blog" className={styles.viewAllBtn}>
            <span>查看更多代码</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(`.${styles.projectCard}`);
            gsap.from(cards, {
              opacity: 0,
              scale: 0.9,
              y: 30,
              stagger: 0.2,
              duration: 0.8,
              ease: 'back.out(1.7)',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.1}
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          项目作品
        </Heading>
        <div className={styles.projectsGrid}>
          {projects.map((project, index) => (
            <Link key={index} to={project.link} className={styles.projectCard}>
              <div
                className={styles.projectGradient}
                style={{background: project.gradient} as React.CSSProperties}
              />
              <Heading as="h3" className={styles.projectTitle}>
                {project.title}
              </Heading>
              <p className={styles.projectDescription}>{project.description}</p>
              <div className={styles.techStack}>
                {project.techStack.map((tech, i) => (
                  <span key={i} className={styles.techTag}>
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.viewAll}>
          <Link to="/docs/projects/intro" className={styles.viewAllBtn}>
            <span>查看全部项目</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="首页"
      description="Ymmcc 的个人学习博客，记录学习笔记、代码片段和项目作品">
      <HeroSection />
      <main>
        <RecentNotesSection />
        <CodeSnippetsSection />
        <ProjectsSection />
      </main>
    </Layout>
  );
}
