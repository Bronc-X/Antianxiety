'use client';

/**
 * useWearables Domain Hook (The Bridge)
 *
 * Wraps wearable status + sync actions.
 */

import { useCallback, useState } from 'react';
import { getWearablesStatus, syncWearables, disconnectWearable, type WearablesSyncInput } from '@/app/actions/wearables';

export interface UseWearablesReturn {
  status: any | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDisconnecting: boolean;
  error: string | null;
  loadStatus: () => Promise<any | null>;
  sync: (input?: WearablesSyncInput) => Promise<boolean>;
  disconnect: (provider: string) => Promise<boolean>;
  clearError: () => void;
}

export function useWearables(): UseWearablesReturn {
  const [status, setStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWearablesStatus();
      if (!result.success) {
        setError(result.error || 'Failed to load wearables status');
        setStatus(null);
        return null;
      }
      setStatus(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wearables status');
      setStatus(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sync = useCallback(async (input: WearablesSyncInput = {}) => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncWearables(input);
      if (!result.success) {
        setError(result.error || 'Sync failed');
        return false;
      }
      setStatus(result.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const disconnect = useCallback(async (provider: string) => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const result = await disconnectWearable(provider as any);
      if (!result.success) {
        setError(result.error || 'Disconnect failed');
        return false;
      }
      await loadStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, [loadStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    isLoading,
    isSyncing,
    isDisconnecting,
    error,
    loadStatus,
    sync,
    disconnect,
    clearError,
  };
}
