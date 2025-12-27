'use client';

import { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface UnlearnSectionProps {
    children: ReactNode;
    variant?: 'dark' | 'light';
    className?: string;
    id?: string;
    fullHeight?: boolean;
}

export default function UnlearnSection({
    children,
    variant = 'dark',
    className = '',
    id,
    fullHeight = false,
}: UnlearnSectionProps) {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const bgColor = variant === 'dark' ? '#1A081C' : '#F5F3EF';
    const textColor = variant === 'dark' ? '#FFFFFF' : '#1F212A';

    return (
        <section
            ref={ref}
            id={id}
            className={`
        relative
        ${fullHeight ? 'min-h-screen' : ''}
        ${className}
      `}
            style={{
                backgroundColor: bgColor,
                color: textColor,
                padding: 'clamp(60px, 10vw, 120px) 0',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-[1280px] mx-auto px-6"
            >
                {children}
            </motion.div>
        </section>
    );
}

// Sub-components for structured content
export function UnlearnSectionHeader({
    eyebrow,
    title,
    description,
    variant = 'dark',
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    variant?: 'dark' | 'light';
}) {
    const textMuted = variant === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(31,33,42,0.6)';

    return (
        <div className="max-w-3xl mb-16">
            {eyebrow && (
                <p
                    className="text-sm uppercase tracking-widest font-medium mb-4"
                    style={{ color: '#AA8FFF' }}
                >
                    {eyebrow}
                </p>
            )}
            <h2
                className="font-bold leading-[1.1] tracking-[-0.02em] mb-6"
                style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
            >
                {title}
            </h2>
            {description && (
                <p
                    className="text-lg leading-relaxed"
                    style={{ color: textMuted }}
                >
                    {description}
                </p>
            )}
        </div>
    );
}

export function UnlearnGrid({
    children,
    columns = 3,
}: {
    children: ReactNode;
    columns?: 2 | 3 | 4;
}) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={`grid gap-6 ${gridCols[columns]}`}>
            {children}
        </div>
    );
}
