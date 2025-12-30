'use client';

/**
 * Mobile Max Chat Presentational Component (The Skin - Mobile)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, WifiOff, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import type { UseMaxReturn, LocalMessage } from '@/hooks/domain/useMax';

interface MobileMaxChatProps {
    max: UseMaxReturn;
    onSendMessage?: (message: string) => Promise<void>;
    onBack?: () => void;
}

function MobileMessageBubble({ message, isLatest }: { message: LocalMessage; isLatest: boolean }) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={isLatest ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isUser
                    ? 'bg-emerald-500 text-white rounded-tr-md'
                    : 'bg-white text-gray-900 rounded-tl-md shadow-sm'
                }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle"
                        />
                    )}
                </p>
            </div>
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export function MobileMaxChat({ max, onSendMessage, onBack }: MobileMaxChatProps) {
    const {
        messages,
        isLoading,
        isSending,
        isOffline,
        error,
        addMessage,
        currentConversationId,
    } = max;

    const { impact } = useHaptics();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        await impact(ImpactStyle.Medium);

        const content = inputValue.trim();
        setInputValue('');

        // Add user message
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

        if (onSendMessage) {
            await onSendMessage(content);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onBack}
                            className="p-2 -ml-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="font-semibold text-gray-900">Max</h1>
                        <p className="text-xs text-gray-500">AI Health Companion</p>
                    </div>
                </div>
            </div>

            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2"
                    >
                        <WifiOff className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Offline - messages will sync later</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4"
                        >
                            <Bot className="w-10 h-10 text-white" />
                        </motion.div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Hi, I'm Max</h2>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Your personal AI health companion. Ask me anything about your wellness journey.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MobileMessageBubble
                        key={msg.id}
                        message={msg}
                        isLatest={idx === messages.length - 1}
                    />
                ))}

                <AnimatePresence>
                    {isSending && messages[messages.length - 1]?.role === 'user' && (
                        <TypingIndicator />
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 bg-white border-t px-4 py-3 pb-safe">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Message Max..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                        disabled={isSending}
                    />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${inputValue.trim()
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default MobileMaxChat;
