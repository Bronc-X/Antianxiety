'use client';

/**
 * useCuratedFeed Domain Hook (The Bridge)
 *
 * Wraps curated feed fetching + feedback actions.
 */

import { useCallback, useState } from 'react';
import {
  getCuratedFeed,
  markCuratedRead,
  toggleFeedFeedback,
  type CuratedFeedParams,
  type CuratedReadInput,
  type FeedFeedbackInput,
} from '@/app/actions/feed';

export interface UseCuratedFeedReturn {
  isLoading: boolean;
  error: string | null;
  fetchPage: (params?: CuratedFeedParams) => Promise<unknown | null>;
  sendFeedback: (input: FeedFeedbackInput) => Promise<'added' | 'removed' | null>;
  markRead: (input: CuratedReadInput) => Promise<boolean>;
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

  const markRead = useCallback(async (input: CuratedReadInput) => {
    try {
      const result = await markCuratedRead(input);
      return Boolean(result.success);
    } catch {
      return false;
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
    markRead,
    clearError,
  };
}
