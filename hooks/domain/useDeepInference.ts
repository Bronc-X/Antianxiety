'use client';

/**
 * useDeepInference Domain Hook (The Bridge)
 *
 * Wraps deep inference action.
 */

import { useCallback, useState } from 'react';
import { getDeepInference, type DeepInferenceInput } from '@/app/actions/deep-inference';

export interface UseDeepInferenceReturn {
  isLoading: boolean;
  error: string | null;
  fetchInference: (input: DeepInferenceInput) => Promise<any>;
  clearError: () => void;
}

export function useDeepInference(): UseDeepInferenceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInference = useCallback(async (input: DeepInferenceInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDeepInference(input);
      if (!result.success) {
        setError(result.error || '获取推演数据失败');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取推演数据失败');
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
    fetchInference,
    clearError,
  };
}
