'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface DigitalTwinHeroProps {
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaHref?: string;
}

export default function DigitalTwinHero({
    headline = 'Meet your digital twin. Understand yourself like never before.',
    subheadline = 'Your AI-powered health companion learns your unique patterns and guides you toward lasting calm.',
    ctaLabel = 'Start Your Journey',
    ctaHref = '/signup',
}: DigitalTwinHeroProps) {
    const containerRef = useRef<HTMLElement>(null);
    const isInView = useInView(containerRef, { once: true });

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
            <div className="absolute inset-0 flex items-center justify-center">
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

            {/* Content - Right aligned */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
                <div className="ml-auto w-full md:w-1/2 lg:w-2/5 pr-4 md:pr-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#D4AF37]/30 bg-[#D4AF37]/10"
                        >
                            <span className="w-2 h-2 bg-[#D4AF37] animate-pulse" />
                            <span className="text-xs uppercase tracking-widest font-medium text-[#D4AF37]">
                                Digital Twin Technology
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <h1
                            className="text-white font-bold leading-[1.05] tracking-[-0.02em] mb-6"
                            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                        >
                            {headline}
                        </h1>

                        {/* Subheadline */}
                        <p
                            className="text-white/70 max-w-md mb-10 leading-relaxed"
                            style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}
                        >
                            {subheadline}
                        </p>

                        {/* CTA Button */}
                        <Link
                            href={ctaHref}
                            className="
                inline-flex items-center gap-3
                px-8 py-4
                bg-[#D4AF37] text-[#0B3D2E]
                text-lg font-semibold
                hover:bg-[#E5C158]
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)]
              "
                        >
                            {ctaLabel}
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute bottom-8 left-8 flex items-center gap-3 text-white/50"
            >
                <div className="w-6 h-10 border-2 border-white/30 flex justify-center pt-2">
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 h-1.5 bg-[#D4AF37]"
                    />
                </div>
                <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            </motion.div>
        </section>
    );
}
