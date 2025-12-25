/**
 * useProfileSync Hook
 * 
 * Provides a function to trigger profile aggregation in the background.
 * Call this after form submissions that update user profile data.
 */

import { useCallback } from 'react';

/**
 * Hook to trigger profile aggregation
 * @returns Function to call after form submissions
 */
export function useProfileSync() {
    const syncProfile = useCallback(async () => {
        try {
            // Fire and forget - don't block the UI
            fetch('/api/user/profile-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }).catch(err => {
                // Silently log errors - profile sync is not critical to UX
                console.warn('Profile sync failed (non-critical):', err);
            });
        } catch {
            // Ignore errors - this is a background operation
        }
    }, []);

    return { syncProfile };
}

/**
 * Standalone function for use outside React components
 */
export async function triggerProfileSync(): Promise<void> {
    try {
        await fetch('/api/user/profile-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.warn('Profile sync failed (non-critical):', err);
    }
}
