'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * GlassCard Component
 * 
 * A glassmorphism card component with backdrop blur, semi-transparent background,
 * and shadow effects. Supports dark mode and optional hover animations.
 * 
 * Required styles per design spec (Requirements 6.3):
 * - backdrop-blur-md
 * - bg-white/80 (light mode) / bg-gray-900/80 (dark mode)
 * - shadow-lg
 * - rounded-2xl
 * - border border-white/20
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = false, ...props }, ref) => {
    const baseClasses = cn(
      // Core glassmorphism styles
      'backdrop-blur-md',
      'bg-white/80 dark:bg-gray-900/80',
      'shadow-lg',
      'rounded-2xl',
      'border border-white/20 dark:border-gray-700/20',
      // Padding
      'p-4',
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
