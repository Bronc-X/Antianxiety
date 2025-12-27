'use client';

import { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface UnlearnCardProps {
    children?: ReactNode;
    title?: string;
    description?: string;
    icon?: LucideIcon;
    variant?: 'dark' | 'light';
    className?: string;
    hoverEffect?: boolean;
}

export default function UnlearnCard({
    children,
    title,
    description,
    icon: Icon,
    variant = 'dark',
    className = '',
    hoverEffect = true,
}: UnlearnCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const bgColor = variant === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(11, 61, 46, 0.05)';
    const borderColor = variant === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(11, 61, 46, 0.1)';
    const iconBgColor = variant === 'dark'
        ? 'rgba(212, 175, 55, 0.15)'
        : 'rgba(212, 175, 55, 0.1)';

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className={`
        relative p-6 backdrop-blur-sm
        ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300' : ''}
        ${className}
      `}
            style={{
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
            }}
        >
            {Icon && (
                <div
                    className="w-12 h-12 flex items-center justify-center mb-4"
                    style={{ backgroundColor: iconBgColor }}
                >
                    <Icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
            )}

            {title && (
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
            )}

            {description && (
                <p
                    className="text-sm leading-relaxed"
                    style={{
                        color: variant === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(11,61,46,0.7)',
                    }}
                >
                    {description}
                </p>
            )}

            {children}
        </motion.div>
    );
}

// Bento-style grid card that spans multiple columns/rows
export function UnlearnBentoCard({
    children,
    span = '1x1',
    variant = 'dark',
    className = '',
}: {
    children: ReactNode;
    span?: '1x1' | '2x1' | '1x2' | '2x2';
    variant?: 'dark' | 'light';
    className?: string;
}) {
    const spanClasses = {
        '1x1': '',
        '2x1': 'md:col-span-2',
        '1x2': 'md:row-span-2',
        '2x2': 'md:col-span-2 md:row-span-2',
    };

    return (
        <UnlearnCard
            variant={variant}
            className={`${spanClasses[span]} ${className}`}
            hoverEffect={false}
        >
            {children}
        </UnlearnCard>
    );
}
