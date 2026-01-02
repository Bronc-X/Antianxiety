'use client';

/**
 * useAiConversation Domain Hook (The Bridge)
 *
 * Wraps AI conversation history actions.
 */

import { useCallback, useState } from 'react';
import {
  getAiConversationHistory,
  saveAiConversationMessage,
  type SaveAiConversationInput,
} from '@/app/actions/ai-conversations';
import type { ConversationRow } from '@/types/assistant';

export interface UseAiConversationReturn {
  isLoading: boolean;
  error: string | null;
  loadHistory: (limit?: number) => Promise<ConversationRow[] | null>;
  saveMessage: (input: SaveAiConversationInput) => Promise<boolean>;
  clearError: () => void;
}

export function useAiConversation(): UseAiConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAiConversationHistory(limit);
      if (!result.success) {
        setError(result.error || 'Failed to load history');
        return null;
      }
      return result.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMessage = useCallback(async (input: SaveAiConversationInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await saveAiConversationMessage(input);
      if (!result.success) {
        setError(result.error || 'Failed to save message');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message');
      return false;
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
    loadHistory,
    saveMessage,
    clearError,
  };
}
