'use client';

import Link from 'next/link';
import MaxAvatar from '../max/MaxAvatar';

interface LogoProps {
    /** Color variant: 'dark' for black text (light backgrounds), 'light' for white text (dark backgrounds) */
    variant?: 'dark' | 'light';
    /** Size: 'sm' | 'md' | 'lg' | 'xl' */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Optional link href */
    href?: string;
    /** Additional className */
    className?: string;
}

const sizeMap = {
    sm: { avatarSize: 24, height: 16 },
    md: { avatarSize: 32, height: 20 },
    lg: { avatarSize: 40, height: 26 },
    xl: { avatarSize: 56, height: 38 },
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

    const logoContent = (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {/* Max Avatar Logic */}
            <MaxAvatar size={sizes.avatarSize} state="thinking" className="shrink-0" />

            {/* Vector Text */}
            <svg
                height={sizes.height}
                viewBox="0 0 165 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${textColor} w-auto overflow-visible`}
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                <text
                    x="0"
                    y="25"
                    fontWeight="700"
                    fontStyle="italic"
                    fontSize="26"
                    fill="currentColor"
                    letterSpacing="-0.03em"
                >
                    AntiAnxiety
                    <tspan
                        fontSize="10"
                        dy="-10"
                        dx="1"
                        fill="currentColor"
                        opacity="0.6"
                        fontWeight="500"
                        fontStyle="normal"
                    >
                        ™
                    </tspan>
                </text>
            </svg>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="shrink-0 group">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}
