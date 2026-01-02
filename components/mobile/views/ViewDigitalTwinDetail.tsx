/**
 * ViewDigitalTwinDetail - Metric Detail View
 * 
 * 单个指标的详细视图，展示完整预测曲线和历史数据
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
} from 'recharts';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Activity,
    Moon,
    Zap,
    Heart,
    Smile,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DigitalTwinCurveOutput } from '@/types/digital-twin-curve';

// ============================================
// Types & Constants
// ============================================

type MetricKey = 'anxietyScore' | 'sleepQuality' | 'stressResilience' | 'moodStability' | 'energyLevel' | 'hrvScore';

const METRIC_CONFIG: Record<MetricKey, {
    label: string;
    labelEn: string;
    icon: typeof Activity;
    color: string;
    description: string;
    isNegative?: boolean;
}> = {
    anxietyScore: {
        label: '焦虑评分',
        labelEn: 'Anxiety Score',
        icon: TrendingDown,
        color: '#ef4444',
        description: '基于 GAD-7 量表推导，越低越好',
        isNegative: true,
    },
    sleepQuality: {
        label: '睡眠质量',
        labelEn: 'Sleep Quality',
        icon: Moon,
        color: '#8b5cf6',
        description: '综合睡眠时长和睡眠质量评分',
    },
    stressResilience: {
        label: '抗压韧性',
        labelEn: 'Stress Resilience',
        icon: Zap,
        color: '#f59e0b',
        description: '基于 PSS-10 和每日压力校准',
    },
    moodStability: {
        label: '情绪稳定性',
        labelEn: 'Mood Stability',
        icon: Smile,
        color: '#10b981',
        description: '基于 PHQ-9 和每日情绪波动',
    },
    energyLevel: {
        label: '能量水平',
        labelEn: 'Energy Level',
        icon: Activity,
        color: '#3b82f6',
        description: '综合睡眠、情绪和每日校准',
    },
    hrvScore: {
        label: 'HRV 代理分',
        labelEn: 'HRV Proxy',
        icon: Heart,
        color: '#ec4899',
        description: '推断值，接入穿戴设备后更准确',
    },
};

// ============================================
// Props
// ============================================

interface ViewDigitalTwinDetailProps {
    curveData: DigitalTwinCurveOutput;
    metricKey: MetricKey;
    onBack: () => void;
}

// ============================================
// Glass Card
// ============================================

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg',
                className
            )}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// Main Component
// ============================================

export function ViewDigitalTwinDetail({ curveData, metricKey, onBack }: ViewDigitalTwinDetailProps) {
    const config = METRIC_CONFIG[metricKey];
    const Icon = config.icon;

    // Prepare chart data
    const chartData = useMemo(() => {
        return curveData.A_predictedLongitudinalOutcomes.timepoints.map(tp => {
            const metric = tp.metrics[metricKey];
            const confidenceHalf = parseFloat(metric.confidence.split('±')[1]?.trim() || '8');
            return {
                week: tp.week,
                weekLabel: `W${tp.week}`,
                value: metric.value,
                upper: Math.min(100, metric.value + confidenceHalf),
                lower: Math.max(0, metric.value - confidenceHalf),
            };
        });
    }, [curveData, metricKey]);

    const week0 = chartData[0];
    const week15 = chartData[chartData.length - 1];
    const currentWeek = curveData.meta.currentWeek || 0;

    // Calculate improvement
    const improvement = config.isNegative
        ? week0.value - week15.value
        : week15.value - week0.value;
    const improvementPct = Math.abs(improvement / week0.value * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-20 px-4 py-4 bg-black/20 backdrop-blur-xl border-b border-white/10"
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl bg-white/10 active:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl"
                            style={{ backgroundColor: `${config.color}20` }}
                        >
                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">{config.label}</h1>
                            <p className="text-xs text-white/50">{config.labelEn}</p>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Content */}
            <main className="p-4 pb-24 space-y-4">
                {/* Current Value Card */}
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-white/50">当前预测值</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">
                                    {chartData.find(d => d.week === Math.floor(currentWeek / 3) * 3)?.value.toFixed(1) || week0.value.toFixed(1)}
                                </span>
                                <span className="text-lg text-white/40">/ 100</span>
                            </div>
                        </div>
                        <div className={cn(
                            'px-3 py-2 rounded-xl flex items-center gap-2',
                            improvement >= 0 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        )}>
                            {improvement >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-amber-400" />
                            )}
                            <span className={cn(
                                'text-sm font-medium',
                                improvement >= 0 ? 'text-emerald-400' : 'text-amber-400'
                            )}>
                                {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <Info className="w-3 h-3" />
                        <span>{config.description}</span>
                    </div>
                </GlassCard>

                {/* Chart */}
                <GlassCard className="p-4">
                    <h3 className="text-sm font-medium text-white/80 mb-4">15 周预测曲线</h3>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={config.color} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={config.color} stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>

                                <XAxis
                                    dataKey="weekLabel"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                />

                                {/* Current week reference line */}
                                {currentWeek > 0 && (
                                    <ReferenceLine
                                        x={`W${Math.floor(currentWeek / 3) * 3}`}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeDasharray="3 3"
                                    />
                                )}

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        border: `1px solid ${config.color}40`,
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                                    formatter={(value: number) => [value.toFixed(1), config.label]}
                                />

                                {/* Confidence interval */}
                                <Area
                                    type="monotone"
                                    dataKey="upper"
                                    stroke="transparent"
                                    fill="url(#colorConfidence)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="lower"
                                    stroke="transparent"
                                    fill="transparent"
                                />

                                {/* Main line */}
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={config.color}
                                    strokeWidth={3}
                                    fill="url(#colorMain)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <GlassCard className="p-4">
                        <p className="text-xs text-white/50 mb-1">基线 (Week 0)</p>
                        <p className="text-xl font-bold text-white">{week0.value.toFixed(1)}</p>
                    </GlassCard>

                    <GlassCard className="p-4">
                        <p className="text-xs text-white/50 mb-1">目标 (Week 15)</p>
                        <p className="text-xl font-bold" style={{ color: config.color }}>{week15.value.toFixed(1)}</p>
                    </GlassCard>

                    <GlassCard className="p-4">
                        <p className="text-xs text-white/50 mb-1">预期改善</p>
                        <p className="text-xl font-bold text-emerald-400">
                            {improvementPct.toFixed(0)}%
                        </p>
                    </GlassCard>

                    <GlassCard className="p-4">
                        <p className="text-xs text-white/50 mb-1">当前周数</p>
                        <p className="text-xl font-bold text-violet-400">
                            Week {currentWeek}
                        </p>
                    </GlassCard>
                </div>

                {/* Week-by-week breakdown */}
                <GlassCard className="p-4">
                    <h3 className="text-sm font-medium text-white/80 mb-4">各周预测详情</h3>

                    <div className="space-y-3">
                        {chartData.map((point, i) => (
                            <div
                                key={point.week}
                                className={cn(
                                    'flex items-center justify-between py-2 border-b border-white/5 last:border-0',
                                    point.week === Math.floor(currentWeek / 3) * 3 && 'bg-violet-500/10 -mx-2 px-2 rounded-lg'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                                            point.week <= currentWeek ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
                                        )}
                                    >
                                        W{point.week}
                                    </div>
                                    <span className="text-sm text-white/80">{point.value.toFixed(1)}</span>
                                </div>
                                <span className="text-xs text-white/40">
                                    {point.lower.toFixed(1)} - {point.upper.toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}

export default ViewDigitalTwinDetail;
