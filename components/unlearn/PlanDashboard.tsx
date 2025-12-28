'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    Target, CheckCircle, Circle, ChevronRight,
    Plus, Loader2, Sparkles, Calendar, X
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PlanItem {
    id: string;
    text: string;
    completed: boolean;
}

interface Plan {
    id: string;
    title: string;
    plan_type: string;
    status: 'active' | 'completed' | 'paused';
    difficulty: 'easy' | 'medium' | 'hard';
    expected_duration_days: number;
    progress: number;
    items: PlanItem[];
    description?: string;
    created_at: string;
}

export default function PlanDashboard() {
    const { language } = useI18n();
    const { toast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [showNewPlan, setShowNewPlan] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [suggestedPlan, setSuggestedPlan] = useState<{
        title: string;
        description: string;
        items: string[];
    } | null>(null);
    const [planDraft, setPlanDraft] = useState({
        title: '',
        description: '',
        items: [''],
    });

    useEffect(() => {
        fetchPlans();
    }, [language]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPlans();
        }, 60000);

        const handleFocus = () => fetchPlans();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [language]);

    const normalizeDifficulty = (value: unknown): Plan['difficulty'] => {
        if (typeof value === 'number') {
            if (value <= 2) return 'easy';
            if (value <= 4) return 'medium';
            return 'hard';
        }
        if (typeof value === 'string') {
            if (value === 'easy' || value === 'medium' || value === 'hard') return value;
            const stars = value.match(/[⭐★]/g)?.length || 0;
            if (stars) {
                if (stars <= 2) return 'easy';
                if (stars <= 4) return 'medium';
                return 'hard';
            }
        }
        return 'medium';
    };

    const normalizePlan = (plan: any): Plan => {
        const rawContent = typeof plan.content === 'string'
            ? (() => {
                try {
                    return JSON.parse(plan.content);
                } catch {
                    return { description: plan.content };
                }
            })()
            : plan.content || {};

        const rawItems = Array.isArray(rawContent.items)
            ? rawContent.items
            : Array.isArray(rawContent.actions)
                ? rawContent.actions
                : [];
        const items = rawItems.map((item: any, index: number) => ({
            id: item.id?.toString() || `${plan.id}-${index}`,
            text: item.text || item.title || String(item),
            completed: item.completed === true || item.status === 'completed',
        }));

        const completedCount = items.filter(item => item.completed).length;
        const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

        return {
            id: plan.id,
            title: plan.title || (language === 'en' ? 'Health Plan' : '健康方案'),
            plan_type: plan.plan_type || 'comprehensive',
            status: plan.status || 'active',
            difficulty: normalizeDifficulty(plan.difficulty),
            expected_duration_days: plan.expected_duration_days || 14,
            progress,
            items,
            description: rawContent.description || rawContent.summary || '',
            created_at: plan.created_at || new Date().toISOString(),
        };
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            setIsUnauthorized(false);
            const res = await fetch('/api/plans/list?status=active');
            if (res.status === 401) {
                setPlans([]);
                setIsUnauthorized(true);
                return;
            }
            if (!res.ok) {
                throw new Error('Failed to fetch plans');
            }
            const data = await res.json();

            if (data.success && data.data?.plans && data.data.plans.length > 0) {
                setPlans(data.data.plans.map(normalizePlan));
            } else {
                // No plans yet - show empty state or prompt to create
                setPlans([]);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            setErrorMessage(language === 'en' ? 'Unable to load plans right now.' : '暂时无法加载计划。');
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = async (planId: string, itemId: string) => {
        setUpdating(itemId);
        let updatedPlan: Plan | null = null;

        // Optimistic update
        setPlans(prev => prev.map(plan => {
            if (plan.id === planId) {
                const newItems = plan.items.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                );
                const completedCount = newItems.filter(i => i.completed).length;
                updatedPlan = {
                    ...plan,
                    items: newItems,
                    progress: Math.round((completedCount / newItems.length) * 100),
                };
                return updatedPlan;
            }
            return plan;
        }));

        try {
            if (updatedPlan) {
                const completedItems = updatedPlan.items.map(item => ({
                    id: item.id,
                    completed: item.completed,
                }));
                const allCompleted = updatedPlan.items.every(item => item.completed);
                const anyCompleted = updatedPlan.items.some(item => item.completed);
                const status = allCompleted ? 'completed' : anyCompleted ? 'partial' : 'skipped';

                await fetch('/api/plans/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId,
                        status,
                        completedItems,
                    }),
                });
                fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
                fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => {});
            }
        } catch (error) {
            console.error('Failed to update item:', error);
            toast({
                message: language === 'en' ? 'Failed to update plan item.' : '更新计划失败，请稍后重试。',
                type: 'error',
            });
        } finally {
            setUpdating(null);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-emerald-500 bg-emerald-500/10';
            case 'medium': return 'text-[#D4AF37] bg-[#D4AF37]/10';
            case 'hard': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        const labels: Record<string, Record<string, string>> = {
            easy: { en: 'Easy', zh: '简单' },
            medium: { en: 'Medium', zh: '中等' },
            hard: { en: 'Hard', zh: '困难' },
        };
        return labels[difficulty]?.[language] || difficulty;
    };

    const loadSuggestion = async () => {
        setSuggestionLoading(true);
        setSuggestionError(null);
        setSuggestedPlan(null);
        try {
            const res = await fetch('/api/user/generate-plan', { method: 'POST' });
            if (res.status === 401) {
                setSuggestionError(language === 'en' ? 'Please sign in to generate a plan.' : '请先登录后生成计划。');
                return;
            }
            const data = await res.json();
            if (!res.ok || !data?.plan) {
                setSuggestionError(data?.error || (language === 'en' ? 'Unable to generate a plan yet.' : '暂时无法生成计划。'));
                return;
            }
            setSuggestedPlan({
                title: data.plan.title,
                description: data.plan.description,
                items: Array.isArray(data.plan.items)
                    ? data.plan.items.map((item: any) => item.action || item.title || '').filter(Boolean)
                    : [],
            });
        } catch (error) {
            console.error('Failed to generate plan:', error);
            setSuggestionError(language === 'en' ? 'Unable to generate a plan yet.' : '暂时无法生成计划。');
        } finally {
            setSuggestionLoading(false);
        }
    };

    const createPlan = async (input: { title: string; description: string; items: string[] }) => {
        const sanitizedItems = input.items.map(item => item.trim()).filter(Boolean);
        if (!input.title.trim() || sanitizedItems.length === 0) {
            return;
        }

        setCreatingPlan(true);
        toast({
            message: language === 'en' ? 'Creating plan...' : '正在创建计划...',
            type: 'info',
            duration: 2000,
        });
        try {
            const payload = {
                plans: [
                    {
                        title: input.title.trim(),
                        content: input.description.trim() || sanitizedItems.join('\n'),
                        items: sanitizedItems.map(text => ({ text })),
                    },
                ],
            };
            const res = await fetch('/api/plans/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Failed to create plan');
            }

            await fetchPlans();
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
            fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => {});
            setPlanDraft({ title: '', description: '', items: [''] });
            setShowNewPlan(false);
            setShowSuggestion(false);
            toast({
                message: language === 'en' ? 'Plan created successfully.' : '计划已创建。',
                type: 'success',
            });
        } catch (error) {
            console.error('Failed to create plan:', error);
            toast({
                message: language === 'en' ? 'Failed to create plan. Please try again.' : '创建计划失败，请稍后重试。',
                type: 'error',
            });
        } finally {
            setCreatingPlan(false);
        }
    };

    const updateDraftItem = (index: number, value: string) => {
        setPlanDraft(prev => {
            const items = [...prev.items];
            items[index] = value;
            return { ...prev, items };
        });
    };

    const addDraftItem = () => {
        setPlanDraft(prev => ({ ...prev, items: [...prev.items, ''] }));
    };

    const removeDraftItem = (index: number) => {
        setPlanDraft(prev => {
            if (prev.items.length === 1) return prev;
            return { ...prev, items: prev.items.filter((_, i) => i !== index) };
        });
    };

    const canSubmitDraft = planDraft.title.trim().length > 0
        && planDraft.items.some(item => item.trim().length > 0);

    if (loading) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
                <div className="max-w-[1000px] mx-auto flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#0B3D2E] animate-spin" />
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
            <div className="max-w-[1000px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <p className="text-sm uppercase tracking-widest font-medium mb-2 text-[#D4AF37]">
                            {language === 'en' ? 'Your Plans' : '你的计划'}
                        </p>
                        <h2
                            className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em]"
                            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                        >
                            {language === 'en' ? 'Personalized action plans' : '个性化行动方案'}
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowNewPlan(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">{language === 'en' ? 'New Plan' : '新建计划'}</span>
                    </button>
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <div className="bg-white border border-[#1A1A1A]/10 p-10 text-center">
                        <p className="text-[#1A1A1A]/70 mb-2">
                            {isUnauthorized
                                ? (language === 'en' ? 'Please sign in to view your plans.' : '请先登录以查看你的计划。')
                                : (language === 'en' ? 'No plans yet.' : '你还没有计划。')}
                        </p>
                        <p className="text-sm text-[#1A1A1A]/50 mb-6">
                            {language === 'en'
                                ? 'Create your first plan or let Max suggest a protocol.'
                                : '创建第一份计划，或让 Max 提供建议。'}
                        </p>
                        {errorMessage && (
                            <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
                        )}
                        <button
                            onClick={() => setShowNewPlan(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {language === 'en' ? 'Create Plan' : '创建方案'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white border border-[#1A1A1A]/10 overflow-hidden"
                            >
                            {/* Plan Header */}
                            <div className="p-6 border-b border-[#1A1A1A]/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#0B3D2E] flex items-center justify-center">
                                            <Target className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#1A1A1A]">{plan.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-xs px-2 py-0.5 ${getDifficultyColor(plan.difficulty)}`}>
                                                    {getDifficultyLabel(plan.difficulty)}
                                                </span>
                                                <span className="text-xs text-[#1A1A1A]/40 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {plan.expected_duration_days} {language === 'en' ? 'days' : '天'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[#0B3D2E]">{plan.progress}%</div>
                                        <div className="text-xs text-[#1A1A1A]/40">{language === 'en' ? 'complete' : '已完成'}</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#0B3D2E]"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${plan.progress}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Plan Items */}
                            <div className="divide-y divide-[#1A1A1A]/5">
                                {plan.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                                        onClick={() => toggleItem(plan.id, item.id)}
                                    >
                                        <div className="relative">
                                            {updating === item.id ? (
                                                <Loader2 className="w-5 h-5 text-[#0B3D2E] animate-spin" />
                                            ) : item.completed ? (
                                                <CheckCircle className="w-5 h-5 text-[#0B3D2E]" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-[#1A1A1A]/30" />
                                            )}
                                        </div>
                                        <span className={`flex-1 ${item.completed ? 'text-[#1A1A1A]/40 line-through' : 'text-[#1A1A1A]'}`}>
                                            {item.text}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-[#1A1A1A]/20" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                    </div>
                )}

                {/* AI Suggestion */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8 p-6 bg-[#0B3D2E] border border-[#D4AF37]/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-1">
                                {language === 'en' ? 'Max suggests a new plan' : 'Max 建议一个新方案'}
                            </h4>
                            <p className="text-white/60 text-sm">
                                {language === 'en'
                                    ? 'Based on your HRV data, a stress management protocol could help improve your recovery.'
                                    : '根据你的 HRV 数据，一个压力管理方案可能有助于改善你的恢复能力。'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowSuggestion(true);
                                loadSuggestion();
                            }}
                            className="px-4 py-2 bg-[#D4AF37] text-[#0B3D2E] font-medium text-sm hover:bg-[#E5C158] transition-colors shrink-0"
                        >
                            {language === 'en' ? 'View' : '查看'}
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showNewPlan && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                            onClick={() => setShowNewPlan(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-xl bg-[#FAF6EF] border border-[#1A1A1A]/10 p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-[#1A1A1A]">
                                        {language === 'en' ? 'Create a new plan' : '创建新计划'}
                                    </h3>
                                    <button
                                        onClick={() => setShowNewPlan(false)}
                                        className="p-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        createPlan(planDraft);
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm text-[#1A1A1A]/60 mb-2">
                                            {language === 'en' ? 'Plan title' : '计划标题'}
                                        </label>
                                        <input
                                            value={planDraft.title}
                                            onChange={(e) => setPlanDraft(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-3 border border-[#1A1A1A]/10 bg-white focus:outline-none focus:border-[#0B3D2E]"
                                            placeholder={language === 'en' ? 'e.g. Evening wind-down' : '例如：夜间放松计划'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#1A1A1A]/60 mb-2">
                                            {language === 'en' ? 'Plan focus' : '计划重点'}
                                        </label>
                                        <textarea
                                            value={planDraft.description}
                                            onChange={(e) => setPlanDraft(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-3 border border-[#1A1A1A]/10 bg-white focus:outline-none focus:border-[#0B3D2E] min-h-[96px]"
                                            placeholder={language === 'en' ? 'Describe the goal or context' : '描述目标或背景'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#1A1A1A]/60 mb-2">
                                            {language === 'en' ? 'Action steps' : '行动步骤'}
                                        </label>
                                        <div className="space-y-2">
                                            {planDraft.items.map((item, index) => (
                                                <div key={`draft-${index}`} className="flex items-center gap-2">
                                                    <input
                                                        value={item}
                                                        onChange={(e) => updateDraftItem(index, e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-[#1A1A1A]/10 bg-white focus:outline-none focus:border-[#0B3D2E]"
                                                        placeholder={language === 'en' ? 'Add a step' : '添加一个步骤'}
                                                    />
                                                    {planDraft.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDraftItem(index)}
                                                            className="px-3 py-2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                                                        >
                                                            {language === 'en' ? 'Remove' : '移除'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addDraftItem}
                                                className="text-sm text-[#0B3D2E] hover:text-[#0B3D2E]/80"
                                            >
                                                {language === 'en' ? '+ Add another step' : '+ 添加步骤'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPlan(false)}
                                            className="px-4 py-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                                        >
                                            {language === 'en' ? 'Cancel' : '取消'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!canSubmitDraft || creatingPlan}
                                            className="px-5 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50"
                                        >
                                            {creatingPlan
                                                ? (language === 'en' ? 'Creating...' : '创建中...')
                                                : (language === 'en' ? 'Create Plan' : '创建计划')}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSuggestion && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                            onClick={() => setShowSuggestion(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-xl bg-[#FAF6EF] border border-[#1A1A1A]/10 p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-[#1A1A1A]">
                                        {language === 'en' ? 'Suggested plan' : '推荐方案'}
                                    </h3>
                                    <button
                                        onClick={() => setShowSuggestion(false)}
                                        className="p-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {suggestionLoading && (
                                        <div className="flex items-center gap-3 text-[#1A1A1A]/60">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{language === 'en' ? 'Generating your plan...' : '正在生成计划...'}</span>
                                        </div>
                                    )}
                                    {suggestionError && (
                                        <p className="text-sm text-red-500">{suggestionError}</p>
                                    )}
                                    {suggestedPlan && !suggestionLoading && (
                                        <>
                                            <div>
                                                <h4 className="text-lg font-semibold text-[#0B3D2E] mb-1">
                                                    {suggestedPlan.title}
                                                </h4>
                                                <p className="text-[#1A1A1A]/60 text-sm">
                                                    {suggestedPlan.description}
                                                </p>
                                            </div>
                                            <div className="bg-white border border-[#1A1A1A]/10 p-4">
                                                <p className="text-sm text-[#1A1A1A]/60 mb-3">
                                                    {language === 'en' ? 'Proposed steps' : '建议步骤'}
                                                </p>
                                                <ul className="space-y-2 text-sm text-[#1A1A1A]">
                                                    {suggestedPlan.items.map((item) => (
                                                        <li key={item} className="flex items-start gap-2">
                                                            <span className="text-[#D4AF37] mt-0.5">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            onClick={() => setShowSuggestion(false)}
                                            className="px-4 py-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                                        >
                                            {language === 'en' ? 'Close' : '关闭'}
                                        </button>
                                        <button
                                            onClick={() => suggestedPlan && createPlan(suggestedPlan)}
                                            disabled={creatingPlan || !suggestedPlan}
                                            className="px-5 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors disabled:opacity-50"
                                        >
                                            {creatingPlan
                                                ? (language === 'en' ? 'Adding...' : '添加中...')
                                                : (language === 'en' ? 'Add Plan' : '添加计划')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
