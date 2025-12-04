'use client';

/**
 * EmptyStateAnimation Component
 * Requirements: 4.1
 * 
 * Displays empty state animations using Lottie
 * Supports no-data, no-results, offline types
 * Includes text message support
 */

import Lottie from 'lottie-react';
import { useLottie } from '@/hooks/useLottie';
import { cn } from '@/lib/utils';

export type EmptyStateType = 'no-data' | 'no-results' | 'offline';

export interface EmptyStateAnimationProps {
  /** Type of empty state to display */
  type: EmptyStateType;
  /** Optional custom message to display below the animation */
  message?: string;
  /** Size of the animation: sm (96px), md (144px), lg (200px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: 96,
  md: 144,
  lg: 200,
} as const;

const animationPaths: Record<EmptyStateType, string> = {
  'no-data': '/lottie/no-data.json',
  'no-results': '/lottie/no-results.json',
  'offline': '/lottie/offline.json',
} as const;

const defaultMessages: Record<EmptyStateType, string> = {
  'no-data': '暂无数据',
  'no-results': '未找到结果',
  'offline': '网络连接已断开',
} as const;

/**
 * Empty state animation component with Lottie
 * Loops continuously and displays contextual message
 */
export function EmptyStateAnimation({ 
  type,
  message,
  size = 'md', 
  className 
}: EmptyStateAnimationProps) {
  const animationPath = animationPaths[type];
  const { animationData, lottieRef, isLoading, error } = useLottie(animationPath);
  
  const dimension = sizeMap[size];
  const displayMessage = message ?? defaultMessages[type];

  // Show fallback while loading or on error
  if (isLoading || error || !animationData) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          className
        )}
      >
        <div 
          className="flex items-center justify-center rounded-lg bg-muted/50"
          style={{ width: dimension, height: dimension }}
        >
          {/* Fallback icon based on type */}
          <EmptyStateFallbackIcon type={type} size={dimension * 0.4} />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-[200px]">
          {displayMessage}
        </p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: dimension, height: dimension }}
      />
      <p className="text-sm text-muted-foreground text-center max-w-[200px]">
        {displayMessage}
      </p>
    </div>
  );
}

/**
 * Fallback icon component for when Lottie fails to load
 */
function EmptyStateFallbackIcon({ 
  type, 
  size 
}: { 
  type: EmptyStateType; 
  size: number;
}) {
  const iconStyle = { width: size, height: size };
  
  switch (type) {
    case 'no-data':
      return (
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-muted-foreground"
          style={iconStyle}
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'no-results':
      return (
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-muted-foreground"
          style={iconStyle}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 8l6 6M14 8l-6 6" />
        </svg>
      );
    case 'offline':
      return (
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-muted-foreground"
          style={iconStyle}
        >
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        </svg>
      );
    default:
      return null;
  }
}

export default EmptyStateAnimation;
