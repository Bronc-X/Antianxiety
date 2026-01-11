"use client";

/**
 * ViewMax - Mobile Max Chat Component
 * 
 * Features:
 * - Voice input support
 * - Fast/Pro model selection
 * - Plan detection and saving
 * - Conversation history with summaries
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Plus,
    X,
    MessageSquare,
    Trash2,
    RefreshCw,
    Menu,
    Mic,
    MicOff,
    Zap,
    Sparkles,
    Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import MaxAvatar from "@/components/max/MaxAvatar";
import { useMax, type LocalMessage, type ModelMode } from "@/hooks/domain/useMax";
import { useChatToPlan } from "@/hooks/domain/useChatToPlan";
import ChatPlanSelector from "@/components/chat/ChatPlanSelector";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// ============================================
// Animation Variants  
// ============================================

const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10 }
};

// ============================================
// Thinking Process Component - Better explanation
// ============================================

function ThinkingIndicator() {
    const steps = [
        "正在调用您的健康档案...",
        "检索历史对话记忆...",
        "查询最新科学文献...",
        "Max 正在深思熟虑..."
    ];
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-1 py-2">
            <div className="flex items-center gap-2 text-xs text-stone-500">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full"
                />
                <span>{steps[currentStep]}</span>
            </div>
            <p className="text-[10px] text-stone-400 pl-5">为您定制专属方案需要一点时间 ☕</p>
        </div>
    );
}

// ============================================
// Plan Content Filter - Remove plan details from chat display
// ============================================

function filterPlanContent(content: string): string {
    // If message contains plans, only show the intro text before "方案1："
    const planStartIndex = content.indexOf('方案1：');
    if (planStartIndex === -1) {
        // Also check for "方案1:"
        const altIndex = content.indexOf('方案1:');
        if (altIndex === -1) return content;
        // Return only the text before the plan
        const beforePlan = content.substring(0, altIndex).trim();
        return beforePlan || '已为您生成方案，请在下方查看和选择 👇';
    }
    // Return only the text before the plan
    const beforePlan = content.substring(0, planStartIndex).trim();
    return beforePlan || '已为您生成方案，请在下方查看和选择 👇';
}

// ============================================
// Message Bubble Component
// ============================================

function MessageBubble({ message, isLatest }: { message: LocalMessage; isLatest: boolean }) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isEmpty = !message.content?.trim();

    // Filter plan content from assistant messages (plans show in ChatPlanSelector)
    const displayContent = isAssistant && message.content
        ? filterPlanContent(message.content)
        : message.content;

    return (
        <motion.div
            variants={isLatest ? messageVariants : undefined}
            initial={isLatest ? "initial" : false}
            animate="animate"
            className={cn(
                "flex gap-2.5 px-3 py-2",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {isAssistant && (
                <div className="flex-shrink-0 w-7 h-7">
                    <MaxAvatar size={28} state={message.isStreaming ? 'thinking' : 'idle'} />
                </div>
            )}

            <div className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2",
                isUser
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-sm"
            )}>
                {isEmpty && message.isStreaming ? (
                    <ThinkingIndicator />
                ) : (
                    <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                        {message.isStreaming && (
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-0.5 h-3.5 bg-emerald-500 ml-1 align-middle"
                            />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================
// Empty State Component
// ============================================

function EmptyState({
    suggestions,
    onSuggestionClick
}: {
    suggestions: string[];
    onSuggestionClick: (text: string) => void;
}) {
    const fallback = [
        "帮我制定一个睡眠改善计划",
        "我最近压力很大",
        "分析我的健康数据"
    ];
    const resolved = suggestions.length > 0 ? suggestions : fallback;

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4">
                <MaxAvatar size={64} state="idle" />
            </motion.div>

            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">Hi, I'm Max</h2>
            <p className="text-sm text-stone-500 text-center mb-6">你的个人健康 AI 助手</p>

            <div className="w-full max-w-xs space-y-2">
                {resolved.map((text, idx) => (
                    <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => onSuggestionClick(text)}
                        className="w-full p-2.5 text-left text-sm text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-emerald-400 transition-all"
                    >
                        {text}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// ============================================
// History Sidebar with Summaries
// ============================================

function HistorySidebar({
    conversations,
    currentId,
    onSelect,
    onNew,
    onDelete,
    onClose
}: {
    conversations: Array<{ id: string; title: string; last_message_at: string; message_count: number }>;
    currentId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}) {
    // Generate summary from title or use message count
    const getSummary = (conv: { title: string; message_count: number }) => {
        if (conv.title && conv.title !== 'New Chat' && conv.title.length > 2) {
            return conv.title.length > 30 ? conv.title.slice(0, 30) + '...' : conv.title;
        }
        return `${conv.message_count} 条消息`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/40"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-stone-900 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-700">
                    <h3 className="font-bold">历史对话</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-2">
                    <button
                        onClick={onNew}
                        className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus size={16} />
                        <span className="font-medium">新对话</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {conversations.length === 0 ? (
                        <p className="text-center text-stone-400 text-xs py-6">暂无对话记录</p>
                    ) : (
                        conversations.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => onSelect(chat.id)}
                                className={cn(
                                    "p-2.5 rounded-xl cursor-pointer group flex items-start gap-2",
                                    chat.id === currentId
                                        ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700"
                                        : "hover:bg-stone-50 dark:hover:bg-stone-800"
                                )}
                            >
                                <MessageSquare size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs truncate">{getSummary(chat)}</p>
                                    <p className="text-[10px] text-stone-400">{new Date(chat.last_message_at).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// Model Toggle Component
// ============================================

function ModelToggle({ mode, onChange }: { mode: ModelMode; onChange: (m: ModelMode) => void }) {
    return (
        <div className="flex items-center bg-stone-200 dark:bg-stone-700 rounded-lg p-0.5 text-[10px] font-medium">
            <button
                onClick={() => onChange('fast')}
                className={cn(
                    "px-2 py-1 rounded-md transition-all flex items-center gap-1",
                    mode === 'fast' ? "bg-white dark:bg-stone-600 text-emerald-600 shadow-sm" : "text-stone-500"
                )}
            >
                <Zap size={10} />
                快速
            </button>
            <button
                onClick={() => onChange('think')}
                className={cn(
                    "px-2 py-1 rounded-md transition-all flex items-center gap-1",
                    mode === 'think' ? "bg-white dark:bg-stone-600 text-purple-600 shadow-sm" : "text-stone-500"
                )}
            >
                <Brain size={10} />
                思考
            </button>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export const ViewMax = () => {
    const {
        messages,
        conversations,
        currentConversationId,
        isLoading,
        isSending,
        error,
        modelMode,
        starterQuestions,
        sendMessage,
        switchConversation,
        newConversation,
        deleteChat,
        setModelMode
    } = useMax();

    const chatToPlan = useChatToPlan();
    const [showPlanSelector, setShowPlanSelector] = useState(false);
    const [input, setInput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const {
        isSupported: voiceSupported,
        isListening: voiceListening,
        start: startVoice,
        stop: stopVoice,
    } = useSpeechRecognition({
        locale: 'zh-CN',
        continuous: false,
        interimResults: false,
        onResult: (text) => {
            setInput(prev => prev + text);
        },
        onError: (message) => {
            console.warn('Speech recognition error:', message);
        },
    });

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Plan detection
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant' && !lastMessage.isStreaming && lastMessage.content) {
            chatToPlan.detectPlansFromMessage(lastMessage.content);
        }
    }, [messages]);

    useEffect(() => {
        if (chatToPlan.hasPlans && !showPlanSelector) setShowPlanSelector(true);
    }, [chatToPlan.hasPlans]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isSending) return;
        const content = input.trim();
        setInput("");
        await sendMessage(content, 'zh');
    }, [input, isSending, sendMessage]);

    const handleSuggestionClick = useCallback((text: string) => {
        setInput(text);
        inputRef.current?.focus();
    }, []);

    const showInlineStarters = starterQuestions.length > 0 && messages.length > 0;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleSavePlans = useCallback(async () => {
        const success = await chatToPlan.saveSelectedPlans();
        if (success) setShowPlanSelector(false);
    }, [chatToPlan]);

    const handleDismissPlans = useCallback(() => {
        setShowPlanSelector(false);
        chatToPlan.clearDetectedPlans();
    }, [chatToPlan]);

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={24} className="text-emerald-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-stone-900 relative overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
                <button onClick={() => setShowHistory(true)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                    <Menu size={18} className="text-stone-600 dark:text-stone-400" />
                </button>

                <div className="flex items-center gap-2">
                    <MaxAvatar size={24} state={isSending ? 'thinking' : 'idle'} />
                    <span className="font-bold text-sm text-stone-800 dark:text-white">Max</span>
                    <ModelToggle mode={modelMode} onChange={setModelMode} />
                </div>

                <button onClick={() => newConversation()} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                    <Plus size={18} className="text-stone-600 dark:text-stone-400" />
                </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <EmptyState suggestions={starterQuestions} onSuggestionClick={handleSuggestionClick} />
                ) : (
                    <div className="py-2">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, idx) => (
                                <MessageBubble key={msg.id} message={msg} isLatest={idx === messages.length - 1} />
                            ))}
                        </AnimatePresence>

                        {showPlanSelector && chatToPlan.hasPlans && (
                            <div className="px-3 py-2">
                                <ChatPlanSelector
                                    plans={chatToPlan.detectedPlans}
                                    isSaving={chatToPlan.isSaving}
                                    error={chatToPlan.error}
                                    onTogglePlan={chatToPlan.togglePlanSelection}
                                    onToggleItem={chatToPlan.toggleItemSelection}
                                    onUpdateItem={chatToPlan.updateItemText}
                                    onAddItem={chatToPlan.addItemToPlan}
                                    onRemoveItem={chatToPlan.removeItemFromPlan}
                                    onSave={handleSavePlans}
                                    onDismiss={handleDismissPlans}
                                    variant="mobile"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mx-3 mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area with Voice */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
                {showInlineStarters && (
                    <div className="mb-2">
                        <p className="text-[11px] text-stone-500 mb-1">个性化推荐问题</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {starterQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSuggestionClick(q)}
                                    className="shrink-0 px-3 py-1.5 text-[11px] rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-emerald-400 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex items-end gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
                    {/* Voice Button */}
                    {voiceSupported && (
                        <button
                            onClick={() => {
                                if (voiceListening) {
                                    void stopVoice();
                                } else {
                                    void startVoice();
                                }
                            }}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                voiceListening
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "text-stone-400 hover:text-emerald-600 hover:bg-stone-200 dark:hover:bg-stone-700"
                            )}
                        >
                            {voiceListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    )}

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={voiceListening ? "正在听..." : "输入消息..."}
                        rows={1}
                        className="flex-1 bg-transparent resize-none outline-none text-[14px] text-stone-800 dark:text-white placeholder-stone-400 px-2 py-2.5 leading-normal"
                        style={{ minHeight: '40px', maxHeight: '120px', lineHeight: '1.5' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            input.trim() && !isSending
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-stone-200 dark:bg-stone-700 text-stone-400"
                        )}
                    >
                        {isSending ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RefreshCw size={18} />
                            </motion.div>
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>

            {/* History Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <HistorySidebar
                        conversations={conversations}
                        currentId={currentConversationId}
                        onSelect={(id) => { switchConversation(id); setShowHistory(false); }}
                        onNew={() => { newConversation(); setShowHistory(false); }}
                        onDelete={deleteChat}
                        onClose={() => setShowHistory(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
