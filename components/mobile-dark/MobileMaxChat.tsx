'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Terminal, Sparkles } from 'lucide-react';
import { useChatAI } from '@/hooks/domain/useChatAI';
import { useAiConversation } from '@/hooks/domain/useAiConversation';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function MobileMaxChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { sendPayload } = useChatAI();
    const { loadHistory, saveMessage, isLoading, error } = useAiConversation();

    useEffect(() => {
        const fetchHistory = async () => {
            const history = await loadHistory(50);
            if (history && history.length > 0) {
                setMessages(history.map((m) => ({ role: m.role, content: m.content })));
            } else {
                setMessages([{
                    role: 'assistant',
                    content: 'Systems nominal. Max initialized.\nReady to process bio-data.',
                }]);
            }
        };
        fetchHistory();
    }, [loadHistory]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            await saveMessage({
                role: 'user',
                content: userMsg.content,
                metadata: { timestamp: new Date().toISOString() },
            });

            const data = await sendPayload({
                message: userMsg.content,
                conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
                stream: false,
            });
            const aiContent = data?.data?.answer || data?.response || data?.reply || data?.message || "Connection interrupted.";

            const aiMsg = { role: 'assistant' as const, content: aiContent };
            setMessages(prev => [...prev, aiMsg]);

            await saveMessage({
                role: 'assistant',
                content: aiMsg.content,
                metadata: { timestamp: new Date().toISOString() },
            });

        } catch (e) {
            setMessages(prev => [...prev, { role: 'system', content: 'Link failure.' }]);
        } finally {
            setIsSending(false);
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
                {isLoading && messages.length === 0 && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-[#111111] border border-[#333333] p-3 rounded-lg w-32 h-6" />
                    </div>
                )}
                {isSending && (
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
            <div className="fixed bottom-[80px] left-0 right-0 z-50 px-4">
                <div className="flex items-center gap-2 max-w-[320px] mx-auto bg-[#0A0A0A] border border-[#222222] p-1.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 placeholder:text-[#444444]"
                        placeholder="INPUT_COMMAND..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isSending || !input.trim()}
                        className="w-8 h-8 rounded-full bg-[#00FF94] flex items-center justify-center text-black disabled:opacity-50 hover:bg-[#00CC76] transition-colors"
                    >
                        {isSending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                {error && (
                    <div className="mt-2 text-xs text-red-400 text-center">{error}</div>
                )}
            </div>
        </div>
    );
}
