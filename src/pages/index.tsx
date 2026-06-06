import type {ReactNode} from 'react';
import {useEffect, useRef, useCallback} from 'react';
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
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const decorCircleRef = useRef<HTMLDivElement>(null);
  const decorSquareRef = useRef<HTMLDivElement>(null);
  const decorTriangleRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // 鼠标视差效果 - 使用 useCallback 优化性能
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const {clientX, clientY} = e;
    const {innerWidth, innerHeight} = window;
    const x = (clientX - innerWidth / 2) / innerWidth;
    const y = (clientY - innerHeight / 2) / innerHeight;

    // 装饰图形视差
    if (decorCircleRef.current) {
      gsap.to(decorCircleRef.current, {
        x: x * 40,
        y: y * 40,
        rotation: x * 10,
        duration: 1.2,
        ease: 'power2.out',
      });
    }

    if (decorSquareRef.current) {
      gsap.to(decorSquareRef.current, {
        x: x * -30,
        y: y * -30,
        rotation: y * -15,
        duration: 1.4,
        ease: 'power2.out',
      });
    }

    if (decorTriangleRef.current) {
      gsap.to(decorTriangleRef.current, {
        x: x * 25,
        y: y * 25,
        duration: 1.6,
        ease: 'power2.out',
      });
    }

    // 粒子视差
    if (particlesRef.current) {
      const particles = particlesRef.current.children;
      for (let i = 0; i < particles.length; i++) {
        const speed = (i % 3 + 1) * 0.5;
        gsap.to(particles[i], {
          x: x * 20 * speed,
          y: y * 20 * speed,
          duration: 1 + (i % 3) * 0.3,
          ease: 'power1.out',
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;

    // 设置初始状态 - 使用 autoAlpha 替代 opacity
    gsap.set([subtitleRef.current, buttonsRef.current, statsRef.current, scrollIndicatorRef.current], {
      autoAlpha: 0,
      y: 30,
    });

    if (titleRef.current) {
      const text = titleRef.current.textContent || '';
      const chars = text.split('');
      titleRef.current.innerHTML = chars
        .map((char, i) => {
          if (char === ' ') return ' ';
          return `<span class="${styles.heroChar}" style="--char-index: ${i}">${char}</span>`;
        })
        .join('');

      gsap.set(`.${styles.heroChar}`, {
        autoAlpha: 0,
        y: 80,
        rotateX: -120,
        scale: 0.5,
      });
    }

    // 创建主时间线
    const tl = gsap.timeline({
      defaults: {ease: 'power3.out'},
      delay: 0.3,
    });

    // 背景光晕入场
    tl.from([decorCircleRef.current, decorSquareRef.current], {
      scale: 0,
      opacity: 0,
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)',
      stagger: 0.2,
    });

    // 标题字符入场 - 使用 stagger 的 from 语法
    tl.to(`.${styles.heroChar}`, {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      stagger: {
        each: 0.04,
        from: 'center',
        ease: 'power2.inOut',
      },
      duration: 0.8,
      ease: 'back.out(2)',
    }, '-=0.8');

    // 标题光晕效果
    tl.from(`.${styles.heroTitleGradient}`, {
      backgroundPosition: '200% center',
      duration: 1.5,
      ease: 'power2.inOut',
    }, '-=0.5');

    // 副标题入场
    tl.to(subtitleRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    }, '-=0.4');

    // 按钮入场 - 使用 stagger
    tl.to(buttonsRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
    }, '-=0.3');

    if (buttonsRef.current) {
      const buttons = buttonsRef.current.children;
      tl.from(buttons, {
        scale: 0.8,
        stagger: 0.15,
        duration: 0.5,
        ease: 'back.out(1.7)',
      }, '-=0.4');
    }

    // 统计数据入场
    tl.to(statsRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
    }, '-=0.2');

    if (statsRef.current) {
      const statItems = statsRef.current.children;
      tl.from(statItems, {
        y: 20,
        autoAlpha: 0,
        stagger: {
          each: 0.1,
          from: 'random',
        },
        duration: 0.5,
        ease: 'power2.out',
      }, '-=0.3');
    }

    // 滚动指示器入场
    tl.to(scrollIndicatorRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
    }, '-=0.2');

    // 滚动指示器持续动画
    tl.fromTo(scrollIndicatorRef.current,
      { y: 0 },
      {
        y: 10,
        duration: 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      },
      '+=0.5'
    );

    // 粒子入场动画
    if (particlesRef.current) {
      const particles = particlesRef.current.children;
      gsap.from(particles, {
        scale: 0,
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'random',
        },
        duration: 1,
        ease: 'power2.out',
        delay: 0.5,
      });
    }

    // 添加鼠标事件监听
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      tl.kill();
    };
  }, [handleMouseMove]);

  return (
    <header ref={heroRef} className={styles.heroBanner}>
      {/* 背景装饰 */}
      <div className={styles.heroBgCircle1} />
      <div className={styles.heroBgCircle2} />
      <div ref={decorCircleRef} className={clsx(styles.heroDecor, styles.heroDecorCircle)} />
      <div ref={decorSquareRef} className={clsx(styles.heroDecor, styles.heroDecorSquare)} />
      <div ref={decorTriangleRef} className={clsx(styles.heroDecor, styles.heroDecorTriangle)} />

      {/* 粒子效果容器 */}
      <div ref={particlesRef} className={styles.particles}>
        {Array.from({length: 40}).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--duration': `${12 + Math.random() * 18}s`,
              '--delay': `${Math.random() * 3}s`,
              '--size': `${2 + Math.random() * 5}px`,
              '--opacity': `${0.2 + Math.random() * 0.4}`,
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
      <div ref={scrollIndicatorRef} className={styles.scrollIndicator}>
        <div className={styles.scrollMouse} />
        <span>向下滚动</span>
      </div>
    </header>
  );
}

function RecentNotesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // 设置初始状态
    gsap.set(titleRef.current, { autoAlpha: 0, y: 40 });
    if (cardsRef.current) {
      gsap.set(cardsRef.current.children, { autoAlpha: 0, y: 60, scale: 0.95 });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // 标题入场
            tl.to(titleRef.current, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
            });

            // 标题下划线动画
            tl.from(`.${styles.sectionTitle}::after`, {
              scaleX: 0,
              duration: 0.4,
              ease: 'power2.inOut',
            }, '-=0.2');

            // 卡片入场 - 使用 stagger
            if (cardsRef.current) {
              tl.to(cardsRef.current.children, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                stagger: {
                  each: 0.15,
                  from: 'start',
                  ease: 'power2.inOut',
                },
                duration: 0.7,
                ease: 'back.out(1.5)',
              }, '-=0.3');
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <Heading ref={titleRef} as="h2" className={styles.sectionTitle}>
          最新笔记
        </Heading>
        <div ref={cardsRef} className={styles.notesGrid}>
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

function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // 设置初始状态
    gsap.set(titleRef.current, { autoAlpha: 0, y: 40 });
    if (cardsRef.current) {
      gsap.set(cardsRef.current.children, { autoAlpha: 0, y: 80, scale: 0.8, rotationX: -20 });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // 标题入场
            tl.to(titleRef.current, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
            });

            // 卡片入场 - 弹性缩放 + 3D 旋转
            if (cardsRef.current) {
              tl.to(cardsRef.current.children, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                stagger: {
                  each: 0.2,
                  from: 'center',
                  ease: 'power2.inOut',
                },
                duration: 0.9,
                ease: 'back.out(2)',
              }, '-=0.3');
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <Heading ref={titleRef} as="h2" className={styles.sectionTitle}>
          项目作品
        </Heading>
        <div ref={cardsRef} className={styles.projectsGrid}>
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
      description="Ymmcc 的个人学习博客，记录学习笔记和项目作品">
      <HeroSection />
      <main>
        <RecentNotesSection />
        <ProjectsSection />
      </main>
    </Layout>
  );
}
