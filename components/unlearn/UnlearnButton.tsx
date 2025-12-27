'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface UnlearnButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
    onClick?: () => void;
    icon?: 'arrow' | 'arrow-up-right' | 'none';
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
    bg-[#AA8FFF] text-[#1A081C]
    hover:bg-[#C4B3FF]
    hover:shadow-[0_0_30px_rgba(170,143,255,0.4)]
  `,
    secondary: `
    bg-transparent text-white
    border border-white/20
    hover:bg-white/10
    hover:border-[#AA8FFF]
  `,
    ghost: `
    bg-transparent text-white/70
    hover:text-white
    hover:bg-white/5
  `,
};

export default function UnlearnButton({
    children,
    variant = 'primary',
    size = 'md',
    href,
    onClick,
    icon = 'none',
    className = '',
    disabled = false,
    type = 'button',
}: UnlearnButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium
    rounded-full
    transition-all duration-300
    hover:-translate-y-0.5
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

    const combinedStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `;

    const IconComponent = icon === 'arrow-up-right' ? ArrowUpRight : icon === 'arrow' ? ArrowRight : null;

    const content = (
        <>
            {children}
            {IconComponent && <IconComponent className="w-4 h-4" />}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={combinedStyles}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedStyles}
        >
            {content}
        </button>
    );
}
