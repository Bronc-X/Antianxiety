/**
 * Digital Twin Curve Output Generator
 * 
 * 汇总曲线引擎计算结果，生成完整的四视图结构化输出
 * 
 * @module lib/digital-twin/curve-output-generator
 */

import type {
    AggregatedUserData,
    CalibrationData,
} from '@/types/digital-twin';

import type {
    DigitalTwinCurveOutput,
    CurveMeta,
    DataQualityFlags,
    PredictedLongitudinalOutcomes,
    TimelineView,
    TimelineMilestone,
    ParticipantBaselineView,
    MetricEndpointsView,
    CurveTimepoint,
    TimepointMetrics,
    ChartDataPoint,
    SchemaField,
    Week0Values,
} from '@/types/digital-twin-curve';

import type { ConfidenceInputs } from './curve-engine';


import {
    PREDICTION_WEEKS,
    calculateWeek0Values,
    calculateCurveParams,
    predictExponentialValue,
    generatePrediction,
    interpretGAD7,
    interpretPHQ9,
    interpretISI,
    interpretPSS10,
    calculateOverallImprovement,
    calculateDaysToFirstResult,
    calculateConsistencyScore,
    round1,
    clamp,
    adaptiveNormalize,
} from './curve-engine';

// ============================================
// 常量
// ============================================

const RULE_VERSION = 'dtwin_rules_v1.0';

const MILESTONE_EVENTS = [
    { week: 0, event: 'Baseline assessment', detail: 'Baseline scores inferred from profiles.inferred_scale_scores' },
    { week: 3, event: 'Week-3 review', detail: 'Use last-14-day calibration trend + conversation trend to recalibrate k/targets' },
    { week: 6, event: 'Week-6 review', detail: 'Recommend re-check insomnia/stress signals; optionally re-administer short scales' },
    { week: 9, event: 'Week-9 mid review', detail: 'Check plateau or shock events; update predictions if trend flips' },
    { week: 12, event: 'Week-12 re-assessment', detail: 'Prefer re-administer GAD-7/PHQ-9/ISI; update baseline deltas for endpoints' },
    { week: 15, event: 'Week-15 closeout', detail: 'Finalize predicted outcomes + observed endpoints; compute overallImprovement' },
];

// ============================================
// 主入口函数
// ============================================

/**
 * 生成完整的数字孪生曲线输出
 */
export function generateCurveOutput(
    userData: AggregatedUserData,
    conversationTrend: 'improving' | 'stable' | 'declining' | null = null
): DigitalTwinCurveOutput {
    // 提取对话趋势（如果未提供则从 userData 获取）
    const emotionTrend = conversationTrend ?? userData.conversationSummary?.emotionalTrend ?? null;

    // 生成元数据
    const meta = generateMeta(userData);

    // 计算 Week 0 基线值
    const week0 = calculateWeek0Values(userData.baseline, userData.calibrations);

    // 计算曲线参数
    const curveParams = calculateCurveParams(week0, userData.calibrations, emotionTrend);

    // 构建置信度输入
    const baseConfidenceInputs = buildBaseConfidenceInputs(userData, meta);

    // 生成四个视图
    const A_predictedLongitudinalOutcomes = generateViewA(week0, curveParams, baseConfidenceInputs);
    const B_timeSinceBaselineVisit = generateViewB(meta.currentWeek, userData.baseline);
    const C_participantBaselineData = generateViewC(userData);
    const D_metricEndpoints = generateViewD(userData, week0, curveParams, meta);

    // 生成 Schema
    const schema = generateSchema();

    return {
        meta,
        A_predictedLongitudinalOutcomes,
        B_timeSinceBaselineVisit,
        C_participantBaselineData,
        D_metricEndpoints,
        schema,
    };
}

// ============================================
// Meta 生成
// ============================================

function generateMeta(userData: AggregatedUserData): CurveMeta {
    const now = new Date();

    // 确定基线日期
    let baselineDate: string | null = null;
    let daysSinceBaseline: number | null = null;
    let currentWeek: number | null = null;

    // 优先级：1. 基线评估日期, 2. 第一条校准记录
    if (userData.baseline?.assessmentDate) {
        baselineDate = userData.baseline.assessmentDate;
    } else if (userData.calibrations.length > 0) {
        baselineDate = userData.calibrations[0].date;
    }

    if (baselineDate) {
        const baseline = new Date(baselineDate);
        daysSinceBaseline = Math.floor((now.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24));
        currentWeek = Math.floor(daysSinceBaseline / 7);
    }

    // 数据质量标记
    const dataQualityFlags = generateDataQualityFlags(userData);

    return {
        ruleVersion: RULE_VERSION,
        asOfDate: now.toISOString().split('T')[0],
        baselineDate: baselineDate ? new Date(baselineDate).toISOString().split('T')[0] : null,
        daysSinceBaseline,
        currentWeek,
        dataQualityFlags,
    };
}

function generateDataQualityFlags(userData: AggregatedUserData): DataQualityFlags {
    const baselineMissing: string[] = [];

    if (!userData.baseline) {
        baselineMissing.push('GAD-7', 'PHQ-9', 'ISI', 'PSS-10');
    } else {
        if (userData.baseline.gad7Score === 0 || userData.baseline.gad7Score === null) {
            baselineMissing.push('GAD-7');
        }
        if (userData.baseline.phq9Score === 0 || userData.baseline.phq9Score === null) {
            baselineMissing.push('PHQ-9');
        }
        if (userData.baseline.isiScore === 0 || userData.baseline.isiScore === null) {
            baselineMissing.push('ISI');
        }
    }

    const pss10Missing = !userData.baseline?.pss10Score || userData.baseline.pss10Score === 0;

    return {
        baselineMissing,
        dailyCalibrationSparse: userData.calibrations.length < 7,
        conversationTrendMissing: !userData.conversationSummary?.emotionalTrend,
        pss10Missing,
        hrvIsInferred: true, // 始终为推断值，除非接入真实 HRV 设备
    };
}

// ============================================
// 置信度输入构建
// ============================================

function buildBaseConfidenceInputs(
    userData: AggregatedUserData,
    meta: CurveMeta
): Omit<ConfidenceInputs, 'week'> {
    // 计算最近 14 天完成度
    const last14Days = userData.calibrations.slice(-14);
    const completenessLast14 = Math.min(last14Days.length / 14, 1);

    // 计算波动度
    let recentVolatility = 0;
    if (last14Days.length >= 3) {
        const moodValues = last14Days.map(c => adaptiveNormalize(c.moodScore));
        const mean = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
        const variance = moodValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / moodValues.length;
        const std = Math.sqrt(variance);
        recentVolatility = clamp(std / 30, 0, 1); // 标准化到 0-1
    }

    return {
        completenessLast14,
        baselineMissing: meta.dataQualityFlags.baselineMissing.length > 0,
        hrvIsInferred: meta.dataQualityFlags.hrvIsInferred,
        recentVolatility,
        hasShock: false, // TODO: 从 inquiry sessions 检测冲击事件
    };
}

// ============================================
// View A: 纵向预测生成
// ============================================

function generateViewA(
    week0: Week0Values,
    curveParams: ReturnType<typeof calculateCurveParams>,
    baseConfidenceInputs: Omit<ConfidenceInputs, 'week'>
): PredictedLongitudinalOutcomes {
    const timepoints: CurveTimepoint[] = PREDICTION_WEEKS.map(week => {
        const confidenceInputs: ConfidenceInputs = {
            ...baseConfidenceInputs,
            week,
        };

        const metrics: TimepointMetrics = {
            anxietyScore: generatePrediction(
                predictExponentialValue(week0.anxietyScore, curveParams.targets.anxietyScore, curveParams.k.anxietyScore, week),
                { ...confidenceInputs, baselineMissing: baseConfidenceInputs.baselineMissing }
            ),
            sleepQuality: generatePrediction(
                predictExponentialValue(week0.sleepQuality, curveParams.targets.sleepQuality, curveParams.k.sleepQuality, week),
                confidenceInputs
            ),
            stressResilience: generatePrediction(
                predictExponentialValue(week0.stressResilience, curveParams.targets.stressResilience, curveParams.k.stressResilience, week),
                confidenceInputs
            ),
            moodStability: generatePrediction(
                predictExponentialValue(week0.moodStability, curveParams.targets.moodStability, curveParams.k.moodStability, week),
                confidenceInputs
            ),
            energyLevel: generatePrediction(
                predictExponentialValue(week0.energyLevel, curveParams.targets.energyLevel, curveParams.k.energyLevel, week),
                confidenceInputs
            ),
            hrvScore: generatePrediction(
                predictExponentialValue(week0.hrvScore, curveParams.targets.hrvScore, curveParams.k.hrvScore, week),
                { ...confidenceInputs, hrvIsInferred: true } // HRV 总是推断
            ),
        };

        return { week, metrics };
    });

    return {
        timepoints,
        curveModel: {
            shape: 'exponential_to_target_with_shock',
            kRangePerWeek: [0.04, 0.25],
            targetHorizonWeeks: 15,
            trendWindowDays: 14,
            notes: [
                'Positive metrics (sleepQuality/stressResilience/moodStability/energy/hrv) increase toward target.',
                'anxietyScore is severity (higher=worse), decreases toward target.',
            ],
        },
    };
}

// ============================================
// View B: 时间线生成
// ============================================

function generateViewB(
    currentWeek: number | null,
    baseline: AggregatedUserData['baseline']
): TimelineView {
    const milestones: TimelineMilestone[] = MILESTONE_EVENTS.map(event => {
        let status: 'completed' | 'current' | 'upcoming';

        if (currentWeek === null) {
            status = 'upcoming';
        } else if (event.week < currentWeek) {
            status = 'completed';
        } else if (event.week === currentWeek) {
            status = 'current';
        } else {
            status = 'upcoming';
        }

        // Week 0 的实际得分
        let actualScore = null;
        if (event.week === 0 && baseline) {
            actualScore = {
                'GAD-7': baseline.gad7Score || null,
                'PHQ-9': baseline.phq9Score || null,
                'ISI': baseline.isiScore || null,
                'PSS-10': baseline.pss10Score || null,
            };
        }

        return {
            week: event.week,
            event: event.event,
            status,
            detail: event.detail,
            actualScore,
        };
    });

    return { milestones };
}

// ============================================
// View C: 基线数据生成
// ============================================

function generateViewC(userData: AggregatedUserData): ParticipantBaselineView {
    const baseline = userData.baseline;

    return {
        scales: [
            {
                name: 'GAD-7',
                value: baseline?.gad7Score ?? null,
                interpretation: interpretGAD7(baseline?.gad7Score ?? null),
            },
            {
                name: 'PHQ-9',
                value: baseline?.phq9Score ?? null,
                interpretation: interpretPHQ9(baseline?.phq9Score ?? null),
            },
            {
                name: 'ISI',
                value: baseline?.isiScore ?? null,
                interpretation: interpretISI(baseline?.isiScore ?? null),
            },
            {
                name: 'PSS-10',
                value: baseline?.pss10Score ?? null,
                interpretation: interpretPSS10(baseline?.pss10Score ?? null),
            },
        ],
        vitals: {}, // 暂无生物指标数据
    };
}

// ============================================
// View D: 指标终点生成
// ============================================

function generateViewD(
    userData: AggregatedUserData,
    week0: Week0Values,
    curveParams: ReturnType<typeof calculateCurveParams>,
    meta: CurveMeta
): MetricEndpointsView {
    const calibrations = userData.calibrations;

    // 生成图表数据
    const charts = {
        anxietyTrend: generateChartTrend(
            'anxiety',
            week0.anxietyScore,
            curveParams.targets.anxietyScore,
            curveParams.k.anxietyScore,
            calibrations,
            '0-100 severity (higher=worse)'
        ),
        sleepTrend: generateChartTrend(
            'sleep',
            week0.sleepQuality,
            curveParams.targets.sleepQuality,
            curveParams.k.sleepQuality,
            calibrations,
            '0-100 (higher=better)'
        ),
        hrvTrend: generateHrvChartTrend(
            week0.hrvScore,
            curveParams.targets.hrvScore,
            curveParams.k.hrvScore
        ),
        energyTrend: generateChartTrend(
            'energy',
            week0.energyLevel,
            curveParams.targets.energyLevel,
            curveParams.k.energyLevel,
            calibrations,
            '0-100 (higher=better)'
        ),
    };

    // 生成汇总统计
    const summaryStats = generateSummaryStats(userData, week0, curveParams, meta);

    return { charts, summaryStats };
}

function generateChartTrend(
    type: 'anxiety' | 'sleep' | 'energy',
    baseline: number,
    target: number,
    k: number,
    calibrations: CalibrationData[],
    unit: string
): { unit: string; points: ChartDataPoint[] } {
    const points: ChartDataPoint[] = [];

    // Week 0 基线点
    points.push({
        week: 0,
        source: calibrations.length > 0 ? 'baselineScale+daily' : 'baselineScale',
        value: round1(baseline),
        confidence: null,
    });

    // 添加观测数据点（按周聚合）
    if (calibrations.length > 0) {
        const weeklyData = aggregateCalibrationsByWeek(calibrations, type);
        for (const [week, value] of Object.entries(weeklyData)) {
            const weekNum = parseInt(week);
            if (weekNum > 0 && weekNum < 3) { // 仅填充未来预测前的观测
                points.push({
                    week: weekNum,
                    source: 'dailyCalibration',
                    value: round1(value),
                    confidence: null,
                });
            }
        }
    }

    // 添加预测点
    for (const week of [3, 6, 9, 12, 15]) {
        const predictedValue = predictExponentialValue(baseline, target, k, week);
        const halfWidth = 8 + 0.4 * week;
        points.push({
            week,
            source: 'predicted',
            value: predictedValue,
            confidence: `${predictedValue.toFixed(1)} ± ${halfWidth.toFixed(1)}`,
        });
    }

    return { unit, points };
}

function generateHrvChartTrend(
    baseline: number,
    target: number,
    k: number
): { unit: string; points: ChartDataPoint[] } {
    const points: ChartDataPoint[] = [];

    // Week 0 推断点
    points.push({
        week: 0,
        source: 'inferred',
        value: round1(baseline),
        confidence: null,
    });

    // 预测点
    for (const week of [3, 6, 9, 12, 15]) {
        const predictedValue = predictExponentialValue(baseline, target, k, week);
        const halfWidth = 11 + 0.5 * week; // HRV 不确定性更大
        points.push({
            week,
            source: 'predicted',
            value: predictedValue,
            confidence: `${predictedValue.toFixed(1)} ± ${halfWidth.toFixed(1)}`,
        });
    }

    return { unit: '0-100 inferred (higher=better)', points };
}

function aggregateCalibrationsByWeek(
    calibrations: CalibrationData[],
    type: 'anxiety' | 'sleep' | 'energy'
): Record<number, number> {
    const weeklyData: Record<number, number[]> = {};

    if (calibrations.length === 0) return {};

    const firstDate = new Date(calibrations[0].date);

    for (const cal of calibrations) {
        const calDate = new Date(cal.date);
        const daysSinceFirst = Math.floor((calDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        const week = Math.floor(daysSinceFirst / 7);

        if (!weeklyData[week]) weeklyData[week] = [];

        let value: number;
        switch (type) {
            case 'sleep':
                value = adaptiveNormalize(cal.sleepQuality);
                break;
            case 'energy':
                value = adaptiveNormalize(cal.energyLevel);
                break;
            case 'anxiety':
                // 从 stress 和 mood 推断焦虑
                value = adaptiveNormalize(cal.stressLevel);
                break;
        }

        weeklyData[week].push(value);
    }

    // 计算周平均
    const result: Record<number, number> = {};
    for (const [week, values] of Object.entries(weeklyData)) {
        result[parseInt(week)] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    return result;
}

function generateSummaryStats(
    userData: AggregatedUserData,
    week0: Week0Values,
    curveParams: ReturnType<typeof calculateCurveParams>,
    meta: CurveMeta
): MetricEndpointsView['summaryStats'] {
    // 计算当前周的预测值（用于 overall improvement）
    const currentWeek = meta.currentWeek ?? 0;
    const predictedCurrent: Week0Values = {
        anxietyScore: predictExponentialValue(week0.anxietyScore, curveParams.targets.anxietyScore, curveParams.k.anxietyScore, currentWeek),
        sleepQuality: predictExponentialValue(week0.sleepQuality, curveParams.targets.sleepQuality, curveParams.k.sleepQuality, currentWeek),
        stressResilience: predictExponentialValue(week0.stressResilience, curveParams.targets.stressResilience, curveParams.k.stressResilience, currentWeek),
        moodStability: predictExponentialValue(week0.moodStability, curveParams.targets.moodStability, curveParams.k.moodStability, currentWeek),
        energyLevel: predictExponentialValue(week0.energyLevel, curveParams.targets.energyLevel, curveParams.k.energyLevel, currentWeek),
        hrvScore: predictExponentialValue(week0.hrvScore, curveParams.targets.hrvScore, curveParams.k.hrvScore, currentWeek),
    };

    const overallImprovement = calculateOverallImprovement(week0, predictedCurrent);

    // 计算首次显著结果天数
    const predictions = PREDICTION_WEEKS.map(week => ({
        week,
        goodness: 100 - predictExponentialValue(week0.anxietyScore, curveParams.targets.anxietyScore, curveParams.k.anxietyScore, week) +
            predictExponentialValue(week0.sleepQuality, curveParams.targets.sleepQuality, curveParams.k.sleepQuality, week),
    }));
    const week0Goodness = 100 - week0.anxietyScore + week0.sleepQuality;
    const daysToFirstResult = calculateDaysToFirstResult(week0Goodness, predictions);

    // 计算坚持度
    const daysSinceBaseline = meta.daysSinceBaseline ?? 0;
    const last30Days = userData.calibrations.slice(-30);
    const uniqueDays = new Set(last30Days.map(c => c.date)).size;

    // 计算最长空缺
    let longestGap = 0;
    if (last30Days.length > 1) {
        const dates = last30Days.map(c => new Date(c.date).getTime()).sort((a, b) => a - b);
        for (let i = 1; i < dates.length; i++) {
            const gap = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
            longestGap = Math.max(longestGap, gap);
        }
    }

    const consistencyScore = calculateConsistencyScore(uniqueDays, daysSinceBaseline, longestGap);

    return {
        overallImprovement: {
            value: overallImprovement,
            unit: 'goodness points (higher=better)',
            method: 'weighted delta of goodness metrics (anxiety inverted)',
        },
        daysToFirstResult: {
            value: daysToFirstResult,
            unit: 'days',
            method: 'first time goodness improves >=8 points and persists >=3 days (observed if available, else predicted)',
        },
        consistencyScore: {
            value: consistencyScore,
            unit: '0-100',
            method: '0.75*completionRateLast30 + 0.25*(1-gapPenalty)',
        },
    };
}

// ============================================
// Schema 生成
// ============================================

function generateSchema(): Record<string, SchemaField> {
    return {
        'A_predictedLongitudinalOutcomes.timepoints.week': {
            type: 'integer',
            allowed: [0, 3, 6, 9, 12, 15],
            unit: 'week',
        },
        'metrics.anxietyScore.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 severity (higher=worse)',
        },
        'metrics.sleepQuality.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 (higher=better)',
        },
        'metrics.stressResilience.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 (higher=better)',
        },
        'metrics.moodStability.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 (higher=better)',
        },
        'metrics.energyLevel.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 (higher=better)',
        },
        'metrics.hrvScore.value': {
            type: 'number',
            range: [0, 100],
            unit: '0-100 inferred unless device HRV is available',
        },
        'metrics.*.confidence': {
            type: 'string',
            format: 'X.X ± Y.Y',
            unit: 'same as metric',
        },
        'daily_calibrations.sleepHours': {
            type: 'number',
            range: [0, 24],
            unit: 'hours',
        },
        'profiles.inferred_scale_scores.gad7Score': {
            type: 'integer',
            range: [0, 21],
            unit: 'raw score',
        },
        'profiles.inferred_scale_scores.phq9Score': {
            type: 'integer',
            range: [0, 27],
            unit: 'raw score',
        },
        'profiles.inferred_scale_scores.isiScore': {
            type: 'integer',
            range: [0, 28],
            unit: 'raw score',
        },
        'profiles.inferred_scale_scores.pss10Score': {
            type: 'integer',
            range: [0, 40],
            unit: 'raw score',
        },
    };
}

// Note: generateCurveOutput is exported inline above
