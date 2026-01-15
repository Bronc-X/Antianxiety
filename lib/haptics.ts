import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic patterns for the app.
 * Follows the "Tactile" interface design philosophy.
 */

const isNative = Capacitor.isNativePlatform();

export const triggerHaptic = {
    // Light tap for standard buttons
    tap: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // Medium impact for toggles and important actions
    medium: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // Heavy impact for destructive actions or severe warnings
    heavy: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // Success notification (usually a double tap feeling)
    success: async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // Error notification (usually a distinct vibration)
    error: async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // Selection change (optimized for single clicks)
    selection: async () => {
        if (!isNative) return;
        try {
            await Haptics.selectionChanged();
        } catch (e) {
            console.warn('Haptics not supported', e);
        }
    },

    // --- Complex Patterns ---

    // Ripple: Light -> Medium -> Light (Fluid feeling)
    ripple: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
            setTimeout(async () => {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }, 80);
        } catch { }
    },

    // Breathing: A slow, rhythmic pattern for meditation
    breathing: async (durationMs: number = 3000) => {
        if (!isNative) return;
        // Simulate a "swelling" feeling with increasing intensity
        const steps = 5;
        const interval = durationMs / steps;

        for (let i = 0; i < steps; i++) {
            setTimeout(async () => {
                await Haptics.selectionChanged();
            }, i * interval);
        }
    }
};
