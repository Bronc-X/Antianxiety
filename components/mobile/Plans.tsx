'use client';

/**
 * Mobile Plans Presentational Component (The Skin - Mobile)
 * 
 * Pure presentation component for mobile plans view.
 * Receives all data and callbacks via props from usePlans hook.
 * 
 * Features:
 * - Framer Motion card animations
 * - Haptic feedback on interactions
 * - Swipe to complete/delete
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Check, Pause, Play, Trash2, RefreshCw,
    Target, Calendar, AlertCircle, WifiOff
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import { LoadingAnimation } from '@/components/lottie/LoadingAnimation';
import { Card, CardContent, Button } from '@/components/ui';
import type { UsePlansReturn, CreatePlanInput } from '@/hooks/domain/usePlans';

// ============================================
// Props Interface
// ============================================

interface MobilePlansProps {
    plans: UsePlansReturn;
}

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, x: -100, transition: { duration: 0.2 } },
};

// ============================================
// Offline Banner
// ============================================

function OfflineBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2"
        >
            <WifiOff className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">You&apos;re offline. Showing cached data.</span>
        </motion.div>
    );
}

// ============================================
// Loading State
// ============================================

function MobileLoadingState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <LoadingAnimation size="lg" />
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500 mt-4 text-sm"
            >
                Loading your plans...
            </motion.p>
        </div>
    );
}

// ============================================
// Error Display
// ============================================

function MobileErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
    const { impact } = useHaptics();

    const handleRetry = async () => {
        await impact(ImpactStyle.Light);
        onRetry();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] p-6"
        >
            <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
            <p className="text-gray-600 text-center mb-6 max-w-xs">{error}</p>
            <Button variant="outline" onClick={handleRetry} className="border-amber-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
            </Button>
        </motion.div>
    );
}

// ============================================
// Mobile Plan Card
// ============================================

interface MobilePlanCardProps {
    plan: UsePlansReturn['plans'][0];
    onComplete: () => void;
    onPause: () => void;
    onResume: () => void;
    onDelete: () => void;
    isSaving: boolean;
}

function MobilePlanCard({ plan, onComplete, onPause, onResume, onDelete, isSaving }: MobilePlanCardProps) {
    const { impact } = useHaptics();

    const statusColors = {
        active: 'bg-green-100 text-green-700',
        completed: 'bg-blue-100 text-blue-700',
        paused: 'bg-gray-100 text-gray-700',
    };

    const handleAction = async (action: () => void) => {
        await impact(ImpactStyle.Medium);
        action();
    };

    return (
        <motion.div variants={cardVariants} whileTap={{ scale: 0.98 }}>
            <Card className="overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[plan.status]}`}>
                            {plan.status}
                        </span>
                    </div>

                    {plan.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
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
                    <div className="h-1 bg-gray-100 rounded-full mb-3">
                        <motion.div
                            className="h-full bg-green-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${plan.progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2">
                        {plan.status === 'active' && (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(onComplete)}
                                    disabled={isSaving}
                                    className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                >
                                    <Check className="h-4 w-4" />
                                    Complete
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(onPause)}
                                    disabled={isSaving}
                                    className="p-2 bg-gray-100 rounded-lg"
                                >
                                    <Pause className="h-4 w-4 text-gray-600" />
                                </motion.button>
                            </>
                        )}
                        {plan.status === 'paused' && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAction(onResume)}
                                disabled={isSaving}
                                className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                            >
                                <Play className="h-4 w-4" />
                                Resume
                            </motion.button>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction(onDelete)}
                            disabled={isSaving}
                            className="p-2 bg-red-50 rounded-lg"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </motion.button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ============================================
// Create Plan Sheet
// ============================================

function CreatePlanSheet({
    isOpen,
    onClose,
    onSubmit,
    isSaving
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreatePlanInput) => void;
    isSaving: boolean;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const { impact } = useHaptics();

    const handleSubmit = async () => {
        if (!name.trim()) return;
        await impact(ImpactStyle.Medium);
        onSubmit({ name, description, category });
        setName('');
        setDescription('');
        setCategory('general');
    };

    const categories = [
        { id: 'sleep', label: '🌙 Sleep' },
        { id: 'stress', label: '🧘 Stress' },
        { id: 'nutrition', label: '🥗 Nutrition' },
        { id: 'exercise', label: '🏃 Exercise' },
        { id: 'general', label: '✨ General' },
    ];

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
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 pb-8"
                    >
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                        <h2 className="text-lg font-semibold mb-4">Create New Plan</h2>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
                                placeholder="Plan name..."
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
                                rows={2}
                                placeholder="Description (optional)"
                            />
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm ${category === cat.id
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving || !name.trim()}
                                className="w-full py-3"
                            >
                                {isSaving ? 'Creating...' : 'Create Plan'}
                            </Button>
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

export function MobilePlans({ plans: hook }: MobilePlansProps) {
    const [showCreate, setShowCreate] = useState(false);
    const { impact } = useHaptics();

    const {
        activePlans,
        completedPlans,
        isLoading,
        isSaving,
        isOffline,
        error,
        create,
        complete,
        pause,
        resume,
        remove,
        refresh
    } = hook;

    if (isLoading) {
        return <MobileLoadingState />;
    }

    if (error) {
        return <MobileErrorDisplay error={error} onRetry={refresh} />;
    }

    const handleCreate = async (input: CreatePlanInput) => {
        const success = await create(input);
        if (success) {
            setShowCreate(false);
        }
    };

    const handleRefresh = async () => {
        await impact(ImpactStyle.Light);
        refresh();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && <OfflineBanner />}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b px-4 py-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Health Plans</h1>
                        <p className="text-xs text-gray-500">
                            {activePlans.length} active · {completedPlans.length} completed
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            className="p-2 bg-gray-100 rounded-lg"
                        >
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
            </motion.div>

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-6 pb-24"
            >
                {/* Active Plans */}
                {activePlans.length > 0 && (
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 mb-3">Active</h2>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {activePlans.map(plan => (
                                    <MobilePlanCard
                                        key={plan.id}
                                        plan={plan}
                                        onComplete={() => complete(plan.id)}
                                        onPause={() => pause(plan.id)}
                                        onResume={() => resume(plan.id)}
                                        onDelete={() => remove(plan.id)}
                                        isSaving={isSaving}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Completed Plans */}
                {completedPlans.length > 0 && (
                    <section>
                        <h2 className="text-sm font-medium text-gray-500 mb-3">Completed</h2>
                        <div className="space-y-3">
                            {completedPlans.map(plan => (
                                <MobilePlanCard
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Target className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 mb-6">No plans yet</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreate(true)}
                            className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium"
                        >
                            Create Your First Plan
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>

            {/* Create Sheet */}
            <CreatePlanSheet
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={handleCreate}
                isSaving={isSaving}
            />
        </div>
    );
}

export default MobilePlans;
