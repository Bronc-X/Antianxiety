"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Mic, MicOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useMax, type LocalMessage } from '@/hooks/domain/useMax';

export default function MobileMaxPage() {
    const { language } = useI18n();

    // Use the domain hook (The Bridge)
    const {
        messages,
        addMessage,
        updateLastMessage,
        isLoading: historyLoading,
        isSending,
        newConversation,
        currentConversationId
    } = useMax();

    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Initial Setup
    useEffect(() => {
        // Ensure we have a conversation context
        newConversation();
    }, [newConversation]);

    // Check for Speech Recognition support
    useEffect(() => {
        const SpeechRecognition = (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
            (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'en' ? 'en-US' : 'zh-CN';

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [language]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    // Add welcome message if empty
    useEffect(() => {
        if (messages.length === 0) {
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
    }, [language, messages.length, addMessage, currentConversationId]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;

        const userContent = input;
        const userMessage: LocalMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
            created_at: new Date().toISOString(),
            conversation_id: currentConversationId || 'temp',
        };

        addMessage(userMessage);
        setInput('');

        try {
            // Add placeholder assistant message
            const placeholderId = (Date.now() + 1).toString();
            const placeholderMessage: LocalMessage = {
                id: placeholderId,
                role: 'assistant',
                content: '',
                isStreaming: true,
                created_at: new Date().toISOString(),
                conversation_id: currentConversationId || 'temp',
            };
            addMessage(placeholderMessage);

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userContent,
                    stream: false, // Currently using non-streaming per original component
                    language,
                }),
            });

            const data = await res.json();
            const reply = data.response || data.reply || data.message || (language === 'en' ? 'I understand.' : '我明白了。');

            updateLastMessage(reply, true);
        } catch (error) {
            console.error('Chat error:', error);
            updateLastMessage(language === 'en' ? 'Sorry, connection error.' : '抱歉，连接错误。', true);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white z-10 sticky top-0">
                <div className="w-10 h-10 bg-[#0B3D2E] rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/20">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                    <h1 className="text-xl font-serif font-bold text-slate-900">Max</h1>
                    <p className="text-slate-500 text-xs">
                        {language === 'en' ? 'Personal Health Agent' : '个人健康智能体'}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 bg-slate-50/50">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md">
                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                ? 'bg-slate-900 text-white rounded-tr-sm'
                                : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#0B3D2E] animate-pulse" />}
                        </div>
                    </motion.div>
                ))}

                {isSending && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center mt-1 shadow-md">
                            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">{language === 'en' ? 'Thinking...' : '思考中...'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom above Nav */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20">
                <div className="flex gap-2 max-w-md mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={language === 'en' ? 'Ask Max anything...' : '问 Max 任何问题...'}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-inner"
                    />
                    {speechSupported && (
                        <button
                            onClick={toggleListening}
                            className={`px-4 py-3 rounded-2xl transition-all shadow-sm ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isSending}
                        className="px-4 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
