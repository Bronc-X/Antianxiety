"use client";

/**
 * ViewAiReminders - AI-Generated Smart Reminders
 * 
 * Mobile UI for viewing and managing AI reminders using useAiReminders hook.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    BellOff,
    Loader2,
    ChevronLeft,
    Sparkles,
    X,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiReminders, type AiReminder } from "@/hooks/domain/useAiReminders";

// ============================================
// Sub-Components
// ============================================

function ReminderCard({ reminder, onMarkRead, onDismiss }: {
    reminder: AiReminder;
    onMarkRead: (id: number) => void;
    onDismiss: (id: number) => void;
}) {
    const timeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cn(
                "relative bg-white dark:bg-white/5 rounded-2xl border overflow-hidden",
                reminder.read
                    ? "border-stone-200 dark:border-white/10"
                    : "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
            )}
        >
            {/* Unread indicator */}
            {!reminder.read && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}

            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl flex-shrink-0",
                        reminder.read
                            ? "bg-stone-100 dark:bg-white/10"
                            : "bg-emerald-100 dark:bg-emerald-900/30"
                    )}>
                        <Sparkles className={cn(
                            "w-5 h-5",
                            reminder.read ? "text-stone-500" : "text-emerald-600"
                        )} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-emerald-950 dark:text-emerald-50 text-sm">
                                {reminder.title || 'AI Insight'}
                            </span>
                        </div>

                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-2">
                            {reminder.message}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {timeAgo(reminder.created_at)}
                            </span>
                            {reminder.category && (
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400">
                                    {reminder.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-white/5">
                    {!reminder.read && (
                        <button
                            onClick={() => onMarkRead(reminder.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                            <CheckCircle2 size={14} />
                            Mark Read
                        </button>
                    )}
                    <button
                        onClick={() => onDismiss(reminder.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-200 dark:hover:bg-white/20 transition-colors"
                    >
                        <X size={14} />
                        Dismiss
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// Main Component
// ============================================

interface ViewAiRemindersProps {
    onBack?: () => void;
}

export const ViewAiReminders = ({ onBack }: ViewAiRemindersProps) => {
    const {
        reminders,
        isLoading,
        error,
        markRead,
        dismiss,
        load
    } = useAiReminders({ limit: 20 });

    const unreadCount = reminders.filter(r => !r.read).length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pb-32"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">
                            AI Reminders
                        </h1>
                        {unreadCount > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => load()}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Bell size={20} />
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Loading */}
            {isLoading && reminders.length === 0 && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && reminders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-white/10 flex items-center justify-center mb-4">
                        <BellOff className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-2">
                        No Reminders
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
                        AI-generated insights and reminders will appear here when available.
                    </p>
                </div>
            )}

            {/* Reminder List */}
            {reminders.length > 0 && (
                <div className="space-y-3">
                    <AnimatePresence>
                        {reminders.map((reminder) => (
                            <ReminderCard
                                key={reminder.id}
                                reminder={reminder}
                                onMarkRead={markRead}
                                onDismiss={dismiss}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};
