'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, Send, Mic, MicOff, Square, Terminal } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function DarkMax() {
    const { language } = useI18n();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: language === 'en'
                ? "MAX_OS v2.4 ONLINE. AWAITING INPUT."
                : "MAX_OS v2.4 在线。等待输入指令。",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        // Simulate network delay logic
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Analyzing biometric inputs... Deviation detected. Recommend 300s coherence breathing protocol.", // Mock response
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-screen bg-black font-mono">
            {/* Header */}
            <header className="px-4 py-4 pt-14 border-b border-[#222222] flex items-center justify-between bg-black z-10">
                <Link href="/mobile-dark" className="flex items-center gap-2 text-[#666666] hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-[10px] tracking-widest uppercase">EXIT</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#007AFF] animate-pulse" />
                    <span className="text-[10px] tracking-widest text-[#007AFF]">MAX_AGENT LINKED</span>
                </div>
            </header>

            {/* Chat Area - Terminal Style */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                    <span className="text-[8px] text-[#444444] tracking-widest">
                                        {message.role === 'user' ? 'USER_INPUT' : 'SYSTEM_OUTPUT'} :: {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>
                                <div
                                    className={`p-3 border ${message.role === 'user'
                                            ? 'border-[#333333] bg-[#111111] text-[#CCCCCC]'
                                            : 'border-[#007AFF] bg-[#007AFF10] text-[#007AFF]'
                                        }`}
                                >
                                    <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
                                        {message.role === 'assistant' && <span className="mr-2 opacity-50">{'>'}</span>}
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <div className="flex items-center gap-2 text-[#007AFF]">
                        <Square className="w-2 h-2 animate-spin" fill="currentColor" />
                        <span className="text-[10px] tracking-widest animate-pulse">PROCESSING DATA STREAM...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Command Line */}
            <div className="p-4 border-t border-[#222222] bg-black">
                <div className="flex items-center gap-2 border border-[#333333] p-3 focus-within:border-[#007AFF] transition-colors">
                    <Terminal className="w-4 h-4 text-[#444444]" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="ENTER COMMAND..."
                        className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-[#444444]"
                        autoComplete="off"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="text-[#007AFF] disabled:opacity-30 hover:text-white"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
