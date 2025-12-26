'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Brain, FileText, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BrutalistNav from './BrutalistNav';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import ReactMarkdown from 'react-markdown';

// Types
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    papers?: any[];
}

export default function BrutalistMax() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initial Load & Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/brutalist/signup');
                return;
            }
            setUserId(user.id);
            loadHistory(user.id);
        };
        checkAuth();
    }, [supabase, router]);

    // Load History
    const loadHistory = async (uid: string) => {
        const { data } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && data.length > 0) {
            const history = data.reverse().map(msg => ({
                role: msg.role as any,
                content: msg.content,
                timestamp: new Date(msg.created_at),
                papers: msg.metadata?.papers
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

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Adjust textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Save User Message
        if (userId) {
            await supabase.from('chat_conversations').insert({
                user_id: userId,
                role: 'user',
                content: userMsg.content,
                metadata: { timestamp: userMsg.timestamp }
            });
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    systemPrompt: "You are Max, a brutalist, direct, and highly efficient biological optimization agent. Speak concisely. Focus on performance, sleep, and stress data. Use data-driven language. Do not be overly polite. Your goal is to solve the user's problem."
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            // Stream placeholder
            const aiMsgPlaceholder: Message = {
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsgPlaceholder]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                aiContent += chunk;

                setMessages(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].content = aiContent;
                    return newHistory;
                });
            }

            // Save Assistant Message
            if (userId) {
                await supabase.from('chat_conversations').insert({
                    user_id: userId,
                    role: 'assistant',
                    content: aiContent,
                    metadata: { timestamp: new Date() }
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error: Connection interrupted. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

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

                    {isLoading && (
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
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] hover:bg-[var(--signal-green)] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
