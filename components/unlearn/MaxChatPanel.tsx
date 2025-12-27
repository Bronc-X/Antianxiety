'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2, User, Bot } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface MaxChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MaxChatPanel({ isOpen, onClose }: MaxChatPanelProps) {
    const { language } = useI18n();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add welcome message when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: language === 'en'
                    ? "Hi! I'm Max, your AI health coach. I can help you understand your anxiety patterns, suggest personalized interventions, and track your progress. What's on your mind?"
                    : "嗨！我是 Max，你的 AI 健康教练。我可以帮助你理解焦虑模式、建议个性化干预措施、并追踪你的进展。今天有什么想聊的吗？",
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, language]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

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
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    stream: false,
                    language,
                }),
            });

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || data.reply || data.message || (language === 'en' ? 'I understand. Let me think about that.' : '我明白了，让我思考一下。'),
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: language === 'en' ? 'Sorry, I had trouble connecting. Please try again.' : '抱歉，连接出现问题。请重试。',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 right-6 w-[400px] h-[600px] z-50 flex flex-col overflow-hidden shadow-2xl"
                    style={{
                        backgroundColor: '#0B3D2E',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-4 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#0B3D2E]" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Max</h3>
                                <p className="text-white/50 text-xs">
                                    {language === 'en' ? 'AI Health Coach' : 'AI 健康教练'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div
                                    className={`w-8 h-8 flex items-center justify-center shrink-0 ${msg.role === 'user'
                                            ? 'bg-white/10'
                                            : 'bg-[#D4AF37]'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-[#0B3D2E]" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[80%] p-3 ${msg.role === 'user'
                                            ? 'bg-[#D4AF37] text-[#0B3D2E]'
                                            : 'bg-white/5 text-white border border-white/10'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-[#0B3D2E]" />
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3">
                                    <div className="flex items-center gap-2 text-white/50">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">{language === 'en' ? 'Thinking...' : '思考中...'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        className="p-4 border-t"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={language === 'en' ? 'Ask Max anything...' : '问 Max 任何问题...'}
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="px-4 py-3 bg-[#D4AF37] text-[#0B3D2E] hover:bg-[#E5C158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
