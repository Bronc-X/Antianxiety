'use client';

/**
 * Premium Section Wrapper
 * 
 * A wrapper component that adds scroll-driven fade and scale animations
 * to marketing sections.
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface PremiumSectionWrapperProps {
    children: ReactNode;
    className?: string;
    fadeOut?: boolean;
    scaleDown?: boolean;
    delay?: number;
}

export default function PremiumSectionWrapper({
    children,
    className = '',
    fadeOut = true,
    scaleDown = true,
    delay = 0,
}: PremiumSectionWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    // Fade in on enter, fade out on exit
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.2, 0.8, 1],
        fadeOut ? [0, 1, 1, 0] : [0, 1, 1, 1]
    );

    // Scale effect
    const scale = useTransform(
        scrollYProgress,
        [0, 0.2, 0.8, 1],
        scaleDown ? [0.95, 1, 1, 0.95] : [1, 1, 1, 1]
    );

    // Subtle parallax
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        ['0%', '5%']
    );

    return (
        <motion.div
            ref={ref}
            style={{ opacity, scale, y }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
