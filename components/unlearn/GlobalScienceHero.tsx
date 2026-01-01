'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  opacity: number;
}

interface GlobalScienceHeroProps {
  ctaLabel?: string;
  ctaHref?: string;
}

export default function GlobalScienceHero({
  ctaLabel,
  ctaHref = '/unlearn/signup',
}: GlobalScienceHeroProps) {
  const { language } = useI18n();
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const defaultCtaLabel = language === 'en' ? 'Begin Your Journey' : '开始你的旅程';

  // Initialize particles
  useEffect(() => {
    const particleCount = 200;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Start particles from edges
      const edge = Math.floor(Math.random() * 4);
      let x, y;

      switch (edge) {
        case 0: // top
          x = Math.random() * window.innerWidth;
          y = -50;
          break;
        case 1: // right
          x = window.innerWidth + 50;
          y = Math.random() * window.innerHeight;
          break;
        case 2: // bottom
          x = Math.random() * window.innerWidth;
          y = window.innerHeight + 50;
          break;
        default: // left
          x = -50;
          y = Math.random() * window.innerHeight;
      }

      newParticles.push({
        id: i,
        x,
        y,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        angle: 0,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw converging particles
      particles.forEach((particle, index) => {
        // Calculate direction to center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move towards center
        if (distance > 50) {
          particle.x += (dx / distance) * particle.speed * 2;
          particle.y += (dy / distance) * particle.speed * 2;
        } else {
          // Reset particle to edge when it reaches center
          const edge = Math.floor(Math.random() * 4);
          switch (edge) {
            case 0:
              particle.x = Math.random() * canvas.width;
              particle.y = -50;
              break;
            case 1:
              particle.x = canvas.width + 50;
              particle.y = Math.random() * canvas.height;
              break;
            case 2:
              particle.x = Math.random() * canvas.width;
              particle.y = canvas.height + 50;
              break;
            default:
              particle.x = -50;
              particle.y = Math.random() * canvas.height;
          }
        }

        // Draw particle with gradient based on distance
        const alpha = Math.min(particle.opacity, distance / 300);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();

        // Draw connection lines to nearby particles
        particles.slice(index + 1).forEach((other) => {
          const d = Math.sqrt(
            Math.pow(particle.x - other.x, 2) + Math.pow(particle.y - other.y, 2)
          );
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - d / 80)})`;
            ctx.stroke();
          }
        });
      });

      // Draw center glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)');
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Pulsing center point
      const pulseSize = 8 + Math.sin(Date.now() / 500) * 3;
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      centerGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
      centerGradient.addColorStop(1, 'rgba(147, 51, 234, 0.4)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = centerGradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0B3D2E' }}
    >
      {/* Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0.8 }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(11,61,46,0.4) 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1
            className="font-bold leading-[1.05] tracking-[-0.03em]"
            style={{
              fontFamily: "'Inter Tight', 'Inter', sans-serif",
              fontSize: 'clamp(48px, 12vw, 120px)',
            }}
          >
            <span className="text-white block">
              {language === 'en' ? 'Max is studying' : 'Max正研究'}
            </span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {language === 'en' ? 'Top Science.' : '最顶级的科学'}
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 text-white/70 max-w-2xl mx-auto leading-relaxed"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(16px, 2vw, 22px)',
          }}
        >
          {language === 'en' ? (
            <>
              Only to serve{' '}
              <em className="text-white font-medium italic">YOU</em>.
            </>
          ) : (
            <>
              只为服务
              <em className="text-white font-medium italic">你</em>
            </>
          )}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12"
        >
          <Link
            href={ctaHref}
            className="
              inline-flex items-center gap-3
              px-10 py-4
              bg-white text-black
              text-lg font-semibold
              hover:bg-white/90
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_8px_40px_rgba(255,255,255,0.2)]
            "
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {ctaLabel || defaultCtaLabel}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </motion.div>


      </div>

      {/* Bottom Gradient Transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[2]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #0B3D2E 100%)',
        }}
      />
    </section>
  );
}
