'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    Target, CheckCircle, Circle, ChevronRight,
    Plus, Loader2, Sparkles, Calendar, X, History, RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import MaxPlanDialogSimple from '@/components/max/MaxPlanDialogSimple';

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
    const [showMaxPlanDialog, setShowMaxPlanDialog] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPlans, setHistoryPlans] = useState<Plan[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [archivingPlan, setArchivingPlan] = useState<string | null>(null);
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
        console.log('📊 normalizePlan input:', { 
            id: plan.id, 
            contentType: typeof plan.content,
            contentPreview: typeof plan.content === 'string' 
                ? plan.content.substring(0, 200) 
                : JSON.stringify(plan.content).substring(0, 200)
        });

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
        
        console.log('📊 rawItems:', rawItems.map((item: any, i: number) => ({
            index: i,
            id: item.id,
            completed: item.completed,
            status: item.status
        })));

        const items = rawItems.map((item: any, index: number) => ({
            id: item.id?.toString() || `${plan.id}-${index}`,
            text: item.text || item.title || String(item),
            completed: item.completed === true || item.status === 'completed',
        }));

        const completedCount = items.filter((item: PlanItem) => item.completed).length;
        const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

        console.log('📊 normalizePlan output:', { 
            id: plan.id, 
            itemsCount: items.length,
            completedCount,
            progress,
            items: items.map((i: PlanItem) => ({ id: i.id, completed: i.completed }))
        });

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
            console.log('🔍 fetchPlans: Fetching active plans...');
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
            console.log('🔍 fetchPlans: Raw API response:', data);

            if (data.success && data.data?.plans && data.data.plans.length > 0) {
                console.log('🔍 fetchPlans: Raw plans from API:', data.data.plans.map((p: any) => ({
                    id: p.id,
                    contentType: typeof p.content,
                    content: typeof p.content === 'string' ? p.content.substring(0, 300) : JSON.stringify(p.content).substring(0, 300)
                })));
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

    const fetchHistoryPlans = async () => {
        try {
            setHistoryLoading(true);
            const res = await fetch('/api/plans/list?status=completed');
            if (!res.ok) {
                throw new Error('Failed to fetch history');
            }
            const data = await res.json();
            if (data.success && data.data?.plans) {
                setHistoryPlans(data.data.plans.map(normalizePlan));
            } else {
                setHistoryPlans([]);
            }
        } catch (error) {
            console.error('Failed to fetch history plans:', error);
            setHistoryPlans([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    /**
     * 归档当前计划并打开新计划对话框
     */
    const archiveAndResetPlan = async (planId: string) => {
        setArchivingPlan(planId);
        
        try {
            // 将当前计划标记为已完成（归档）
            const res = await fetch('/api/plans/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    status: 'archived',
                    completedItems: [],
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to archive plan');
            }

            toast({
                message: language === 'en' ? 'Plan archived. Creating new plan...' : '计划已归档，正在创建新计划...',
                type: 'success',
                duration: 2000,
            });

            // 先从本地状态移除已归档的计划
            setPlans(prev => prev.filter(p => p.id !== planId));
            
            // 立即打开 Max 对话框
            setShowMaxPlanDialog(true);
            
            // 设置 archivingPlan 为 null，避免阻塞
            setArchivingPlan(null);
            
            // 后台静默刷新计划列表（不设置 loading 状态）
            fetch('/api/plans/list?status=active')
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.data?.plans) {
                        setPlans(data.data.plans.map(normalizePlan));
                    }
                })
                .catch(() => {});

        } catch (error) {
            console.error('Failed to archive plan:', error);
            toast({
                message: language === 'en' ? 'Failed to archive plan. Please try again.' : '归档计划失败，请稍后重试。',
                type: 'error',
            });
            setArchivingPlan(null);
        }
    };

    const toggleItem = async (planId: string, itemId: string) => {
        setUpdating(itemId);

        console.log('🔄 toggleItem called:', { planId, itemId });

        // 先找到当前计划并计算新状态
        const currentPlan = plans.find(p => p.id === planId);
        if (!currentPlan) {
            console.error('❌ Plan not found:', planId);
            setUpdating(null);
            return;
        }

        // 计算新的 items 状态
        const newItems = currentPlan.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = newItems.filter(i => i.completed).length;
        const newProgress = Math.round((completedCount / newItems.length) * 100);

        console.log('📝 Calculated new state:', { 
            planId, 
            items: newItems.map(i => ({ id: i.id, completed: i.completed })),
            progress: newProgress 
        });

        // Optimistic update
        setPlans(prev => prev.map(plan => {
            if (plan.id === planId) {
                return {
                    ...plan,
                    items: newItems,
                    progress: newProgress,
                };
            }
            return plan;
        }));

        // 准备 API 请求数据
        const completedItems = newItems.map((item: PlanItem) => ({
            id: item.id,
            completed: item.completed,
        }));
        const allCompleted = newItems.every((item: PlanItem) => item.completed);
        const anyCompleted = newItems.some((item: PlanItem) => item.completed);
        const status = allCompleted ? 'completed' : anyCompleted ? 'partial' : 'skipped';

        console.log('📤 Sending to API:', { planId, status, completedItems });

        try {
            const res = await fetch('/api/plans/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    status,
                    completedItems,
                }),
            });
            
            console.log('📥 API response status:', res.status);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('❌ Failed to save completion:', errorData);
                throw new Error(errorData.error || 'Failed to save');
            }
            
            const result = await res.json();
            console.log('✅ Plan completion saved:', result);
            
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
            fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => {});
        } catch (error) {
            console.error('❌ Failed to update item:', error);
            toast({
                message: language === 'en' ? 'Failed to update plan item.' : '更新计划失败，请稍后重试。',
                type: 'error',
            });
            // Revert optimistic update on error
            fetchPlans();
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

    // MaxPlanDialogSimple 使用简化的直接渲染
    const maxPlanDialogElement = (
        <MaxPlanDialogSimple
            isOpen={showMaxPlanDialog}
            onClose={() => setShowMaxPlanDialog(false)}
            onPlanCreated={() => {
                fetchPlans();
                fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
            }}
        />
    );

    if (loading && !showMaxPlanDialog) {
        return (
            <>
                <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
                    <div className="max-w-[1000px] mx-auto flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#0B3D2E] animate-spin" />
                    </div>
                </section>
                {maxPlanDialogElement}
            </>
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
                        onClick={() => {
                            setShowHistory(true);
                            fetchHistoryPlans();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors"
                    >
                        <History className="w-4 h-4" />
                        <span className="text-sm">{language === 'en' ? 'History' : '历史计划'}</span>
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
                            onClick={() => setShowMaxPlanDialog(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            {language === 'en' ? 'Create Plan with Max' : 'Max协助你一起制定计划'}
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
                                    <div className="flex items-center gap-4">
                                        {/* 重新设置按钮 */}
                                        <button
                                            onClick={() => archiveAndResetPlan(plan.id)}
                                            disabled={archivingPlan === plan.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#1A1A1A]/60 hover:text-[#0B3D2E] hover:bg-[#0B3D2E]/5 rounded transition-colors disabled:opacity-50"
                                            title={language === 'en' ? 'Reset and create new plan' : '重新设置计划'}
                                        >
                                            {archivingPlan === plan.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4" />
                                            )}
                                            <span className="hidden sm:inline">
                                                {language === 'en' ? 'Reset' : '重新设置'}
                                            </span>
                                        </button>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-[#0B3D2E]">{plan.progress}%</div>
                                            <div className="text-xs text-[#1A1A1A]/40">{language === 'en' ? 'complete' : '已完成'}</div>
                                        </div>
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

                <AnimatePresence>
                    {/* History Modal */}
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                            onClick={() => setShowHistory(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-2xl max-h-[80vh] bg-[#FAF6EF] border border-[#1A1A1A]/10 overflow-hidden flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]/10">
                                    <h3 className="text-xl font-semibold text-[#1A1A1A]">
                                        {language === 'en' ? 'Plan History' : '历史计划'}
                                    </h3>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    {historyLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 text-[#0B3D2E] animate-spin" />
                                        </div>
                                    ) : historyPlans.length === 0 ? (
                                        <div className="text-center py-12">
                                            <History className="w-12 h-12 text-[#1A1A1A]/20 mx-auto mb-4" />
                                            <p className="text-[#1A1A1A]/50">
                                                {language === 'en' ? 'No completed plans yet.' : '暂无已完成的计划。'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {historyPlans.map((plan) => (
                                                <div
                                                    key={plan.id}
                                                    className="bg-white border border-[#1A1A1A]/10 p-4"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-[#0B3D2E]/10 flex items-center justify-center">
                                                                <CheckCircle className="w-4 h-4 text-[#0B3D2E]" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-[#1A1A1A]">{plan.title}</h4>
                                                                <p className="text-xs text-[#1A1A1A]/40">
                                                                    {new Date(plan.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-[#0B3D2E] font-medium">
                                                            {plan.progress}%
                                                        </span>
                                                    </div>
                                                    {plan.items.length > 0 && (
                                                        <div className="space-y-1 mt-3 pt-3 border-t border-[#1A1A1A]/5">
                                                            {plan.items.slice(0, 3).map((item) => (
                                                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                                                    {item.completed ? (
                                                                        <CheckCircle className="w-3 h-3 text-[#0B3D2E]" />
                                                                    ) : (
                                                                        <Circle className="w-3 h-3 text-[#1A1A1A]/30" />
                                                                    )}
                                                                    <span className={item.completed ? 'text-[#1A1A1A]/40 line-through' : 'text-[#1A1A1A]/70'}>
                                                                        {item.text}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {plan.items.length > 3 && (
                                                                <p className="text-xs text-[#1A1A1A]/40 pl-5">
                                                                    +{plan.items.length - 3} {language === 'en' ? 'more items' : '更多项目'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

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

                {/* Max Plan Dialog */}
                {maxPlanDialogElement}
            </div>
        </section>
    );
}
