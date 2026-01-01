'use client';

/**
 * useCuratedFeed Domain Hook (The Bridge)
 *
 * Wraps curated feed fetching + feedback actions.
 */

import { useCallback, useState } from 'react';
import {
  getCuratedFeed,
  toggleFeedFeedback,
  type CuratedFeedParams,
  type FeedFeedbackInput,
} from '@/app/actions/feed';

export interface UseCuratedFeedReturn {
  isLoading: boolean;
  error: string | null;
  fetchPage: (params?: CuratedFeedParams) => Promise<any>;
  sendFeedback: (input: FeedFeedbackInput) => Promise<'added' | 'removed' | null>;
  clearError: () => void;
}

export function useCuratedFeed(): UseCuratedFeedReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (params: CuratedFeedParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCuratedFeed(params);
      if (!result.success) {
        setError(result.error || 'Failed to load feed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFeedback = useCallback(async (input: FeedFeedbackInput) => {
    try {
      const result = await toggleFeedFeedback(input);
      if (!result.success) {
        return null;
      }
      return result.data?.action || null;
    } catch {
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    fetchPage,
    sendFeedback,
    clearError,
  };
}
