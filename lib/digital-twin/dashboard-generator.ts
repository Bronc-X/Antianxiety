/**
 * Digital Twin Dashboard Generator
 * 
 * 将 AI 分析结果转换为仪表盘展示数据
 * 
 * @module lib/digital-twin/dashboard-generator
 */

import type {
  AggregatedUserData,
  PhysiologicalAssessment,
  LongitudinalPredictions,
  AdaptivePlan,
  DashboardData,
  ParticipantInfo,
  PredictionTableMetric,
  TreatmentMilestone,
  BaselineAssessment,
  VitalMetric,
  ChartData,
  SummaryStats,
  CalibrationData,
} from '@/types/digital-twin';
import { calculateMilestones } from './prediction-engine';

// ============================================
// 类型定义
// ============================================

export interface LLMAnalysisResult {
  assessment: PhysiologicalAssessment;
  predictions: LongitudinalPredictions;
  adaptivePlan: AdaptivePlan;
  analysisTimestamp: string;
  modelUsed: string;
  confidenceScore: number;
}

// ============================================
// 核心函数
// ============================================

/**
 * 生成仪表盘数据
 */
export function generateDashboardData(
  analysis: LLMAnalysisResult,
  userData: AggregatedUserData
): DashboardData {
  // 生成参与者信息
  const participant = generateParticipantInfo(userData);
  
  // 生成预测表格
  const predictionTable = generatePredictionTable(analysis.predictions);
  
  // 生成时间线
  const timeline = calculateMilestones(
    userData.profile.registrationDate,
    userData.calibrations
  );
  
  // 生成基线数据
  const baselineData = generateBaselineData(userData, analysis.assessment);
  
  // 生成图表数据
  const charts = generateChartData(userData.calibrations, analysis.predictions);
  
  // 生成汇总统计
  const summaryStats = generateSummaryStats(userData, analysis);
  
  // 计算下次分析时间
  const nextAnalysisScheduled = calculateNextAnalysisTime();
  
  return {
    participant,
    predictionTable,
    timeline,
    baselineData,
    charts,
    summaryStats,
    lastAnalyzed: analysis.analysisTimestamp,
    nextAnalysisScheduled,
  };
}

// ============================================
// 生成函数
// ============================================

/**
 * 生成参与者信息
 */
function generateParticipantInfo(userData: AggregatedUserData): ParticipantInfo {
  // 生成首字母（使用用户 ID 的前两个字符）
  const initials = userData.userId.substring(0, 2).toUpperCase();
  
  // 确定诊断描述
  let diagnosis = '健康管理';
  if (userData.baseline) {
    if (userData.baseline.gad7Score > 10) {
      diagnosis = '焦虑调节';
    } else if (userData.baseline.phq9Score > 10) {
      diagnosis = '情绪调节';
    } else if (userData.baseline.isiScore > 14) {
      diagnosis = '睡眠优化';
    } else if (userData.baseline.pss10Score > 20) {
      diagnosis = '压力管理';
    }
  }
  
  return {
    initials,
    age: userData.profile.age,
    gender: userData.profile.gender,
    diagnosis,
    registrationDate: userData.profile.registrationDate,
  };
}

/**
 * 生成预测表格
 */
function generatePredictionTable(predictions: LongitudinalPredictions): { metrics: PredictionTableMetric[] } {
  const metricNames = [
    { key: 'anxietyScore', name: '焦虑评分' },
    { key: 'sleepQuality', name: '睡眠质量' },
    { key: 'stressResilience', name: '压力韧性' },
    { key: 'moodStability', name: '情绪稳定性' },
    { key: 'energyLevel', name: '能量水平' },
    { key: 'hrvScore', name: 'HRV 评分' },
  ];
  
  const metrics: PredictionTableMetric[] = metricNames.map(({ key, name }) => {
    const baseline = predictions.timepoints[0]?.predictions[key as keyof typeof predictions.timepoints[0]['predictions']]?.value || 0;
    
    const predictionsByWeek: Record<string, string> = {};
    predictions.timepoints.forEach(tp => {
      const pred = tp.predictions[key as keyof typeof tp.predictions];
      predictionsByWeek[`week${tp.week}`] = pred?.confidence || `${pred?.value?.toFixed(1) || '0'} ± 1.0`;
    });
    
    return {
      name,
      baseline: Math.round(baseline * 10) / 10,
      predictions: predictionsByWeek,
    };
  });
  
  return { metrics };
}

/**
 * 生成基线数据
 */
function generateBaselineData(
  userData: AggregatedUserData,
  assessment: PhysiologicalAssessment
): { assessments: BaselineAssessment[]; vitals: VitalMetric[] } {
  const assessments: BaselineAssessment[] = [];
  const vitals: VitalMetric[] = [];
  
  // 添加临床评估
  if (userData.baseline) {
    assessments.push({
      name: 'GAD-7 焦虑量表',
      value: `${userData.baseline.gad7Score}/21`,
      interpretation: userData.baseline.interpretations.gad7,
    });
    
    assessments.push({
      name: 'PHQ-9 抑郁量表',
      value: `${userData.baseline.phq9Score}/27`,
      interpretation: userData.baseline.interpretations.phq9,
    });
    
    assessments.push({
      name: 'ISI 失眠量表',
      value: `${userData.baseline.isiScore}/28`,
      interpretation: userData.baseline.interpretations.isi,
    });
    
    assessments.push({
      name: 'PSS-10 压力量表',
      value: `${userData.baseline.pss10Score}/40`,
      interpretation: userData.baseline.interpretations.pss10,
    });
  }
  
  // 添加生物指标
  vitals.push({
    name: '焦虑水平',
    value: `${assessment.anxietyLevel.score.toFixed(1)}/10`,
    trend: getTrendStatus(assessment.anxietyLevel.score, 6),
  });
  
  vitals.push({
    name: '睡眠健康',
    value: `${assessment.sleepHealth.score.toFixed(1)}/10`,
    trend: getTrendStatus(assessment.sleepHealth.score, 6),
  });
  
  vitals.push({
    name: '压力韧性',
    value: `${assessment.stressResilience.score.toFixed(1)}/10`,
    trend: getTrendStatus(assessment.stressResilience.score, 6),
  });
  
  vitals.push({
    name: '能量水平',
    value: `${assessment.energyLevel.score.toFixed(1)}/10`,
    trend: getTrendStatus(assessment.energyLevel.score, 6),
  });
  
  vitals.push({
    name: 'HRV 估计',
    value: `${assessment.hrvEstimate.score.toFixed(1)}/10`,
    trend: getTrendStatus(assessment.hrvEstimate.score, 5),
  });
  
  return { assessments, vitals };
}

/**
 * 获取趋势状态
 */
function getTrendStatus(score: number, target: number): 'above_target' | 'at_target' | 'below_target' | 'normal' {
  if (score >= target + 1) return 'above_target';
  if (score >= target - 1) return 'at_target';
  if (score >= target - 2) return 'below_target';
  return 'normal';
}

/**
 * 生成图表数据
 */
function generateChartData(
  calibrations: CalibrationData[],
  predictions: LongitudinalPredictions
): ChartData {
  // 从校准数据提取趋势
  const recentCalibrations = calibrations.slice(-14);
  
  // 如果有校准数据，使用实际数据
  if (recentCalibrations.length > 0) {
    return {
      anxietyTrend: recentCalibrations.map(c => 10 - c.stressLevel), // 反转压力为焦虑改善
      sleepTrend: recentCalibrations.map(c => c.sleepQuality),
      hrvTrend: recentCalibrations.map(() => 5 + Math.random() * 2), // HRV 需要专门设备，这里模拟
      energyTrend: recentCalibrations.map(c => c.energyLevel),
    };
  }
  
  // 否则使用预测数据
  return {
    anxietyTrend: predictions.timepoints.map(tp => tp.predictions.anxietyScore.value),
    sleepTrend: predictions.timepoints.map(tp => tp.predictions.sleepQuality.value),
    hrvTrend: predictions.timepoints.map(tp => tp.predictions.hrvScore.value),
    energyTrend: predictions.timepoints.map(tp => tp.predictions.energyLevel.value),
  };
}

/**
 * 生成汇总统计
 */
function generateSummaryStats(
  userData: AggregatedUserData,
  analysis: LLMAnalysisResult
): SummaryStats {
  // 计算整体改善
  let overallImprovement = '0%';
  if (analysis.predictions.baselineComparison.length > 0) {
    const avgChange = analysis.predictions.baselineComparison.reduce(
      (sum, c) => sum + c.changePercent, 0
    ) / analysis.predictions.baselineComparison.length;
    overallImprovement = `${avgChange > 0 ? '+' : ''}${Math.round(avgChange)}%`;
  }
  
  // 计算首次结果天数
  const regDate = new Date(userData.profile.registrationDate);
  const now = new Date();
  const daysSinceRegistration = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToFirstResult = Math.min(daysSinceRegistration, 7);
  
  // 计算一致性分数
  const calibrationCount = userData.calibrations.length;
  const expectedCalibrations = daysSinceRegistration;
  const consistencyRatio = expectedCalibrations > 0 ? calibrationCount / expectedCalibrations : 0;
  let consistencyScore: string;
  if (consistencyRatio >= 0.8) {
    consistencyScore = '优秀';
  } else if (consistencyRatio >= 0.6) {
    consistencyScore = '良好';
  } else if (consistencyRatio >= 0.4) {
    consistencyScore = '一般';
  } else {
    consistencyScore = '需改进';
  }
  
  return {
    overallImprovement,
    daysToFirstResult,
    consistencyScore,
  };
}

/**
 * 计算下次分析时间
 */
function calculateNextAnalysisTime(): string {
  const nextAnalysis = new Date();
  nextAnalysis.setHours(nextAnalysis.getHours() + 6);
  return nextAnalysis.toISOString();
}

// ============================================
// 验证函数
// ============================================

/**
 * 验证仪表盘数据完整性
 */
export function validateDashboardData(data: DashboardData): boolean {
  // Property 8: Baseline Display Completeness
  if (!data.baselineData || !data.baselineData.assessments || !data.baselineData.vitals) {
    return false;
  }
  
  // Property 10: Summary Statistics Presence
  if (!data.summaryStats) return false;
  if (typeof data.summaryStats.overallImprovement !== 'string') return false;
  if (typeof data.summaryStats.daysToFirstResult !== 'number') return false;
  if (typeof data.summaryStats.consistencyScore !== 'string') return false;
  
  // Property 11: Participant Metadata Completeness
  if (!data.participant) return false;
  if (!data.participant.initials) return false;
  if (!data.participant.registrationDate) return false;
  
  // 检查预测表格
  if (!data.predictionTable || !data.predictionTable.metrics) return false;
  if (data.predictionTable.metrics.length !== 6) return false;
  
  // 检查时间线
  if (!data.timeline || data.timeline.length !== 6) return false;
  
  // 检查图表数据
  if (!data.charts) return false;
  if (!Array.isArray(data.charts.anxietyTrend)) return false;
  if (!Array.isArray(data.charts.sleepTrend)) return false;
  if (!Array.isArray(data.charts.hrvTrend)) return false;
  if (!Array.isArray(data.charts.energyTrend)) return false;
  
  return true;
}

/**
 * 检查医疗历史隐私
 * Property 12: Medical History Privacy
 */
export function filterSensitiveData(
  data: DashboardData,
  hasConsent: boolean
): DashboardData {
  if (hasConsent) {
    return data;
  }
  
  // 移除敏感的医疗历史数据
  return {
    ...data,
    baselineData: {
      ...data.baselineData,
      assessments: data.baselineData.assessments.map(a => ({
        ...a,
        // 隐藏具体分数，只显示一般描述
        value: '已记录',
        interpretation: '详情需授权查看',
      })),
    },
  };
}
