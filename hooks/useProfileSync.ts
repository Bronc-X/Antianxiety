'use client';

/**
 * useProfileSync Hook
 * 
 * Provides a function to trigger profile aggregation in the background.
 * Call this after form submissions that update user profile data.
 */

import { useCallback } from 'react';
import { useProfileMaintenance, triggerProfileSync as triggerProfileSyncAction } from '@/hooks/domain/useProfileMaintenance';

export interface UseProfileSyncReturn {
    syncProfile: () => Promise<void>;
}

/**
 * Hook to trigger profile aggregation
 * @returns Function to call after form submissions
 */
export function useProfileSync(): UseProfileSyncReturn {
    const { sync } = useProfileMaintenance();
    const syncProfile = useCallback(async () => {
        try {
            // Fire and forget - don't block the UI
            sync().catch(err => {
                // Silently log errors - profile sync is not critical to UX
                console.warn('Profile sync failed (non-critical):', err);
            });
        } catch {
            // Ignore errors - this is a background operation
        }
    }, [sync]);

    return { syncProfile };
}

/**
 * Standalone function for use outside React components
 */
export async function triggerProfileSync(): Promise<void> {
    const ok = await triggerProfileSyncAction();
    if (!ok) {
        console.warn('Profile sync failed (non-critical)');
    }
}
