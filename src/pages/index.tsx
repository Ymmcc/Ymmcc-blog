import type {ReactNode} from 'react';
import {useEffect, useRef, useCallback} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import gsap from 'gsap';

import styles from './index.module.css';
import blogData from '../data/blog-data.json';

function HeroSection() {
  const stats = [
    { label: '学习笔记', value: `${blogData.stats.notes}`, icon: '📝' },
    { label: '代码片段', value: `${blogData.stats.codeSnippets}`, icon: '💻' },
    { label: '项目作品', value: `${blogData.stats.projects}`, icon: '🚀' },
  ];

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatingOrbsRef = useRef<HTMLDivElement>(null);

  // 高级粒子背景系统
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number;
    }> = [];
    let mouseX = 0, mouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouse);

    // 创建粒子
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 60 + 240
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制优雅连接线
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            gradient.addColorStop(0, `hsla(260, 80%, 70%, ${0.2 * (1 - dist / 120)})`);
            gradient.addColorStop(1, `hsla(280, 80%, 70%, ${0.1 * (1 - dist / 120)})`);
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // 更新粒子 - 带鼠标吸引效果
      particles.forEach(p => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // 绘制带光晕的粒子
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 80%, ${p.opacity * 1.5})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;

    // 设置初始状态
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

    // 光晕呼吸动画
    glowRefs.current.forEach((glow, i) => {
      if (glow) {
        gsap.to(glow, {
          scale: 1.2 + i * 0.1,
          opacity: 0.6 + i * 0.1,
          duration: 3 + i,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.5,
        });

        // 缓慢漂移
        gsap.to(glow, {
          x: `random(-50, 50)`,
          y: `random(-50, 50)`,
          duration: 8 + i * 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    });

    // 浮动球体动画
    if (floatingOrbsRef.current) {
      const orbs = floatingOrbsRef.current.children;
      Array.from(orbs).forEach((orb, i) => {
        gsap.to(orb, {
          y: `random(-30, 30)`,
          x: `random(-20, 20)`,
          rotation: `random(-180, 180)`,
          duration: 6 + i * 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });
    }

    // 创建主时间线
    const tl = gsap.timeline({
      defaults: {ease: 'power3.out'},
      delay: 0.5,
    });

    // 标题字符入场
    tl.to(`.${styles.heroChar}`, {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      stagger: {
        each: 0.05,
        from: 'center',
        ease: 'power2.inOut',
      },
      duration: 1,
      ease: 'back.out(2)',
    });

    // 副标题入场
    tl.to(subtitleRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
    }, '-=0.5');

    // 按钮入场
    tl.to(buttonsRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
    }, '-=0.4');

    if (buttonsRef.current) {
      tl.from(buttonsRef.current.children, {
        scale: 0.8,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.7)',
      }, '-=0.5');
    }

    // 统计数据入场
    tl.to(statsRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
    }, '-=0.3');

    if (statsRef.current) {
      tl.from(statsRef.current.children, {
        y: 20,
        autoAlpha: 0,
        stagger: { each: 0.1, from: 'random' },
        duration: 0.5,
      }, '-=0.4');
    }

    // 滚动指示器
    tl.to(scrollIndicatorRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
    }, '-=0.2');

    tl.fromTo(scrollIndicatorRef.current,
      { y: 0 },
      { y: 10, duration: 1.5, ease: 'sine.inOut', repeat: -1, yoyo: true },
      '+=0.5'
    );

    return () => { tl.kill(); };
  }, []);

  return (
    <header ref={heroRef} className={styles.heroBanner}>
      {/* 高级粒子画布 */}
      <canvas ref={canvasRef} className={styles.heroCanvas} />

      {/* 动态光晕 */}
      <div ref={el => { glowRefs.current[0] = el; }} className={styles.heroGlow1} />
      <div ref={el => { glowRefs.current[1] = el; }} className={styles.heroGlow2} />
      <div ref={el => { glowRefs.current[2] = el; }} className={styles.heroGlow3} />

      {/* 浮动几何球体 */}
      <div ref={floatingOrbsRef} className={styles.floatingOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.orb4} />
      </div>

      {/* 网格背景 */}
      <div className={styles.heroGrid} />

      <div className={styles.heroContent}>
        <Heading ref={titleRef} as="h1" className={styles.heroTitle}>
          <span className={styles.heroTitleGradient}>Ymmcc Blog</span>
        </Heading>
        <p ref={subtitleRef} className={styles.heroSubtitle}>
          记录学习历程，分享技术知识，探索无限可能
        </p>
        <div ref={buttonsRef} className={styles.heroButtons}>
          <Link className={clsx(styles.heroBtn, styles.heroBtnPrimary)} to="/explore">
            <span>开始探索</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <Link className={clsx(styles.heroBtn, styles.heroBtnSecondary)} to="/explore">
            <span>浏览目录</span>
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
          {blogData.recentNotes.map((note, index) => (
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
          <Link to="/docs/frontend/intro" className={styles.viewAllBtn}>
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
          {blogData.projects.length === 0 ? (
            <div style={{textAlign: 'center', padding: '3rem 1rem', color: '#888', gridColumn: '1 / -1'}}>
              <p style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>暂无项目</p>
              <p>项目作品正在筹备中，敬请期待...</p>
            </div>
          ) : (
            blogData.projects.map((project, index) => (
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
            ))
          )}
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
