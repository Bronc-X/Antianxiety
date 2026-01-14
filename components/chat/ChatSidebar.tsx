'use client';

/**
 * ChatSidebar Component
 * 
 * Left sidebar showing conversation history with smart AI-generated titles.
 * Supports:
 * - Conversation switching
 * - New conversation creation
 * - Delete conversations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquarePlus,
    Trash2,
    MessageCircle,
    X,
    Clock,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/app/actions/chat';

interface ChatSidebarProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onNewConversation: () => Promise<void>;
    onSwitchConversation: (id: string) => void;
    onDeleteConversation: (id: string) => Promise<void>;
    isLoading?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}

export function ChatSidebar({
    conversations,
    currentConversationId,
    onNewConversation,
    onSwitchConversation,
    onDeleteConversation,
    isLoading = false,
    isOpen = true,
    onToggle,
}: ChatSidebarProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            await onDeleteConversation(id);
        } finally {
            setDeletingId(null);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    };

    // Mobile: show toggle button when closed
    // Desktop: always show sidebar
    const isMobileHidden = !isOpen;

    return (
        <>
            {/* Sidebar - always visible on desktop, toggleable on mobile */}
            <div className={cn(
                "flex flex-col h-full bg-black/40 backdrop-blur-xl",
                "w-64 md:w-72 border-r border-white/10",
                // Desktop: relative positioning (side by side). Mobile: fixed overlay
                "md:relative md:z-auto",
                "fixed left-0 top-0 z-40 transition-transform duration-200",
                // Mobile: slide in/out. Desktop: always visible (relative)
                isMobileHidden && "-translate-x-full",
                "md:translate-x-0"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6">
                            {/* Glow */}
                            <div className="absolute inset-[-50%] z-0 rounded-full bg-[#4ADE80] animate-pulse blur-md opacity-60" style={{ animationDuration: '3s' }} />
                            {/* Avatar */}
                            <div className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-sm">
                                <Image
                                    src="/max-avatar.png?v=2"
                                    alt="History"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover scale-[1.8]"
                                />
                            </div>
                        </div>
                        <span className="font-medium text-white/90">对话历史</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onNewConversation()}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="新对话"
                        >
                            <MessageSquarePlus className="w-5 h-5" />
                        </button>
                        {onToggle && (
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors md:hidden"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <MessageCircle className="w-12 h-12 text-white/20 mb-3" />
                            <p className="text-white/40 text-sm">还没有对话</p>
                            <p className="text-white/30 text-xs mt-1">点击上方按钮开始新对话</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {conversations.map((conv) => (
                                <motion.div
                                    key={conv.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onSwitchConversation(conv.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onSwitchConversation(conv.id);
                                            }
                                        }}
                                        className={cn(
                                            "w-full px-4 py-3 text-left group transition-all cursor-pointer",
                                            "hover:bg-white/5",
                                            currentConversationId === conv.id
                                                ? "bg-gradient-to-r from-teal-500/10 to-transparent border-l-2 border-teal-400"
                                                : "border-l-2 border-transparent"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate text-sm text-white">
                                                    {conv.title || '新对话'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-white/50" />
                                                    <span className="text-xs text-white/60">
                                                        {formatTime(conv.last_message_at)}
                                                    </span>
                                                    {conv.message_count > 0 && (
                                                        <span className="text-xs text-white/60">
                                                            · {conv.message_count}条
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, conv.id)}
                                                disabled={deletingId === conv.id}
                                                className={cn(
                                                    "p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                                    "hover:bg-red-500/20 text-white/40 hover:text-red-400",
                                                    deletingId === conv.id && "opacity-100"
                                                )}
                                            >
                                                {deletingId === conv.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => onNewConversation()}
                        className={cn(
                            "w-full py-2.5 px-4 rounded-lg font-medium text-sm",
                            "bg-gradient-to-r from-teal-500/20 to-emerald-500/20",
                            "text-teal-300 hover:text-teal-200",
                            "border border-teal-500/30 hover:border-teal-500/50",
                            "transition-all hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <MessageSquarePlus className="w-4 h-4" />
                            开始新对话
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}

export default ChatSidebar;
