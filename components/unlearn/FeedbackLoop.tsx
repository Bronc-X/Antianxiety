'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { TrendingUp, Brain, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FeedbackMetric {
    label: string;
    value: number;
    change: number | null;
    status: 'improving' | 'stable' | 'declining';
}

interface ScoreBreakdown {
    completion_prediction_accuracy?: number;
    replacement_acceptance_rate?: number;
    sentiment_prediction_accuracy?: number;
    preference_pattern_match?: number;
}

interface UnderstandingScore {
    current: number;
    breakdown?: ScoreBreakdown;
    isDeepUnderstanding?: boolean;
    lastUpdated?: string;
}

interface ScoreHistoryEntry {
    date: string;
    score: number;
    factors_changed?: string[];
}

export default function FeedbackLoop() {
    const { language } = useI18n();
    const [score, setScore] = useState<UnderstandingScore | null>(null);
    const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    const fetchScore = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            setIsUnauthorized(false);
            const res = await fetch('/api/understanding-score?includeHistory=true&days=14', { cache: 'no-store' });
            if (res.status === 401) {
                setScore(null);
                setHistory([]);
                setIsUnauthorized(true);
                return;
            }
            if (!res.ok) {
                throw new Error('Failed to fetch understanding score');
            }
            const data = await res.json();
            setScore(data?.score ?? null);
            setHistory(Array.isArray(data?.history) ? data.history : []);
        } catch (error) {
            console.error('Failed to fetch understanding score:', error);
            setScore(null);
            setHistory([]);
            setErrorMessage(language === 'en' ? 'Unable to load AI learning data.' : '暂时无法加载 AI 学习数据。');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScore();
    }, [language]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchScore();
        }, 60000);

        const handleFocus = () => fetchScore();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [language]);

    const sortedHistory = [...history].sort((a, b) => (
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
    const scoreDelta = sortedHistory.length > 1
        ? sortedHistory[0].score - sortedHistory[1].score
        : null;
    const breakdown = score?.breakdown || {};

    const metrics: FeedbackMetric[] = score
        ? [
            {
                label: language === 'en' ? 'Prediction Accuracy' : '预测准确率',
                value: Math.round(breakdown.completion_prediction_accuracy ?? 0),
                change: null,
                status: 'stable',
            },
            {
                label: language === 'en' ? 'Understanding Score' : '理解度评分',
                value: Math.round(score.current ?? 0),
                change: scoreDelta !== null ? Math.round(scoreDelta * 10) / 10 : null,
                status: scoreDelta !== null && scoreDelta !== 0
                    ? (scoreDelta > 0 ? 'improving' : 'declining')
                    : 'stable',
            },
            {
                label: language === 'en' ? 'Intervention Success' : '干预成功率',
                value: Math.round(breakdown.replacement_acceptance_rate ?? 0),
                change: null,
                status: 'stable',
            },
        ]
        : [];

    const hasMetricData = metrics.some((metric) => metric.value > 0);
    const learningEvents = sortedHistory.slice(0, 3).map((entry) => ({
        time: new Date(entry.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
            month: 'short',
            day: 'numeric',
        }),
        event: language === 'en'
            ? `Understanding score updated to ${Math.round(entry.score)}`
            : `理解度评分更新至 ${Math.round(entry.score)}`,
        type: 'update',
    }));
    const hasEvents = learningEvents.length > 0;
    const hasData = hasMetricData || hasEvents;

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
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Self-Correcting AI' : 'AI 自我修正'}
                    </p>
                    <h2
                        className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Your digital twin learns and adapts' : '你的数字孪生不断学习与适应'}
                    </h2>
                    <p className="text-[#1A1A1A]/60 max-w-xl mx-auto">
                        {language === 'en'
                            ? 'Max constantly refines its understanding of you based on new data and feedback'
                            : 'Max 根据新数据和反馈不断完善对你的理解'}
                    </p>
                </div>

                {!hasData ? (
                    <div className="bg-white border border-[#1A1A1A]/10 p-8 text-center">
                        <p className="text-[#1A1A1A]/70 mb-3">
                            {isUnauthorized
                                ? (language === 'en' ? 'Please sign in to see AI learning progress.' : '请先登录以查看 AI 学习进展。')
                                : (language === 'en' ? 'AI learning data is building up.' : 'AI 学习数据正在积累中。')}
                        </p>
                        <p className="text-sm text-[#1A1A1A]/50">
                            {language === 'en'
                                ? 'Complete daily calibration and interact with plans to unlock insights.'
                                : '完成每日校准并执行计划，即可解锁学习洞察。'}
                        </p>
                        {errorMessage && (
                            <p className="text-sm text-red-500 mt-4">{errorMessage}</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Metrics Grid */}
                        {metrics.length > 0 && (
                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                {metrics.map((metric, i) => (
                                    <motion.div
                                        key={metric.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-6 bg-white border border-[#1A1A1A]/10"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-[#1A1A1A]/60">{metric.label}</span>
                                            <div
                                                className={`flex items-center gap-1 text-sm ${metric.status === 'improving'
                                                        ? 'text-emerald-600'
                                                        : metric.status === 'declining'
                                                            ? 'text-red-500'
                                                            : 'text-[#1A1A1A]/40'
                                                    }`}
                                            >
                                                {metric.status === 'improving' ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : metric.status === 'declining' ? (
                                                    <AlertCircle className="w-4 h-4" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                <span>
                                                    {metric.change === null
                                                        ? '—'
                                                        : `${metric.change > 0 ? '+' : ''}${metric.change}%`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-bold text-[#0B3D2E] mb-2">
                                            {metric.value}%
                                        </div>
                                        {/* Progress bar */}
                                        <div className="h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#0B3D2E]"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Learning Timeline */}
                        <div className="bg-white border border-[#1A1A1A]/10 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-[#0B3D2E] flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1A1A1A]">
                                        {language === 'en' ? 'Recent Learning Events' : '最近的学习事件'}
                                    </h3>
                                    <p className="text-sm text-[#1A1A1A]/50">
                                        {language === 'en' ? 'How Max is improving for you' : 'Max 正在如何为你改进'}
                                    </p>
                                </div>
                            </div>

                            {learningEvents.length === 0 ? (
                                <div className="text-sm text-[#1A1A1A]/50">
                                    {language === 'en' ? 'No learning events recorded yet.' : '暂无学习事件记录。'}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {learningEvents.map((event, i) => (
                                        <motion.div
                                            key={`${event.time}-${i}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-4 p-4 bg-[#FAF6EF] border-l-2 border-[#D4AF37]"
                                        >
                                            <RefreshCw className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[#1A1A1A]">{event.event}</p>
                                                <p className="text-sm text-[#1A1A1A]/40 mt-1">{event.time}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
