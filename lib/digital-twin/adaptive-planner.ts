/**
 * Digital Twin Adaptive Planner
 * 
 * 基于生理评估生成个性化的自适应健康计划
 * 
 * @module lib/digital-twin/adaptive-planner
 */

import type { Paper } from '@/lib/services/semantic-scholar';
import type {
  PhysiologicalAssessment,
  AdaptivePlan,
  DailyFocus,
  BreathingExercise,
  SleepRecommendation,
  ActivitySuggestion,
} from '@/types/digital-twin';

// ============================================
// 类型定义
// ============================================

export interface UserPreferences {
  preferredExerciseTime?: 'morning' | 'afternoon' | 'evening';
  activityLevel?: 'low' | 'moderate' | 'high';
  sleepGoal?: number;
  availableMinutesPerDay?: number;
}

// ============================================
// 核心函数
// ============================================

/**
 * 生成自适应计划
 */
export function generateAdaptivePlan(
  assessment: PhysiologicalAssessment,
  papers: Paper[],
  userPreferences?: UserPreferences
): AdaptivePlan {
  // 分析需要关注的领域
  const focusAreas = analyzeFocusAreas(assessment);
  
  // 生成每日重点
  const dailyFocus = generateDailyFocus(focusAreas, papers);
  
  // 生成呼吸练习
  const breathingExercises = generateBreathingExercises(assessment, userPreferences);
  
  // 生成睡眠建议
  const sleepRecommendations = generateSleepRecommendations(assessment, userPreferences);
  
  // 生成活动建议
  const activitySuggestions = generateActivitySuggestions(assessment, userPreferences);
  
  // 生成避免行为
  const avoidanceBehaviors = generateAvoidanceBehaviors(assessment);
  
  // 计算下次检查点
  const nextCheckpoint = calculateNextCheckpoint(assessment);
  
  return {
    dailyFocus,
    breathingExercises,
    sleepRecommendations,
    activitySuggestions,
    avoidanceBehaviors,
    nextCheckpoint,
  };
}

// ============================================
// 分析函数
// ============================================

interface FocusArea {
  area: string;
  priority: 'high' | 'medium' | 'low';
  score: number;
  needsAttention: boolean;
}

/**
 * 分析需要关注的领域
 */
function analyzeFocusAreas(assessment: PhysiologicalAssessment): FocusArea[] {
  const areas: FocusArea[] = [
    {
      area: '焦虑管理',
      priority: assessment.anxietyLevel.score < 5 ? 'high' : assessment.anxietyLevel.score < 7 ? 'medium' : 'low',
      score: assessment.anxietyLevel.score,
      needsAttention: assessment.anxietyLevel.score < 6,
    },
    {
      area: '睡眠健康',
      priority: assessment.sleepHealth.score < 5 ? 'high' : assessment.sleepHealth.score < 7 ? 'medium' : 'low',
      score: assessment.sleepHealth.score,
      needsAttention: assessment.sleepHealth.score < 6,
    },
    {
      area: '压力韧性',
      priority: assessment.stressResilience.score < 5 ? 'high' : assessment.stressResilience.score < 7 ? 'medium' : 'low',
      score: assessment.stressResilience.score,
      needsAttention: assessment.stressResilience.score < 6,
    },
    {
      area: '情绪稳定',
      priority: assessment.moodStability.score < 5 ? 'high' : assessment.moodStability.score < 7 ? 'medium' : 'low',
      score: assessment.moodStability.score,
      needsAttention: assessment.moodStability.score < 6,
    },
    {
      area: '能量水平',
      priority: assessment.energyLevel.score < 5 ? 'high' : assessment.energyLevel.score < 7 ? 'medium' : 'low',
      score: assessment.energyLevel.score,
      needsAttention: assessment.energyLevel.score < 6,
    },
    {
      area: '心率变异性',
      priority: assessment.hrvEstimate.score < 5 ? 'high' : assessment.hrvEstimate.score < 7 ? 'medium' : 'low',
      score: assessment.hrvEstimate.score,
      needsAttention: assessment.hrvEstimate.score < 6,
    },
  ];
  
  // 按优先级排序
  return areas.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================
// 生成函数
// ============================================

/**
 * 生成每日重点
 */
function generateDailyFocus(focusAreas: FocusArea[], papers: Paper[]): DailyFocus[] {
  const dailyFocus: DailyFocus[] = [];
  
  // 取前 3 个需要关注的领域
  const topAreas = focusAreas.filter(a => a.needsAttention).slice(0, 3);
  
  topAreas.forEach(area => {
    const focus = getFocusForArea(area, papers);
    if (focus) {
      dailyFocus.push(focus);
    }
  });
  
  // 如果没有需要特别关注的领域，添加维护性建议
  if (dailyFocus.length === 0) {
    dailyFocus.push({
      area: '整体健康',
      priority: 'medium',
      action: '保持当前的健康习惯',
      rationale: '您的各项指标都在良好范围内，继续保持',
    });
  }
  
  return dailyFocus;
}

/**
 * 获取特定领域的重点建议
 */
function getFocusForArea(area: FocusArea, papers: Paper[]): DailyFocus | null {
  const focusMap: Record<string, { action: string; rationale: string }> = {
    '焦虑管理': {
      action: '每天进行 10 分钟正念呼吸练习',
      rationale: '正念呼吸可以激活副交感神经系统，降低皮质醇水平',
    },
    '睡眠健康': {
      action: '建立固定的睡前仪式，提前 1 小时远离屏幕',
      rationale: '规律的睡前习惯有助于调节昼夜节律',
    },
    '压力韧性': {
      action: '每天记录 3 件感恩的事情',
      rationale: '感恩练习可以重塑大脑的压力响应模式',
    },
    '情绪稳定': {
      action: '进行 15 分钟户外散步',
      rationale: '自然光照和轻度运动可以稳定情绪',
    },
    '能量水平': {
      action: '优化午餐后的休息时间',
      rationale: '短暂的休息可以恢复认知能量',
    },
    '心率变异性': {
      action: '练习 4-7-8 呼吸法',
      rationale: '深呼吸可以提高心率变异性，增强自主神经调节能力',
    },
  };
  
  const focus = focusMap[area.area];
  if (!focus) return null;
  
  // 尝试添加科学依据
  let scientificBasis: string | undefined;
  if (papers.length > 0) {
    const relevantPaper = papers.find(p => 
      p.title.toLowerCase().includes(area.area.toLowerCase()) ||
      p.abstract.toLowerCase().includes(area.area.toLowerCase())
    );
    if (relevantPaper) {
      scientificBasis = `参考: ${relevantPaper.title.substring(0, 50)}...`;
    }
  }
  
  return {
    area: area.area,
    priority: area.priority,
    action: focus.action,
    rationale: focus.rationale,
    scientificBasis,
  };
}

/**
 * 生成呼吸练习
 */
function generateBreathingExercises(
  assessment: PhysiologicalAssessment,
  preferences?: UserPreferences
): BreathingExercise[] {
  void preferences;
  const exercises: BreathingExercise[] = [];
  
  // 基础呼吸练习
  exercises.push({
    name: '腹式呼吸',
    duration: '3-5 分钟',
    timing: '感到紧张时',
    benefit: '快速激活副交感神经，缓解即时焦虑',
  });
  
  // 根据焦虑水平添加练习
  if (assessment.anxietyLevel.score < 6) {
    exercises.push({
      name: '4-7-8 呼吸法',
      duration: '5 分钟',
      timing: '睡前或焦虑发作时',
      benefit: '深度放松，促进入睡',
    });
  }
  
  // 根据睡眠状况添加练习
  if (assessment.sleepHealth.score < 6) {
    exercises.push({
      name: '渐进式肌肉放松',
      duration: '10-15 分钟',
      timing: '睡前 30 分钟',
      benefit: '释放身体紧张，改善睡眠质量',
    });
  }
  
  // 根据 HRV 添加练习
  if (assessment.hrvEstimate.score < 6) {
    exercises.push({
      name: '共振呼吸',
      duration: '5 分钟',
      timing: '每天固定时间',
      benefit: '提高心率变异性，增强自主神经调节',
    });
  }
  
  return exercises;
}

/**
 * 生成睡眠建议
 */
function generateSleepRecommendations(
  assessment: PhysiologicalAssessment,
  preferences?: UserPreferences
): SleepRecommendation[] {
  void preferences;
  const recommendations: SleepRecommendation[] = [];
  
  // 基础建议
  recommendations.push({
    recommendation: '保持固定的起床时间',
    reason: '稳定的起床时间是调节昼夜节律的关键',
    expectedImpact: '1-2 周内改善睡眠规律性',
  });
  
  // 根据睡眠状况添加建议
  if (assessment.sleepHealth.score < 6) {
    recommendations.push({
      recommendation: '睡前 2 小时避免咖啡因和酒精',
      reason: '这些物质会干扰睡眠结构',
      expectedImpact: '立即改善入睡时间和睡眠深度',
    });
    
    recommendations.push({
      recommendation: '创造凉爽、黑暗的睡眠环境',
      reason: '最佳睡眠温度为 18-20°C',
      expectedImpact: '提高深度睡眠比例',
    });
  }
  
  // 根据焦虑水平添加建议
  if (assessment.anxietyLevel.score < 6) {
    recommendations.push({
      recommendation: '睡前写下明天的待办事项',
      reason: '将担忧外化可以减少入睡时的思绪纷飞',
      expectedImpact: '减少入睡时间',
    });
  }
  
  // 根据能量水平添加建议
  if (assessment.energyLevel.score < 6) {
    recommendations.push({
      recommendation: '避免午后长时间午睡',
      reason: '长午睡会影响夜间睡眠驱动力',
      expectedImpact: '提高夜间睡眠质量和白天精力',
    });
  }
  
  return recommendations;
}

/**
 * 生成活动建议
 */
function generateActivitySuggestions(
  assessment: PhysiologicalAssessment,
  preferences?: UserPreferences
): ActivitySuggestion[] {
  const suggestions: ActivitySuggestion[] = [];
  const activityLevel = preferences?.activityLevel || 'moderate';
  
  // 基础活动建议
  suggestions.push({
    activity: '户外散步',
    frequency: '每天',
    duration: '15-30 分钟',
    benefit: '自然光照调节昼夜节律，轻度运动释放内啡肽',
  });
  
  // 根据活动水平调整
  if (activityLevel === 'low') {
    suggestions.push({
      activity: '温和瑜伽',
      frequency: '每周 2-3 次',
      duration: '20 分钟',
      benefit: '提高身体觉察，减少肌肉紧张',
    });
  } else if (activityLevel === 'moderate' || activityLevel === 'high') {
    suggestions.push({
      activity: '有氧运动',
      frequency: '每周 3-4 次',
      duration: '30-45 分钟',
      benefit: '提高心肺功能，改善情绪和睡眠',
    });
  }
  
  // 根据压力水平添加建议
  if (assessment.stressResilience.score < 6) {
    suggestions.push({
      activity: '正念冥想',
      frequency: '每天',
      duration: '10 分钟',
      benefit: '培养压力觉察能力，建立心理韧性',
    });
  }
  
  return suggestions;
}

/**
 * 生成避免行为
 */
function generateAvoidanceBehaviors(assessment: PhysiologicalAssessment): string[] {
  const behaviors: string[] = [];
  
  // 基础避免行为
  behaviors.push('睡前 1 小时避免使用电子设备');
  
  // 根据焦虑水平
  if (assessment.anxietyLevel.score < 6) {
    behaviors.push('避免过度查看新闻和社交媒体');
    behaviors.push('避免在焦虑时做重大决定');
  }
  
  // 根据睡眠状况
  if (assessment.sleepHealth.score < 6) {
    behaviors.push('避免在床上工作或看电视');
    behaviors.push('避免睡前进食过多');
  }
  
  // 根据压力水平
  if (assessment.stressResilience.score < 6) {
    behaviors.push('避免过度承诺和多任务处理');
  }
  
  return behaviors;
}

/**
 * 计算下次检查点
 */
function calculateNextCheckpoint(assessment: PhysiologicalAssessment): { date: string; focus: string } {
  // 根据整体状态决定检查间隔
  let daysUntilCheckpoint: number;
  let focus: string;
  
  if (assessment.overallStatus === 'needs_attention') {
    daysUntilCheckpoint = 3;
    focus = '密切关注当前状态变化';
  } else if (assessment.overallStatus === 'stable') {
    daysUntilCheckpoint = 7;
    focus = '评估本周进展';
  } else {
    daysUntilCheckpoint = 14;
    focus = '巩固当前成果';
  }
  
  const checkpointDate = new Date();
  checkpointDate.setDate(checkpointDate.getDate() + daysUntilCheckpoint);
  
  return {
    date: checkpointDate.toISOString().split('T')[0],
    focus,
  };
}

// ============================================
// 验证函数
// ============================================

/**
 * 验证自适应计划完整性
 */
export function validateAdaptivePlan(plan: AdaptivePlan): boolean {
  // 检查必要字段
  if (!Array.isArray(plan.dailyFocus) || plan.dailyFocus.length === 0) return false;
  if (!Array.isArray(plan.breathingExercises) || plan.breathingExercises.length === 0) return false;
  if (!Array.isArray(plan.sleepRecommendations) || plan.sleepRecommendations.length === 0) return false;
  if (!Array.isArray(plan.activitySuggestions)) return false;
  if (!Array.isArray(plan.avoidanceBehaviors)) return false;
  if (!plan.nextCheckpoint || !plan.nextCheckpoint.date || !plan.nextCheckpoint.focus) return false;
  
  // 验证每日重点
  for (const focus of plan.dailyFocus) {
    if (!focus.area || !focus.priority || !focus.action || !focus.rationale) return false;
    if (!['high', 'medium', 'low'].includes(focus.priority)) return false;
  }
  
  // 验证呼吸练习
  for (const exercise of plan.breathingExercises) {
    if (!exercise.name || !exercise.duration || !exercise.timing || !exercise.benefit) return false;
  }
  
  // 验证睡眠建议
  for (const rec of plan.sleepRecommendations) {
    if (!rec.recommendation || !rec.reason || !rec.expectedImpact) return false;
  }
  
  return true;
}
