'use client';

/**
 * LoadingAnimation Component
 * Requirements: 4.1
 * 
 * Displays a loading animation using Lottie
 * Supports sm/md/lg sizes and auto-loops
 */

import Lottie from 'lottie-react';
import { useLottie } from '@/hooks/useLottie';
import { cn } from '@/lib/utils';

export interface LoadingAnimationProps {
  /** Size of the animation: sm (24px), md (48px), lg (96px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 48,
  lg: 96,
} as const;

/**
 * Loading animation component with Lottie
 * Auto-loops continuously
 */
export function LoadingAnimation({ 
  size = 'md', 
  className 
}: LoadingAnimationProps) {
  const { animationData, lottieRef, isLoading, error } = useLottie('/lottie/loading.json');
  
  const dimension = sizeMap[size];

  // Show nothing while loading or on error
  if (isLoading || error || !animationData) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ width: dimension, height: dimension }}
      >
        {/* Fallback spinner */}
        <div 
          className="animate-spin rounded-full border-2 border-primary border-t-transparent"
          style={{ width: dimension * 0.6, height: dimension * 0.6 }}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: dimension, height: dimension }}
      />
    </div>
  );
}

export default LoadingAnimation;
