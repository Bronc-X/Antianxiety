/**
 * ViewGoals - Goal Management
 * 
 * Allows users to view, add, and complete their goals.
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Plus,
    CheckCircle2,
    Circle,
    Trash2,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { useGoals } from '@/hooks/domain/useGoals';
import { CardGlass } from '@/components/mobile/HealthWidgets';

// ============================================
// Types
// ============================================

interface ViewGoalsProps {
    onBack?: () => void;
}

// ============================================
// Component
// ============================================

export const ViewGoals = ({ onBack }: ViewGoalsProps) => {
    const {
        activeGoals,
        completedGoals,
        isLoading,
        create,
        toggle,
        remove
    } = useGoals();

    const [newGoalText, setNewGoalText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;

        setIsAdding(true);
        const success = await create({
            goal_text: newGoalText,
            category: 'general'
        });

        if (success) {
            setNewGoalText('');
        }
        setIsAdding(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">My Goals</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Focus on what matters</p>
                </div>
            </div>

            {/* Add Goal Form */}
            <CardGlass className="p-4">
                <form onSubmit={handleAddGoal} className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            placeholder="Add a new goal..."
                            className="w-full h-10 px-4 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all border-none"
                        />
                        <div className="absolute right-3 top-2.5 text-stone-400">
                            <Target size={16} />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!newGoalText.trim() || isAdding}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    </button>
                </form>
            </CardGlass>

            {/* Active Goals */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 px-2 uppercase tracking-wider">
                    In Progress
                </h3>
                <AnimatePresence mode="popLayout">
                    {activeGoals.map((goal) => (
                        <motion.div
                            key={goal.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <CardGlass className="p-4 flex items-center gap-4 group">
                                <button
                                    onClick={() => toggle(goal.id)}
                                    className="text-stone-300 hover:text-emerald-500 transition-colors"
                                >
                                    <Circle size={24} strokeWidth={1.5} />
                                </button>
                                <div className="flex-1">
                                    <h4 className="font-medium text-emerald-950 dark:text-emerald-50 leading-snug">
                                        {goal.goal_text || "Untitled Goal"}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => remove(goal.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-rose-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </CardGlass>
                        </motion.div>
                    ))}
                    {activeGoals.length === 0 && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-stone-400 text-sm"
                        >
                            No active goals. Add one above!
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 px-2 uppercase tracking-wider">
                        Completed
                    </h3>
                    <div className="space-y-2 opacity-60">
                        {completedGoals.map((goal) => (
                            <motion.div
                                key={goal.id}
                                layout
                            >
                                <CardGlass className="p-3 flex items-center gap-4 bg-stone-50/50 dark:bg-white/5 border-transparent">
                                    <button
                                        onClick={() => toggle(goal.id)}
                                        className="text-emerald-500"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-stone-500 dark:text-stone-400 line-through text-sm">
                                            {goal.goal_text || "Untitled Goal"}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => remove(goal.id)}
                                        className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </CardGlass>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
