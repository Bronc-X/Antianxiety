'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface DigitalTwinHeroProps {
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaHref?: string;
}

export default function DigitalTwinHero({
    headline,
    subheadline,
    ctaLabel,
    ctaHref = '/signup',
}: DigitalTwinHeroProps) {
    const { language } = useI18n();
    const containerRef = useRef<HTMLElement>(null);
    const isInView = useInView(containerRef, { once: true });

    // Default texts based on language
    const defaultHeadline = language === 'en'
        ? 'Meet your digital twin. Understand yourself like never before.'
        : '遇见你的数字孪生体，前所未有地了解自己。';
    const defaultSubheadline = language === 'en'
        ? 'Your AI-powered health companion learns your unique patterns and guides you toward lasting calm.'
        : '你的人工智能健康伙伴学习你独特的模式，引导你走向持久的平静。';
    const defaultCtaLabel = language === 'en' ? 'Start Your Journey' : '开始你的旅程';
    const scrollText = language === 'en' ? 'Scroll to explore' : '向下滚动探索';

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            {/* Split Background - Cream on left, Green on right */}
            <div className="absolute inset-0 flex">
                <div className="w-1/2 bg-[#FAF6EF]" />
                <div className="w-1/2 bg-[#0B3D2E]" />
            </div>

            {/* Digital Twin Portrait - Face to face */}
            <div className="absolute inset-0 flex items-center justify-center pb-48">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    className="relative w-full h-full max-w-[1400px]"
                >
                    <Image
                        src="/digital-twin-facing.png"
                        alt="You and Your Digital Twin"
                        fill
                        className="object-contain object-center"
                        priority
                    />
                </motion.div>
            </div>

            {/* Gradient overlay on right side for text readability */}
            <div
                className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
                style={{
                    background: 'linear-gradient(to left, rgba(11,61,46,0.95) 20%, rgba(11,61,46,0.7) 60%, transparent 100%)',
                }}
            />

            {/* Content - Below the image */}
            <div className="absolute bottom-0 left-0 right-0 z-10 py-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left side - Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#D4AF37]/30 bg-[#D4AF37]/10"
                            >
                                <span className="w-2 h-2 bg-[#D4AF37] animate-pulse" />
                                <span className="text-xs uppercase tracking-widest font-medium text-[#D4AF37] font-serif">
                                    {language === 'en' ? 'Digital Twin Technology' : '数字孪生技术'}
                                </span>
                            </motion.div>

                            {/* Headline - White text for contrast */}
                            <h1
                                className="text-white font-bold leading-[1.05] tracking-[-0.02em] mb-6 font-serif"
                                style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                            >
                                {headline || defaultHeadline}
                            </h1>
                        </motion.div>

                        {/* Right side - Subheadline and CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* Subheadline - Cream/light color for contrast */}
                            <p
                                className="text-[#FAF6EF]/80 max-w-md mb-8 leading-relaxed font-serif"
                                style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}
                            >
                                {subheadline || defaultSubheadline}
                            </p>

                            {/* CTA Button */}
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
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute bottom-32 left-8 flex items-center gap-3 text-white/70 z-20"
            >
                <div className="w-6 h-10 border-2 border-white/40 flex justify-center pt-2">
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 h-1.5 bg-[#D4AF37]"
                    />
                </div>
                <span className="text-xs uppercase tracking-widest font-serif">{scrollText}</span>
            </motion.div>
        </section>
    );
}
