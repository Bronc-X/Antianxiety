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
    headline = 'Simulate outcomes for every participant at the beginning of your journey.',
    subheadline = 'Your AI-powered digital twin learns your unique patterns and predicts what works best for you.',
    ctaLabel = 'Start Your Journey',
    ctaHref = '/signup',
}: DigitalTwinHeroProps) {
    const containerRef = useRef<HTMLElement>(null);
    const isInView = useInView(containerRef, { once: true });

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{ backgroundColor: '#1A081C' }}
        >
            {/* Split Background - Image on left, purple on right */}
            <div className="absolute inset-0 flex">
                {/* Left side - will show the realistic photo part */}
                <div className="w-1/2 bg-[#F5F3EF]" />
                {/* Right side - deep purple */}
                <div className="w-1/2 bg-[#1A081C]" />
            </div>

            {/* Digital Twin Portrait - Centered split image */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                    className="relative w-full h-full max-w-[1400px]"
                >
                    <Image
                        src="/digital-twin-hero.png"
                        alt="Digital Twin Visualization"
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
                    background: 'linear-gradient(to left, rgba(26,8,28,0.9) 30%, rgba(26,8,28,0.5) 70%, transparent 100%)',
                }}
            />

            {/* Content - Right aligned */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
                <div className="ml-auto w-full md:w-1/2 lg:w-2/5 pr-4 md:pr-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <h1
                            className="text-white font-serif italic leading-[1.1] tracking-[-0.01em] mb-8"
                            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                        >
                            {headline}
                        </h1>

                        <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
                            {subheadline}
                        </p>

                        <Link
                            href={ctaHref}
                            className="
                inline-flex items-center gap-3
                px-8 py-4
                bg-[#AA8FFF] text-[#1A081C]
                text-lg font-semibold
                rounded-full
                hover:bg-[#C4B3FF]
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_0_40px_rgba(170,143,255,0.5)]
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
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 h-1.5 bg-white/50 rounded-full"
                    />
                </div>
                <span className="text-xs uppercase tracking-widest">Scroll to learn more</span>
            </motion.div>
        </section>
    );
}
