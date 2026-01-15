'use client';

/**
 * useChatAI Domain Hook (The Bridge)
 *
 * Wraps chat AI payload + papers fetch.
 */

import { useCallback, useState } from 'react';
import { callChatPayload, getChatPapers } from '@/app/actions/chat-ai';

export interface UseChatAIReturn {
  isLoading: boolean;
  error: string | null;
  sendPayload: (payload: Record<string, unknown>) => Promise<unknown | null>;
  fetchPapers: (query: string) => Promise<unknown | null>;
  clearError: () => void;
}

export function useChatAI(): UseChatAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPayload = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callChatPayload(payload);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPapers = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getChatPapers(query);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
    sendPayload,
    fetchPapers,
    clearError,
  };
}
