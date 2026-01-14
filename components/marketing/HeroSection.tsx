'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { SystemStatus, TechCorner, TechCrosshair, DataStream } from './TechDecorations';

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const { language } = useI18n();

    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const updateDevice = () => {
            setIsMobile(window.innerWidth < 768);
            setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        };
        const timer = setTimeout(updateDevice, 0);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const y = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : (isMobile ? [0, 100] : [0, 400]));
    const opacity = useTransform(scrollY, [0, 500], prefersReducedMotion ? [1, 1] : [1, 0]);
    const scale = useTransform(scrollY, [0, 500], prefersReducedMotion ? [1, 1] : [1, 0.95]);

    const [currentWord, setCurrentWord] = useState(0);
    const words = useMemo(() =>
        language === 'en'
            ? ['Give Up', 'Rest', 'Lie Flat']
            : ['放弃', '休息', '躺平'],
        [language]);

    useEffect(() => {
        if (prefersReducedMotion) return;
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [words.length, prefersReducedMotion]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#FAF6EF] dark:bg-[#0F1115]"
        >
            {/* 1. Tech Background Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Global Dot Grid */}
                <div className="absolute inset-0 bg-grid-dots opacity-30 dark:opacity-20" />

                {/* Tech Highlights (Glows) */}
                <div
                    className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse"
                    style={{ animationDuration: '8s' }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#0EA5E9]/5 dark:bg-[#0EA5E9]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse"
                    style={{ animationDuration: '10s', animationDelay: '1s' }}
                />
            </div>

            {/* 2. Floating Tech Decorations */}
            <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none hidden md:block">
                <TechCorner position="top-left" className="top-32 left-8" />
                <TechCorner position="bottom-right" className="bottom-20 right-8" />
                <TechCrosshair className="top-1/3 left-[10%]" />
                <TechCrosshair className="bottom-1/3 right-[10%]" />

                <DataStream direction="vertical" className="absolute left-10 top-1/2 -translate-y-1/2 h-64" />
                <DataStream direction="vertical" className="absolute right-10 top-1/2 -translate-y-1/2 h-64" />
            </div>

            <motion.div
                style={{ opacity, scale, y, transform: 'translateZ(0)' }}
                className="relative z-10 max-w-5xl mx-auto text-center px-4"
            >
                {/* System Status Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <SystemStatus label={language === 'en' ? 'SYSTEM ONLINE v1.0' : '系统运行中 v1.0'} />
                </motion.div>

                {/* Headline */}
                <h1 className="flex flex-col items-center mb-6 tracking-tight">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mb-4"
                    >
                        <span className="font-heading font-medium text-2xl md:text-4xl lg:text-5xl text-[#1A1A1A] dark:text-white/90">
                            {language === 'en' ? "The World's First" : '全球首个'}
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="font-heading font-medium text-2xl md:text-4xl lg:text-5xl text-[#1A1A1A] dark:text-white/90 flex items-center gap-2 mb-8 md:mb-12"
                    >
                        {language === 'en' ? 'Coach That Tells You To' : '教你'}
                        <span className="italic text-[#D4AF37] relative inline-block mx-1">
                            「<span className="relative inline-block min-w-[2em] text-center">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={words[currentWord]}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {words[currentWord]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>」
                        </span>
                        {language === 'en' ? '' : '的'}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 100 }}
                        className="relative"
                    >
                        {/* Glitch/Scanner Effect Wrapper could go here */}
                        <span className="font-heading font-bold text-5xl md:text-7xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-[#1A1A1A] to-[#1A1A1A]/80 dark:from-white dark:to-white/60 filter drop-shadow-2xl">
                            {language === 'en' ? 'Health Intelligence' : '健康智能体'}
                        </span>

                        <div className="flex items-center justify-center gap-4 mt-8">
                            <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                            <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-[#D4AF37] uppercase opacity-80">
                                Project Max
                            </span>
                            <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                        </div>
                    </motion.div>
                </h1>

                {/* CTA Scanner Line */}
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 48 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="flex flex-col items-center justify-center gap-6 mt-16 relative"
                >
                    <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent opacity-30" />
                </motion.div>
            </motion.div>
        </section>
    );
}
