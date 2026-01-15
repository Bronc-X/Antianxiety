'use client';

/**
 * useBayesianHistory Domain Hook (The Bridge)
 *
 * Wraps bayesian history fetch.
 */

import { useCallback, useState } from 'react';
import { getBayesianHistory, type BayesianHistoryRange } from '@/app/actions/bayesian';

export interface UseBayesianHistoryReturn {
  isLoading: boolean;
  error: string | null;
  fetchHistory: (range?: BayesianHistoryRange, context?: string | null) => Promise<unknown | null>;
  clearError: () => void;
}

export function useBayesianHistory(): UseBayesianHistoryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (range: BayesianHistoryRange = '30d', context?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBayesianHistory(range, context);
      if (!result.success) {
        setError(result.error || 'Failed to load history');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
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
    fetchHistory,
    clearError,
  };
}

export type { BayesianHistoryRange };
