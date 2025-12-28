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

    const defaultHeadline = language === 'en'
        ? 'Meet your digital twin. Understand yourself like never before.'
        : '遇见你的数字孪生体，前所未有地了解自己。';
    const defaultSubheadline = language === 'en'
        ? 'Your AI-powered health companion learns your unique patterns and guides you toward lasting calm.'
        : '你的人工智能健康伙伴学习你独特的模式，引导你走向持久的平静。';
    const defaultCtaLabel = language === 'en' ? 'Start Your Journey' : '开始你的旅程';
    const scrollText = language === 'en' ? 'Scroll to explore' : '向下滚动探索';

    return (
        <section ref={containerRef} className="relative">
            {/* Image Section with Overlay Text */}
            <div className="relative w-full pt-14">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    className="relative max-w-[1200px] mx-auto"
                >
                    <Image
                        src="/digital-twin-facing.png"
                        alt="You and Your Digital Twin"
                        width={1920}
                        height={1080}
                        className="w-full h-auto"
                        priority
                    />
                    
                    {/* Overlay Text - Center Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="absolute top-1/2 right-[5%] -translate-y-1/2 max-w-[40%] text-right"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 border border-white/30 bg-white/10 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-[#D4AF37] animate-pulse" />
                            <span className="text-[clamp(10px,1.2vw,12px)] uppercase tracking-widest font-medium text-white/90 font-serif">
                                {language === 'en' ? 'Digital Twin Technology' : '数字孪生技术'}
                            </span>
                        </div>

                        <h1
                            className="text-white font-bold leading-[1.1] tracking-[-0.02em] font-serif drop-shadow-lg"
                            style={{ fontSize: 'clamp(18px, 3vw, 36px)' }}
                        >
                            {language === 'en' 
                                ? <>Meet your <em className="italic">digital twin</em>. Understand yourself like <em className="italic">never before</em>.</>
                                : <>遇见你的<em className="italic">数字孪生体</em>，<em className="italic">前所未有</em>地了解自己。</>
                            }
                        </h1>
                    </motion.div>
                </motion.div>
            </div>

            {/* Content Section - Below the image */}
            <div className="py-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1200px] mx-auto">
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-[#FAF6EF]/80 max-w-lg leading-relaxed font-serif"
                            style={{ fontSize: 'clamp(14px, 1.8vw, 18px)' }}
                        >
                            {subheadline || defaultSubheadline}
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.8 }}
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
                                    whitespace-nowrap
                                "
                            >
                                {ctaLabel || defaultCtaLabel}
                            </Link>
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="mt-12 flex items-center gap-3 text-white/70"
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
                </div>
            </div>
        </section>
    );
}
