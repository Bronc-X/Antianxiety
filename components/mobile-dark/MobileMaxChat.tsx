'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, Terminal } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase-client';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function MobileMaxChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const supabase = createClientSupabaseClient();

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(50);

        if (data) {
            setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
        } else {
            // Initial Welcome if no history
            setMessages([{
                role: 'assistant',
                content: `Systems nominal. Max initialized.\nReady to process bio-data and optimize performance.`
            }]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Optimistic update
            const { data: { user } } = await supabase.auth.getUser();

            // Save user msg
            if (user) {
                await supabase.from('ai_conversations').insert({
                    user_id: user.id,
                    role: 'user',
                    content: userMsg.content,
                    metadata: { timestamp: new Date().toISOString() }
                });
            }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            const result = await res.json();
            const aiContent = result.data?.answer || result.response || "Connection interrupted.";

            const aiMsg = { role: 'assistant' as const, content: aiContent };
            setMessages(prev => [...prev, aiMsg]);

            // Save AI msg
            if (user) {
                await supabase.from('ai_conversations').insert({
                    user_id: user.id,
                    role: 'assistant',
                    content: aiMsg.content,
                    metadata: { timestamp: new Date().toISOString() }
                });
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'system', content: 'Error: Link failure.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black font-mono text-sm relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-lg border ${msg.role === 'user'
                                    ? 'bg-[#111111] border-[#333333] text-[#CCCCCC]'
                                    : 'bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF]'
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-1 mb-1 text-[10px] opacity-50 uppercase tracking-widest">
                                    <Terminal className="w-3 h-3" />
                                    <span>Max_Core</span>
                                </div>
                            )}
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 p-3 rounded-lg flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-[#007AFF] animate-pulse" />
                            <span className="w-1.5 h-1.5 bg-[#007AFF] animate-pulse delay-75" />
                            <span className="w-1.5 h-1.5 bg-[#007AFF] animate-pulse delay-150" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-[80px] left-0 right-0 px-4">
                <div className="flex items-center gap-2 max-w-[320px] mx-auto bg-[#0A0A0A] border border-[#333333] p-1.5 rounded-full shadow-2xl">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 placeholder:text-[#444444]"
                        placeholder="Enter command..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white disabled:opacity-50"
                    >
                        {isLoading ? <Zap className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
