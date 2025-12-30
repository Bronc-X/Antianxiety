'use client';

/**
 * V2 Max Page - AI 对话
 * 
 * 用户可见的核心功能之一：越来越懂你的 AI 对话
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useMax } from '@/hooks/domain/useMax';

export default function V2MaxPage() {
    const {
        messages,
        isLoading,
        isSending,
        addMessage,
        updateLastMessage,
        newConversation,
    } = useMax();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        addMessage({
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
        });

        // Add placeholder assistant message
        addMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
            isStreaming: true,
        });

        // Call streaming API
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) throw new Error('Failed to send');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                updateLastMessage(fullContent, false);
            }

            updateLastMessage(fullContent, true);
        } catch (error) {
            updateLastMessage('抱歉，发生了错误。请稍后重试。', true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-emerald-900/30">
                <Link href="/v2/home" className="text-emerald-400 hover:text-emerald-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">Max</h1>
                    <p className="text-emerald-400/60 text-sm">你的 AI 健康顾问</p>
                </div>
                <button
                    onClick={() => newConversation()}
                    className="text-emerald-400 hover:text-emerald-300"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <span className="text-6xl mb-4 block">🧠</span>
                        <p className="text-emerald-400/70">向 Max 提问任何健康问题</p>
                        <p className="text-emerald-400/40 text-sm mt-2">越聊越懂你</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user'
                                        ? 'bg-emerald-600/30 text-emerald-100'
                                        : 'bg-slate-800/50 text-slate-200'
                                    }`}
                            >
                                {message.content || (
                                    <span className="inline-block animate-pulse">思考中...</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-emerald-900/30">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入消息..."
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-emerald-900/30 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/50"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
