'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ArrowRight, Play } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface AnimatedHeroProps {
    onGetStarted?: () => void;
}

export default function AnimatedHero({ onGetStarted }: AnimatedHeroProps) {
    const { language } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const [currentImage, setCurrentImage] = useState(0);
    const [showDemo, setShowDemo] = useState(false);

    const images = [
        '/images/70C6708DB5AA54379EFE89B78CC21A0A.jpg',
        '/images/B6FCE81D3927336342DDDFCA70992896.jpg',
    ];

    // Auto-rotate images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

    const floatingAnimation = {
        y: [0, -15, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    return (
        <section
            ref={ref}
            className="min-h-screen relative overflow-hidden flex items-center"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-20 right-20 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            <motion.div
                className="max-w-[1400px] mx-auto px-6 py-32 relative z-10"
                style={{ y, opacity, scale }}
            >
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-8"
                            style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                        >
                            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                            <span className="text-sm text-[#D4AF37] font-medium tracking-wider uppercase font-serif">
                                {language === 'en' ? 'The Future of Wellness' : '健康管理的未来'}
                            </span>
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.1] mb-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {language === 'en' ? (
                                <>
                                    Meet Your{' '}
                                    <span className="relative inline-block">
                                        <span className="italic text-[#D4AF37]">Digital Twin</span>
                                        <motion.svg
                                            className="absolute -bottom-2 left-0 w-full"
                                            viewBox="0 0 200 10"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ delay: 1, duration: 1 }}
                                        >
                                            <motion.path
                                                d="M0 5 Q 100 10 200 5"
                                                stroke="#D4AF37"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </motion.svg>
                                    </span>
                                </>
                            ) : (
                                <>
                                    遇见你的{' '}
                                    <span className="relative inline-block">
                                        <span className="italic text-[#D4AF37]">数字孪生</span>
                                        <motion.svg
                                            className="absolute -bottom-2 left-0 w-full"
                                            viewBox="0 0 200 10"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ delay: 1, duration: 1 }}
                                        >
                                            <motion.path
                                                d="M0 5 Q 100 10 200 5"
                                                stroke="#D4AF37"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </motion.svg>
                                    </span>
                                </>
                            )}
                        </motion.h1>

                        <motion.p
                            className="text-xl text-white/70 font-serif leading-relaxed mb-10 max-w-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {language === 'en'
                                ? 'An AI companion that truly understands your biology, emotions, and rhythms. Finally, wellness that adapts to you.'
                                : '真正理解你的生理、情绪和节律的人工智能伙伴。终于有了适应你的健康管理方式。'}
                        </motion.p>

                        <motion.div
                            className="flex flex-wrap gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <button
                                onClick={onGetStarted}
                                className="group flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-[#0B3D2E] font-semibold font-serif text-lg hover:bg-[#E5C158] transition-all"
                            >
                                {language === 'en' ? 'Start Your Journey' : '开始你的旅程'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setShowDemo(true)}
                                className="flex items-center gap-3 px-6 py-4 border border-white/20 text-white font-serif hover:bg-white/5 transition-colors"
                            >
                                <Play className="w-5 h-5" />
                                {language === 'en' ? 'Watch Demo' : '观看演示'}
                            </button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            className="flex gap-8 mt-12 pt-8 border-t border-white/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            {(language === 'en' ? [
                                { value: '47%', label: 'Anxiety Reduction' },
                                { value: '12', label: 'Days to Results' },
                                { value: '98%', label: 'User Satisfaction' },
                            ] : [
                                { value: '47%', label: '焦虑减少' },
                                { value: '12', label: '天见效' },
                                { value: '98%', label: '用户满意度' },
                            ]).map((stat, i) => (
                                <div key={i}>
                                    <div className="text-3xl font-serif font-bold text-[#D4AF37]">{stat.value}</div>
                                    <div className="text-sm text-white/50 font-serif">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Image Side */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        <motion.div
                            className="relative aspect-[3/4] max-w-md mx-auto"
                            animate={floatingAnimation}
                        >
                            {/* Decorative frame */}
                            <div className="absolute inset-0 border border-[#D4AF37]/30" style={{ transform: 'translate(20px, 20px)' }} />

                            {/* Image container */}
                            <div className="relative w-full h-full overflow-hidden bg-[#D4AF37]/10">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentImage}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.8 }}
                                        className="absolute inset-0"
                                    >
                                        <Image
                                            src={images[currentImage]}
                                            alt="Wellness portrait"
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Gold overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E]/50 via-transparent to-transparent" />
                            </div>

                            {/* Floating badge */}
                            <motion.div
                                className="absolute -bottom-6 -left-6 px-6 py-4 bg-white shadow-xl"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <p className="text-[#0B3D2E] font-serif font-semibold">
                                    {language === 'en' ? 'Build in Public' : '公开构建中'}
                                </p>
                                <p className="text-[#1A1A1A]/60 text-sm font-serif">
                                    {language === 'en' ? '5,000+ users embracing change' : '5000+ 用户共同见证改变'}
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Image indicators */}
                        <div className="flex justify-center gap-2 mt-8">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImage(i)}
                                    className={`w-2 h-2 transition-all ${currentImage === i ? 'w-8 bg-[#D4AF37]' : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
            >
                <motion.div
                    className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        className="w-1.5 h-3 bg-[#D4AF37] rounded-full mt-2"
                        animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-3xl bg-[#0B3D2E] border border-[#D4AF37]/30 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <h3 className="text-white font-semibold text-lg">
                                    {language === 'en' ? 'Digital Twin Demo' : '数字孪生演示'}
                                </h3>
                                <button
                                    onClick={() => setShowDemo(false)}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    {language === 'en' ? 'Close' : '关闭'}
                                </button>
                            </div>
                            <div className="p-6 grid gap-6 md:grid-cols-2 items-center">
                                <div className="aspect-video bg-gradient-to-br from-[#D4AF37]/20 to-[#0B3D2E] border border-white/10 flex items-center justify-center text-white/60">
                                    {language === 'en' ? 'Demo preview' : '演示预览'}
                                </div>
                                <div className="space-y-4 text-white/70">
                                    <p>
                                        {language === 'en'
                                            ? 'See how Max synthesizes HRV, sleep, and stress signals into a personalized daily plan.'
                                            : '了解 Max 如何融合 HRV、睡眠与压力信号，生成个性化每日方案。'}
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        {(language === 'en'
                                            ? ['Live biometrics', 'Adaptive coaching', 'Evidence-backed prompts']
                                            : ['实时生物数据', '自适应教练建议', '循证提醒']
                                        ).map((item) => (
                                            <li key={item} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => {
                                            setShowDemo(false);
                                            onGetStarted?.();
                                        }}
                                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors"
                                    >
                                        {language === 'en' ? 'Start now' : '立即开始'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
