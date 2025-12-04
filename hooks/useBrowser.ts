'use client';

/**
 * useBrowser Hook - Capacitor Browser for external links
 * Requirements: 5.5
 * 
 * Provides methods to open external URLs with automatic native platform detection.
 * On native platforms, uses Capacitor Browser (in-app browser).
 * On web, uses window.open.
 */

import { useCallback } from 'react';
import { Browser, OpenOptions } from '@capacitor/browser';
import { isNative } from '@/lib/capacitor';

export interface UseBrowserReturn {
  /**
   * Open a URL in the browser
   * @param url - The URL to open
   * @param options - Optional browser options (native only)
   */
  open: (url: string, options?: Partial<OpenOptions>) => Promise<void>;
  /**
   * Close the browser (native only)
   */
  close: () => Promise<void>;
  /**
   * Check if in-app browser is available (native platform)
   */
  isNativeBrowser: boolean;
}

/**
 * Custom hook for opening external links
 * Automatically detects native platform and uses appropriate method
 */
export function useBrowser(): UseBrowserReturn {
  const isNativeBrowser = isNative();

  const open = useCallback(async (url: string, options?: Partial<OpenOptions>) => {
    if (isNativeBrowser) {
      try {
        await Browser.open({ url, ...options });
      } catch (error) {
        console.warn('Browser open failed:', error);
        // Fallback to window.open if native browser fails
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Web platform: use window.open
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [isNativeBrowser]);

  const close = useCallback(async () => {
    if (isNativeBrowser) {
      try {
        await Browser.close();
      } catch (error) {
        console.warn('Browser close failed:', error);
      }
    }
    // No-op on web platform
  }, [isNativeBrowser]);

  return {
    open,
    close,
    isNativeBrowser,
  };
}

export default useBrowser;
