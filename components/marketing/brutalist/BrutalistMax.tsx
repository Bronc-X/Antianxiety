'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BrutalistNav from './BrutalistNav';
import ReactMarkdown from 'react-markdown';
import { useChatAI } from '@/hooks/domain/useChatAI';
import { useChatConversation } from '@/hooks/domain/useChatConversation';
import { useAuth } from '@/hooks/domain/useAuth';
import type { RoleType } from '@/types/assistant';

// Types
interface Message {
    role: RoleType;
    content: string;
    timestamp: Date;
    papers?: unknown[];
}

export default function BrutalistMax() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { sendPayload } = useChatAI();
    const { loadHistory, saveMessage, isLoading: historyLoading, error } = useChatConversation();
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const isPending = isSending || historyLoading;

    // Initial Load & Auth Check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/brutalist/signup');
        }
    }, [authLoading, isAuthenticated, router]);

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            if (authLoading || !isAuthenticated) return;
            const data = await loadHistory(50);
            if (data && data.length > 0) {
                const history = data.slice().reverse().map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.created_at),
                    papers: msg.metadata?.papers,
                }));
                setMessages(history);
            } else {
                // Welcome message
                setMessages([{
                    role: 'assistant',
                    content: "Hello. I am Max.\n\nI am here to optimize your biology effectively and ruthlessly.\n\nTell me about your sleep, stress, or performance goals.",
                    timestamp: new Date()
                }]);
            }
        };
        fetchHistory();
    }, [authLoading, isAuthenticated, loadHistory]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    // Adjust textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isSending) return;

        const userMsg: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        // Save User Message
        await saveMessage({
            role: 'user',
            content: userMsg.content,
            metadata: { timestamp: userMsg.timestamp },
        });

        try {
            const data = await sendPayload({
                messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                stream: false,
                systemPrompt: "You are Max, a brutalist, direct, and highly efficient biological optimization agent. Speak concisely. Focus on performance, sleep, and stress data. Use data-driven language. Do not be overly polite. Your goal is to solve the user's problem."
            });

            if (!data) throw new Error('Failed to fetch response');

            const aiContent =
                data?.data?.answer
                || data?.response
                || data?.reply
                || data?.message
                || 'Response unavailable.';

            const aiMsgPlaceholder: Message = {
                role: 'assistant',
                content: aiContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsgPlaceholder]);

            // Save Assistant Message
            await saveMessage({
                role: 'assistant',
                content: aiContent,
                metadata: { timestamp: new Date() },
            });

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error: Connection interrupted. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (authLoading) {
        return (
            <div className="brutalist-page min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00FF94] border-t-transparent rounded-full animate-spin animate-pulse" />
            </div>
        );
    }

    return (
        <div className="brutalist-page min-h-screen flex flex-col">
            <BrutalistNav />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-40 border-b border-[var(--brutalist-border)] h-16 flex items-center justify-between px-4 mt-16 md:mt-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-[var(--brutalist-muted)]/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                            Max <span className="bg-[var(--signal-green)] text-black text-[10px] px-1 font-bold">AI</span>
                        </h1>
                        <p className="text-[10px] text-[var(--brutalist-muted)]">Biological Optimization Agent</p>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 pt-32 pb-24 px-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[70%] p-4 border ${msg.role === 'user'
                                ? 'bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] border-[var(--brutalist-fg)]'
                                : 'bg-[var(--brutalist-bg)] text-[var(--brutalist-fg)] border-[var(--brutalist-border)]'} 
                                brutalist-shadow-sm`}
                            >
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                                <div className={`text-[10px] mt-2 uppercase tracking-wide ${msg.role === 'user' ? 'text-white/50' : 'text-[var(--brutalist-muted)]'}`}>
                                    {msg.role === 'user' ? 'You' : 'Max'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {historyLoading && messages.length === 0 && (
                        <div className="flex justify-start">
                            <div className="bg-[var(--brutalist-bg)] border border-[var(--brutalist-border)] p-4 flex items-center gap-2 animate-pulse">
                                <span className="text-xs font-mono uppercase">Loading...</span>
                            </div>
                        </div>
                    )}
                    {isSending && (
                        <div className="flex justify-start">
                            <div className="bg-[var(--brutalist-bg)] border border-[var(--brutalist-border)] p-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--signal-green)] animate-spin" />
                                <span className="text-xs font-mono uppercase blink">Processing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="fixed bottom-0 left-0 right-0 bg-[var(--brutalist-bg)] border-t border-[var(--brutalist-border)] p-4 z-50">
                <div className="max-w-3xl mx-auto flex gap-4 items-end">
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Max about your health..."
                            rows={1}
                            className="w-full bg-transparent border-b-2 border-[var(--brutalist-border)] focus:border-[var(--signal-green)] p-3 outline-none resize-none max-h-32 font-mono text-sm"
                        />
                    </div>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isPending}
                        className="p-3 bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] hover:bg-[var(--signal-green)] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                {error && (
                    <div className="mt-2 text-center text-xs text-red-400">{error}</div>
                )}
            </footer>
        </div>
    );
}
