'use client';

/**
 * useInquiry Domain Hook (The Bridge)
 *
 * Handles pending inquiry fetch + response.
 */

import { useCallback, useState } from 'react';
import { getPendingInquiry, respondToInquiry } from '@/app/actions/inquiry';

export interface UseInquiryReturn {
  pending: unknown | null;
  isLoading: boolean;
  isResponding: boolean;
  error: string | null;
  loadPending: (language?: 'zh' | 'en') => Promise<unknown | null>;
  respond: (id: string, response: string) => Promise<boolean>;
  clearError: () => void;
}

export function useInquiry(): UseInquiryReturn {
  const [pending, setPending] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(async (language: 'zh' | 'en' = 'zh') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPendingInquiry(language);
      if (!result.success) {
        setError(result.error || 'Failed to load inquiry');
        setPending(null);
        return null;
      }
      setPending(result.data || null);
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiry');
      setPending(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respond = useCallback(async (id: string, response: string) => {
    setIsResponding(true);
    setError(null);
    try {
      const result = await respondToInquiry(id, response);
      if (!result.success) {
        setError(result.error || 'Failed to submit response');
        return false;
      }
      setPending(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
      return false;
    } finally {
      setIsResponding(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pending,
    isLoading,
    isResponding,
    error,
    loadPending,
    respond,
    clearError,
  };
}
