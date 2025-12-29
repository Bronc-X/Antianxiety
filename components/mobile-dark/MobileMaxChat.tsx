'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, Terminal, Sparkles } from 'lucide-react';
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
            setMessages([{
                role: 'assistant',
                content: `Systems nominal. Max initialized.\nReady to process bio-data.`
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
            const { data: { user } } = await supabase.auth.getUser();

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

            if (user) {
                await supabase.from('ai_conversations').insert({
                    user_id: user.id,
                    role: 'assistant',
                    content: aiMsg.content,
                    metadata: { timestamp: new Date().toISOString() }
                });
            }

        } catch (e) {
            setMessages(prev => [...prev, { role: 'system', content: 'Link failure.' }]);
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
                                ? 'bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94] shadow-[0_0_10px_rgba(0,255,148,0.1)]' // Green for User
                                : 'bg-[#111111] border-[#333333] text-[#CCCCCC]' // Dark Gray/White for AI
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-1 mb-1 text-[10px] opacity-50 uppercase tracking-widest text-emerald-400">
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
                        <div className="bg-[#111111] border border-[#333333] p-3 rounded-lg flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-[#00FF94] animate-pulse" />
                            <span className="w-1.5 h-1.5 bg-[#00FF94] animate-pulse delay-75" />
                            <span className="w-1.5 h-1.5 bg-[#00FF94] animate-pulse delay-150" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-[100px] left-0 right-0 z-50 px-4">
                <div
                    className="flex items-center gap-2 max-w-[320px] mx-auto bg-[#0A0A0A] p-2 rounded-full backdrop-blur-md relative overflow-hidden"
                    style={{
                        boxShadow: `
                           inset 1px 1px 2px rgba(255,255,255,0.05),
                           inset -2px -2px 6px rgba(0,0,0,0.5),
                           0 10px 30px rgba(0,0,0,0.4)
                        `
                    }}
                >
                    {/* Gloss Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-full pointer-events-none" />

                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 placeholder:text-[#444444]"
                        placeholder="INPUT_COMMAND..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="w-8 h-8 rounded-full bg-[#00FF94] flex items-center justify-center text-black disabled:opacity-50 hover:bg-[#00CC76] transition-colors"
                    >
                        {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
