'use client';

/**
 * Desktop Max Chat Presentational Component (The Skin - Desktop)
 */

import { useState, useRef, useEffect } from 'react';
import {
    Send, Plus, Trash2, MessageSquare, RefreshCw,
    AlertCircle, Bot, User
} from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import type { UseMaxReturn, LocalMessage } from '@/hooks/domain/useMax';

interface DesktopMaxChatProps {
    max: UseMaxReturn;
    onSendMessage?: (message: string) => Promise<void>;
}

function ChatSkeleton() {
    return (
        <div className="flex h-[calc(100vh-120px)]">
            <div className="w-64 border-r p-4 space-y-3">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
            <div className="flex-1 p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-3/4" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: LocalMessage }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
            </div>
        </div>
    );
}

function ConversationItem({
    title,
    isActive,
    onClick,
    onDelete
}: {
    title: string;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
            onClick={onClick}
        >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate text-sm">{title}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-all"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}

export function DesktopMaxChat({ max, onSendMessage }: DesktopMaxChatProps) {
    const {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        isSending,
        error,
        addMessage,
        newConversation,
        switchConversation,
        deleteChat,
        clearMessages,
    } = max;

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        const content = inputValue.trim();
        setInputValue('');

        // Add user message locally
        addMessage({
            id: 'temp-' + Date.now(),
            conversation_id: currentConversationId || '',
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        });

        // Add placeholder for assistant
        addMessage({
            id: 'temp-assistant-' + Date.now(),
            conversation_id: currentConversationId || '',
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
            isStreaming: true,
        });

        // Call the streaming API
        if (onSendMessage) {
            await onSendMessage(content);
        }
    };

    if (isLoading) return <ChatSkeleton />;

    return (
        <div className="flex h-[calc(100vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 border-r bg-gray-50/50 flex flex-col">
                <div className="p-4">
                    <Button onClick={newConversation} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {conversations.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            title={conv.title}
                            isActive={conv.id === currentConversationId}
                            onClick={() => switchConversation(conv.id)}
                            onDelete={() => deleteChat(conv.id)}
                        />
                    ))}
                    {conversations.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">
                            No conversations yet
                        </p>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Max</h1>
                        <p className="text-sm text-gray-500">Your AI health companion</p>
                    </div>
                    {currentConversationId && (
                        <Button variant="outline" size="sm" onClick={clearMessages}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Bot className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">Start a conversation with Max</p>
                            <p className="text-sm">Ask about your health, sleep, stress, or anything else</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            disabled={isSending}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isSending}
                            className="px-6"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DesktopMaxChat;
