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
    appendMessage,
    deleteConversation,
    type ChatMessage,
    type Conversation
} from '@/app/actions/chat';
import { generateChatResponse } from '@/app/actions/chat-ai';

// ============================================
// Types
// ============================================

export interface LocalMessage extends ChatMessage {
    isStreaming?: boolean;
    isPending?: boolean;
}

export type ModelMode = 'fast' | 'pro';

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
    modelMode: ModelMode;

    // Actions
    addMessage: (message: LocalMessage) => void;
    updateLastMessage: (content: string, isComplete?: boolean) => void;
    newConversation: () => Promise<string | null>;
    switchConversation: (id: string) => Promise<void>;
    deleteChat: (id: string) => Promise<boolean>;
    sendMessage: (content: string, language?: 'zh' | 'en') => Promise<boolean>;
    clearMessages: () => void;
    refresh: () => Promise<void>;
    setModelMode: (mode: ModelMode) => void;
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
    const [modelMode, setModelMode] = useState<ModelMode>('fast');

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

    // Send message + persist
    const sendMessage = useCallback(async (
        content: string,
        language: 'zh' | 'en' = 'zh'
    ): Promise<boolean> => {
        if (!content.trim()) return false;
        if (isSending) return false;

        setIsSending(true);
        setError(null);

        let conversationId = currentConversationId;

        // If no conversation, create one first
        if (!conversationId) {
            const created = await createConversation();
            if (!created.success || !created.data) {
                setError(created.error || 'Failed to create conversation');
                setIsSending(false);
                return false;
            }
            conversationId = created.data.id;
            setConversations(prev => [created.data!, ...prev]);
            setCurrentConversationId(created.data.id);
        }

        // 1. Save User Message
        const userResult = await appendMessage({
            conversation_id: conversationId,
            role: 'user',
            content: content.trim(),
        });

        if (!userResult.success || !userResult.data) {
            setError(userResult.error || 'Failed to send message');
            setIsSending(false);
            return false;
        }

        setMessages(prev => [...prev, userResult.data!]);

        // 2. Add Placeholder for Assistant
        const placeholderId = `assistant-${Date.now()}`;
        setMessages(prev => ([
            ...prev,
            {
                id: placeholderId,
                conversation_id: conversationId,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString(),
                isStreaming: true,
            },
        ]));

        let assistantContent = '';

        // 3. Generate Response
        try {
            // Build simple history for AI context
            const chatHistory = [...messages, { role: 'user', content: content.trim() }]
                .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const result = await generateChatResponse(chatHistory, language);

            if (!result.success) {
                assistantContent = language === 'en'
                    ? 'AI service is temporarily unavailable.'
                    : 'AI 服务暂时不可用。';
            } else {
                assistantContent = result.data || '';
            }
        } catch (err) {
            assistantContent = language === 'en'
                ? 'Network error. Please try again.'
                : '网络错误，请稍后再试。';
        }

        let parsedContent = assistantContent.trim();
        if (!parsedContent) {
            parsedContent = language === 'en' ? 'I understand.' : '我明白了。';
        }

        // 4. Save Assistant Response
        const assistantResult = await appendMessage({
            conversation_id: conversationId,
            role: 'assistant',
            content: parsedContent,
        });

        setMessages(prev => prev.map(msg => {
            if (msg.id !== placeholderId) return msg;
            if (assistantResult.success && assistantResult.data) {
                return { ...assistantResult.data, isStreaming: false };
            }
            return { ...msg, content: parsedContent, isStreaming: false };
        }));

        if (!assistantResult.success) {
            setError(assistantResult.error || 'Failed to save response');
        }

        setIsSending(false);
        return true;
    }, [currentConversationId, isSending, messages]);

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
        modelMode,
        addMessage,
        updateLastMessage,
        newConversation,
        switchConversation,
        deleteChat,
        sendMessage,
        clearMessages,
        refresh,
        setModelMode,
    };
}

export type { ChatMessage, Conversation };
