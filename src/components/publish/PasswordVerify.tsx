import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from '../../pages/publish.module.css';

interface Props {
  onVerified: () => void;
}

export default function PasswordVerify({ onVerified }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas 粒子动画背景
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

    // 获取当前主题
    const getIsDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

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
      const isDark = getIsDark();
      // 浅色模式用深色粒子，深色模式用亮色粒子
      const lightness = isDark ? 70 : 40;
      const lineAlpha = isDark ? 0.2 : 0.12;
      const dotAlpha = isDark ? 1.5 : 1.0;

      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            gradient.addColorStop(0, `hsla(260, 60%, ${lightness}%, ${lineAlpha * (1 - dist / 120)})`);
            gradient.addColorStop(1, `hsla(280, 60%, ${lightness}%, ${lineAlpha * 0.5 * (1 - dist / 120)})`);
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

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

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 60%, ${lightness}%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, ${lightness}%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, ${lightness + 10}%, ${p.opacity * dotAlpha})`;
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
    if (!cardRef.current) return;
    gsap.set(cardRef.current, { y: 40, opacity: 0, scale: 0.95 });
    gsap.to(cardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    setTimeout(() => {
      if (password === 'Ymc060214@') {
        if (cardRef.current) {
          gsap.to(cardRef.current, {
            scale: 1.05, duration: 0.2, yoyo: true, repeat: 1,
            onComplete: () => {
              gsap.to(cardRef.current!, {
                y: -20, opacity: 0, duration: 0.4, ease: 'power2.in',
                onComplete: onVerified
              });
            }
          });
        } else {
          onVerified();
        }
      } else {
        setError('密码错误，请重试');
        setPassword('');
        if (cardRef.current) {
          gsap.to(cardRef.current, {
            x: 10, duration: 0.05, yoyo: true, repeat: 5, ease: 'power2.inOut'
          });
        }
      }
      setIsVerifying(false);
    }, 500);
  };

  return (
    <div className={styles.passwordPage}>
      <canvas ref={canvasRef} className={styles.passwordCanvas} />
      <div ref={cardRef} className={styles.passwordCard}>
        <span className={styles.passwordIcon}>🔐</span>
        <h2 className={styles.passwordTitle}>发布权限验证</h2>
        <p className={styles.passwordSubtitle}>请输入发布密码以继续</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="请输入密码"
              className={`${styles.passwordInput} ${error ? styles.error : ''}`}
              autoFocus
            />
            {error && (
              <p className={styles.errorMessage}>
                <span>⚠️</span> {error}
              </p>
            )}
          </div>
          <button type="submit" disabled={!password || isVerifying} className={styles.submitBtn}>
            {isVerifying ? '验证中...' : '验证'}
          </button>
        </form>
      </div>
    </div>
  );
}
