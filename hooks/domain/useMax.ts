'use client';

/**
 * useMax Domain Hook (The Bridge)
 * 
 * Manages Max AI chat state.
 * Note: Actual AI streaming is handled by /api/chat endpoint.
 * This hook manages conversation state and history.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getConversations,
    getChatHistory,
    createConversation,
    deleteConversation,
    type ChatMessage,
    type Conversation
} from '@/app/actions/chat';

// ============================================
// Types
// ============================================

export interface LocalMessage extends ChatMessage {
    isStreaming?: boolean;
    isPending?: boolean;
}

export interface UseMaxReturn {
    // Data
    messages: LocalMessage[];
    conversations: Conversation[];
    currentConversationId: string | null;

    // States
    isLoading: boolean;
    isSending: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    addMessage: (message: LocalMessage) => void;
    updateLastMessage: (content: string, isComplete?: boolean) => void;
    newConversation: () => Promise<string | null>;
    switchConversation: (id: string) => Promise<void>;
    deleteChat: (id: string) => Promise<boolean>;
    clearMessages: () => void;
    refresh: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useMax(): UseMaxReturn {
    const { isOnline } = useNetwork();

    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchingRef = useRef(false);

    // Fetch conversations on mount
    useEffect(() => {
        const fetchData = async () => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;

            try {
                const result = await getConversations();
                if (result.success && result.data) {
                    setConversations(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setIsLoading(false);
                fetchingRef.current = false;
            }
        };

        fetchData();
    }, []);

    // Add a message (user or assistant start)
    const addMessage = useCallback((message: LocalMessage) => {
        setMessages(prev => [...prev, message]);
        if (message.role === 'user') {
            setIsSending(true);
        }
    }, []);

    // Update the last assistant message (for streaming)
    const updateLastMessage = useCallback((content: string, isComplete = false) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content,
                    isStreaming: !isComplete,
                };
            }
            return newMessages;
        });

        if (isComplete) {
            setIsSending(false);
        }
    }, []);

    // Create new conversation
    const newConversation = useCallback(async (): Promise<string | null> => {
        try {
            const result = await createConversation();
            if (result.success && result.data) {
                setConversations(prev => [result.data!, ...prev]);
                setCurrentConversationId(result.data.id);
                setMessages([]);
                return result.data.id;
            }
            return null;
        } catch {
            setError('Failed to create conversation');
            return null;
        }
    }, []);

    // Switch to a conversation
    const switchConversation = useCallback(async (id: string) => {
        setCurrentConversationId(id);
        setIsLoading(true);

        try {
            const result = await getChatHistory(id);
            if (result.success && result.data) {
                setMessages(result.data);
            }
        } catch {
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete a conversation
    const deleteChat = useCallback(async (id: string): Promise<boolean> => {
        try {
            const result = await deleteConversation(id);
            if (result.success) {
                setConversations(prev => prev.filter(c => c.id !== id));
                if (currentConversationId === id) {
                    setCurrentConversationId(null);
                    setMessages([]);
                }
                return true;
            }
            return false;
        } catch {
            setError('Failed to delete conversation');
            return false;
        }
    }, [currentConversationId]);

    // Clear current messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setCurrentConversationId(null);
    }, []);

    // Refresh conversations
    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getConversations();
            if (result.success && result.data) {
                setConversations(result.data);
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        isSending,
        isOffline: !isOnline,
        error,
        addMessage,
        updateLastMessage,
        newConversation,
        switchConversation,
        deleteChat,
        clearMessages,
        refresh,
    };
}

export type { ChatMessage, Conversation, LocalMessage };
