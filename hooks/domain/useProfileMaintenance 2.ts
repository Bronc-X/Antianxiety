'use client';

/**
 * useProfileMaintenance Domain Hook (The Bridge)
 *
 * Provides profile refresh/sync helpers for background updates.
 */

import { useCallback, useState } from 'react';
import { refreshUserProfile, syncUserProfile } from '@/app/actions/user';

export interface UseProfileMaintenanceReturn {
  isRefreshing: boolean;
  isSyncing: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  sync: () => Promise<boolean>;
  clearError: () => void;
}

export function useProfileMaintenance(): UseProfileMaintenanceReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const result = await refreshUserProfile();
      if (!result.success) {
        setError(result.error || 'Failed to refresh profile');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncUserProfile();
      if (!result.success) {
        setError(result.error || 'Failed to sync profile');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync profile');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRefreshing,
    isSyncing,
    error,
    refresh,
    sync,
    clearError,
  };
}

export async function triggerProfileSync(): Promise<boolean> {
  try {
    const result = await syncUserProfile();
    return result.success;
  } catch {
    return false;
  }
}
