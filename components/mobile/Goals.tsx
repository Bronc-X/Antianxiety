'use client';

/**
 * Mobile Goals Presentational Component (The Skin - Mobile)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, RefreshCw, Target, Flag, WifiOff, AlertCircle } from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import { LoadingAnimation } from '@/components/lottie/LoadingAnimation';
import { Button } from '@/components/ui';
import type { UseGoalsReturn, CreateGoalInput } from '@/hooks/domain/useGoals';

interface MobileGoalsProps {
    goals: UseGoalsReturn;
}

const GOAL_CATEGORIES = [
    { id: 'sleep', label: 'Sleep', icon: '🌙', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'stress', label: 'Stress', icon: '🧘', color: 'bg-amber-100 text-amber-700' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'bg-green-100 text-green-700' },
    { id: 'exercise', label: 'Exercise', icon: '🏃', color: 'bg-blue-100 text-blue-700' },
    { id: 'mental', label: 'Mental', icon: '🧠', color: 'bg-purple-100 text-purple-700' },
    { id: 'habits', label: 'Habits', icon: '✨', color: 'bg-pink-100 text-pink-700' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
};

function MobileGoalItem({ goal, onToggle, onDelete, isSaving }: {
    goal: UseGoalsReturn['goals'][0];
    onToggle: () => void;
    onDelete: () => void;
    isSaving: boolean;
}) {
    const { impact, notification } = useHaptics();
    const categoryInfo = GOAL_CATEGORIES.find(c => c.id === goal.category) || GOAL_CATEGORIES[5];

    const handleToggle = async () => {
        if (goal.is_completed) {
            await impact(ImpactStyle.Light);
        } else {
            await notification('success');
        }
        onToggle();
    };

    const handleDelete = async () => {
        await impact(ImpactStyle.Medium);
        onDelete();
    };

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm ${goal.is_completed ? 'opacity-60' : ''
                }`}
        >
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggle}
                disabled={isSaving}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${goal.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
            >
                {goal.is_completed && <Check className="w-4 h-4 text-white" />}
            </motion.button>

            <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${goal.is_completed ? 'line-through text-gray-400' : ''}`}>
                    {goal.goal_text}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryInfo.color}`}>
                        {categoryInfo.icon}
                    </span>
                    <span className={`text-xs ${goal.priority === 'high' ? 'text-red-500' :
                            goal.priority === 'medium' ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                        <Flag className="w-3 h-3 inline" />
                    </span>
                </div>
            </div>

            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                disabled={isSaving}
                className="p-2"
            >
                <Trash2 className="w-5 h-5 text-gray-300" />
            </motion.button>
        </motion.div>
    );
}

function CreateGoalSheet({ isOpen, onClose, onSubmit, isSaving }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateGoalInput) => void;
    isSaving: boolean;
}) {
    const [goalText, setGoalText] = useState('');
    const [category, setCategory] = useState('habits');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const { impact } = useHaptics();

    const handleSubmit = async () => {
        if (!goalText.trim()) return;
        await impact(ImpactStyle.Medium);
        onSubmit({ goal_text: goalText, category, priority });
        setGoalText('');
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
                        className="fixed inset-0 bg-black/50 z-40"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 pb-10"
                    >
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                        <h2 className="text-lg font-semibold mb-4">Add Goal</h2>

                        <input
                            type="text"
                            value={goalText}
                            onChange={(e) => setGoalText(e.target.value)}
                            className="w-full px-4 py-3 border rounded-xl mb-4"
                            placeholder="What do you want to achieve?"
                        />

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Category</p>
                            <div className="flex flex-wrap gap-2">
                                {GOAL_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-3 py-1 rounded-full text-sm ${category === cat.id ? cat.color : 'bg-gray-100'
                                            }`}
                                    >
                                        {cat.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">Priority</p>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 rounded-lg text-sm capitalize ${priority === p
                                                ? p === 'high' ? 'bg-red-100 text-red-700'
                                                    : p === 'medium' ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-gray-200 text-gray-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button onClick={handleSubmit} disabled={isSaving || !goalText.trim()} className="w-full py-3">
                            {isSaving ? 'Adding...' : 'Add Goal'}
                        </Button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function MobileGoals({ goals: hook }: MobileGoalsProps) {
    const [showCreate, setShowCreate] = useState(false);

    const { activeGoals, completedGoals, isLoading, isSaving, isOffline, error, create, toggle, remove, refresh } = hook;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingAnimation size="lg" />
                <p className="text-gray-500 mt-4 text-sm">Loading goals...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
                <p className="text-gray-600 text-center mb-6">{error}</p>
                <Button variant="outline" onClick={refresh}>Try Again</Button>
            </div>
        );
    }

    const handleCreate = async (input: CreateGoalInput) => {
        const success = await create(input);
        if (success) setShowCreate(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2"
                    >
                        <WifiOff className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Offline mode</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Goals</h1>
                        <p className="text-xs text-gray-500">{activeGoals.length} active</p>
                    </div>
                    <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={refresh} className="p-2 bg-gray-100 rounded-lg">
                            <RefreshCw className={`h-5 w-5 text-gray-600 ${isSaving ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreate(true)}
                            className="p-2 bg-green-500 text-white rounded-lg"
                        >
                            <Plus className="h-5 w-5" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 space-y-4 pb-24">
                {activeGoals.length > 0 && (
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 mb-3">In Progress</h2>
                        <div className="space-y-2">
                            <AnimatePresence>
                                {activeGoals.map(goal => (
                                    <MobileGoalItem
                                        key={goal.id}
                                        goal={goal}
                                        onToggle={() => toggle(goal.id)}
                                        onDelete={() => remove(goal.id)}
                                        isSaving={isSaving}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {completedGoals.length > 0 && (
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 mb-3">Completed</h2>
                        <div className="space-y-2">
                            {completedGoals.map(goal => (
                                <MobileGoalItem
                                    key={goal.id}
                                    goal={goal}
                                    onToggle={() => toggle(goal.id)}
                                    onDelete={() => remove(goal.id)}
                                    isSaving={isSaving}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {activeGoals.length === 0 && completedGoals.length === 0 && (
                    <div className="text-center py-16">
                        <Target className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 mb-6">No goals yet</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreate(true)}
                            className="px-6 py-3 bg-green-500 text-white rounded-xl"
                        >
                            Add Your First Goal
                        </motion.button>
                    </div>
                )}
            </motion.div>

            <CreateGoalSheet isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} isSaving={isSaving} />
        </div>
    );
}

export default MobileGoals;
