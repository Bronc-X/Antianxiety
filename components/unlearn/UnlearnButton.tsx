'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface UnlearnButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
    icon?: 'arrow' | 'none';
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
    bg-[#D4AF37] text-[#0B3D2E]
    hover:bg-[#E5C158]
    hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)]
  `,
    secondary: `
    bg-transparent text-white
    border border-white/20
    hover:bg-white/10 hover:border-[#D4AF37]
  `,
    ghost: `
    bg-transparent text-white/80
    hover:text-white hover:bg-white/5
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

export default function UnlearnButton({
    children,
    variant = 'primary',
    size = 'md',
    href,
    icon = 'none',
    fullWidth = false,
    className = '',
    ...props
}: UnlearnButtonProps) {
    const classes = `
    inline-flex items-center justify-center gap-2
    font-medium
    transition-all duration-300
    hover:-translate-y-0.5
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

    const content = (
        <>
            {children}
            {icon === 'arrow' && <ArrowUpRight className="w-4 h-4" />}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={classes}>
                {content}
            </Link>
        );
    }

    return (
        <button className={classes} {...props}>
            {content}
        </button>
    );
}
