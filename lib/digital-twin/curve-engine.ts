/**
 * Digital Twin Curve Engine
 * 
 * 核心计算引擎：基于基线量表、每日校准、对话趋势生成
 * 指数趋近预测曲线（0-100 坐标系）
 * 
 * @module lib/digital-twin/curve-engine
 */

import type {
    CalibrationData,
    BaselineData,
    ConversationSummary,
} from '@/types/digital-twin';

import type {
    Week0Values,
    TrendInputs,
    ShockEvent,
    CurveParams,
    MetricPrediction,
} from '@/types/digital-twin-curve';

// ============================================
// 常量
// ============================================

/** 预测周数 */
export const PREDICTION_WEEKS = [0, 3, 6, 9, 12, 15] as const;

/** 趋势窗口天数 */
export const TREND_WINDOW_DAYS = 14;

/** 最小校准天数（用于趋势计算） */
export const MIN_DAYS_FOR_TREND = 7;

/** 基础不确定性 */
const BASE_UNCERTAINTY = 8;

/** 最大不确定性 */
const MAX_UNCERTAINTY = 30;

/** 最小不确定性 */
const MIN_UNCERTAINTY = 6;

// ============================================
// 工具函数
// ============================================

/**
 * 限制值在范围内
 */
export function clamp(x: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, x));
}

/**
 * 原始分数转百分比 (0-100)
 */
export function toPct(raw: number, maxRaw: number): number {
    return clamp((raw / maxRaw) * 100, 0, 100);
}

/**
 * 自适应归一化（处理未知量表范围）
 * 
 * @param x 原始值
 * @returns 归一化到 0-100 的值
 */
export function adaptiveNormalize(x: number | null | undefined): number {
    if (x === null || x === undefined) return 50; // 默认中值

    if (x <= 5) {
        // 1-5 量表
        return clamp(((x - 1) / 4) * 100, 0, 100);
    } else if (x <= 10) {
        // 0-10 或 1-10 量表
        return clamp((x / 10) * 100, 0, 100);
    } else if (x <= 100) {
        // 已经是 0-100
        return clamp(x, 0, 100);
    }

    // 超范围截断
    return 100;
}

/**
 * 睡眠时长转分数 (0-100)
 * 7-9 小时最佳
 */
export function sleepHoursToScore(hours: number): number {
    if (hours >= 7 && hours <= 9) {
        return 100;
    } else if (hours < 7) {
        // 每少1小时扣20分
        return clamp(100 - (7 - hours) * 20, 0, 100);
    } else {
        // 每多1小时扣15分
        return clamp(100 - (hours - 9) * 15, 0, 100);
    }
}

/**
 * 四舍五入到一位小数
 */
export function round1(x: number): number {
    return Math.round(x * 10) / 10;
}

// ============================================
// 量表解释函数 (English keys)
// ============================================

export type GAD7Interpretation = 'minimal' | 'mild' | 'moderate' | 'severe';
export type PHQ9Interpretation = 'minimal' | 'mild' | 'moderate' | 'moderately severe' | 'severe';
export type ISIInterpretation = 'none/minimal' | 'subthreshold' | 'clinical insomnia (moderate)' | 'clinical insomnia (severe)';
export type PSS10Interpretation = 'low' | 'moderate' | 'high' | 'missing';

export function interpretGAD7(score: number | null): GAD7Interpretation {
    if (score === null) return 'minimal';
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    return 'severe';
}

export function interpretPHQ9(score: number | null): PHQ9Interpretation {
    if (score === null) return 'minimal';
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately severe';
    return 'severe';
}

export function interpretISI(score: number | null): ISIInterpretation {
    if (score === null) return 'none/minimal';
    if (score <= 7) return 'none/minimal';
    if (score <= 14) return 'subthreshold';
    if (score <= 21) return 'clinical insomnia (moderate)';
    return 'clinical insomnia (severe)';
}

export function interpretPSS10(score: number | null): PSS10Interpretation {
    if (score === null) return 'missing';
    if (score <= 13) return 'low';
    if (score <= 26) return 'moderate';
    return 'high';
}

// ============================================
// 生理数据归一化
// ============================================

export function normalizeHRV(hrv: number): number {
    // 20ms (低) -> 100ms (高)
    return clamp(((hrv - 20) / 80) * 100, 0, 100);
}

export function normalizeRHR(rhr: number): number {
    // 50bpm (优) -> 90bpm (差)
    // RHR 越低越好，所以反向计算
    return clamp(100 - ((rhr - 50) / 40) * 100, 0, 100);
}

export function normalizeSteps(steps: number): number {
    // 10000 步为满分
    return clamp((steps / 10000) * 100, 0, 100);
}

// ============================================
// Week 0 基线值计算
// ============================================

/**
 * 计算每日睡眠综合分
 */
function calculateSleepComposite(calibration: CalibrationData): number {
    const sleepQualityNorm = adaptiveNormalize(calibration.sleepQuality);
    const sleepDurationScore = sleepHoursToScore(calibration.sleepHours);

    // 若有设备睡眠分，优先融合
    if (calibration.deviceSleepScore) {
        return 0.4 * sleepQualityNorm + 0.2 * sleepDurationScore + 0.4 * calibration.deviceSleepScore;
    }

    // 若某项缺失用另一项
    if (calibration.sleepQuality === 0 || calibration.sleepQuality === null) {
        return sleepDurationScore;
    }
    if (calibration.sleepHours === 0 || calibration.sleepHours === null) {
        return sleepQualityNorm;
    }

    return 0.6 * sleepQualityNorm + 0.4 * sleepDurationScore;
}

/**
 * 计算最近 N 天平均值
 */
function avgLast(
    calibrations: CalibrationData[],
    field: keyof CalibrationData,
    days: number
): number | null {
    const recent = calibrations.slice(-days);
    if (recent.length === 0) return null;

    const values = recent
        .map(c => c[field] as number)
        .filter(v => v !== null && v !== undefined && v !== 0);

    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * 计算睡眠综合的最近 N 天平均值
 */
function avgSleepCompositeLast(calibrations: CalibrationData[], days: number): number | null {
    const recent = calibrations.slice(-days);
    if (recent.length === 0) return null;

    const values = recent.map(c => calculateSleepComposite(c));
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * 计算标准差
 */
function stdLast(
    calibrations: CalibrationData[],
    field: keyof CalibrationData,
    days: number
): number {
    const recent = calibrations.slice(-days);
    if (recent.length < 2) return 0;

    const values = recent
        .map(c => adaptiveNormalize(c[field] as number))
        .filter(v => v !== null && v !== undefined);

    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(variance);
}

/**
 * 计算 Week 0 所有基线值
 */
export function calculateWeek0Values(
    baseline: BaselineData | null,
    calibrations: CalibrationData[]
): Week0Values {
    // 从量表计算初值
    const gad7Score = baseline?.gad7Score ?? 0;
    const phq9Score = baseline?.phq9Score ?? 0;
    const isiScore = baseline?.isiScore ?? 0;
    const pss10Score = baseline?.pss10Score ?? null;

    // 基线量表映射到 0-100 (越高越好/健康)
    const anxietyHealthFromScale = 100 - toPct(gad7Score, 21); // GAD7 越低越好 -> 100分全健康
    const sleepHealthFromScale = 100 - toPct(isiScore, 28); // ISI 越低越好
    const stressHealthFromScale = pss10Score !== null
        ? 100 - toPct(pss10Score, 40)
        : null;
    const moodHealthFromScale = 100 - toPct(phq9Score, 27); // PHQ9 越低越好

    const hasEnoughCalibrations = calibrations.length >= 7;

    // 获取可穿戴数据平均值 (最近7天)
    const avgRHR = avgLast(calibrations, 'restingHeartRate', 7);
    const avgHRV = avgLast(calibrations, 'hrv', 7);
    const avgSteps = avgLast(calibrations, 'stepCount', 7);
    const avgDeviceSleep = avgLast(calibrations, 'deviceSleepScore', 7);

    // 归一化可穿戴分数 (0-100)
    const rhrScore = avgRHR ? normalizeRHR(avgRHR) : null;
    const hrvScoreNorm = avgHRV ? normalizeHRV(avgHRV) : null;
    const stepsScore = avgSteps ? normalizeSteps(avgSteps) : null;

    // 生理状态综合分 (HRV + RHR)
    const physioScore = (rhrScore !== null && hrvScoreNorm !== null)
        ? 0.5 * rhrScore + 0.5 * hrvScoreNorm
        : (rhrScore ?? hrvScoreNorm);

    // 融合计算各指标
    let sleepQuality_w0: number;
    let energyLevel_w0: number;
    let stressResilience_w0: number;
    let moodStability_w0: number;
    let anxietyScore_w0: number;
    let hrvScore_w0: number;

    // 1. 睡眠质量 (Sleep)
    // 逻辑: 量表(Isi) + 主观每天 + 设备(DeviceSleep)
    const avg7SleepComposite = avgSleepCompositeLast(calibrations, 7); // 已包含 deviceSleepScore 如果有
    if (avg7SleepComposite !== null) {
        // 如果有设备分，SleepComposite 已经处理了权重，这里主要平衡量表和日常
        sleepQuality_w0 = 0.5 * sleepHealthFromScale + 0.5 * avg7SleepComposite;
    } else {
        sleepQuality_w0 = sleepHealthFromScale;
    }

    // 2. 能量水平 (Energy)
    // 逻辑: 主观能量 + 睡眠 + 运动(Steps)
    const avg7Energy = avgLast(calibrations, 'energyLevel', 7);
    const energyBase = avg7Energy ? adaptiveNormalize(avg7Energy) : (0.5 * sleepQuality_w0 + 0.5 * moodHealthFromScale);

    if (stepsScore !== null) {
        energyLevel_w0 = 0.5 * energyBase + 0.3 * stepsScore + 0.2 * (avgDeviceSleep ?? sleepQuality_w0);
    } else {
        energyLevel_w0 = energyBase;
    }

    // 3. 焦虑评分 (Anxiety) -> 注意: 输出的是 Score (0-100 越高越严重)，所以最后要 100-Health
    // 逻辑: GAD7 + 主观焦虑(推断) + 生理(RHR/HRV)
    // 生理数据好(HRV高RHR低) -> 焦虑低
    let anxietyHealth = anxietyHealthFromScale;
    if (physioScore !== null) {
        anxietyHealth = 0.6 * anxietyHealth + 0.4 * physioScore;
    }
    anxietyScore_w0 = 100 - anxietyHealth; // 转回 "越高越焦虑"

    // 4. 抗压韧性 (Stress Resilience)
    // 逻辑: PSS10 + 主观压力 + 生理(HRV是核心指标)
    const avg7Stress = avgLast(calibrations, 'stressLevel', 7);
    const stressDailyHealth = avg7Stress !== null ? (100 - adaptiveNormalize(avg7Stress)) : null;
    let stressBase = stressHealthFromScale ?? (stressDailyHealth ?? (100 - anxietyScore_w0)); // 降级策略

    if (stressDailyHealth !== null) {
        stressBase = 0.5 * (stressHealthFromScale ?? stressDailyHealth) + 0.5 * stressDailyHealth;
    }

    if (hrvScoreNorm !== null) {
        // HRV 是抗压的直接生理指标
        stressResilience_w0 = 0.5 * stressBase + 0.5 * hrvScoreNorm;
    } else {
        stressResilience_w0 = stressBase;
    }

    // 5. 情绪稳定 (Mood Stability)
    // 逻辑: PHQ9 + 主观情绪 + 运动(Steps) + 睡眠
    const avg7Mood = avgLast(calibrations, 'moodScore', 7);
    const std7Mood = stdLast(calibrations, 'moodScore', 7);
    let moodBase = moodHealthFromScale;

    if (avg7Mood !== null) {
        const moodNorm = adaptiveNormalize(avg7Mood);
        const volatilityPenalty = clamp(100 - std7Mood * 10, 0, 100);
        const dailyMoodContrib = 0.6 * moodNorm + 0.4 * volatilityPenalty;
        moodBase = 0.6 * moodHealthFromScale + 0.4 * dailyMoodContrib;
    }

    if (stepsScore !== null && avgDeviceSleep !== null) {
        // 运动和睡眠对情绪调节有帮助
        moodStability_w0 = 0.6 * moodBase + 0.2 * stepsScore + 0.2 * avgDeviceSleep;
    } else {
        moodStability_w0 = moodBase;
    }

    // 6. HRV 代理分/真实分
    if (avgHRV !== null) {
        // 有真实数据直接用
        hrvScore_w0 = normalizeHRV(avgHRV);
    } else {
        // 代理推算
        hrvScore_w0 = clamp(
            0.45 * stressResilience_w0 + 0.35 * sleepQuality_w0 + 0.20 * energyLevel_w0,
            0,
            100
        );
    }

    // Check for "too perfect" (Demo Fallback)
    const isAllPerfect =
        anxietyScore_w0 <= 5 &&
        sleepQuality_w0 >= 95 &&
        moodStability_w0 >= 95;

    if (isAllPerfect && !hasEnoughCalibrations && !avgHRV) {
        return {
            anxietyScore: 65,      // Moderate anxiety
            sleepQuality: 45,      // Poor sleep
            stressResilience: 40,  // Low resilience
            moodStability: 50,     // Moderate stability
            energyLevel: 45,       // Low energy
            hrvScore: 55,          // Average HRV
        };
    }

    return {
        anxietyScore: round1(anxietyScore_w0),
        sleepQuality: round1(sleepQuality_w0),
        stressResilience: round1(stressResilience_w0),
        moodStability: round1(moodStability_w0),
        energyLevel: round1(energyLevel_w0),
        hrvScore: round1(hrvScore_w0),
    };
}

// ============================================
// 趋势与改善因子计算
// ============================================

/**
 * 计算单个指标的趋势斜率
 * 返回 -1 到 +1 的归一化值
 */
export function calculateTrendNorm(
    calibrations: CalibrationData[],
    field: keyof CalibrationData,
    isStress: boolean = false
): number {
    if (calibrations.length < MIN_DAYS_FOR_TREND * 2) {
        return 0; // 数据不足，返回中性
    }

    const midpoint = Math.floor(calibrations.length / 2);
    const firstHalf = calibrations.slice(0, midpoint);
    const secondHalf = calibrations.slice(midpoint);

    const avg1 = avgLast(firstHalf, field, firstHalf.length);
    const avg2 = avgLast(secondHalf, field, secondHalf.length);

    if (avg1 === null || avg2 === null) return 0;

    const norm1 = adaptiveNormalize(avg1);
    const norm2 = adaptiveNormalize(avg2);

    // 每周 20 分变化 ≈ 强趋势
    const diff = norm2 - norm1;
    let trendNorm = clamp(diff / 20, -1, 1);

    // 压力：下降是好的，所以反转符号
    if (isStress) {
        trendNorm = -trendNorm;
    }

    return trendNorm;
}

/**
 * 对话情绪趋势映射
 */
export function emotionTrendToValue(
    trend: 'improving' | 'stable' | 'declining' | null
): number {
    switch (trend) {
        case 'improving': return 0.6;
        case 'stable': return 0;
        case 'declining': return -0.6;
        default: return 0;
    }
}

/**
 * 计算改善因子 (0-1)
 */
export function calculateImproveFactor(inputs: TrendInputs): number {
    const overallTrend = (
        inputs.trendNormSleep +
        inputs.trendNormMood +
        inputs.trendNormEnergy +
        (-inputs.trendNormStress) // 压力下降是好的
    ) / 4;

    const improveFactor = clamp(
        0.45 +
        0.25 * inputs.completeness +
        0.25 * overallTrend +
        0.15 * inputs.emotionTrend,
        0,
        1
    );

    return round1(improveFactor);
}

/**
 * 计算 15 周改善比例
 */
export function calculateImproveFrac15(
    improveFactor: number,
    isAnxiety: boolean
): number {
    if (isAnxiety) {
        return clamp(0.08 + 0.32 * improveFactor, 0.00, 0.45);
    }
    return clamp(0.10 + 0.35 * improveFactor, 0.05, 0.45);
}

/**
 * 计算速度参数 k
 * Adjusted for intersection point ~Week 3.2, still reaching ~90% by Week 12
 */
export function calculateK(improveFactor: number): number {
    // Previous: 0.15 - 0.35 (too fast, noticeable change at Week 1-2)
    // New: 0.08 - 0.25 (intersection point shifted to ~Week 3.2)
    // At k=0.15, 1-e^(-0.15*3.2) = 1-e^(-0.48) = 1-0.619 = 0.38 (38% progress at W3.2)
    // At k=0.25, 1-e^(-0.25*12) = 1-e^(-3) = 1-0.05 = 0.95 (95% progress at W12)
    return clamp(0.08 + 0.17 * improveFactor, 0.08, 0.25);
}

/**
 * 计算目标值 (Target 100% Logic)
 */
export function calculateTargetValue(
    baseline: number,
    improveFrac: number,
    isNegative: boolean
): number {
    // 强制设定极为乐观的目标 (Approaching 100%)
    // Digital Twin 展示的是理想情况下的恢复路径
    if (isNegative) {
        // 焦虑：目标接近 0 (即 100% 健康)
        return clamp(baseline * 0.05, 0, 100);
    }
    // 正向指标：目标接近 100
    return clamp(baseline + (100 - baseline) * 0.95, 0, 100);
}

// ============================================
// 曲线预测
// ============================================

/**
 * 指数趋近预测
 */
export function predictExponentialValue(
    baseline: number,
    target: number,
    k: number,
    week: number
): number {
    // M(w) = M0 + (Mtarget - M0) * (1 - e^(-k*w))
    const value = baseline + (target - baseline) * (1 - Math.exp(-k * week));
    return round1(clamp(value, 0, 100));
}

/**
 * 应用冲击事件
 */
export function applyShock(
    value: number,
    shock: ShockEvent | null,
    currentWeek: number,
    isNegative: boolean
): number {
    if (!shock || currentWeek < shock.week) return value;

    const weeksSinceShock = currentWeek - shock.week;
    const decay = Math.exp(-weeksSinceShock / shock.halfLifeWeeks);
    const shockEffect = shock.magnitude * decay;

    if (isNegative) {
        // 焦虑等负向指标：冲击导致上升
        return round1(clamp(value + shockEffect, 0, 100));
    } else if (shock.affectsPositive) {
        // 正向指标：冲击导致下降
        return round1(clamp(value - shockEffect, 0, 100));
    }

    return value;
}

// ============================================
// 置信区间计算
// ============================================

export interface ConfidenceInputs {
    completenessLast14: number;
    week: number;
    baselineMissing: boolean;
    hrvIsInferred: boolean;
    recentVolatility: number; // 0-1
    hasShock: boolean;
}

/**
 * 计算置信区间半宽
 */
export function calculateConfidenceHalfWidth(inputs: ConfidenceInputs): number {
    let uncertainty = BASE_UNCERTAINTY;

    // 数据稀疏惩罚
    uncertainty += 12 * (1 - inputs.completenessLast14);

    // 基线缺失惩罚
    if (inputs.baselineMissing) {
        uncertainty += 10;
    }

    // 远期惩罚
    uncertainty += 0.4 * inputs.week;

    // HRV 推断惩罚
    if (inputs.hrvIsInferred) {
        uncertainty += 3;
    }

    // 波动/冲击惩罚
    if (inputs.hasShock || inputs.recentVolatility > 0.5) {
        uncertainty += inputs.hasShock ? 8 : 3 * inputs.recentVolatility;
    }

    return round1(clamp(uncertainty, MIN_UNCERTAINTY, MAX_UNCERTAINTY));
}

/**
 * 生成置信字符串
 */
export function formatConfidence(value: number, halfWidth: number): string {
    return `${round1(value).toFixed(1)} ± ${round1(halfWidth).toFixed(1)}`;
}

/**
 * 生成完整的预测值
 */
export function generatePrediction(
    value: number,
    confidenceInputs: ConfidenceInputs
): MetricPrediction {
    const halfWidth = calculateConfidenceHalfWidth(confidenceInputs);
    return {
        value: round1(value),
        confidence: formatConfidence(value, halfWidth),
    };
}

// ============================================
// 汇总统计计算
// ============================================

/**
 * 计算整体改善度（goodness points）
 */
export function calculateOverallImprovement(
    week0: Week0Values,
    current: Week0Values
): number {
    // 统一为 "越高越好" 的 goodness
    const goodness0 = {
        anxiety: 100 - week0.anxietyScore, // 反转
        sleep: week0.sleepQuality,
        stress: week0.stressResilience,
        mood: week0.moodStability,
        energy: week0.energyLevel,
        hrv: week0.hrvScore,
    };

    const goodnessCurrent = {
        anxiety: 100 - current.anxietyScore,
        sleep: current.sleepQuality,
        stress: current.stressResilience,
        mood: current.moodStability,
        energy: current.energyLevel,
        hrv: current.hrvScore,
    };

    const deltas = [
        goodnessCurrent.anxiety - goodness0.anxiety,
        goodnessCurrent.sleep - goodness0.sleep,
        goodnessCurrent.stress - goodness0.stress,
        goodnessCurrent.mood - goodness0.mood,
        goodnessCurrent.energy - goodness0.energy,
        goodnessCurrent.hrv - goodness0.hrv,
    ];

    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    return round1(clamp(avgDelta, -100, 100));
}

/**
 * 计算首次显著结果天数
 */
export function calculateDaysToFirstResult(
    week0Goodness: number,
    predictions: Array<{ week: number; goodness: number }>
): number | null {
    const threshold = 8; // 提升 >= 8 分

    for (const pred of predictions) {
        if (pred.goodness - week0Goodness >= threshold) {
            return pred.week * 7;
        }
    }

    return null;
}

/**
 * 计算坚持度/一致性分数
 */
export function calculateConsistencyScore(
    daysWithCalibrationLast30: number,
    daysSinceBaseline: number,
    longestGapDaysLast30: number
): number {
    const effectiveDays = Math.min(daysSinceBaseline, 30);
    const completionRate = effectiveDays > 0
        ? daysWithCalibrationLast30 / effectiveDays
        : 0;

    const gapPenalty = clamp(longestGapDaysLast30 / 7, 0, 1);

    const score = 100 * (0.75 * completionRate + 0.25 * (1 - gapPenalty));
    return Math.round(clamp(score, 0, 100));
}

// ============================================
// 完整曲线参数计算
// ============================================

/**
 * 计算完整曲线生成参数
 */
export function calculateCurveParams(
    week0: Week0Values,
    calibrations: CalibrationData[],
    emotionTrend: 'improving' | 'stable' | 'declining' | null
): CurveParams {
    // 计算趋势
    const trendInputs: TrendInputs = {
        trendNormSleep: calculateTrendNorm(calibrations, 'sleepQuality'),
        trendNormMood: calculateTrendNorm(calibrations, 'moodScore'),
        trendNormEnergy: calculateTrendNorm(calibrations, 'energyLevel'),
        trendNormStress: calculateTrendNorm(calibrations, 'stressLevel', true),
        completeness: Math.min(calibrations.length / 14, 1),
        emotionTrend: emotionTrendToValue(emotionTrend),
    };

    const improveFactor = calculateImproveFactor(trendInputs);
    // 基础速度
    const baseK = calculateK(improveFactor);

    // 为每个指标生成不同的 k 值 (Curvature Variation)
    // 焦虑: 快 (1.2x)
    // 睡眠: 较快 (1.1x)
    // 能量: 标准 (1.0x)
    // 情绪: 较慢 (0.9x) - 情绪改变需要时间
    // 压力: 慢 (0.8x) - 压力源消除难
    // HRV: 极慢 (0.6x) - 生理适应最慢
    const k: Record<keyof Week0Values, number> = {
        anxietyScore: baseK * 1.2,
        sleepQuality: baseK * 1.1,
        energyLevel: baseK * 1.0,
        moodStability: baseK * 0.9,
        stressResilience: baseK * 0.8,
        hrvScore: baseK * 0.6,
    };

    // 计算各指标目标值 (Approaching 100% Logic applied in calculateTargetValue)
    // 这里 improveFrac 参数实际上被 calculateTargetValue 忽略了，因为我们强制设为 0.95/0.05
    const dummyFrac = 0.95;

    const targets: Week0Values = {
        anxietyScore: calculateTargetValue(week0.anxietyScore, dummyFrac, true),
        sleepQuality: calculateTargetValue(week0.sleepQuality, dummyFrac, false),
        stressResilience: calculateTargetValue(week0.stressResilience, dummyFrac, false),
        moodStability: calculateTargetValue(week0.moodStability, dummyFrac, false),
        energyLevel: calculateTargetValue(week0.energyLevel, dummyFrac, false),
        hrvScore: calculateTargetValue(week0.hrvScore, dummyFrac, false),
    };

    return {
        improveFactor,
        k,
        targets,
    };
}
