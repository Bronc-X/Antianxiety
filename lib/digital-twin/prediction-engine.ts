/**
 * Digital Twin Prediction Engine
 * 
 * 基于生理评估和校准历史生成纵向预测
 * 
 * @module lib/digital-twin/prediction-engine
 */

import type {
  PhysiologicalAssessment,
  CalibrationData,
  LongitudinalPredictions,
  PredictionTimepoint,
  TreatmentMilestone,
  BaselineComparison,
} from '@/types/digital-twin';

// ============================================
// 常量
// ============================================

/** 预测时间点（周） */
export const PREDICTION_WEEKS = [0, 3, 6, 9, 12, 15] as const;

/** 指标名称映射 */
const METRIC_NAMES = {
  anxietyScore: '焦虑评分',
  sleepQuality: '睡眠质量',
  stressResilience: '压力韧性',
  moodStability: '情绪稳定性',
  energyLevel: '能量水平',
  hrvScore: 'HRV 评分',
} as const;

/** 里程碑事件模板 */
const MILESTONE_TEMPLATES = [
  { week: 0, event: '开始旅程', detail: '完成基线评估，建立个人健康档案' },
  { week: 3, event: '初步适应', detail: '身体开始适应新的作息和呼吸练习' },
  { week: 6, event: '习惯形成', detail: '健康习惯逐渐稳固，睡眠质量改善' },
  { week: 9, event: '深度调整', detail: '神经系统重塑，压力响应优化' },
  { week: 12, event: '稳定期', detail: '各项指标趋于稳定，建立长期模式' },
  { week: 15, event: '巩固成果', detail: '健康状态持续改善，准备下一阶段' },
];

// ============================================
// 核心函数
// ============================================

/**
 * 生成纵向预测
 */
export function generatePredictions(
  assessment: PhysiologicalAssessment,
  calibrationHistory: CalibrationData[]
): LongitudinalPredictions {
  // 计算基线值
  const baselineValues = calculateBaselineValues(assessment, calibrationHistory);
  
  // 计算改善率
  const improvementRates = calculateImprovementRates(assessment, calibrationHistory);
  
  // 生成各时间点预测
  const timepoints: PredictionTimepoint[] = PREDICTION_WEEKS.map(week => ({
    week,
    predictions: {
      anxietyScore: predictMetric(baselineValues.anxiety, improvementRates.anxiety, week),
      sleepQuality: predictMetric(baselineValues.sleep, improvementRates.sleep, week),
      stressResilience: predictMetric(baselineValues.stress, improvementRates.stress, week),
      moodStability: predictMetric(baselineValues.mood, improvementRates.mood, week),
      energyLevel: predictMetric(baselineValues.energy, improvementRates.energy, week),
      hrvScore: predictMetric(baselineValues.hrv, improvementRates.hrv, week),
    },
  }));
  
  // 计算基线对比
  const baselineComparison = calculateBaselineComparison(
    baselineValues,
    timepoints[timepoints.length - 1].predictions
  );
  
  return {
    timepoints,
    baselineComparison,
  };
}

/**
 * 计算治疗里程碑
 */
export function calculateMilestones(
  registrationDate: string,
  calibrationHistory: CalibrationData[]
): TreatmentMilestone[] {
  const regDate = new Date(registrationDate);
  const now = new Date();
  const daysSinceRegistration = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(daysSinceRegistration / 7);
  
  return MILESTONE_TEMPLATES.map(template => {
    let status: 'completed' | 'current' | 'upcoming';
    
    if (template.week < currentWeek) {
      status = 'completed';
    } else if (template.week === currentWeek || 
               (template.week > currentWeek && template.week <= currentWeek + 2)) {
      status = 'current';
    } else {
      status = 'upcoming';
    }
    
    // 计算该周的实际分数（如果有数据）
    let actualScore: number | undefined;
    if (status === 'completed' && calibrationHistory.length > 0) {
      const weekStart = new Date(regDate);
      weekStart.setDate(weekStart.getDate() + template.week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekCalibrations = calibrationHistory.filter(c => {
        const cDate = new Date(c.date);
        return cDate >= weekStart && cDate < weekEnd;
      });
      
      if (weekCalibrations.length > 0) {
        actualScore = weekCalibrations.reduce((sum, c) => sum + c.moodScore, 0) / weekCalibrations.length;
      }
    }
    
    return {
      week: template.week,
      event: template.event,
      status,
      detail: template.detail,
      actualScore,
    };
  });
}

// ============================================
// 辅助函数
// ============================================

interface BaselineValues {
  anxiety: number;
  sleep: number;
  stress: number;
  mood: number;
  energy: number;
  hrv: number;
}

interface ImprovementRates {
  anxiety: number;
  sleep: number;
  stress: number;
  mood: number;
  energy: number;
  hrv: number;
}

/**
 * 计算基线值
 */
function calculateBaselineValues(
  assessment: PhysiologicalAssessment,
  calibrationHistory: CalibrationData[]
): BaselineValues {
  // 优先使用评估数据，否则使用校准历史平均值
  if (calibrationHistory.length > 0) {
    const recent = calibrationHistory.slice(-7);
    const avgSleep = recent.reduce((sum, c) => sum + c.sleepQuality, 0) / recent.length;
    const avgMood = recent.reduce((sum, c) => sum + c.moodScore, 0) / recent.length;
    const avgStress = recent.reduce((sum, c) => sum + c.stressLevel, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, c) => sum + c.energyLevel, 0) / recent.length;
    
    return {
      anxiety: assessment.anxietyLevel.score,
      sleep: avgSleep || assessment.sleepHealth.score,
      stress: 10 - avgStress || assessment.stressResilience.score,
      mood: avgMood || assessment.moodStability.score,
      energy: avgEnergy || assessment.energyLevel.score,
      hrv: assessment.hrvEstimate.score,
    };
  }
  
  return {
    anxiety: assessment.anxietyLevel.score,
    sleep: assessment.sleepHealth.score,
    stress: assessment.stressResilience.score,
    mood: assessment.moodStability.score,
    energy: assessment.energyLevel.score,
    hrv: assessment.hrvEstimate.score,
  };
}

/**
 * 计算改善率
 */
function calculateImprovementRates(
  assessment: PhysiologicalAssessment,
  calibrationHistory: CalibrationData[]
): ImprovementRates {
  // 基础改善率（每周）
  const baseRate = 0.03; // 3% per week
  
  // 根据当前状态调整改善率
  const statusMultiplier = assessment.overallStatus === 'needs_attention' ? 1.5 :
                          assessment.overallStatus === 'stable' ? 1.0 : 0.8;
  
  // 根据数据量调整置信度
  const dataConfidence = Math.min(1, calibrationHistory.length / 14);
  
  // 计算各指标的改善率
  const anxietyRoom = 10 - assessment.anxietyLevel.score;
  const sleepRoom = 10 - assessment.sleepHealth.score;
  const stressRoom = 10 - assessment.stressResilience.score;
  const moodRoom = 10 - assessment.moodStability.score;
  const energyRoom = 10 - assessment.energyLevel.score;
  const hrvRoom = 10 - assessment.hrvEstimate.score;
  
  return {
    anxiety: baseRate * statusMultiplier * (anxietyRoom / 10) * (0.5 + 0.5 * dataConfidence),
    sleep: baseRate * statusMultiplier * (sleepRoom / 10) * (0.5 + 0.5 * dataConfidence),
    stress: baseRate * statusMultiplier * (stressRoom / 10) * (0.5 + 0.5 * dataConfidence),
    mood: baseRate * statusMultiplier * (moodRoom / 10) * (0.5 + 0.5 * dataConfidence),
    energy: baseRate * statusMultiplier * (energyRoom / 10) * (0.5 + 0.5 * dataConfidence),
    hrv: baseRate * statusMultiplier * (hrvRoom / 10) * (0.5 + 0.5 * dataConfidence),
  };
}

/**
 * 预测单个指标
 */
function predictMetric(
  baseline: number,
  improvementRate: number,
  week: number
): { value: number; confidence: string } {
  // 使用对数增长模型（避免无限增长）
  const maxImprovement = 10 - baseline;
  const improvement = maxImprovement * (1 - Math.exp(-improvementRate * week));
  const predictedValue = Math.min(10, baseline + improvement);
  
  // 计算不确定性（随时间增加）
  const baseUncertainty = 0.5;
  const timeUncertainty = 0.1 * Math.sqrt(week);
  const totalUncertainty = baseUncertainty + timeUncertainty;
  
  return {
    value: Math.round(predictedValue * 10) / 10,
    confidence: `${predictedValue.toFixed(1)} ± ${totalUncertainty.toFixed(1)}`,
  };
}

/**
 * 计算基线对比
 */
function calculateBaselineComparison(
  baseline: BaselineValues,
  finalPredictions: PredictionTimepoint['predictions']
): BaselineComparison[] {
  const metrics: Array<{ key: keyof typeof METRIC_NAMES; baselineKey: keyof BaselineValues }> = [
    { key: 'anxietyScore', baselineKey: 'anxiety' },
    { key: 'sleepQuality', baselineKey: 'sleep' },
    { key: 'stressResilience', baselineKey: 'stress' },
    { key: 'moodStability', baselineKey: 'mood' },
    { key: 'energyLevel', baselineKey: 'energy' },
    { key: 'hrvScore', baselineKey: 'hrv' },
  ];
  
  return metrics.map(({ key, baselineKey }) => {
    const baselineValue = baseline[baselineKey];
    const currentValue = finalPredictions[key].value;
    const change = currentValue - baselineValue;
    const changePercent = baselineValue > 0 ? (change / baselineValue) * 100 : 0;
    
    return {
      metric: METRIC_NAMES[key],
      baseline: Math.round(baselineValue * 10) / 10,
      current: Math.round(currentValue * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent),
    };
  });
}

/**
 * 验证预测完整性
 */
export function validatePredictions(predictions: LongitudinalPredictions): boolean {
  // 检查时间点数量
  if (predictions.timepoints.length !== 6) return false;
  
  // 检查时间点周数
  const expectedWeeks = [0, 3, 6, 9, 12, 15];
  for (let i = 0; i < predictions.timepoints.length; i++) {
    if (predictions.timepoints[i].week !== expectedWeeks[i]) return false;
  }
  
  // 检查每个时间点的指标完整性
  for (const timepoint of predictions.timepoints) {
    const preds = timepoint.predictions;
    if (!preds.anxietyScore || !preds.sleepQuality || !preds.stressResilience ||
        !preds.moodStability || !preds.energyLevel || !preds.hrvScore) {
      return false;
    }
  }
  
  return true;
}

/**
 * 验证里程碑一致性
 */
export function validateMilestones(milestones: TreatmentMilestone[]): boolean {
  // 检查里程碑数量
  if (milestones.length !== 6) return false;
  
  // 检查周数
  const expectedWeeks = [0, 3, 6, 9, 12, 15];
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i].week !== expectedWeeks[i]) return false;
  }
  
  // 检查状态一致性：只能有一个 current，completed 在 current 之前，upcoming 在 current 之后
  let foundCurrent = false;
  let afterCurrent = false;
  
  for (const milestone of milestones) {
    if (milestone.status === 'current') {
      if (foundCurrent) return false; // 不能有多个 current
      foundCurrent = true;
    } else if (milestone.status === 'upcoming') {
      afterCurrent = true;
    } else if (milestone.status === 'completed') {
      if (afterCurrent) return false; // completed 不能在 upcoming 之后
    }
  }
  
  return true;
}
