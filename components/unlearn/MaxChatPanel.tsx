'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2, Mic, MicOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useMax, type LocalMessage } from '@/hooks/domain/useMax';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface MaxChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MaxChatPanel({ isOpen, onClose }: MaxChatPanelProps) {
    const { language } = useI18n();

    // Use the domain hook (The Bridge)
    const {
        messages,
        addMessage,
        isSending,
        newConversation,
        currentConversationId,
        sendMessage: sendMessageHook
    } = useMax();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        isSupported: speechSupported,
        isListening,
        start,
        stop,
    } = useSpeechRecognition({
        locale: language === 'en' ? 'en-US' : 'zh-CN',
        continuous: false,
        interimResults: false,
        onResult: (text) => {
            setInput(prev => prev + text);
        },
        onError: () => {},
    });

    // Initial Setup
    useEffect(() => {
        if (isOpen) {
            // Ensure we have a conversation context
            newConversation();

            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isOpen, newConversation]);

    const toggleListening = () => {
        if (!speechSupported) return;
        if (isListening) {
            void stop();
            return;
        }
        void start();
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    // Add welcome message if empty
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg: LocalMessage = {
                id: 'welcome',
                role: 'assistant',
                content: language === 'en'
                    ? "Hi! I'm Max, your personal health agent. I can help you understand your anxiety patterns, suggest personalized interventions, and track your progress. What's on your mind?"
                    : "嗨！我是 Max，你的个人健康智能体。我可以帮助你理解焦虑模式、建议个性化干预措施、并追踪你的进展。今天有什么想聊的吗？",
                created_at: new Date().toISOString(),
                conversation_id: currentConversationId || 'temp',
            };
            addMessage(welcomeMsg);
        }
    }, [isOpen, language, messages.length, addMessage, currentConversationId]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;

        const userContent = input;
        setInput('');
        await sendMessageHook(userContent, language === 'en' ? 'en' : 'zh');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-0 right-0 w-full h-[100dvh] md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] z-50 flex flex-col overflow-hidden shadow-2xl md:rounded-lg"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0B3D2E] rounded-full flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                                <h3 className="text-[#1A1A1A] font-semibold">Max</h3>
                                <p className="text-[#1A1A1A]/60 text-xs">
                                    {language === 'en' ? 'Personal Health Agent' : '个人健康智能体'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                        ? 'text-[#1A1A1A]'
                                        : 'bg-[#0B3D2E]/5 text-[#1A1A1A]'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#0B3D2E] animate-pulse" />}
                                </div>
                            </motion.div>
                        ))}

                        {isSending && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                </div>
                                <div className="bg-[#0B3D2E]/5 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-[#1A1A1A]/60">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">{language === 'en' ? 'Thinking...' : '思考中...'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={language === 'en' ? 'Ask Max anything...' : '问 Max 任何问题...'}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-[#1A1A1A] placeholder-[#1A1A1A]/40 rounded-lg focus:outline-none focus:border-[#0B3D2E] transition-colors"
                            />
                            {speechSupported && (
                                <button
                                    onClick={toggleListening}
                                    className={`px-4 py-3 rounded-lg transition-colors ${isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-gray-100 text-[#1A1A1A]/60 hover:bg-gray-200'
                                        }`}
                                    title={language === 'en' ? 'Voice input' : '语音输入'}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            )}
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isSending}
                                className="px-4 py-3 bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
