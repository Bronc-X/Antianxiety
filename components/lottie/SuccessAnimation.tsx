'use client';

/**
 * SuccessAnimation Component
 * Requirements: 4.1, 5.1
 * 
 * Displays a success/celebration animation using Lottie
 * Plays once and triggers onComplete callback
 * Integrates with Capacitor Haptics for tactile feedback
 */

import { useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useLottie } from '@/hooks/useLottie';
import { isNative } from '@/lib/capacitor';
import { cn } from '@/lib/utils';

export interface SuccessAnimationProps {
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Whether to auto-play the animation */
  autoPlay?: boolean;
  /** Size of the animation: sm (48px), md (96px), lg (144px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 96,
  lg: 144,
} as const;

/**
 * Success animation component with Lottie
 * Plays once and triggers haptic feedback on native platforms
 */
export function SuccessAnimation({ 
  onComplete,
  autoPlay = true,
  size = 'md', 
  className 
}: SuccessAnimationProps) {
  const { animationData, lottieRef, isLoading, error } = useLottie('/lottie/success.json');
  
  const dimension = sizeMap[size];

  // Trigger haptic feedback when animation starts
  const triggerHaptics = useCallback(async () => {
    if (isNative()) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (e) {
        // Silently fail on web or if haptics unavailable
        console.debug('Haptics not available:', e);
      }
    }
  }, []);

  // Trigger haptics when animation data loads and autoPlay is true
  useEffect(() => {
    if (animationData && autoPlay) {
      triggerHaptics();
    }
  }, [animationData, autoPlay, triggerHaptics]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Show nothing while loading or on error
  if (isLoading || error || !animationData) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ width: dimension, height: dimension }}
      />
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
        loop={false}
        autoplay={autoPlay}
        onComplete={handleComplete}
        style={{ width: dimension, height: dimension }}
      />
    </div>
  );
}

export default SuccessAnimation;
