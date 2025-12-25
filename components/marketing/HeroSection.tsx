'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';

export default function HeroSection({ onStart }: { onStart?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const { language } = useI18n();

    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reduced parallax on mobile for smoother scrolling
    const y = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : (isMobile ? [0, 100] : [0, 400]));
    const opacity = useTransform(scrollY, [0, 500], prefersReducedMotion ? [1, 1] : [1, 0]);
    const scale = useTransform(scrollY, [0, 500], prefersReducedMotion ? [1, 1] : [1, 0.95]);

    // Beta "Word Rotation" Logic
    const [currentWord, setCurrentWord] = useState(0);
    const words = useMemo(() =>
        language === 'en'
            ? ['Give Up', 'Rest', 'Lie Flat']
            : ['放弃', '休息', '躺平'],
        [language]);

    useEffect(() => {
        if (prefersReducedMotion) return; // Skip animation if reduced motion
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [words.length, prefersReducedMotion]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#FAF6EF] dark:bg-[#1A1A1A]"
        >
            {/* Ambient Background (Refined Aurora) - Simplified for mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#D4AF37]/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse"
                    style={{ animationDuration: '8s', willChange: 'opacity' }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9CAF88]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-pulse"
                    style={{ animationDuration: '10s', animationDelay: '1s', willChange: 'opacity' }}
                />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <motion.div
                style={{
                    opacity,
                    scale,
                    y,
                    willChange: 'opacity, transform',
                    transform: 'translateZ(0)',
                }}
                className="relative z-10 max-w-5xl mx-auto text-center"
            >
                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <span className="inline-block py-1 px-3 border border-[#D4AF37] rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37] bg-[#D4AF37]/5 backdrop-blur-sm">
                        {language === 'en' ? 'THE MISSION' : '我们的使命'}
                    </span>
                </motion.div>

                {/* Headline - New Hierarchy */}
                <h1 className="flex flex-col items-center mb-6 tracking-tight">
                    {/* Line 1: Global First - Own Line */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mb-4"
                    >
                        <span className="font-heading font-medium text-2xl md:text-4xl lg:text-5xl text-[#1A1A1A] dark:text-white">
                            {language === 'en' ? "The World's First" : '全球首个'}
                        </span>
                    </motion.div>

                    {/* Line 2: Coach That Tells You To... */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="font-heading font-medium text-2xl md:text-4xl lg:text-5xl text-[#1A1A1A] dark:text-white flex items-center gap-2 mb-8 md:mb-12"
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

                    {/* Line 3: Health Intelligence Max */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 100 }}
                        className="relative"
                    >
                        <span className="font-heading font-bold text-5xl md:text-7xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-[#1A1A1A] to-[#1A1A1A]/80 dark:from-white dark:to-white/80 filter drop-shadow-2xl">
                            {language === 'en' ? 'Health Intelligence' : '健康智能体'}
                        </span>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <div className="h-px w-12 md:w-24 bg-[#D4AF37]" />
                            <span className="font-serif italic text-4xl md:text-6xl text-[#D4AF37]">
                                Max
                            </span>
                            <div className="h-px w-12 md:w-24 bg-[#D4AF37]" />
                        </div>
                    </motion.div>
                </h1>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#1A1A1A]/20 dark:via-white/20 to-transparent" />
                </motion.div>
            </motion.div>
        </section>
    );
}
