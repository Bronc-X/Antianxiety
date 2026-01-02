"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Send,
    Brain,
    Plus,
    Activity,
    Copy,
    ThumbsUp,
    ThumbsDown,
    History,
    X,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import MaxAvatar from "@/components/max/MaxAvatar";
import { useMax } from "@/hooks/domain/useMax";

const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
};

export const ViewMax = () => {
    const {
        messages,
        conversations,
        isSending,
        sendMessage,
        switchConversation,
        newConversation,
        isLoading
    } = useMax();

    const [input, setInput] = useState("");
    const [language, setLanguage] = useState<'zh' | 'en'>('zh');
    const [showHistory, setShowHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isSending]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const success = await sendMessage(input, language);
        if (success) {
            setInput("");
        }
    };

    const handleNewChat = async () => {
        await newConversation();
        setShowHistory(false);
    }

    return (
        <motion.div
            initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
            className="flex flex-col h-full relative"
        >
            {/* Header (Floating) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-white/5 mb-2 sticky top-0 bg-[#F9F9F7]/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md z-10">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 transition-colors"
                >
                    <History size={18} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-emerald-950 dark:text-emerald-50">Max</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Beta</span>
                </div>

                <button
                    onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
                    className="p-2 -mr-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 transition-colors font-mono text-xs font-bold"
                >
                    {language.toUpperCase()}
                </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6" ref={scrollRef}>
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-60">
                        <MaxAvatar state="idle" size={80} className="mb-4 opacity-50 grayscale" />
                        <p>How can I help you today?</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse group" : "")}>

                        {/* Avatar */}
                        {msg.role === 'assistant' ? (
                            <MaxAvatar state={msg.isStreaming ? "thinking" : "idle"} size={32} className="mt-1 shadow-sm flex-shrink-0" />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 mt-1">
                                <img src="https://i.pravatar.cc/150?u=admin" alt="User" />
                            </div>
                        )}

                        {/* Content */}
                        <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                            {/* Message Bubble/Text */}
                            <div className={cn(
                                "text-[15px] leading-relaxed py-1.5 px-2 rounded-2xl whitespace-pre-wrap",
                                msg.role === 'user'
                                    ? "bg-stone-200/50 dark:bg-white/10 text-emerald-950 dark:text-slate-200 rounded-tr-md"
                                    : "text-emerald-950 dark:text-slate-200 rounded-tl-md"
                            )}>
                                {msg.content}
                                {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-emerald-500 animate-pulse" />}
                            </div>

                            {/* Actions */}
                            {msg.role === 'assistant' && !msg.isStreaming && (
                                <div className="flex gap-4 mt-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy size={14} className="text-stone-300 cursor-pointer hover:text-stone-500 transition-colors" />
                                    <RotateCcw size={14} className="text-stone-300 cursor-pointer hover:text-stone-500 transition-colors" />
                                    <div className="flex gap-2">
                                        <ThumbsUp size={14} className="text-stone-300 cursor-pointer hover:text-emerald-500 transition-colors" />
                                        <ThumbsDown size={14} className="text-stone-300 cursor-pointer hover:text-red-500 transition-colors" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isSending && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                            <Sparkles size={14} className="text-white animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1 h-8">
                            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            {/* Composer Area (Fixed Bottom) */}
            <div className="absolute bottom-[70px] left-0 right-0 p-4 bg-gradient-to-t from-[#F9F9F7] via-[#F9F9F7] to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A] pt-10">
                <div className={cn(
                    "relative bg-white dark:bg-[#1A1A1A] rounded-[24px] border border-stone-200 dark:border-white/10 p-2 flex items-end gap-2 group focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all",
                    input ? "shadow-lg shadow-emerald-500/10" : "shadow-xl shadow-stone-200/50 dark:shadow-black/50"
                )}>

                    <button
                        onClick={handleNewChat}
                        className="p-2.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 transition-colors"
                    >
                        <Plus size={20} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message Max..."
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-[15px] resize-none max-h-32 text-emerald-950 dark:text-white placeholder:text-stone-400 disabled:opacity-50"
                        style={{ minHeight: "24px" }}
                        disabled={isSending}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    {input ? (
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <Send size={18} className="translate-x-0.5" />
                        </button>
                    ) : (
                        <button className="p-2.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 transition-colors">
                            <Brain size={20} />
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-center text-stone-400 mt-2 font-medium">
                    Max can make mistakes. Consider checking important info.
                </p>
            </div>

            {/* History Overlay */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowHistory(false)}
                    >
                        <motion.div
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            className="absolute left-0 top-0 bottom-0 w-[80%] bg-[#F9F9F7] dark:bg-[#0A0A0A] shadow-2xl p-6 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-emerald-950 dark:text-emerald-50">History</h3>
                                <button onClick={() => setShowHistory(false)}>
                                    <X size={20} className="text-stone-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2">
                                <button
                                    onClick={handleNewChat}
                                    className="w-full p-3 rounded-xl bg-emerald-600 text-white flex items-center gap-3 mb-4 shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus size={20} />
                                    <span className="font-medium">New Chat</span>
                                </button>

                                {conversations.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => {
                                            switchConversation(chat.id);
                                            setShowHistory(false);
                                        }}
                                        className="p-3 rounded-xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageSquare size={16} className="text-stone-400 group-hover:text-emerald-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-emerald-950 dark:text-white truncate">
                                                    {chat.title || "New Conversation"}
                                                </p>
                                                <p className="text-xs text-stone-400">
                                                    {new Date(chat.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {conversations.length === 0 && (
                                    <p className="text-center text-stone-400 text-sm py-4">No history yet</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
