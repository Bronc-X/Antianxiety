/**
 * Hooks barrel export
 * Requirements: 6.4
 */

// Lottie animation hook
export { useLottie } from './useLottie';
export type { UseLottieOptions, UseLottieReturn } from './useLottie';

// Capacitor Haptics hook
export { useHaptics, ImpactStyle, NotificationType } from './useHaptics';
export type { UseHapticsReturn } from './useHaptics';

// Capacitor Preferences hook
export { usePreferences } from './usePreferences';
export type { UsePreferencesReturn } from './usePreferences';

// Capacitor Network hook
export { useNetwork } from './useNetwork';
export type { UseNetworkReturn, NetworkStatus } from './useNetwork';
export type { ConnectionType } from '@capacitor/network';

// Capacitor Browser hook
export { useBrowser } from './useBrowser';
export type { UseBrowserReturn } from './useBrowser';
