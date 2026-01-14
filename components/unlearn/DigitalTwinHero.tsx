'use client';



import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface DigitalTwinHeroProps {
    ctaLabel?: string;
    ctaHref?: string;
}

export default function DigitalTwinHero({
    ctaLabel,
    ctaHref = '/unlearn/signup',
}: DigitalTwinHeroProps) {
    const { language } = useI18n();
    const containerRef = useRef<HTMLElement>(null);
    const isInView = useInView(containerRef, { once: true });
    const [currentIndex, setCurrentIndex] = useState(0);

    const defaultCtaLabel = language === 'en' ? 'Start Your Journey' : '开始你的旅程';

    // Rotating statements
    const statements = language === 'en' ? [
        { verb: 'Digest', prefix: 'global research. To serve one ', keyword: 'purpose', suffix: ':', highlight: 'You.' },
        { verb: 'Filter', prefix: 'world noise. To find one ', keyword: 'truth', suffix: ':', highlight: 'You.' },
        { verb: 'Compute', prefix: 'millions of papers. To make one ', keyword: 'decision', suffix: ':', highlight: 'You.' },
    ] : [
        { verb: '汲取', prefix: '全球研究，只为一个', keyword: '目的', suffix: '：', highlight: '你。' },
        { verb: '过滤', prefix: '世界噪音，只为一个', keyword: '真相', suffix: '：', highlight: '你。' },
        { verb: '计算', prefix: '千万论文，只为一个', keyword: '决策', suffix: '：', highlight: '你。' },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % statements.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [statements.length]);

    return (
        <section ref={containerRef} className="relative" style={{ backgroundColor: '#0B3D2E' }}>
            {/* Hero Section - Full Width with Asymmetric Layout */}
            <div className="relative min-h-[70vh] flex items-center overflow-hidden">
                {/* Background Image - Right Side, Bleeding Off Edge */}
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute right-0 bottom-0 w-[55%] hidden md:block"
                    style={{ height: '100%' }}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src="/digital-twin-facing.png"
                            alt="You and Your Digital Twin"
                            fill
                            className="object-contain object-right-bottom"
                            priority
                        />
                        {/* Gradient Fade to Left */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to right, #0B3D2E 0%, transparent 30%)',
                            }}
                        />
                    </div>
                </motion.div>

                {/* Content - Left Side */}
                <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 py-20">
                    <div className="max-w-2xl">
                        {/* Tag */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                                <span className="w-2 h-2 bg-[#D4AF37] animate-pulse" />
                                <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#D4AF37] font-serif">
                                    {language === 'en' ? 'Digital Twin Technology' : '数字孪生技术'}
                                </span>
                            </div>
                        </motion.div>

                        {/* Rotating Statement */}
                        <div className="min-h-[180px] mb-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    <h2
                                        className="font-serif font-bold text-white leading-[1.1] tracking-[-0.02em] mb-4"
                                        style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
                                    >
                                        <span className="text-[#D4AF37]">{statements[currentIndex].verb}</span>
                                        <br />
                                        <span className="text-white">
                                            {statements[currentIndex].prefix}
                                            <span className="text-[#D4AF37]">{statements[currentIndex].keyword}</span>
                                            {statements[currentIndex].suffix}
                                        </span>
                                    </h2>
                                    <p
                                        className="font-serif italic text-[#D4AF37]"
                                        style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
                                    >
                                        {statements[currentIndex].highlight}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Progress Line */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex items-center gap-4 mb-10"
                        >
                            {statements.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className="group relative h-[2px] transition-all duration-500"
                                    style={{ width: idx === currentIndex ? '48px' : '24px' }}
                                >
                                    <div className={`absolute inset-0 transition-colors duration-300 ${idx === currentIndex ? 'bg-[#D4AF37]' : 'bg-white/20 group-hover:bg-white/40'
                                        }`} />
                                    {idx === currentIndex && (
                                        <motion.div
                                            className="absolute inset-0 bg-[#D4AF37]"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 4, ease: 'linear' }}
                                            style={{ transformOrigin: 'left' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <Link
                                href={ctaHref}
                                className="
                                    inline-flex items-center gap-3
                                    px-8 py-4
                                    bg-[#D4AF37] text-[#0B3D2E]
                                    text-lg font-semibold font-serif
                                    hover:bg-[#E5C158]
                                    transition-all duration-300
                                    hover:-translate-y-1
                                    hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)]
                                "
                            >
                                {ctaLabel || defaultCtaLabel}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Mobile Image */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="md:hidden w-full px-6 pb-8"
                >
                    <Image
                        src="/digital-twin-facing.png"
                        alt="You and Your Digital Twin"
                        width={960}
                        height={540}
                        className="w-full h-auto rounded-lg"
                        priority
                    />
                </motion.div>
            </div>
        </section>
    );
}
