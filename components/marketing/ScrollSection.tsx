'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState } from 'react';

interface ScrollSectionProps {
    children: ReactNode;
    className?: string;
}

export default function ScrollSection({ children, className = '' }: ScrollSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check for mobile and reduced motion preference
        const initialTimer = setTimeout(() => {
            setIsMobile(window.innerWidth < 768);
            setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }, 0);

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            clearTimeout(initialTimer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Simplified animation for mobile - only opacity, no scale/transform (better performance)
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.8],
        prefersReducedMotion ? [1, 1] : [1, 0]
    );
    const scale = useTransform(
        scrollYProgress,
        [0, 0.8],
        prefersReducedMotion || isMobile ? [1, 1] : [1, 0.95]
    );
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        prefersReducedMotion || isMobile ? [0, 0] : [0, 50]
    );

    return (
        <motion.div
            ref={containerRef}
            style={{
                opacity,
                scale,
                y,
                willChange: 'opacity, transform',
                transform: 'translateZ(0)', // Force GPU layer
            }}
            className={`relative z-10 ${className}`}
        >
            {children}
        </motion.div>
    );
}
