'use client';

/**
 * useBayesianNudgeAction Domain Hook (The Bridge)
 *
 * Wraps passive nudge trigger action.
 */

import { useCallback, useState } from 'react';
import { triggerBayesianNudge, type BayesianNudgeInput, type BayesianNudgeResult } from '@/app/actions/bayesian';

export interface UseBayesianNudgeActionReturn {
  isLoading: boolean;
  error: string | null;
  trigger: (input: BayesianNudgeInput) => Promise<BayesianNudgeResult | null>;
  clearError: () => void;
}

export function useBayesianNudgeAction(): UseBayesianNudgeActionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async (input: BayesianNudgeInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await triggerBayesianNudge(input);
      if (!result.success) {
        setError(result.error || 'Failed to trigger nudge');
        return null;
      }
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger nudge');
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
    trigger,
    clearError,
  };
}
