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
    const words = useMemo(() => ['放弃', '休息', '躺平'], []);

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
                className="relative z-10 max-w-[1400px] w-full px-6 md:px-12 flex flex-col items-center text-center"
            >
                {/* Headline */}
                <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] text-[#1A1A1A] dark:text-[#F9F8F6] mb-10 tracking-tight">
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="block text-[#1A1A1A]/80 dark:text-white/80"
                    >
                        {language === 'en' ? 'The Only AI Coach' : '唯一敢建议你'}
                    </motion.span>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="flex flex-col md:block"
                    >
                        <span className="text-[#1A1A1A] dark:text-white">
                            {language === 'en' ? 'That Tells You to' : (
                                <>
                                    「<span className="relative inline-block min-w-[2em] text-center">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={words[currentWord]}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-[#D4AF37]"
                                            >
                                                {words[currentWord]}
                                            </motion.span>
                                        </AnimatePresence>
                                    </span>」的
                                </>
                            )}
                        </span>{' '}
                        <span className="italic text-[#D4AF37] relative inline-block">
                            <span className="relative z-10">{language === 'en' ? 'Rest' : 'AI 教练'}</span>
                            <span className="absolute bottom-2 left-0 w-full h-[0.2em] bg-[#D4AF37]/30 -rotate-1 rounded-full" />
                        </span>
                    </motion.div>
                </h1>

                {/* Subhead */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="max-w-2xl mx-auto text-lg md:text-xl text-[#1A1A1A]/60 dark:text-white/60 leading-relaxed mb-12 px-4"
                >
                    {language === 'en'
                        ? "Based on your real-time biological data, not just goals. Here, taking a break isn't laziness—it's preparation."
                        : "不再盲目坚持，而是基于你的实时生理数据（HRV）做决策。在这里，休息不是偷懒，而是为了更好地出发。"}
                </motion.p>

                {/* Scroll Indicator - Hidden on mobile for cleaner look */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-3 hidden md:flex"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#1A1A1A]/20 dark:via-white/20 to-transparent" />
                </motion.div>
            </motion.div>
        </section>
    );
}
