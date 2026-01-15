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
    getStarterQuestions,
    type ChatMessage,
    type Conversation
} from '@/app/actions/chat';
import { generateChatResponse } from '@/app/actions/chat-ai';
import { deriveConversationTitle, isDefaultConversationTitle } from '@/lib/chat-title';

// ============================================
// Types
// ============================================

export interface LocalMessage extends ChatMessage {
    isStreaming?: boolean;
    isPending?: boolean;
    attachments?: Array<{
        name?: string;
        contentType?: string;
        url?: string;
        base64?: string;
    }>;
}

export type ModelMode = 'fast' | 'think';

type ChatMessageInput = {
    role: 'user' | 'assistant';
    content: string;
    experimental_attachments?: Array<{
        name?: string;
        contentType?: string;
        url?: string;
    }>;
};

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
    starterQuestions: string[];

    // Actions
    addMessage: (message: LocalMessage) => void;
    updateLastMessage: (content: string, isComplete?: boolean) => void;
    newConversation: () => Promise<string | null>;
    switchConversation: (id: string) => Promise<void>;
    deleteChat: (id: string) => Promise<boolean>;
    sendMessage: (content: string, attachments?: File[], language?: 'zh' | 'en') => Promise<boolean>;
    clearMessages: () => void;
    refresh: () => Promise<void>;
    setModelMode: (mode: ModelMode) => void;
    stopGeneration: () => void;
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
    const [starterQuestions, setStarterQuestions] = useState<string[]>([]);

    const fetchingRef = useRef(false);
    const startersLoadingRef = useRef(false);
    const startersTimestampRef = useRef(0);
    const generationIdRef = useRef(0);

    const loadStarterQuestions = useCallback(async (force = false) => {
        if (startersLoadingRef.current) return;
        const now = Date.now();
        if (!force && startersTimestampRef.current && now - startersTimestampRef.current < 2 * 60 * 1000) {
            return;
        }

        startersLoadingRef.current = true;
        try {
            const result = await getStarterQuestions();
            if (result.success && Array.isArray(result.data)) {
                setStarterQuestions(result.data);
                startersTimestampRef.current = Date.now();
            }
        } catch (err) {
            console.warn('Failed to fetch starter questions:', err);
        } finally {
            startersLoadingRef.current = false;
        }
    }, []);

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

    useEffect(() => {
        void loadStarterQuestions(true);
    }, [loadStarterQuestions]);

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
                void loadStarterQuestions(true);
                return result.data.id;
            }
            return null;
        } catch {
            setError('Failed to create conversation');
            return null;
        }
    }, [loadStarterQuestions]);

    // Switch to a conversation
    const switchConversation = useCallback(async (id: string) => {
        setCurrentConversationId(id);
        setIsLoading(true);

        try {
            const result = await getChatHistory(id);
            if (result.success && result.data) {
                setMessages(result.data);
            }
            void loadStarterQuestions();
        } catch {
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    }, [loadStarterQuestions]);

    const stopGeneration = useCallback(() => {
        generationIdRef.current += 1; // Invalidate current generation
        setIsSending(false);
    }, []);

    // Send message + persist
    const sendMessage = useCallback(async (
        content: string,
        attachments: File[] = [],
        language: 'zh' | 'en' = 'zh'
    ): Promise<boolean> => {
        if (!content.trim() && attachments.length === 0) return false;
        if (isSending) return false;

        const currentGenId = ++generationIdRef.current;
        setIsSending(true);
        setError(null);

        let conversationId = currentConversationId;

        // Process Attachments (Convert to Base64)
        const processedAttachments = await Promise.all(attachments.map(async (file) => {
            return new Promise<{ name: string; contentType: string; base64: string; url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    if (generationIdRef.current !== currentGenId) return; // check cancel
                    const base64 = reader.result as string;
                    resolve({
                        name: file.name,
                        contentType: file.type,
                        base64: base64,
                        url: base64 // Use base64 as URL for preview
                    });
                };
                reader.onerror = reject;
            });
        }));

        if (generationIdRef.current !== currentGenId) return false;

        // 0. Optimistic Update: Show user message immediately
        const tempUserMsgId = `temp-user-${Date.now()}`;
        const tempUserMsg: LocalMessage = {
            id: tempUserMsgId,
            role: 'user',
            content: content.trim(),
            created_at: new Date().toISOString(),
            conversation_id: conversationId || '',
            attachments: processedAttachments
        };
        setMessages(prev => [...prev, tempUserMsg]);

        // If no conversation, create one first
        if (!conversationId) {
            const created = await createConversation();
            if (generationIdRef.current !== currentGenId) return false; // check cancel

            if (!created.success || !created.data) {
                setError(created.error || 'Failed to create conversation');
                setIsSending(false);
                // Rollback optimistic update
                setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));
                return false;
            }
            conversationId = created.data.id;
            setConversations(prev => [created.data!, ...prev]);
            setCurrentConversationId(created.data.id);
        }

        // 1. Save User Message
        // Note: For now, we only persist text content to DB. 
        // Real implementation should upload images to storage (e.g. Supabase Storage) and save URLs.
        // Here we just attach base64 for the AI context.
        const userResult = await appendMessage({
            conversation_id: conversationId,
            role: 'user',
            content: content.trim(),
            // Ensure backend can handle extra fields if needed, or we handle it in AI call only
        });

        if (generationIdRef.current !== currentGenId) return false; // check cancel

        if (!userResult.success || !userResult.data) {
            setError(userResult.error || 'Failed to send message');
            setIsSending(false);
            // Rollback optimistic update
            setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));
            return false;
        }

        // Replace optimistic message with real message but keep attachments (since DB might not return them yet)
        setMessages(prev => prev.map(msg => msg.id === tempUserMsgId ? { ...userResult.data!, attachments: processedAttachments } : msg));

        setConversations(prev => prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            if (!isDefaultConversationTitle(conv.title)) return conv;
            return { ...conv, title: deriveConversationTitle(content) };
        }));

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
            // Map attachments to Vercel AI SDK parts format if needed?
            // Actually generateChatResponse expects ChatMessageInput[].
            // We need to pass the images there.

            // Add current message with images
            // We need to modify generateChatResponse signature to accept rich content
            // or we update chatHistory to support parts.
            // Let's assume generateChatResponse will be updated to accept mixed content.

            /* 
              We will pass a special structure or just rely on the updated generateChatResponse.
              For this implementation, let's assume we pass the raw 'messages' array 
              and the backend helps parse it, OR we perform formatting here.
            */

            // Construct the payload for the current turn specifically
            const currentMessagePayload = {
                role: 'user' as const,
                content: content.trim(),
                experimental_attachments: processedAttachments.map(a => ({
                    name: a.name,
                    contentType: a.contentType,
                    url: a.base64
                }))
            };

            // We might need to adjust how we call generateChatResponse
            // For now, let's keep the history simple text-only (since we don't store images yet)
            // and pass the images in the last message.

            const historyForAi: ChatMessageInput[] = [
                ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                currentMessagePayload
            ];

            const result = await generateChatResponse(historyForAi, language, modelMode);

            if (generationIdRef.current !== currentGenId) return false; // check cancel

            if (!result.success) {
                assistantContent = language === 'en'
                    ? 'AI service is temporarily unavailable.'
                    : 'AI 服务暂时不可用。';
            } else {
                assistantContent = result.data || '';
            }
        } catch {
            if (generationIdRef.current !== currentGenId) return false; // check cancel
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

        if (generationIdRef.current !== currentGenId) return false; // check cancel

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
    }, [currentConversationId, isSending, messages, modelMode]);

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
        starterQuestions,
        addMessage,
        updateLastMessage,
        newConversation,
        switchConversation,
        deleteChat,
        sendMessage,
        stopGeneration,
        clearMessages,
        refresh,
        setModelMode,
    };
}

export type { ChatMessage, Conversation };
