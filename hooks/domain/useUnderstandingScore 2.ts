'use client';

/**
 * useUnderstandingScore Domain Hook (The Bridge)
 *
 * Wraps understanding score actions.
 */

import { useCallback, useState } from 'react';
import { getUnderstandingScore, type UnderstandingScoreOptions } from '@/app/actions/understanding-score';
import type { ActionResult } from '@/types/architecture';

export interface UseUnderstandingScoreReturn {
  isLoading: boolean;
  error: string | null;
  fetchScore: (options?: UnderstandingScoreOptions) => Promise<ActionResult<any>>;
  clearError: () => void;
}

export function useUnderstandingScore(): UseUnderstandingScoreReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async (options: UnderstandingScoreOptions = {}): Promise<ActionResult<any>> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUnderstandingScore(options);
      if (!result.success) {
        setError(result.error || 'Failed to load score');
        return result;
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load score';
      setError(message);
      return { success: false, error: message };
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
    fetchScore,
    clearError,
  };
}
