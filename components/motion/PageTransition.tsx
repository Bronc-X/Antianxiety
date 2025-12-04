'use client';

/**
 * PageTransition Component
 * Wraps content with AnimatePresence for smooth page transitions
 * Requirements: 4.2
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Unique key for AnimatePresence to track page changes */
  pageKey?: string;
}

/**
 * PageTransition wraps content with fade + slide animations
 * - initial: opacity 0, y 20
 * - animate: opacity 1, y 0
 * - exit: opacity 0, y -20
 * - duration: 0.3s (300ms)
 */
export function PageTransition({ children, className, pageKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

PageTransition.displayName = 'PageTransition';
