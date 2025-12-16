'use client';

/**
 * useHaptics Hook - Capacitor Haptics feedback
 * Requirements: 5.1
 * 
 * Provides haptic feedback methods with automatic native platform detection
 */

import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from '@/lib/capacitor';

export interface UseHapticsReturn {
  /**
   * Trigger impact haptic feedback
   * @param style - Impact style (Light, Medium, Heavy)
   */
  impact: (style?: ImpactStyle) => Promise<void>;
  /**
   * Trigger notification haptic feedback
   * @param type - Notification type (Success, Warning, Error)
   */
  notification: (type?: NotificationType) => Promise<void>;
  /**
   * Trigger selection changed haptic feedback
   */
  selectionChanged: () => Promise<void>;
  /**
   * Trigger vibration
   * @param duration - Duration in milliseconds
   */
  vibrate: (duration?: number) => Promise<void>;
  /**
   * Check if haptics are available (native platform)
   */
  isAvailable: boolean;
}

/**
 * Custom hook for Capacitor Haptics feedback
 * Automatically detects native platform and silently skips on web
 */
export function useHaptics(): UseHapticsReturn {
  const isAvailable = isNative();

  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
    if (isAvailable) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('Haptics impact failed:', error);
      }
    }
  }, [isAvailable]);

  const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (isAvailable) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.warn('Haptics notification failed:', error);
      }
    }
  }, [isAvailable]);

  const selectionChanged = useCallback(async () => {
    if (isAvailable) {
      try {
        await Haptics.selectionChanged();
      } catch (error) {
        console.warn('Haptics selectionChanged failed:', error);
      }
    }
  }, [isAvailable]);

  const vibrate = useCallback(async (duration: number = 300) => {
    if (isAvailable) {
      try {
        await Haptics.vibrate({ duration });
      } catch (error) {
        console.warn('Haptics vibrate failed:', error);
      }
    }
  }, [isAvailable]);

  return {
    impact,
    notification,
    selectionChanged,
    vibrate,
    isAvailable,
  };
}

export { ImpactStyle, NotificationType };
export default useHaptics;
