'use client';

/**
 * Desktop Plans Presentational Component (The Skin - Desktop)
 * 
 * Pure presentation component for desktop plans view.
 * Receives all data and callbacks via props from usePlans hook.
 */

import { useState } from 'react';
import {
    Plus, RefreshCw, Target, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UsePlansReturn, CreatePlanInput } from '@/hooks/domain/usePlans';
import PlanListWithActions from '@/components/PlanListWithActions';

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

// PlanCard component removed as we use PlanListWithActions now

// ============================================
// Main Component
// ============================================

export function DesktopPlans({ plans: hook }: DesktopPlansProps) {
    const [showCreate, setShowCreate] = useState(false);

    const {
        plans,
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

            {/* Plan List */}
            <PlanListWithActions
                plans={plans}
                onDelete={remove}
                onComplete={complete}
                onPause={pause}
                onResume={resume}
            />

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
