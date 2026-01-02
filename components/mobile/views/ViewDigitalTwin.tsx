/**
 * ViewDigitalTwin - Mobile Digital Twin Curve Visualization
 * 
 * 移动端数字孪生曲线可视化组件
 * 展示四个视图 (A/B/C/D) 的预测数据
 * 
 * Features:
 * - 6 指标预测曲线图
 * - 里程碑时间线
 * - 基线量表数据
 * - 汇总统计卡片
 * - Framer Motion 动画
 * - 玻璃态设计
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from 'recharts';
import {
    Brain,
    TrendingDown,
    TrendingUp,
    Moon,
    Zap,
    Heart,
    Activity,
    Smile,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronRight,
    RefreshCw,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDigitalTwinCurve, getDataQualityStatus, getCurrentMilestone } from '@/hooks/domain';
import { ViewDigitalTwinDetail } from './ViewDigitalTwinDetail';
import type {
    DigitalTwinCurveOutput,
    CurveTimepoint,
    TimelineMilestone,
} from '@/types/digital-twin-curve';

// ============================================
// Design Tokens
// ============================================

const COLORS = {
    anxiety: '#ef4444',
    sleep: '#8b5cf6',
    stress: '#f59e0b',
    mood: '#10b981',
    energy: '#3b82f6',
    hrv: '#ec4899',
};

const METRIC_ICONS = {
    anxietyScore: TrendingDown,
    sleepQuality: Moon,
    stressResilience: Zap,
    moodStability: Smile,
    energyLevel: Activity,
    hrvScore: Heart,
};

const METRIC_LABELS = {
    anxietyScore: '焦虑评分',
    sleepQuality: '睡眠质量',
    stressResilience: '抗压韧性',
    moodStability: '情绪稳定',
    energyLevel: '能量水平',
    hrvScore: 'HRV 代理',
};

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

// ============================================
// Glass Card Component
// ============================================

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

function GlassCard({ children, className, onClick }: GlassCardProps) {
    return (
        <motion.div
            variants={itemVariants}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-white/10 backdrop-blur-xl',
                'border border-white/20',
                'shadow-lg shadow-black/5',
                className
            )}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// Metric Card Component
// ============================================

interface MetricCardProps {
    metricKey: keyof typeof METRIC_LABELS;
    value: number;
    confidence: string;
    isNegative?: boolean;
    week0Value?: number;
    onClick?: () => void;
}

function MetricCard({ metricKey, value, confidence, isNegative, week0Value, onClick }: MetricCardProps) {
    const Icon = METRIC_ICONS[metricKey];
    const label = METRIC_LABELS[metricKey];

    // Calculate trend
    const trend = week0Value !== undefined
        ? isNegative
            ? value < week0Value ? 'improving' : value > week0Value ? 'declining' : 'stable'
            : value > week0Value ? 'improving' : value < week0Value ? 'declining' : 'stable'
        : 'stable';

    const trendColors = {
        improving: 'text-emerald-400',
        stable: 'text-gray-400',
        declining: 'text-amber-400',
    };

    const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Activity;

    return (
        <GlassCard className="p-4 cursor-pointer hover:bg-white/20 transition-colors" onClick={onClick}>
            <div className="flex items-start justify-between mb-2">
                <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${COLORS[metricKey.replace('Score', '').replace('Quality', '').replace('Resilience', '').replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS] || '#6366f1'}20` }}
                >
                    <Icon className="w-5 h-5 text-white/80" />
                </div>
                <div className={cn('flex items-center gap-1 text-xs', trendColors[trend])}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{trend === 'improving' ? '改善' : trend === 'declining' ? '需关注' : '稳定'}</span>
                </div>
            </div>

            <p className="text-xs text-white/60 mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{value.toFixed(1)}</span>
                <span className="text-xs text-white/40">/ 100</span>
            </div>
            <p className="text-xs text-white/40 mt-1">置信区间 {confidence.split('±')[1]?.trim() || '±8.0'}</p>
        </GlassCard>
    );
}

// ============================================
// Timeline Component
// ============================================

interface TimelineProps {
    milestones: TimelineMilestone[];
    currentWeek: number | null;
}

function Timeline({ milestones, currentWeek }: TimelineProps) {
    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white/80">进度时间线</h3>
            </div>

            <div className="relative">
                {/* Progress bar */}
                <div className="absolute top-3 left-0 right-0 h-1 bg-white/10 rounded-full" />
                <motion.div
                    className="absolute top-3 left-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(((currentWeek || 0) / 15) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />

                {/* Milestone dots */}
                <div className="relative flex justify-between px-1">
                    {milestones.map((milestone, i) => (
                        <div key={milestone.week} className="flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center z-10',
                                    milestone.status === 'completed' && 'bg-emerald-500',
                                    milestone.status === 'current' && 'bg-violet-500 ring-4 ring-violet-500/30',
                                    milestone.status === 'upcoming' && 'bg-white/20'
                                )}
                            >
                                {milestone.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                                {milestone.status === 'current' && <Activity className="w-3 h-3 text-white" />}
                                {milestone.status === 'upcoming' && <div className="w-2 h-2 rounded-full bg-white/40" />}
                            </motion.div>
                            <span className="text-[10px] text-white/50 mt-2">W{milestone.week}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current milestone info */}
            {milestones.find(m => m.status === 'current') && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 p-3 rounded-xl bg-violet-500/20 border border-violet-500/30"
                >
                    <p className="text-xs text-violet-300 font-medium">
                        {milestones.find(m => m.status === 'current')?.event}
                    </p>
                    <p className="text-[10px] text-white/50 mt-1">
                        {milestones.find(m => m.status === 'current')?.detail}
                    </p>
                </motion.div>
            )}
        </GlassCard>
    );
}

// ============================================
// Chart Component
// ============================================

interface CurveChartProps {
    timepoints: CurveTimepoint[];
    selectedMetrics: (keyof typeof METRIC_LABELS)[];
}

function CurveChart({ timepoints, selectedMetrics }: CurveChartProps) {
    const chartData = useMemo(() => {
        return timepoints.map(tp => ({
            week: `W${tp.week}`,
            ...Object.fromEntries(
                Object.entries(tp.metrics).map(([key, val]) => [key, val.value])
            ),
        }));
    }, [timepoints]);

    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white/80">预测曲线</h3>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <defs>
                            {selectedMetrics.map(metric => {
                                const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '').replace('Stability', '').replace('Level', '').toLowerCase();
                                const color = COLORS[colorKey as keyof typeof COLORS] || '#6366f1';
                                return (
                                    <linearGradient key={metric} id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <XAxis
                            dataKey="week"
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
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                            }}
                            labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                            itemStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                        {selectedMetrics.map(metric => {
                            const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '').replace('Stability', '').replace('Level', '').toLowerCase();
                            const color = COLORS[colorKey as keyof typeof COLORS] || '#6366f1';
                            return (
                                <Area
                                    key={metric}
                                    type="monotone"
                                    dataKey={metric}
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${metric})`}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4">
                {selectedMetrics.map(metric => {
                    const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '').replace('Stability', '').replace('Level', '').toLowerCase();
                    const color = COLORS[colorKey as keyof typeof COLORS] || '#6366f1';
                    return (
                        <div key={metric} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[10px] text-white/50">{METRIC_LABELS[metric]}</span>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );
}

// ============================================
// Summary Stats Component
// ============================================

interface SummaryStatsProps {
    summaryStats: DigitalTwinCurveOutput['D_metricEndpoints']['summaryStats'];
}

function SummaryStats({ summaryStats }: SummaryStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-3 text-center">
                <p className="text-[10px] text-white/50 mb-1">整体改善</p>
                <p className="text-lg font-bold text-emerald-400">
                    {summaryStats.overallImprovement.value !== null
                        ? `+${summaryStats.overallImprovement.value.toFixed(1)}`
                        : 'N/A'}
                </p>
                <p className="text-[10px] text-white/40">分</p>
            </GlassCard>

            <GlassCard className="p-3 text-center">
                <p className="text-[10px] text-white/50 mb-1">首次见效</p>
                <p className="text-lg font-bold text-violet-400">
                    {summaryStats.daysToFirstResult.value ?? 'N/A'}
                </p>
                <p className="text-[10px] text-white/40">天</p>
            </GlassCard>

            <GlassCard className="p-3 text-center">
                <p className="text-[10px] text-white/50 mb-1">坚持度</p>
                <p className="text-lg font-bold text-fuchsia-400">
                    {summaryStats.consistencyScore.value ?? 0}
                </p>
                <p className="text-[10px] text-white/40">%</p>
            </GlassCard>
        </div>
    );
}

// ============================================
// Baseline Scales Component
// ============================================

interface BaselineScalesProps {
    scales: DigitalTwinCurveOutput['C_participantBaselineData']['scales'];
}

function BaselineScales({ scales }: BaselineScalesProps) {
    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white/80">基线量表</h3>
            </div>

            <div className="space-y-3">
                {scales.map(scale => (
                    <div key={scale.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80 font-medium">{scale.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                                {scale.interpretation}
                            </span>
                        </div>
                        <span className="text-lg font-bold text-white">
                            {scale.value ?? 'N/A'}
                        </span>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}

// ============================================
// Data Quality Banner
// ============================================

interface DataQualityBannerProps {
    curveData: DigitalTwinCurveOutput;
}

function DataQualityBanner({ curveData }: DataQualityBannerProps) {
    const { isGood, warnings } = getDataQualityStatus(curveData);

    if (isGood) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30"
        >
            <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div>
                    <p className="text-xs text-amber-300 font-medium">数据质量提示</p>
                    <ul className="text-[10px] text-white/60 mt-1 space-y-0.5">
                        {warnings.slice(0, 2).map((w, i) => (
                            <li key={i}>• {w}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// Main Component
// ============================================

export function ViewDigitalTwin() {
    const { curveData, isLoading, error, generateCurve, refreshCurve } = useDigitalTwinCurve();
    const [selectedMetrics, setSelectedMetrics] = useState<(keyof typeof METRIC_LABELS)[]>([
        'anxietyScore',
        'sleepQuality',
        'moodStability',
    ]);
    const [detailMetric, setDetailMetric] = useState<keyof typeof METRIC_LABELS | null>(null);

    useEffect(() => {
        generateCurve();
    }, [generateCurve]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <Brain className="w-12 h-12 text-violet-400" />
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4 flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
                <p className="text-white/60 text-center mb-4">{error}</p>
                <button
                    onClick={() => generateCurve()}
                    className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm"
                >
                    重试
                </button>
            </div>
        );
    }

    // No data state
    if (!curveData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4 flex flex-col items-center justify-center">
                <Brain className="w-12 h-12 text-violet-400/50 mb-4" />
                <p className="text-white/60 text-center">尚无预测数据</p>
            </div>
        );
    }

    const week0 = curveData.A_predictedLongitudinalOutcomes.timepoints[0];
    const currentWeek = curveData.meta.currentWeek;
    const currentTimepoint = curveData.A_predictedLongitudinalOutcomes.timepoints.find(
        tp => tp.week === Math.floor((currentWeek || 0) / 3) * 3
    ) || week0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
            <AnimatePresence>
                {detailMetric && curveData && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
                        className="fixed inset-0 z-50 bg-slate-900"
                    >
                        <ViewDigitalTwinDetail
                            curveData={curveData}
                            metricKey={detailMetric}
                            onBack={() => setDetailMetric(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-20 px-4 py-4 bg-black/20 backdrop-blur-xl border-b border-white/10"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/20">
                            <Brain className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">数字孪生</h1>
                            <p className="text-xs text-white/50">
                                规则版本 {curveData.meta.ruleVersion}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => refreshCurve()}
                        className="p-2 rounded-xl bg-white/10 active:bg-white/20"
                    >
                        <RefreshCw className="w-5 h-5 text-white/60" />
                    </button>
                </div>
            </motion.header>

            {/* Content */}
            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 pb-24 space-y-4"
            >
                {/* Data Quality Banner */}
                <DataQualityBanner curveData={curveData} />

                {/* Summary Stats */}
                <SummaryStats summaryStats={curveData.D_metricEndpoints.summaryStats} />

                {/* Prediction Chart */}
                <CurveChart
                    timepoints={curveData.A_predictedLongitudinalOutcomes.timepoints}
                    selectedMetrics={selectedMetrics}
                />

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        metricKey="anxietyScore"
                        value={currentTimepoint.metrics.anxietyScore.value}
                        confidence={currentTimepoint.metrics.anxietyScore.confidence}
                        isNegative={true}
                        week0Value={week0.metrics.anxietyScore.value}
                        onClick={() => setDetailMetric('anxietyScore')}
                    />
                    <MetricCard
                        metricKey="sleepQuality"
                        value={currentTimepoint.metrics.sleepQuality.value}
                        confidence={currentTimepoint.metrics.sleepQuality.confidence}
                        week0Value={week0.metrics.sleepQuality.value}
                        onClick={() => setDetailMetric('sleepQuality')}
                    />
                    <MetricCard
                        metricKey="moodStability"
                        value={currentTimepoint.metrics.moodStability.value}
                        confidence={currentTimepoint.metrics.moodStability.confidence}
                        week0Value={week0.metrics.moodStability.value}
                        onClick={() => setDetailMetric('moodStability')}
                    />
                    <MetricCard
                        metricKey="energyLevel"
                        value={currentTimepoint.metrics.energyLevel.value}
                        confidence={currentTimepoint.metrics.energyLevel.confidence}
                        week0Value={week0.metrics.energyLevel.value}
                        onClick={() => setDetailMetric('energyLevel')}
                    />
                </div>

                {/* Timeline */}
                <Timeline
                    milestones={curveData.B_timeSinceBaselineVisit.milestones}
                    currentWeek={currentWeek}
                />

                {/* Baseline Scales */}
                <BaselineScales scales={curveData.C_participantBaselineData.scales} />
            </motion.main>
        </div>
    );
}

export default ViewDigitalTwin;
