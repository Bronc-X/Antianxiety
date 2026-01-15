'use client';

/**
 * useDebugSession Domain Hook (The Bridge)
 *
 * Wraps debug session action.
 */

import { useCallback, useState } from 'react';
import { getDebugSession } from '@/app/actions/debug';

export interface UseDebugSessionReturn {
  isLoading: boolean;
  error: string | null;
  load: () => Promise<unknown | null>;
  clearError: () => void;
}

export function useDebugSession(): UseDebugSessionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDebugSession();
      if (!result.success) {
        setError(result.error || 'Failed to load session');
        return null;
      }
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    load,
    clearError,
  };
}
