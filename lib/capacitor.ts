/**
 * Capacitor utility functions
 * Requirements: 5.1
 */
import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native platform (Android/iOS)
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform
 */
export function getPlatform(): 'web' | 'android' | 'ios' {
  return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
}
