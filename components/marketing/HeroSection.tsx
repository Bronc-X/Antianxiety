'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function HeroSection({ onStart }: { onStart?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const { language } = useI18n();

    const y = useTransform(scrollY, [0, 1000], [0, 400]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);
    const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

    // Beta "Word Rotation" Logic
    const [currentWord, setCurrentWord] = useState(0);
    const words = ['放弃', '休息', '躺平'];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#FAF6EF] dark:bg-[#1A1A1A]"
        >
            {/* Ambient Background (Refined Aurora) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#D4AF37]/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9CAF88]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-[10s] delay-1000" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <motion.div
                style={{ opacity, scale, y }}
                className="relative z-10 max-w-[1400px] w-full px-6 md:px-12 flex flex-col items-center text-center"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full mb-12 backdrop-blur-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                    </span>
                    <span className="text-[#D4AF37] text-xs font-medium tracking-widest uppercase">
                        {language === 'en' ? 'Private Beta' : '内测招募中'}
                    </span>
                </motion.div>

                {/* Headline */}
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] text-[#1A1A1A] dark:text-[#F9F8F6] mb-10 tracking-tight">
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="block text-[#1A1A1A]/80 dark:text-white/80"
                    >
                        {language === 'en' ? 'The First Coach to Say' : '世界上第一个'}
                    </motion.span>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="block mt-2"
                    >
                        {language === 'en' ? (
                            <span>"It's Okay to <span className="italic text-[#D4AF37]">Rest.</span>"</span>
                        ) : (
                            <span className="inline-flex flex-wrap justify-center items-center gap-x-2">
                                会劝你「
                                <div className="relative inline-block min-w-[2.5ch] text-left align-bottom">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={currentWord}
                                            className="absolute left-0 bottom-0 text-[#D4AF37] italic font-serif whitespace-nowrap"
                                            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {words[currentWord]}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="invisible font-serif">{words[0]}</span>
                                </div>
                                」
                            </span>
                        )}
                    </motion.div>

                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="block text-3xl md:text-5xl text-[#1A1A1A]/40 dark:text-white/40 mt-6 font-normal tracking-normal"
                    >
                        {language === 'en' ? 'Based on Your Biology.' : '的健康教练'}
                    </motion.span>
                </h1>

                {/* Subhead */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="text-lg md:text-xl text-[#1A1A1A]/60 dark:text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed"
                >
                    {language === 'en'
                        ? 'When cortisol is high, simple rest is the highest form of discipline.'
                        : <>当皮质醇过高时，<span className="text-[#1A1A1A] dark:text-white font-medium border-b border-[#D4AF37]/40 pb-0.5">休息</span>才是最高级的自律。</>
                    }
                </motion.p>

                {/* Start Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    onClick={onStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative overflow-hidden bg-[#1A1A1A] dark:bg-[#F9F8F6] text-[#F9F8F6] dark:text-[#1A1A1A] px-10 py-5 rounded-full min-w-[240px] flex items-center justify-center gap-3 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.3)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                >
                    <span className="absolute inset-0 bg-[#D4AF37] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out z-0" />
                    <span className="relative z-10 text-sm tracking-[0.2em] uppercase font-medium">
                        {language === 'en' ? 'Join Internal Beta' : '加入内测计划'}
                    </span>
                    <ArrowRight className="w-4 h-4 relative z-10" />
                </motion.button>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#1A1A1A]/20 dark:via-white/20 to-transparent" />
                </motion.div>

            </motion.div>
        </section>
    );
}
