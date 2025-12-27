'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
    Target, Clock, CheckCircle, Circle, ChevronRight,
    Plus, Loader2, Sparkles, Calendar
} from 'lucide-react';

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
    created_at: string;
}

export default function PlanDashboard() {
    const { language } = useI18n();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/plans/list?status=active');
            const data = await res.json();

            if (data.success && data.data?.plans && data.data.plans.length > 0) {
                // Transform API data to component format
                const transformedPlans = data.data.plans.map((plan: any) => ({
                    id: plan.id,
                    title: plan.title || (language === 'en' ? 'Health Plan' : '健康方案'),
                    plan_type: plan.plan_type || 'comprehensive',
                    status: plan.status || 'active',
                    difficulty: plan.difficulty || 'medium',
                    expected_duration_days: plan.expected_duration_days || 14,
                    progress: plan.progress || 0,
                    items: plan.content?.actions?.map((action: any, idx: number) => ({
                        id: `${plan.id}-${idx}`,
                        text: action.description || action.text || action,
                        completed: action.completed || false,
                    })) || [],
                    created_at: plan.created_at,
                }));
                setPlans(transformedPlans);
            } else {
                // No plans yet - show empty state or prompt to create
                setPlans([]);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = async (planId: string, itemId: string) => {
        setUpdating(itemId);

        // Optimistic update
        setPlans(prev => prev.map(plan => {
            if (plan.id === planId) {
                const newItems = plan.items.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                );
                const completedCount = newItems.filter(i => i.completed).length;
                return {
                    ...plan,
                    items: newItems,
                    progress: Math.round((completedCount / newItems.length) * 100),
                };
            }
            return plan;
        }));

        try {
            await fetch('/api/execution-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, itemId }),
            });
        } catch (error) {
            console.error('Failed to update item:', error);
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">{language === 'en' ? 'New Plan' : '新建计划'}</span>
                    </button>
                </div>

                {/* Plans Grid */}
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
                        <button className="px-4 py-2 bg-[#D4AF37] text-[#0B3D2E] font-medium text-sm hover:bg-[#E5C158] transition-colors shrink-0">
                            {language === 'en' ? 'View' : '查看'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
