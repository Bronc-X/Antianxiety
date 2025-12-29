/**
 * Device Detection Utilities
 * 
 * Provides server-side device detection for routing decisions.
 * Used by page components to determine desktop vs mobile rendering.
 * 
 * Priority order:
 * 1. Capacitor header (X-Capacitor-Platform) - authoritative for native apps
 * 2. User-Agent string - fallback for web browsers
 * 
 * Requirements: 4.1, 4.7
 */

import { headers } from 'next/headers';

/**
 * Mobile User-Agent patterns
 */
const MOBILE_UA_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Capacitor platform header name
 */
export const CAPACITOR_PLATFORM_HEADER = 'x-capacitor-platform';

/**
 * Check if User-Agent indicates a mobile device.
 * 
 * @param userAgent - The User-Agent string from request headers
 * @returns true if mobile device detected
 */
export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MOBILE_UA_PATTERN.test(userAgent);
}

/**
 * Check if request is from Capacitor native app.
 * 
 * @param platformHeader - The X-Capacitor-Platform header value
 * @returns true if running in Capacitor (iOS or Android)
 */
export function isCapacitorPlatform(platformHeader: string | null): boolean {
  if (!platformHeader) return false;
  const platform = platformHeader.toLowerCase();
  return platform === 'ios' || platform === 'android';
}

/**
 * Get the Capacitor platform type.
 * 
 * @param platformHeader - The X-Capacitor-Platform header value
 * @returns 'ios' | 'android' | null
 */
export function getCapacitorPlatform(platformHeader: string | null): 'ios' | 'android' | null {
  if (!platformHeader) return null;
  const platform = platformHeader.toLowerCase();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return null;
}

/**
 * Detect if the current request is from a mobile device.
 * Uses Capacitor header as authoritative source, falls back to User-Agent.
 * 
 * This function should be called in Server Components only.
 * 
 * @returns Promise<boolean> - true if mobile device
 * 
 * @example
 * // In a Server Component (page.tsx)
 * export default async function DashboardPage() {
 *   const isMobile = await detectMobileDevice();
 *   return <DashboardClient isMobile={isMobile} />;
 * }
 */
export async function detectMobileDevice(): Promise<boolean> {
  const headersList = await headers();
  
  // Priority 1: Capacitor header (authoritative for native apps)
  const capacitorPlatform = headersList.get(CAPACITOR_PLATFORM_HEADER);
  if (capacitorPlatform) {
    return isCapacitorPlatform(capacitorPlatform);
  }
  
  // Priority 2: User-Agent detection (fallback for web)
  const userAgent = headersList.get('user-agent');
  return isMobileUserAgent(userAgent);
}

/**
 * Get detailed device info for logging/analytics.
 * 
 * @returns Device information object
 */
export async function getDeviceInfo(): Promise<{
  isMobile: boolean;
  isCapacitor: boolean;
  capacitorPlatform: 'ios' | 'android' | null;
  userAgent: string | null;
}> {
  const headersList = await headers();
  const capacitorPlatform = headersList.get(CAPACITOR_PLATFORM_HEADER);
  const userAgent = headersList.get('user-agent');
  
  return {
    isMobile: capacitorPlatform 
      ? isCapacitorPlatform(capacitorPlatform)
      : isMobileUserAgent(userAgent),
    isCapacitor: isCapacitorPlatform(capacitorPlatform),
    capacitorPlatform: getCapacitorPlatform(capacitorPlatform),
    userAgent,
  };
}
