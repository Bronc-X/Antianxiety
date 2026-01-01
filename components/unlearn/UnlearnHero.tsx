'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

interface UnlearnHeroProps {
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaHref?: string;
    backgroundImage?: string;
}

export default function UnlearnHero({
    headline = 'Redefine Your Relationship With Anxiety',
    subheadline = 'The world\'s first AI health coach that understands your unique biology and guides you toward lasting calm.',
    ctaLabel = 'Start Your Journey',
    ctaHref = '/unlearn/signup',
    backgroundImage = '/pitch-scene.png',
}: UnlearnHeroProps) {
    const containerRef = useRef<HTMLElement>(null);
    const isInView = useInView(containerRef, { once: true });

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#1A081C' }}
        >
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    opacity: 0.4,
                }}
            />

            {/* Gradient Overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
            to bottom,
            rgba(26, 8, 28, 0.7) 0%,
            rgba(26, 8, 28, 0.85) 50%,
            rgba(26, 8, 28, 1) 100%
          )`,
                }}
            />

            {/* Accent Glow */}
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] pointer-events-none"
                style={{ backgroundColor: 'rgba(170, 143, 255, 0.15)' }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#AA8FFF] animate-pulse" />
                        <span className="text-sm font-medium text-white/80">
                            Science-Backed • AI-Powered
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <h1
                        className="text-white font-bold leading-[1.05] tracking-[-0.03em] mb-6"
                        style={{ fontSize: 'clamp(40px, 8vw, 72px)' }}
                    >
                        {headline}
                    </h1>

                    {/* Subheadline */}
                    <p
                        className="text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
                        style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}
                    >
                        {subheadline}
                    </p>

                    {/* CTA Button */}
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

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <a
                        href="#scroll"
                        className="flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
                    >
                        <span className="text-xs uppercase tracking-widest">Learn More</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <ArrowDown className="w-5 h-5" />
                        </motion.div>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
