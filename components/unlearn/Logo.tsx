'use client';

import Link from 'next/link';

interface LogoProps {
    /** Color variant: 'dark' for black text (light backgrounds), 'light' for white text (dark backgrounds) */
    variant?: 'dark' | 'light';
    /** Size: 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg';
    /** Optional link href */
    href?: string;
    /** Additional className */
    className?: string;
}

const sizeMap = {
    sm: { dot: 'w-2 h-2', text: 'text-sm', sup: 'text-[6px]' },
    md: { dot: 'w-3 h-3', text: 'text-base', sup: 'text-[8px]' },
    lg: { dot: 'w-4 h-4', text: 'text-xl', sup: 'text-[10px]' },
};

/**
 * AntiAnxiety™ Logo Component
 * 
 * Uses Playfair Display italic serif font (same as the SVG)
 * Supports dark/light color variants for different backgrounds
 */
export default function Logo({
    variant = 'dark',
    size = 'md',
    href,
    className = ''
}: LogoProps) {
    const sizes = sizeMap[size];

    // Colors based on variant
    const textColor = variant === 'dark' ? 'text-[#1A1A1A]' : 'text-white';
    const dotColor = 'bg-emerald-500'; // Emerald dot always stays green

    const logoContent = (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Emerald Dot */}
            <div className={`${sizes.dot} rounded-full ${dotColor}`} />

            {/* Text - Playfair Display italic serif */}
            <span
                className={`font-serif font-bold italic ${sizes.text} ${textColor} tracking-tight`}
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                AntiAnxiety<sup className={sizes.sup}>™</sup>
            </span>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="shrink-0">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}
