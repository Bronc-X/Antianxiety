/**
 * Digital Twin AI Analytics Types
 * 
 * 数字孪生 AI 分析系统的类型定义
 * 用于健康数据聚合、AI 分析、预测和仪表盘展示
 */

import { Paper } from '@/lib/services/semantic-scholar';

// ============================================
// 数据聚合类型
// ============================================

/** 问卷基线数据 */
export interface BaselineData {
  gad7Score: number;
  phq9Score: number;
  isiScore: number;
  pss10Score: number;
  assessmentDate: string;
  interpretations: {
    gad7: string;
    phq9: string;
    isi: string;
    pss10: string;
  };
}

/** 每日校准数据 */
export interface CalibrationData {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  moodScore: number;
  stressLevel: number;
  energyLevel: number;
}

/** 主动问询洞察 */
export interface InquiryInsight {
  date: string;
  topic: string;
  userResponse: string;
  extractedIndicators: Record<string, unknown>;
}

/** 对话分析摘要 */
export interface ConversationSummary {
  totalMessages: number;
  emotionalTrend: 'improving' | 'stable' | 'declining';
  frequentTopics: string[];
  lastInteraction: string;
}

/** 用户画像 */
export interface UserProfile {
  age?: number;
  gender?: string;
  primaryConcern?: string;
  registrationDate: string;
  medicalHistoryConsent?: boolean;
}

/** 聚合的用户数据 */
export interface AggregatedUserData {
  userId: string;
  baseline: BaselineData | null;
  calibrations: CalibrationData[];
  inquiryInsights: InquiryInsight[];
  conversationSummary: ConversationSummary;
  profile: UserProfile;
}

// ============================================
// AI 分析类型
// ============================================

/** 指标评分 */
export interface MetricScore {
  score: number;
  trend: string;  // 趋势描述，可以是 'improving' | 'stable' | 'declining' 或自定义描述
  confidence: number;
}

/** 科学依据 */
export interface ScientificBasis {
  claim: string;
  paperTitle: string;
  paperUrl: string;
  citationCount: number;
}

/** 生理状态评测 */
export interface PhysiologicalAssessment {
  overallStatus: 'improving' | 'stable' | 'needs_attention';
  anxietyLevel: MetricScore;
  sleepHealth: MetricScore;
  stressResilience: MetricScore;
  moodStability: MetricScore;
  energyLevel: MetricScore;
  hrvEstimate: MetricScore;
  riskFactors: string[];
  strengths: string[];
  scientificBasis: ScientificBasis[];
}

// ============================================
// 预测类型
// ============================================

/** 预测值（带置信区间） */
export interface PredictionValue {
  value: number;
  confidence: string;  // e.g., "3.8 ± 0.9"
}

/** 单个时间点的预测 */
export interface TimepointPrediction {
  week: number;  // 0, 3, 6, 9, 12, 15
  predictions: {
    anxietyScore: PredictionValue;
    sleepQuality: PredictionValue;
    stressResilience: PredictionValue;
    moodStability: PredictionValue;
    energyLevel: PredictionValue;
    hrvScore: PredictionValue;
  };
}

/** 预测时间点（别名） */
export type PredictionTimepoint = TimepointPrediction;

/** 基线对比 */
export interface BaselineComparison {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
}

/** 纵向预测 */
export interface LongitudinalPredictions {
  timepoints: TimepointPrediction[];
  baselineComparison: BaselineComparison[];
}

/** 治疗里程碑 */
export interface TreatmentMilestone {
  week: number;
  event: string;
  status: 'completed' | 'current' | 'upcoming';
  detail: string;
  actualScore?: number;
}

// ============================================
// 自适应计划类型
// ============================================

/** 每日重点 */
export interface DailyFocus {
  area: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  scientificBasis?: string;
}

/** 呼吸练习 */
export interface BreathingExercise {
  name: string;
  duration: string;
  timing: string;
  benefit: string;
}

/** 睡眠建议 */
export interface SleepRecommendation {
  recommendation: string;
  reason: string;
  expectedImpact: string;
}

/** 活动建议 */
export interface ActivitySuggestion {
  activity: string;
  frequency: string;
  duration: string;
  benefit: string;
}

/** 自适应计划 */
export interface AdaptivePlan {
  dailyFocus: DailyFocus[];
  breathingExercises: BreathingExercise[];
  sleepRecommendations: SleepRecommendation[];
  activitySuggestions: ActivitySuggestion[];
  avoidanceBehaviors: string[];
  nextCheckpoint: {
    date: string;
    focus: string;
  };
}

// ============================================
// 仪表盘类型
// ============================================

/** 参与者信息 */
export interface ParticipantInfo {
  initials: string;
  age?: number;
  gender?: string;
  diagnosis: string;
  registrationDate: string;
}

/** 预测表格指标 */
export interface PredictionTableMetric {
  name: string;
  baseline: number;
  predictions: Record<string, string>;  // week -> "value ± confidence"
}

/** 基线评估项 */
export interface BaselineAssessment {
  name: string;
  value: string;
  interpretation: string;
}

/** 生物指标 */
export interface VitalMetric {
  name: string;
  value: string;
  trend: 'above_target' | 'at_target' | 'below_target' | 'normal';
}

/** 图表数据 */
export interface ChartData {
  anxietyTrend: number[];
  sleepTrend: number[];
  hrvTrend: number[];
  energyTrend: number[];
}

/** 汇总统计 */
export interface SummaryStats {
  overallImprovement: string;
  daysToFirstResult: number;
  consistencyScore: string;
}

/** 仪表盘数据 */
export interface DashboardData {
  participant: ParticipantInfo;
  predictionTable: {
    metrics: PredictionTableMetric[];
  };
  timeline: TreatmentMilestone[];
  baselineData: {
    assessments: BaselineAssessment[];
    vitals: VitalMetric[];
  };
  charts: ChartData;
  summaryStats: SummaryStats;
  lastAnalyzed: string;
  nextAnalysisScheduled: string;
}

// ============================================
// 完整分析结果类型
// ============================================

/** LLM 分析结果 */
export interface LLMAnalysisResult {
  assessment: PhysiologicalAssessment;
  predictions: LongitudinalPredictions;
  adaptivePlan: AdaptivePlan;
  analysisTimestamp: string;
  modelUsed: string;
  confidenceScore: number;
}

/** 数字孪生分析（数据库记录） */
export interface DigitalTwinAnalysis {
  id: string;
  userId: string;
  inputSnapshot: AggregatedUserData;
  physiologicalAssessment: PhysiologicalAssessment;
  longitudinalPredictions: LongitudinalPredictions;
  adaptivePlan: AdaptivePlan;
  papersUsed: Paper[];
  dashboardData: DashboardData;
  modelUsed: string;
  confidenceScore: number;
  analysisVersion: number;
  createdAt: string;
  expiresAt: string;
}

/** 分析历史条目 */
export interface AnalysisHistoryEntry {
  id: string;
  userId: string;
  analysisId: string;
  anxietyScore: number;
  sleepQuality: number;
  stressResilience: number;
  moodStability: number;
  energyLevel: number;
  hrvEstimate: number;
  overallStatus: 'improving' | 'stable' | 'needs_attention';
  confidenceScore: number;
  createdAt: string;
}

// ============================================
// API 类型
// ============================================

/** 分析请求 */
export interface AnalyzeRequest {
  userId: string;
  forceRefresh?: boolean;
}

/** 分析响应 */
export interface AnalyzeResponse {
  success: boolean;
  analysisId: string;
  dashboardData: DashboardData;
  adaptivePlan: AdaptivePlan;
  lastAnalyzed: string;
}

/** 仪表盘响应 */
export interface DashboardResponse {
  dashboardData: DashboardData;
  adaptivePlan: AdaptivePlan;
  isStale: boolean;
  lastAnalyzed: string;
}

/** 数据收集状态 */
export interface DataCollectionStatus {
  hasBaseline: boolean;
  calibrationCount: number;
  calibrationDays?: number;
  firstCalibrationDate?: string | null;
  lastCalibrationDate?: string | null;
  requiredCalibrations: number;
  isReady: boolean;
  progress: number;  // 0-100
  message: string;
}
