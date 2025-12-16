'use client';

/**
 * BreathingBackground Component
 * Two gradient blob animations creating a calm visual effect
 * Requirements: 4.5
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { breathingBlob } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface BreathingBackgroundProps {
  className?: string;
  /** Primary color for blob 1 (default: primary green) */
  primaryColor?: string;
  /** Accent color for blob 2 (default: amber) */
  accentColor?: string;
}

/**
 * BreathingBackground creates an organic, calming background effect
 * - Blob 1: 7s infinite cycle
 * - Blob 2: 9s infinite cycle with 2s delay
 * Both use ease-in-out easing for smooth transitions
 */
export function BreathingBackground({ 
  className,
  primaryColor = 'bg-primary/30',
  accentColor = 'bg-amber-500/20',
}: BreathingBackgroundProps) {
  return (
    <div className={cn('fixed inset-0 overflow-hidden pointer-events-none -z-10', className)}>
      {/* Blob 1 - Primary color, 7s cycle */}
      <motion.div
        className={cn(
          'absolute w-96 h-96 rounded-full blur-3xl',
          primaryColor
        )}
        style={{
          top: '10%',
          left: '20%',
          filter: 'blur(60px)',
        }}
        animate={breathingBlob.blob1.animate}
        transition={breathingBlob.blob1.transition}
      />
      
      {/* Blob 2 - Accent color, 9s cycle */}
      <motion.div
        className={cn(
          'absolute w-80 h-80 rounded-full blur-3xl',
          accentColor
        )}
        style={{
          bottom: '20%',
          right: '15%',
          filter: 'blur(60px)',
        }}
        animate={breathingBlob.blob2.animate}
        transition={breathingBlob.blob2.transition}
      />
    </div>
  );
}

BreathingBackground.displayName = 'BreathingBackground';
