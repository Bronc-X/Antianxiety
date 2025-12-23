'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ScrollSectionProps {
    children: ReactNode;
    className?: string;
}

export default function ScrollSection({ children, className = '' }: ScrollSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress relative to this specific section
    // "start start" = top of element meets top of viewport (starts leaving)
    // "end start" = bottom of element meets top of viewport (fully left)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Replicating HeroSection logic: Fade out, scale down, move slightly (parallax)
    // modifying the output range to ensure it doesn't disappear too quickly
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
    const y = useTransform(scrollYProgress, [0, 1], [0, 50]);

    return (
        <motion.div
            ref={containerRef}
            style={{ opacity, scale, y }}
            className={`relative z-10 ${className}`}
        >
            {children}
        </motion.div>
    );
}
