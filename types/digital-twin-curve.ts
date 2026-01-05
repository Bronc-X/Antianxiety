/**
 * Digital Twin Curve Engine Types
 * 
 * 数字孪生曲线生成引擎的类型定义
 * 用于生成四个视图（A/B/C/D）的结构化输出
 * 
 * @module types/digital-twin-curve
 */

// ============================================
// 元数据类型
// ============================================

/** 数据质量标记 */
export interface DataQualityFlags {
    /** 缺失的基线量表 */
    baselineMissing: string[];
    /** 每日校准数据稀疏 */
    dailyCalibrationSparse: boolean;
    /** 对话趋势缺失 */
    conversationTrendMissing: boolean;
    /** PSS-10 缺失 */
    pss10Missing: boolean;
    /** HRV 是推断值 */
    hrvIsInferred: boolean;
    /** 睡眠时长超出范围 */
    sleepHoursOutOfRange?: boolean;
    /** 量表范围不匹配 */
    scaleMismatchFlag?: boolean;
}

/** 曲线输出元信息 */
export interface CurveMeta {
    /** 规则版本 */
    ruleVersion: string;
    /** 生成日期 */
    asOfDate: string;
    /** 基线日期 */
    baselineDate: string | null;
    /** 基线后天数 */
    daysSinceBaseline: number | null;
    /** 当前周数 */
    currentWeek: number | null;
    /** 数据质量标记 */
    dataQualityFlags: DataQualityFlags;
}

// ============================================
// View A: 纵向预测类型
// ============================================

/** 单个指标预测值 */
export interface MetricPrediction {
    /** 预测值 (0-100) */
    value: number;
    /** 置信区间字符串 e.g. "66.7 ± 9.0" */
    confidence: string;
}

/** 时间点的所有指标 */
export interface TimepointMetrics {
    /** 焦虑评分 (0-100, 越高越糟) */
    anxietyScore: MetricPrediction;
    /** 睡眠质量 (0-100, 越高越好) */
    sleepQuality: MetricPrediction;
    /** 抗压韧性 (0-100, 越高越好) */
    stressResilience: MetricPrediction;
    /** 情绪稳定性 (0-100, 越高越好) */
    moodStability: MetricPrediction;
    /** 能量水平 (0-100, 越高越好) */
    energyLevel: MetricPrediction;
    /** HRV 代理分 (0-100, 越高越好) */
    hrvScore: MetricPrediction;
}

/** 单个预测时间点 */
export interface CurveTimepoint {
    /** 周数 (0, 3, 6, 9, 12, 15) */
    week: number;
    /** 各项指标预测 */
    metrics: TimepointMetrics;
}

/** 曲线模型描述 */
export interface CurveModel {
    /** 曲线形态 */
    shape: 'exponential_to_target_with_shock';
    /** k 参数范围（每周） */
    kRangePerWeek: [number, number];
    /** 目标时间范围（周） */
    targetHorizonWeeks: number;
    /** 趋势窗口天数 */
    trendWindowDays: number;
    /** 备注 */
    notes: string[];
}

/** View A: 纵向预测输出 */
export interface PredictedLongitudinalOutcomes {
    /** 预测时间点 (6个) */
    timepoints: CurveTimepoint[];
    /** 曲线模型描述 */
    curveModel: CurveModel;
}

// ============================================
// View B: 时间线类型
// ============================================

/** 里程碑实际得分 */
export interface MilestoneActualScore {
    'GAD-7': number | null;
    'PHQ-9': number | null;
    'ISI': number | null;
    'PSS-10': number | null;
}

/** 单个里程碑 */
export interface TimelineMilestone {
    /** 周数 */
    week: number;
    /** 事件名称 */
    event: string;
    /** 状态 */
    status: 'completed' | 'current' | 'upcoming';
    /** 详细说明 */
    detail: string;
    /** 实际得分（如果有） */
    actualScore: MilestoneActualScore | null;
}

/** View B: 时间线输出 */
export interface TimelineView {
    /** 里程碑列表 */
    milestones: TimelineMilestone[];
}

// ============================================
// View C: 参与者基线数据类型
// ============================================

/** 量表基线项 */
export interface ScaleBaselineItem {
    /** 量表名称 */
    name: 'GAD-7' | 'PHQ-9' | 'ISI' | 'PSS-10';
    /** 原始分值 */
    value: number | null;
    /** 解释 */
    interpretation: string;
}

/** 生物指标 */
export interface VitalsData {
    /** 静息心率 */
    restingHeartRate?: number;
    /** 血压 */
    bloodPressure?: string;
    /** BMI */
    bmi?: number;
}

/** View C: 参与者基线数据输出 */
export interface ParticipantBaselineView {
    /** 量表得分列表 */
    scales: ScaleBaselineItem[];
    /** 生物指标 */
    vitals: VitalsData;
}

// ============================================
// View D: 指标终点类型
// ============================================

/** 图表数据点 */
export interface ChartDataPoint {
    /** 周数 */
    week: number;
    /** 数据来源 */
    source: 'baselineScale' | 'dailyCalibration' | 'predicted' | 'baselineScale+daily' | 'inferred';
    /** 值 */
    value: number;
    /** 置信区间（仅预测点） */
    confidence: string | null;
}

/** 单个图表数据 */
export interface ChartTrend {
    /** 单位说明 */
    unit: string;
    /** 数据点 */
    points: ChartDataPoint[];
}

/** 所有图表数据 */
export interface ChartsData {
    anxietyTrend: ChartTrend;
    sleepTrend: ChartTrend;
    hrvTrend: ChartTrend;
    energyTrend: ChartTrend;
}

/** 汇总统计项 */
export interface SummaryStatItem {
    value: number | null;
    unit: string;
    method: string;
}

/** 汇总统计 */
export interface CurveSummaryStats {
    overallImprovement: SummaryStatItem;
    daysToFirstResult: SummaryStatItem;
    consistencyScore: SummaryStatItem;
}

/** View D: 指标终点输出 */
export interface MetricEndpointsView {
    /** 图表数据 */
    charts: ChartsData;
    /** 汇总统计 */
    summaryStats: CurveSummaryStats;
}

// ============================================
// Schema 定义类型
// ============================================

/** Schema 字段定义 */
export interface SchemaField {
    type: 'integer' | 'number' | 'string';
    range?: [number, number];
    allowed?: number[];
    format?: string;
    unit: string;
}

// ============================================
// 完整输出类型
// ============================================

/** 数字孪生曲线完整输出 */
export interface DigitalTwinCurveOutput {
    /** 元信息 */
    meta: CurveMeta;
    /** View A: 纵向预测 */
    A_predictedLongitudinalOutcomes: PredictedLongitudinalOutcomes;
    /** View B: 时间线 */
    B_timeSinceBaselineVisit: TimelineView;
    /** View C: 基线数据 */
    C_participantBaselineData: ParticipantBaselineView;
    /** View D: 指标终点 */
    D_metricEndpoints: MetricEndpointsView;
    /** Schema 定义 */
    schema: Record<string, SchemaField>;
}

// ============================================
// 内部计算类型
// ============================================

/** Week 0 基线值 */
export interface Week0Values {
    anxietyScore: number;
    sleepQuality: number;
    stressResilience: number;
    moodStability: number;
    energyLevel: number;
    hrvScore: number;
}

/** 改善因子计算输入 */
export interface TrendInputs {
    trendNormSleep: number;
    trendNormMood: number;
    trendNormEnergy: number;
    trendNormStress: number;
    completeness: number;
    emotionTrend: number;
}

/** 冲击事件 */
export interface ShockEvent {
    week: number;
    magnitude: number;
    halfLifeWeeks: number;
    affectsPositive: boolean;
}

/** 曲线生成参数 */
export interface CurveParams {
    improveFactor: number;
    k: Record<keyof Week0Values, number>;
    targets: Week0Values;
}
