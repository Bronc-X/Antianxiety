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
                    content: data.reply || data.message || "I'm here to help.",
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
    };

    return (
        <div
            className="flex flex-col h-screen"
            style={{
                background: 'linear-gradient(180deg, #0B3D2E 0%, #1a5c47 40%, #1a5c47 100%)',
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
                    background: 'rgba(11, 61, 46, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <Link href="/mobile">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </motion.button>
                </Link>
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-white font-bold text-lg">Max</h1>
                        <p className="text-white/50 text-xs">
                            {language === 'en' ? 'Your Health Agent' : '你的健康智能体'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                            className={`flex gap-3 mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${message.role === 'assistant'
                                        ? ''
                                        : ''
                                    }`}
                                style={{
                                    background: message.role === 'assistant'
                                        ? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)'
                                        : 'rgba(255, 255, 255, 0.15)',
                                }}
                            >
                                {message.role === 'assistant'
                                    ? <Sparkles className="w-4 h-4 text-white" />
                                    : <User className="w-4 h-4 text-white" />
                                }
                            </div>
                            <div
                                className={`max-w-[75%] px-4 py-3 rounded-[20px] ${message.role === 'assistant'
                                        ? ''
                                        : ''
                                    }`}
                                style={{
                                    background: message.role === 'assistant'
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: message.role === 'assistant'
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : 'none',
                                    boxShadow: message.role === 'user'
                                        ? '0 4px 20px rgba(0, 0, 0, 0.1)'
                                        : 'none',
                                }}
                            >
                                <p className={`text-sm leading-relaxed ${message.role === 'assistant' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {message.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 mb-4"
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                            }}
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div
                            className="px-4 py-3 rounded-[20px]"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-white/60 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.15,
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 py-4"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                    background: 'rgba(11, 61, 46, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? '' : ''
                            }`}
                        style={{
                            background: isListening
                                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isListening ? '0 8px 24px rgba(239, 68, 68, 0.3)' : 'none',
                        }}
                    >
                        {isListening
                            ? <MicOff className="w-5 h-5 text-white" />
                            : <Mic className="w-5 h-5 text-white/80" />
                        }
                    </motion.button>

                    <div
                        className="flex-1 flex items-center px-4 rounded-2xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={language === 'en' ? 'Ask Max anything...' : '问 Max 任何问题...'}
                            className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none py-3"
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Send className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
