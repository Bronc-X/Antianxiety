"use client";

/**
 * ViewHabits - Habit Tracking Interface
 * 
 * Mobile UI for habit management using useHabits hook.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Check,
    Loader2,
    Sparkles,
    ChevronLeft,
    Target,
    Calendar,
    Flame,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabits, type HabitData, type HabitCreateInput } from "@/hooks/domain/useHabits";

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
};

// ============================================
// Sub-Components
// ============================================

function HabitCard({ habit, onComplete, isSaving }: {
    habit: HabitData;
    onComplete: (habitId: number, score: number) => void;
    isSaving: boolean;
}) {
    const [showScoreSelector, setShowScoreSelector] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 overflow-hidden"
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-1">
                            {habit.name}
                        </h3>
                        {habit.description && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                                {habit.description}
                            </p>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowScoreSelector(!showScoreSelector)}
                        disabled={isSaving}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            habit.belief_score && habit.belief_score > 0
                                ? "bg-emerald-500 text-white"
                                : "bg-stone-100 dark:bg-white/10 text-stone-400"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : habit.belief_score && habit.belief_score > 0 ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Plus className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                    {habit.streak && habit.streak > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <Flame size={14} />
                            <span className="font-medium">{habit.streak} day streak</span>
                        </div>
                    )}
                    {habit.belief_score && habit.belief_score > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <Target size={14} />
                            <span className="font-medium">Score: {habit.belief_score}/10</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Score Selector */}
            <AnimatePresence>
                {showScoreSelector && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/5"
                    >
                        <div className="p-4">
                            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                                How well did you follow this habit today?
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                    <button
                                        key={score}
                                        onClick={() => {
                                            onComplete(habit.id, score);
                                            setShowScoreSelector(false);
                                        }}
                                        disabled={isSaving}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                                            "bg-white dark:bg-white/10 border border-stone-200 dark:border-white/10",
                                            "hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
                                            isSaving && "opacity-50"
                                        )}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function AddHabitSheet({ isOpen, onClose, onCreate, isSaving }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (input: HabitCreateInput) => Promise<boolean>;
    isSaving: boolean;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async () => {
        if (!name.trim()) return;
        const success = await onCreate({
            name: name.trim(),
            description: description.trim() || undefined,
            category: "general",
            frequency: "daily"
        });
        if (success) {
            setName("");
            setDescription("");
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] rounded-t-3xl z-50 p-6 pb-10"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
                                New Habit
                            </h3>
                            <button onClick={onClose} className="p-2 -mr-2">
                                <X size={20} className="text-stone-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5 block">
                                    Habit Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Morning meditation"
                                    className="w-full px-4 py-3 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-emerald-950 dark:text-white placeholder:text-stone-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5 block">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Why is this habit important to you?"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-emerald-950 dark:text-white placeholder:text-stone-400 resize-none"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={!name.trim() || isSaving}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Create Habit
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================
// Main Component
// ============================================

interface ViewHabitsProps {
    onBack?: () => void;
}

export const ViewHabits = ({ onBack }: ViewHabitsProps) => {
    const {
        habits,
        isLoading,
        isSaving,
        error,
        create,
        complete,
        clearError
    } = useHabits();

    const [showAddSheet, setShowAddSheet] = useState(false);

    const todayCompleted = habits.filter(h => h.belief_score && h.belief_score > 0).length;
    const totalHabits = habits.length;

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
                        <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">Habits</h1>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            {todayCompleted}/{totalHabits} completed today
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddSheet(true)}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Progress Ring */}
            {totalHabits > 0 && (
                <div className="flex justify-center mb-8">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-stone-200 dark:text-white/10"
                            />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                                className="text-emerald-500"
                                initial={{ strokeDasharray: "0 283" }}
                                animate={{ strokeDasharray: `${(todayCompleted / totalHabits) * 283} 283` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">
                                {Math.round((todayCompleted / totalHabits) * 100)}%
                            </span>
                            <span className="text-xs text-stone-500">complete</span>
                        </div>
                    </div>
                </div>
            )}

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
            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && habits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-2">
                        No habits yet
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mb-6">
                        Start building positive habits to improve your mental well-being.
                    </p>
                    <button
                        onClick={() => setShowAddSheet(true)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium"
                    >
                        Create Your First Habit
                    </button>
                </div>
            )}

            {/* Habit List */}
            {!isLoading && habits.length > 0 && (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onComplete={complete}
                            isSaving={isSaving}
                        />
                    ))}
                </div>
            )}

            {/* Add Habit Sheet */}
            <AddHabitSheet
                isOpen={showAddSheet}
                onClose={() => setShowAddSheet(false)}
                onCreate={create}
                isSaving={isSaving}
            />
        </motion.div>
    );
};
