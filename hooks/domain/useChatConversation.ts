'use client';

/**
 * useChatConversation Domain Hook (The Bridge)
 *
 * Wraps chat conversation history actions.
 */

import { useCallback, useState } from 'react';
import {
  getChatConversationHistory,
  saveChatConversationMessage,
  type SaveChatConversationInput,
  type ChatConversationRow,
} from '@/app/actions/chat-conversations';

export interface UseChatConversationReturn {
  isLoading: boolean;
  error: string | null;
  loadHistory: (limit?: number) => Promise<ChatConversationRow[] | null>;
  saveMessage: (input: SaveChatConversationInput) => Promise<boolean>;
  clearError: () => void;
}

export function useChatConversation(): UseChatConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getChatConversationHistory(limit);
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

  const saveMessage = useCallback(async (input: SaveChatConversationInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await saveChatConversationMessage(input);
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
