'use client';

/**
 * Desktop Digital Twin Visualization Component
 * 
 * PC 端数字孪生曲线可视化组件
 * 展示四个视图 (A/B/C/D) 的预测数据
 * 
 * Features:
 * - 6 指标预测曲线图
 * - 里程碑时间线
 * - 基线量表数据
 * - 汇总统计卡片
 * - Shadcn UI 组件
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
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
    RefreshCw,
    Info,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import { useDigitalTwinCurve, getDataQualityStatus, getCurrentMilestone, getNextMilestone } from '@/hooks/domain';
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
    anxietyScore: 'Anxiety Score',
    sleepQuality: 'Sleep Quality',
    stressResilience: 'Stress Resilience',
    moodStability: 'Mood Stability',
    energyLevel: 'Energy Level',
    hrvScore: 'HRV Index',
};

const METRIC_LABELS_CN = {
    anxietyScore: '焦虑评分',
    sleepQuality: '睡眠质量',
    stressResilience: '抗压韧性',
    moodStability: '情绪稳定',
    energyLevel: '能量水平',
    hrvScore: 'HRV 代理',
};

// ============================================
// Loading Skeleton
// ============================================

function DigitalTwinSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-10 w-24" />
            </div>

            {/* Summary Stats Skeleton */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6 text-center">
                            <Skeleton className="h-4 w-20 mx-auto mb-2" />
                            <Skeleton className="h-8 w-16 mx-auto" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
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

interface ErrorDisplayProps {
    error: string;
    onRetry: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
            <Card className="max-w-md w-full bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-amber-800 dark:text-amber-200 mb-4">
                        {error}
                    </p>
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Improvement</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {summaryStats.overallImprovement.value !== null
                            ? `+${summaryStats.overallImprovement.value.toFixed(1)}`
                            : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">points</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Days to First Result</p>
                    <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                        {summaryStats.daysToFirstResult.value ?? 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">days</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-600/5 border-fuchsia-500/20">
                <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Consistency Score</p>
                    <p className="text-3xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        {summaryStats.consistencyScore.value ?? 0}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">%</p>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================
// Metric Card Component
// ============================================

interface MetricCardProps {
    metricKey: keyof typeof METRIC_LABELS;
    value: number | null;
    confidence: string;
    isNegative?: boolean;
    week0Value?: number | null;
    isInferred?: boolean;
}

function MetricCard({ metricKey, value, confidence, isNegative, week0Value, isInferred }: MetricCardProps) {
    const Icon = METRIC_ICONS[metricKey];
    const label = METRIC_LABELS[metricKey];

    // Handle null value
    const displayValue = value ?? 0;
    const compareValue = week0Value ?? displayValue;

    // Calculate trend
    const trend = week0Value !== undefined && week0Value !== null && value !== null
        ? isNegative
            ? value < week0Value ? 'improving' : value > week0Value ? 'declining' : 'stable'
            : value > week0Value ? 'improving' : value < week0Value ? 'declining' : 'stable'
        : 'stable';

    const trendConfig = {
        improving: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Improving', Icon: TrendingUp },
        stable: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Stable', Icon: Activity },
        declining: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Attention', Icon: TrendingDown },
    };

    const colorKey = metricKey.replace('Score', '').replace('Quality', '').replace('Resilience', '')
        .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
    const color = COLORS[colorKey] || '#6366f1';

    return (
        <Card className={cn(
            "hover:shadow-md transition-shadow",
            isInferred && "border-amber-200 dark:border-amber-800/50"
        )}>
            <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex items-center gap-1">
                        {isInferred && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                推断值
                            </span>
                        )}
                        <div className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full', trendConfig[trend].bg, trendConfig[trend].color)}>
                            {React.createElement(trendConfig[trend].Icon, { className: 'w-3 h-3' })}
                            <span>{trendConfig[trend].label}</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value !== null ? value.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-sm text-gray-400">/ 100</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    CI: ±{confidence.split('±')[1]?.trim() || '8.0'}
                </p>
            </CardContent>
        </Card>
    );
}

// ============================================
// Curve Chart Component
// ============================================

interface CurveChartProps {
    timepoints: CurveTimepoint[];
    selectedMetrics: (keyof typeof METRIC_LABELS)[];
    onMetricToggle: (metric: keyof typeof METRIC_LABELS) => void;
}

function CurveChart({ timepoints, selectedMetrics, onMetricToggle }: CurveChartProps) {
    const chartData = useMemo(() => {
        return timepoints.map(tp => ({
            week: `Week ${tp.week}`,
            ...Object.fromEntries(
                Object.entries(tp.metrics).map(([key, val]) => [key, val.value])
            ),
        }));
    }, [timepoints]);

    const allMetrics = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-500" />
                    <CardTitle>Prediction Curves</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {/* Metric Toggle Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {allMetrics.map(metric => {
                        const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                            .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                        const color = COLORS[colorKey] || '#6366f1';
                        const isSelected = selectedMetrics.includes(metric);

                        return (
                            <button
                                key={metric}
                                onClick={() => onMetricToggle(metric)}
                                className={cn(
                                    'px-3 py-1.5 text-xs rounded-full border transition-all',
                                    isSelected
                                        ? 'border-transparent text-white'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                )}
                                style={isSelected ? { backgroundColor: color } : {}}
                            >
                                {METRIC_LABELS[metric]}
                            </button>
                        );
                    })}
                </div>

                {/* Chart */}
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                {selectedMetrics.map(metric => {
                                    const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                                        .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                                    const color = COLORS[colorKey] || '#6366f1';
                                    return (
                                        <linearGradient key={metric} id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis
                                dataKey="week"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    backdropFilter: 'blur(10px)',
                                }}
                                labelStyle={{ color: '#f3f4f6' }}
                                itemStyle={{ color: '#d1d5db' }}
                            />
                            {selectedMetrics.map(metric => {
                                const colorKey = metric.replace('Score', '').replace('Quality', '').replace('Resilience', '')
                                    .replace('Stability', '').replace('Level', '').toLowerCase() as keyof typeof COLORS;
                                const color = COLORS[colorKey] || '#6366f1';
                                return (
                                    <Area
                                        key={metric}
                                        type="monotone"
                                        dataKey={metric}
                                        name={METRIC_LABELS[metric]}
                                        stroke={color}
                                        strokeWidth={2}
                                        fill={`url(#gradient-${metric})`}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
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
    const progressPercent = Math.min(((currentWeek || 0) / 15) * 100, 100);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Clock className="w-5 h-5 text-violet-500" />
                <CardTitle>Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Progress Bar */}
                <div className="relative mb-6">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                            className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Milestone Dots */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ marginTop: '-3px' }}>
                        {milestones.map((milestone) => (
                            <div
                                key={milestone.week}
                                className={cn(
                                    'w-4 h-4 rounded-full flex items-center justify-center z-10',
                                    milestone.status === 'completed' && 'bg-emerald-500',
                                    milestone.status === 'current' && 'bg-violet-500 ring-4 ring-violet-500/30',
                                    milestone.status === 'upcoming' && 'bg-gray-300 dark:bg-gray-600'
                                )}
                            >
                                {milestone.status === 'completed' && (
                                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Milestone Labels */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    {milestones.map((milestone) => (
                        <div key={milestone.week} className="text-center" style={{ width: '60px' }}>
                            <p className="font-medium">W{milestone.week}</p>
                        </div>
                    ))}
                </div>

                {/* Current Milestone Info */}
                {milestones.find(m => m.status === 'current') && (
                    <div className="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                            {milestones.find(m => m.status === 'current')?.event}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {milestones.find(m => m.status === 'current')?.detail}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// Baseline Scales Component
// ============================================

interface BaselineScalesProps {
    scales: DigitalTwinCurveOutput['C_participantBaselineData']['scales'];
}

function BaselineScales({ scales }: BaselineScalesProps) {
    const interpretationColors: Record<string, string> = {
        'minimal': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'mild': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        'moderate': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'severe': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'moderately severe': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'none/minimal': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'subthreshold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        'clinical insomnia (moderate)': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'clinical insomnia (severe)': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'low': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'high': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'missing': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    };

    // Safely extract a displayable string from any value
    const safeString = (val: unknown): string => {
        if (val === null || val === undefined) return 'N/A';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object') {
            // Handle {score, interpretation, updatedAt} objects
            const obj = val as Record<string, unknown>;
            if ('interpretation' in obj && typeof obj.interpretation === 'string') {
                return obj.interpretation;
            }
            if ('score' in obj && typeof obj.score === 'number') {
                return String(obj.score);
            }
            if ('value' in obj && typeof obj.value === 'number') {
                return String(obj.value);
            }
            return 'N/A';
        }
        return String(val);
    };

    // Safely extract numeric value
    const safeValue = (val: unknown): string => {
        if (val === null || val === undefined) return 'N/A';
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            const obj = val as Record<string, unknown>;
            if ('score' in obj && typeof obj.score === 'number') {
                return String(obj.score);
            }
            if ('value' in obj && typeof obj.value === 'number') {
                return String(obj.value);
            }
        }
        return 'N/A';
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Info className="w-5 h-5 text-violet-500" />
                <CardTitle>Baseline Scales</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {scales.map((scale, index) => {
                        const interpretationText = safeString(scale.interpretation);
                        const valueText = safeValue(scale.value);
                        const scaleName = typeof scale.name === 'string' ? scale.name : `Scale ${index + 1}`;

                        return (
                            <div key={scaleName} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900 dark:text-white">{scaleName}</span>
                                    <span className={cn(
                                        'text-xs px-2 py-0.5 rounded-full',
                                        interpretationColors[interpretationText.toLowerCase()] || 'bg-gray-100 text-gray-500'
                                    )}>
                                        {interpretationText}
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {valueText}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// Methodology Section Component
// ============================================

const METHODOLOGY_DATA = {
    dataSource: [
        { metric: '焦虑评分', source: 'GAD-7量表 + 每日压力校准', realData: true, formula: '(GAD-7/21)×100' },
        { metric: '睡眠质量', source: 'ISI量表 + 每日睡眠评分', realData: true, formula: '70%×量表分 + 30%×日均评分' },
        { metric: '情绪稳定', source: 'PHQ-9量表 + 每日心情', realData: true, formula: '100-(PHQ-9/27)×100，融合日均心情' },
        { metric: '抗压韧性', source: 'PSS-10量表 + 每日压力', realData: true, formula: '100-(PSS-10/40)×100' },
        { metric: '能量水平', source: '每日能量校准', realData: true, formula: '日均能量×10' },
        { metric: 'HRV指数', source: '⚠️ 推断值（无可穿戴设备）', realData: false, formula: '0.3×睡眠 + 0.3×(100-焦虑) + 0.4×能量' },
    ],
    predictionModel: {
        name: '指数衰减恢复模型',
        formula: 'y(t) = 目标值 + (当前值 - 目标值) × e^(-k×t)',
        description: '模拟心理干预的渐进恢复过程，初期改善快，后期趋于稳定',
        kValue: '0.12 × 趋势因子（改善中=1.15，稳定=1.0，下降=0.85）',
        horizon: '15周（符合CBT标准疗程12-16周）',
    },
    references: [
        { name: 'GAD-7', citation: 'Spitzer et al., 2006. Archives of Internal Medicine', use: '焦虑严重程度筛查' },
        { name: 'PHQ-9', citation: 'Kroenke et al., 2001. Journal of General Internal Medicine', use: '抑郁症状评估' },
        { name: 'ISI', citation: 'Morin et al., 2011. Sleep', use: '失眠严重程度指数' },
        { name: 'PSS-10', citation: 'Cohen et al., 1983. Journal of Health and Social Behavior', use: '感知压力量表' },
    ],
};

function MethodologySection() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-900/10">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-violet-500" />
                        <CardTitle className="text-base">计算方法 & 科学依据</CardTitle>
                    </div>
                    <ChevronRight className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        isExpanded && "rotate-90"
                    )} />
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-6 pt-0">
                    {/* Data Sources */}
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 数据来源</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 dark:text-gray-400">
                                        <th className="pb-2">指标</th>
                                        <th className="pb-2">来源</th>
                                        <th className="pb-2">计算公式</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {METHODOLOGY_DATA.dataSource.map((item) => (
                                        <tr key={item.metric} className={item.realData ? '' : 'bg-amber-50/50 dark:bg-amber-900/10'}>
                                            <td className="py-2 font-medium text-gray-900 dark:text-white">
                                                {item.metric}
                                                {!item.realData && <span className="ml-1 text-xs text-amber-500">⚠️推断</span>}
                                            </td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300">{item.source}</td>
                                            <td className="py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{item.formula}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Prediction Model */}
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">📈 预测模型</h4>
                        <div className="p-4 rounded-lg bg-gradient-to-r from-violet-100/50 to-purple-100/50 dark:from-violet-900/20 dark:to-purple-900/20">
                            <p className="font-medium text-violet-700 dark:text-violet-300 mb-2">
                                {METHODOLOGY_DATA.predictionModel.name}
                            </p>
                            <div className="font-mono text-sm bg-white/80 dark:bg-gray-900/50 p-3 rounded border mb-3">
                                {METHODOLOGY_DATA.predictionModel.formula}
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <li>• <strong>原理</strong>: {METHODOLOGY_DATA.predictionModel.description}</li>
                                <li>• <strong>衰减系数k</strong>: {METHODOLOGY_DATA.predictionModel.kValue}</li>
                                <li>• <strong>预测周期</strong>: {METHODOLOGY_DATA.predictionModel.horizon}</li>
                            </ul>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                                💡 你只录入了7天数据，系统据此预测未来15周趋势。这是基于当前状态的「可能发展曲线」，不是确定结果。
                            </p>
                        </div>
                    </div>

                    {/* Scientific References */}
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">📚 参考文献</h4>
                        <div className="grid gap-2">
                            {METHODOLOGY_DATA.references.map((ref) => (
                                <div key={ref.name} className="p-2 rounded bg-gray-50 dark:bg-gray-800/50 text-sm">
                                    <span className="font-medium text-gray-900 dark:text-white">{ref.name}</span>
                                    <span className="text-gray-400 mx-2">|</span>
                                    <span className="text-gray-500 dark:text-gray-400">{ref.use}</span>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{ref.citation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>⚠️ 重要说明</strong>: 所有预测基于统计模型，仅供参考。HRV指数为推断值（需接入可穿戴设备获取真实数据）。
                            实际恢复进度因人而异，建议定期完成每日校准以提高预测准确度。
                        </p>
                    </div>
                </CardContent>
            )}
        </Card>
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
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Data Quality Notice</p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-0.5">
                        {warnings.slice(0, 3).map((w, i) => (
                            <li key={i}>• {w}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export function DesktopDigitalTwin() {
    const { curveData, isLoading, error, generateCurve, refreshCurve } = useDigitalTwinCurve();
    const [selectedMetrics, setSelectedMetrics] = useState<(keyof typeof METRIC_LABELS)[]>([
        'anxietyScore',
        'sleepQuality',
        'moodStability',
    ]);

    useEffect(() => {
        generateCurve();
    }, [generateCurve]);

    const handleMetricToggle = (metric: keyof typeof METRIC_LABELS) => {
        setSelectedMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    };

    // Loading state
    if (isLoading) {
        return <DigitalTwinSkeleton />;
    }

    // Error state
    if (error) {
        return <ErrorDisplay error={error} onRetry={() => generateCurve()} />;
    }

    // No data state
    if (!curveData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
                <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No prediction data available</p>
                <Button variant="outline" onClick={() => generateCurve()} className="mt-4">
                    Generate Prediction
                </Button>
            </div>
        );
    }

    const week0 = curveData.A_predictedLongitudinalOutcomes.timepoints[0];
    const currentWeek = curveData.meta.currentWeek;
    const currentTimepoint = curveData.A_predictedLongitudinalOutcomes.timepoints.find(
        tp => tp.week === Math.floor((currentWeek || 0) / 3) * 3
    ) || week0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <Brain className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Digital Twin
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Rule Version {curveData.meta.ruleVersion}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refreshCurve()}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Data Quality Banner */}
            <DataQualityBanner curveData={curveData} />

            {/* Summary Stats */}
            <SummaryStats summaryStats={curveData.D_metricEndpoints.summaryStats} />

            {/* Chart */}
            <CurveChart
                timepoints={curveData.A_predictedLongitudinalOutcomes.timepoints}
                selectedMetrics={selectedMetrics}
                onMetricToggle={handleMetricToggle}
            />

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard
                    metricKey="anxietyScore"
                    value={currentTimepoint.metrics.anxietyScore.value}
                    confidence={currentTimepoint.metrics.anxietyScore.confidence}
                    isNegative={true}
                    week0Value={week0.metrics.anxietyScore.value}
                />
                <MetricCard
                    metricKey="sleepQuality"
                    value={currentTimepoint.metrics.sleepQuality.value}
                    confidence={currentTimepoint.metrics.sleepQuality.confidence}
                    week0Value={week0.metrics.sleepQuality.value}
                />
                <MetricCard
                    metricKey="stressResilience"
                    value={currentTimepoint.metrics.stressResilience.value}
                    confidence={currentTimepoint.metrics.stressResilience.confidence}
                    week0Value={week0.metrics.stressResilience.value}
                />
                <MetricCard
                    metricKey="moodStability"
                    value={currentTimepoint.metrics.moodStability.value}
                    confidence={currentTimepoint.metrics.moodStability.confidence}
                    week0Value={week0.metrics.moodStability.value}
                />
                <MetricCard
                    metricKey="energyLevel"
                    value={currentTimepoint.metrics.energyLevel.value}
                    confidence={currentTimepoint.metrics.energyLevel.confidence}
                    week0Value={week0.metrics.energyLevel.value}
                />
                <MetricCard
                    metricKey="hrvScore"
                    value={currentTimepoint.metrics.hrvScore.value}
                    confidence={currentTimepoint.metrics.hrvScore.confidence}
                    week0Value={week0.metrics.hrvScore.value}
                    isInferred={true}
                />
            </div>

            {/* Timeline and Baseline in 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Timeline
                    milestones={curveData.B_timeSinceBaselineVisit.milestones}
                    currentWeek={currentWeek}
                />
                <BaselineScales scales={curveData.C_participantBaselineData.scales} />
            </div>

            {/* Methodology & Science */}
            <MethodologySection />
        </div>
    );
}

export default DesktopDigitalTwin;
