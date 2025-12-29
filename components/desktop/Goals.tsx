'use client';

/**
 * Desktop Goals Presentational Component (The Skin - Desktop)
 */

import { useState } from 'react';
import {
    Plus, Check, Trash2, RefreshCw, Target, Calendar,
    AlertCircle, Flag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseGoalsReturn, CreateGoalInput } from '@/hooks/domain/useGoals';

interface DesktopGoalsProps {
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

function GoalsSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        </div>
    );
}

function CreateGoalForm({ onSubmit, onCancel, isSaving }: {
    onSubmit: (input: CreateGoalInput) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [goalText, setGoalText] = useState('');
    const [category, setCategory] = useState('habits');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalText.trim()) return;
        onSubmit({ goal_text: goalText, category, priority });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                <input
                    type="text"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Sleep 8 hours every night"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {GOAL_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${category === cat.id ? cat.color + ' ring-2 ring-offset-1' : 'bg-gray-100'
                                }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`px-4 py-2 rounded-lg text-sm capitalize ${priority === p
                                    ? p === 'high' ? 'bg-red-100 text-red-700'
                                        : p === 'medium' ? 'bg-amber-100 text-amber-700'
                                            : 'bg-gray-100 text-gray-700'
                                    : 'bg-gray-50 text-gray-500'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !goalText.trim()} className="flex-1">
                    {isSaving ? 'Adding...' : 'Add Goal'}
                </Button>
            </div>
        </form>
    );
}

function GoalItem({
    goal,
    onToggle,
    onDelete,
    isSaving
}: {
    goal: UseGoalsReturn['goals'][0];
    onToggle: () => void;
    onDelete: () => void;
    isSaving: boolean;
}) {
    const categoryInfo = GOAL_CATEGORIES.find(c => c.id === goal.category) || GOAL_CATEGORIES[5];

    const priorityColors = {
        high: 'text-red-500',
        medium: 'text-amber-500',
        low: 'text-gray-400',
    };

    return (
        <div className={`flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow ${goal.is_completed ? 'opacity-60' : ''
            }`}>
            <button
                onClick={onToggle}
                disabled={isSaving}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${goal.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
            >
                {goal.is_completed && <Check className="w-4 h-4" />}
            </button>

            <div className="flex-1">
                <p className={`font-medium ${goal.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {goal.goal_text}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${categoryInfo.color}`}>
                        {categoryInfo.icon} {categoryInfo.label}
                    </span>
                    <span className={`flex items-center gap-1 ${priorityColors[goal.priority]}`}>
                        <Flag className="w-3 h-3" />
                        {goal.priority}
                    </span>
                </div>
            </div>

            <button
                onClick={onDelete}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export function DesktopGoals({ goals: hook }: DesktopGoalsProps) {
    const [showCreate, setShowCreate] = useState(false);

    const { activeGoals, completedGoals, isLoading, isSaving, error, create, toggle, remove, refresh } = hook;

    if (isLoading) return <GoalsSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <p className="text-amber-800 mb-4">{error}</p>
                <Button variant="outline" onClick={refresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    const handleCreate = async (input: CreateGoalInput) => {
        const success = await create(input);
        if (success) setShowCreate(false);
    };

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Health Goals</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeGoals.length} active · {completedGoals.length} completed
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refresh} disabled={isSaving}>
                        <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                    </Button>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreateGoalForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} isSaving={isSaving} />
                    </CardContent>
                </Card>
            )}

            {/* Active Goals */}
            {activeGoals.length > 0 && (
                <section>
                    <h2 className="text-sm font-medium text-gray-500 mb-3">In Progress</h2>
                    <div className="space-y-2">
                        {activeGoals.map(goal => (
                            <GoalItem
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

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <section>
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Completed</h2>
                    <div className="space-y-2">
                        {completedGoals.map(goal => (
                            <GoalItem
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

            {/* Empty State */}
            {activeGoals.length === 0 && completedGoals.length === 0 && (
                <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No goals yet. Start by adding your first goal!</p>
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Goal
                    </Button>
                </div>
            )}
        </div>
    );
}

export default DesktopGoals;
