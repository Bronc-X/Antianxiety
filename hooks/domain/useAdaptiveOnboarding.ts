'use client';

/**
 * useAdaptiveOnboarding Domain Hook (The Bridge)
 *
 * Wraps adaptive onboarding goal recommendation.
 */

import { useCallback, useState } from 'react';
import { recommendGoals } from '@/app/actions/onboarding';

export interface UseAdaptiveOnboardingReturn {
  isLoading: boolean;
  error: string | null;
  recommend: (answers: Record<string, string>) => Promise<unknown | null>;
  clearError: () => void;
}

export function useAdaptiveOnboarding(): UseAdaptiveOnboardingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = useCallback(async (answers: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await recommendGoals(answers);
      if (!result.success) {
        setError(result.error || 'Failed to recommend goals');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recommend goals');
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
    recommend,
    clearError,
  };
}
