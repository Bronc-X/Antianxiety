'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Target,
    Plus,
    Check,
    Trash2,
    Sparkles,
    Calendar,
    Clock
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PhaseGoal {
    id: string;
    goal_text: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    target_date?: string;
    progress: number;
    is_completed: boolean;
    created_at: string;
}

const GOAL_CATEGORIES = [
    { id: 'sleep', labelZh: '睡眠', labelEn: 'Sleep', icon: '🌙', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'stress', labelZh: '压力管理', labelEn: 'Stress', icon: '🧘', color: 'bg-amber-100 text-amber-700' },
    { id: 'fitness', labelZh: '运动健身', labelEn: 'Fitness', icon: '💪', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'nutrition', labelZh: '营养饮食', labelEn: 'Nutrition', icon: '🥗', color: 'bg-green-100 text-green-700' },
    { id: 'mental', labelZh: '心理健康', labelEn: 'Mental', icon: '🧠', color: 'bg-purple-100 text-purple-700' },
    { id: 'habits', labelZh: '习惯养成', labelEn: 'Habits', icon: '✨', color: 'bg-pink-100 text-pink-700' },
];

export default function GoalsPage() {
    const router = useRouter();
    const { language } = useI18n();
    const isZh = language !== 'en';
    const supabase = createClientComponentClient();

    const [userId, setUserId] = useState<string | null>(null);
    const [goals, setGoals] = useState<PhaseGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGoal, setNewGoal] = useState({ text: '', category: 'habits', priority: 'medium' as const });

    const loadGoals = useCallback(async () => {
        if (!userId) return;

        const { data } = await supabase
            .from('phase_goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) {
            setGoals(data);
        }
    }, [userId, supabase]);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
            setLoading(false);
        }
        init();
    }, [supabase]);

    useEffect(() => {
        if (userId) {
            loadGoals();
        }
    }, [userId, loadGoals]);

    const [saving, setSaving] = useState(false);

    const handleAddGoal = async () => {
        if (!userId) {
            alert(isZh ? '请先登录' : 'Please login first');
            return;
        }
        if (!newGoal.text.trim()) {
            alert(isZh ? '请输入目标描述' : 'Please enter goal description');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('phase_goals')
                .insert({
                    user_id: userId,
                    goal_text: newGoal.text.trim(),
                    category: newGoal.category,
                    priority: newGoal.priority,
                    progress: 0,
                    is_completed: false,
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding goal:', error);
                alert(isZh ? `添加失败: ${error.message}` : `Failed to add: ${error.message}`);
                return;
            }

            if (data) {
                setGoals([data, ...goals]);
                setNewGoal({ text: '', category: 'habits', priority: 'medium' });
                setShowAddModal(false);

                // Trigger profile sync
                fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => { });
            }
        } catch (e) {
            console.error('Exception adding goal:', e);
            alert(isZh ? '添加失败，请重试' : 'Failed to add, please try again');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleComplete = async (goal: PhaseGoal) => {
        const { error } = await supabase
            .from('phase_goals')
            .update({ is_completed: !goal.is_completed, progress: goal.is_completed ? goal.progress : 100 })
            .eq('id', goal.id);

        if (!error) {
            setGoals(goals.map(g =>
                g.id === goal.id
                    ? { ...g, is_completed: !g.is_completed, progress: g.is_completed ? g.progress : 100 }
                    : g
            ));
            fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => { });
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        const { error } = await supabase
            .from('phase_goals')
            .delete()
            .eq('id', goalId);

        if (!error) {
            setGoals(goals.filter(g => g.id !== goalId));
            fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => { });
        }
    };

    const getCategoryInfo = (categoryId: string) => {
        return GOAL_CATEGORIES.find(c => c.id === categoryId) || GOAL_CATEGORIES[0];
    };

    const activeGoals = goals.filter(g => !g.is_completed);
    const completedGoals = goals.filter(g => g.is_completed);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#FEFCF8] to-[#F8F4ED] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FEFCF8] to-[#F8F4ED]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FEFCF8]/80 backdrop-blur-lg border-b border-[#E7E1D6]/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl hover:bg-[#E7E1D6]/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeft className="w-5 h-5 text-[#0B3D2E]" />
                        </motion.button>
                        <div>
                            <h1 className="font-bold text-xl text-[#0B3D2E]">
                                {isZh ? '阶段性计划' : 'Phase Goals'}
                            </h1>
                            <p className="text-xs text-[#0B3D2E]/60">
                                {isZh ? '设定你的短期健康目标' : 'Set your short-term health goals'}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0a3629] transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">{isZh ? '添加目标' : 'Add Goal'}</span>
                    </motion.button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
                {/* Active Goals */}
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {isZh ? '进行中的目标' : 'Active Goals'} ({activeGoals.length})
                    </h2>

                    {activeGoals.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-[#E7E1D6] p-8 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0B3D2E] mb-2">
                                {isZh ? '开始设定你的目标' : 'Start Setting Your Goals'}
                            </h3>
                            <p className="text-sm text-[#0B3D2E]/60 mb-4">
                                {isZh
                                    ? '设定具体可衡量的短期目标，AI 将根据你的目标推荐个性化内容'
                                    : 'Set specific, measurable short-term goals. AI will recommend personalized content based on your goals.'}
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0a3629] transition-colors"
                            >
                                {isZh ? '添加第一个目标' : 'Add First Goal'}
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {activeGoals.map((goal, index) => {
                                    const category = getCategoryInfo(goal.category);
                                    return (
                                        <motion.div
                                            key={goal.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-2xl border border-[#E7E1D6] p-4 group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => handleToggleComplete(goal)}
                                                    className="mt-1 w-6 h-6 rounded-full border-2 border-[#0B3D2E]/30 hover:border-emerald-500 transition-colors flex items-center justify-center"
                                                >
                                                    <Check className="w-4 h-4 text-transparent group-hover:text-emerald-500/50" />
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${category.color}`}>
                                                            {category.icon} {isZh ? category.labelZh : category.labelEn}
                                                        </span>
                                                        {goal.priority === 'high' && (
                                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                                                {isZh ? '高优先级' : 'High'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-[#0B3D2E]">{goal.goal_text}</p>
                                                    {goal.target_date && (
                                                        <p className="text-xs text-[#0B3D2E]/50 mt-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(goal.target_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </section>

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50 mb-4 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {isZh ? '已完成' : 'Completed'} ({completedGoals.length})
                        </h2>
                        <div className="space-y-2">
                            {completedGoals.map((goal) => {
                                const category = getCategoryInfo(goal.category);
                                return (
                                    <div
                                        key={goal.id}
                                        className="bg-white/50 rounded-xl border border-[#E7E1D6]/50 p-3 flex items-center gap-3 opacity-60"
                                    >
                                        <button
                                            onClick={() => handleToggleComplete(goal)}
                                            className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                                        >
                                            <Check className="w-3 h-3 text-white" />
                                        </button>
                                        <span className="flex-1 text-sm text-[#0B3D2E] line-through">{goal.goal_text}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${category.color}`}>
                                            {category.icon}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-[#0B3D2E] mb-4">
                                {isZh ? '添加新目标' : 'Add New Goal'}
                            </h3>

                            <div className="space-y-4">
                                {/* Goal Text */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50 mb-2 block">
                                        {isZh ? '目标描述' : 'Goal Description'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newGoal.text}
                                        onChange={e => setNewGoal({ ...newGoal, text: e.target.value })}
                                        placeholder={isZh ? '例如：每天睡7小时以上' : 'e.g. Sleep 7+ hours daily'}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E7E1D6] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50 mb-2 block">
                                        {isZh ? '类别' : 'Category'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {GOAL_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setNewGoal({ ...newGoal, category: cat.id })}
                                                className={`px-3 py-1.5 text-sm rounded-full transition-all ${newGoal.category === cat.id
                                                    ? 'bg-[#0B3D2E] text-white'
                                                    : 'bg-[#F3F4F6] text-[#0B3D2E] hover:bg-[#E5E7EB]'
                                                    }`}
                                            >
                                                {cat.icon} {isZh ? cat.labelZh : cat.labelEn}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50 mb-2 block">
                                        {isZh ? '优先级' : 'Priority'}
                                    </label>
                                    <div className="flex gap-2">
                                        {(['high', 'medium', 'low'] as const).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewGoal({ ...newGoal, priority: p })}
                                                className={`flex-1 py-2 text-sm rounded-xl transition-all ${newGoal.priority === p
                                                    ? p === 'high' ? 'bg-red-500 text-white'
                                                        : p === 'medium' ? 'bg-amber-500 text-white'
                                                            : 'bg-gray-400 text-white'
                                                    : 'bg-[#F3F4F6] text-[#0B3D2E]'
                                                    }`}
                                            >
                                                {isZh
                                                    ? (p === 'high' ? '高' : p === 'medium' ? '中' : '低')
                                                    : p.charAt(0).toUpperCase() + p.slice(1)
                                                }
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 border border-[#E7E1D6] rounded-xl text-[#0B3D2E] font-medium hover:bg-[#F3F4F6] transition-colors"
                                >
                                    {isZh ? '取消' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleAddGoal}
                                    disabled={!newGoal.text.trim() || saving}
                                    className="flex-1 py-3 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0a3629] transition-colors disabled:opacity-50"
                                >
                                    {saving ? (isZh ? '添加中...' : 'Adding...') : (isZh ? '添加' : 'Add')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
