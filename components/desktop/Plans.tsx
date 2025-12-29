'use client';

/**
 * Desktop Plans Presentational Component (The Skin - Desktop)
 * 
 * Pure presentation component for desktop plans view.
 * Receives all data and callbacks via props from usePlans hook.
 */

import { useState } from 'react';
import {
    Plus, Check, Pause, Play, Trash2, RefreshCw,
    Target, Calendar, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UsePlansReturn, CreatePlanInput } from '@/hooks/domain/usePlans';

// ============================================
// Props Interface
// ============================================

interface DesktopPlansProps {
    plans: UsePlansReturn;
}

// ============================================
// Loading Skeleton
// ============================================

function PlansSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ============================================
// Error Display
// ============================================

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
            <Card className="max-w-md w-full bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-amber-800 mb-4">{error}</p>
                    <Button variant="outline" onClick={onRetry} className="border-amber-300">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================
// Create Plan Modal
// ============================================

function CreatePlanForm({
    onSubmit,
    onCancel,
    isSaving
}: {
    onSubmit: (input: CreatePlanInput) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, description, category });
    };

    const categories = [
        { id: 'sleep', label: 'Sleep' },
        { id: 'stress', label: 'Stress' },
        { id: 'nutrition', label: 'Nutrition' },
        { id: 'exercise', label: 'Exercise' },
        { id: 'general', label: 'General' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Improve Sleep Quality"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="What do you want to achieve?"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !name.trim()} className="flex-1">
                    {isSaving ? 'Creating...' : 'Create Plan'}
                </Button>
            </div>
        </form>
    );
}

// ============================================
// Plan Card
// ============================================

interface PlanCardProps {
    plan: UsePlansReturn['plans'][0];
    onComplete: () => void;
    onPause: () => void;
    onResume: () => void;
    onDelete: () => void;
    isSaving: boolean;
}

function PlanCard({ plan, onComplete, onPause, onResume, onDelete, isSaving }: PlanCardProps) {
    const statusColors = {
        active: 'bg-green-100 text-green-700',
        completed: 'bg-blue-100 text-blue-700',
        paused: 'bg-gray-100 text-gray-700',
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium">{plan.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[plan.status]}`}>
                        {plan.status}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {plan.description && (
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {plan.category}
                    </span>
                    {plan.target_date && (
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(plan.target_date).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-3">
                    <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {plan.status === 'active' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onComplete}
                                disabled={isSaving}
                                className="flex-1"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onPause}
                                disabled={isSaving}
                            >
                                <Pause className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                    {plan.status === 'paused' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onResume}
                            disabled={isSaving}
                            className="flex-1"
                        >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDelete}
                        disabled={isSaving}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// Main Component
// ============================================

export function DesktopPlans({ plans: hook }: DesktopPlansProps) {
    const [showCreate, setShowCreate] = useState(false);

    const {
        activePlans,
        completedPlans,
        isLoading,
        isSaving,
        error,
        create,
        complete,
        pause,
        resume,
        remove,
        refresh
    } = hook;

    if (isLoading) {
        return <PlansSkeleton />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={refresh} />;
    }

    const handleCreate = async (input: CreatePlanInput) => {
        const success = await create(input);
        if (success) {
            setShowCreate(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Health Plans</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activePlans.length} active · {completedPlans.length} completed
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refresh} disabled={isSaving}>
                        <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Plan
                    </Button>
                </div>
            </div>

            {/* Create Form Modal */}
            {showCreate && (
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>Create New Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreatePlanForm
                            onSubmit={handleCreate}
                            onCancel={() => setShowCreate(false)}
                            isSaving={isSaving}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Active Plans */}
            {activePlans.length > 0 && (
                <section>
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Active Plans</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activePlans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onComplete={() => complete(plan.id)}
                                onPause={() => pause(plan.id)}
                                onResume={() => resume(plan.id)}
                                onDelete={() => remove(plan.id)}
                                isSaving={isSaving}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Completed Plans */}
            {completedPlans.length > 0 && (
                <section>
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Completed</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedPlans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onComplete={() => complete(plan.id)}
                                onPause={() => pause(plan.id)}
                                onResume={() => resume(plan.id)}
                                onDelete={() => remove(plan.id)}
                                isSaving={isSaving}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {activePlans.length === 0 && completedPlans.length === 0 && (
                <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No plans yet</p>
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Plan
                    </Button>
                </div>
            )}
        </div>
    );
}

export default DesktopPlans;
