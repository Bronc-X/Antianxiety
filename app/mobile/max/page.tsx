'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, Send, Mic, MicOff, Sparkles, User } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function MobileMax() {
    const { language } = useI18n();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: language === 'en'
                ? "Hi! I'm Max, your personal health agent. How can I help you today?"
                : "你好！我是 Max，你的个人健康智能体。今天有什么我可以帮助你的吗？",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply || data.message || 'I\'m here to help.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }
        setIsListening(!isListening);
        // Voice recognition would be implemented here
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-[#0B3D2E] to-[#1a5c47]">
            {/* Header */}
            <div
                className="flex items-center gap-4 px-4 py-4"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
            >
                <Link href="/mobile">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </motion.button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-semibold">Max</h1>
                        <p className="text-white/60 text-xs">
                            {language === 'en' ? 'Your Health Agent' : '你的健康智能体'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex gap-3 mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'assistant'
                                        ? 'bg-[#D4AF37]'
                                        : 'bg-white/20'
                                    }`}
                            >
                                {message.role === 'assistant'
                                    ? <Sparkles className="w-4 h-4 text-white" />
                                    : <User className="w-4 h-4 text-white" />
                                }
                            </div>
                            <div
                                className={`max-w-[75%] px-4 py-3 rounded-2xl ${message.role === 'assistant'
                                        ? 'bg-white/10 backdrop-blur text-white'
                                        : 'bg-white text-gray-900'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 mb-4"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-white/60 rounded-full"
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="px-4 py-4 bg-white/10 backdrop-blur"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
                <div className="flex gap-2">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isListening
                                ? 'bg-red-500'
                                : 'bg-white/20'
                            }`}
                    >
                        {isListening
                            ? <MicOff className="w-5 h-5 text-white" />
                            : <Mic className="w-5 h-5 text-white" />
                        }
                    </motion.button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={language === 'en' ? 'Ask Max anything...' : '问 Max 任何问题...'}
                        className="flex-1 px-4 py-3 bg-white/20 backdrop-blur rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/30 transition-colors"
                    />

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
