'use client';

/**
 * StaggerList Component
 * Implements list child elements entering sequentially
 * Requirements: 4.4
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface StaggerListProps {
  children: React.ReactNode;
  /** Delay between each child animation in seconds (default: 0.05 = 50ms) */
  staggerDelay?: number;
  className?: string;
}

/**
 * Default stagger delay in seconds (50ms)
 * Per Requirements 4.4
 */
export const DEFAULT_STAGGER_DELAY = 0.05;

/**
 * StaggerList wraps children with staggered entrance animations
 * Each child enters with a 50ms delay after the previous one
 */
export function StaggerList({ 
  children, 
  staggerDelay = DEFAULT_STAGGER_DELAY, 
  className 
}: StaggerListProps) {
  // Create custom variants if staggerDelay differs from default
  const containerVariants = staggerDelay === DEFAULT_STAGGER_DELAY 
    ? staggerContainer 
    : {
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

StaggerList.displayName = 'StaggerList';
