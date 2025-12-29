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

export default function DarkMax() {
    const { language } = useI18n();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: language === 'en'
                ? "MAX ONLINE. How can I assist with your recovery today?"
                : "MAX 在线。今天我能如何协助你的恢复？",
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
                    content: data.reply || data.message || "Processing...",
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
            style={{ background: '#000000' }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
                    borderBottom: '1px solid #1A1A1A',
                }}
            >
                <Link href="/mobile-dark">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                            background: '#0A0A0A',
                            border: '1px solid #222222',
                        }}
                    >
                        <ChevronLeft className="w-5 h-5" style={{ color: '#666666' }} />
                    </motion.button>
                </Link>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                            background: '#007AFF20',
                            border: '1px solid #007AFF50',
                        }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: '#007AFF' }} />
                    </div>
                    <div>
                        <h1
                            className="font-mono uppercase tracking-wider text-sm"
                            style={{ color: '#FFFFFF' }}
                        >
                            MAX
                        </h1>
                        <p
                            className="text-[10px] font-mono"
                            style={{ color: '#007AFF' }}
                        >
                            {language === 'en' ? 'AGENT ONLINE' : '智能体在线'}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex gap-3 mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div
                                className="w-8 h-8 flex items-center justify-center shrink-0"
                                style={{
                                    background: message.role === 'assistant'
                                        ? '#007AFF20'
                                        : '#1A1A1A',
                                    border: `1px solid ${message.role === 'assistant' ? '#007AFF50' : '#333333'}`,
                                }}
                            >
                                {message.role === 'assistant'
                                    ? <Sparkles className="w-3 h-3" style={{ color: '#007AFF' }} />
                                    : <User className="w-3 h-3" style={{ color: '#666666' }} />
                                }
                            </div>
                            <div
                                className="max-w-[75%] px-4 py-3"
                                style={{
                                    background: message.role === 'assistant'
                                        ? '#0A0A0A'
                                        : '#1A1A1A',
                                    border: `1px solid ${message.role === 'assistant' ? '#222222' : '#333333'}`,
                                }}
                            >
                                <p
                                    className="text-sm font-mono leading-relaxed"
                                    style={{ color: '#CCCCCC' }}
                                >
                                    {message.content}
                                </p>
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
                        <div
                            className="w-8 h-8 flex items-center justify-center"
                            style={{
                                background: '#007AFF20',
                                border: '1px solid #007AFF50',
                            }}
                        >
                            <Sparkles className="w-3 h-3" style={{ color: '#007AFF' }} />
                        </div>
                        <div
                            className="px-4 py-3"
                            style={{
                                background: '#0A0A0A',
                                border: '1px solid #222222',
                            }}
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5"
                                        style={{ background: '#007AFF' }}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{
                                            duration: 1,
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 py-4"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                    borderTop: '1px solid #1A1A1A',
                }}
            >
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        className="w-12 h-12 flex items-center justify-center"
                        style={{
                            background: isListening ? '#FF3B3020' : '#0A0A0A',
                            border: `1px solid ${isListening ? '#FF3B30' : '#222222'}`,
                        }}
                    >
                        {isListening
                            ? <MicOff className="w-5 h-5" style={{ color: '#FF3B30' }} />
                            : <Mic className="w-5 h-5" style={{ color: '#666666' }} />
                        }
                    </motion.button>

                    <div
                        className="flex-1 flex items-center px-4"
                        style={{
                            background: '#0A0A0A',
                            border: '1px solid #222222',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={language === 'en' ? 'QUERY...' : '输入查询...'}
                            className="flex-1 bg-transparent font-mono text-sm placeholder-gray-600 focus:outline-none py-3"
                            style={{ color: '#FFFFFF' }}
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 flex items-center justify-center disabled:opacity-40"
                        style={{
                            background: '#007AFF',
                        }}
                    >
                        <Send className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
