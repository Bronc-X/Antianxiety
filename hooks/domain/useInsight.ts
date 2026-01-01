'use client';

/**
 * useInsight Domain Hook (The Bridge)
 *
 * Wraps insight generation actions.
 */

import { useCallback, useState } from 'react';
import { generateInsight, getFallbackInsight, type InsightInput } from '@/app/actions/insight';

export interface UseInsightReturn {
  isLoading: boolean;
  error: string | null;
  generate: (input: InsightInput) => Promise<string | null>;
  fallback: () => Promise<string | null>;
  clearError: () => void;
}

export function useInsight(): UseInsightReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (input: InsightInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateInsight(input);
      if (!result.success) {
        setError(result.error || 'Failed to generate insight');
        return null;
      }
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insight');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFallbackInsight();
      if (!result.success) {
        setError(result.error || 'Failed to generate insight');
        return null;
      }
      return result.data?.insight || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insight');
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
    generate,
    fallback,
    clearError,
  };
}
