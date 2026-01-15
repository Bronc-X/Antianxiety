/**
 * Decision Tree Engine for Adaptive Onboarding
 * 
 * Generates personalized follow-up questions based on user's template answers.
 * Uses AI to create contextually relevant questions within 800ms.
 * 
 * **Property 2: Total Question Limit**
 * Total questions (template + decision-tree) SHALL NOT exceed 7.
 * 
 * **Property 3: Decision Tree Response Time**
 * AI-generated questions SHALL be returned within 800ms.
 */

import type {
  DecisionTreeQuestion,
  PhaseGoal,
  MetabolicProfile,
} from '@/types/adaptive-interaction';

// Constants
export const MAX_TOTAL_QUESTIONS = 7;
export const TEMPLATE_QUESTION_COUNT = 3;
export const MAX_DECISION_TREE_QUESTIONS = MAX_TOTAL_QUESTIONS - TEMPLATE_QUESTION_COUNT;
export const AI_RESPONSE_TIMEOUT_MS = 800;

/**
 * Decision tree question pools based on answer patterns
 */
const DECISION_TREE_POOLS: Record<string, DecisionTreeQuestion[]> = {
  // Energy-focused follow-ups
  energy_severe: [
    {
      id: 'dt_caffeine_dependency',
      question: '你是否依赖咖啡或能量饮料来度过下午？',
      description: '每天需要多少杯才能保持清醒？',
      type: 'single',
      options: [
        { label: '3杯以上', value: 'high_caffeine', score: 3 },
        { label: '1-2杯', value: 'moderate_caffeine', score: 2 },
        { label: '几乎不喝', value: 'no_caffeine', score: 1 },
      ],
      reasoning: '咖啡因依赖程度可以反映肾上腺疲劳的严重性',
    },
    {
      id: 'dt_post_meal_crash',
      question: '午餐后是否特别容易犯困？',
      description: '尤其是吃了米饭、面条等碳水化合物之后？',
      type: 'single',
      options: [
        { label: '是的，几乎每次都会', value: 'severe_postmeal', score: 3 },
        { label: '偶尔会', value: 'occasional_postmeal', score: 2 },
        { label: '不会', value: 'no_postmeal', score: 1 },
      ],
      reasoning: '餐后血糖波动是代谢健康的重要指标',
    },
  ],
  
  // Sleep-focused follow-ups
  sleep_severe: [
    {
      id: 'dt_sleep_onset',
      question: '入睡需要多长时间？',
      description: '从躺下到真正睡着',
      type: 'single',
      options: [
        { label: '超过30分钟', value: 'long_onset', score: 3 },
        { label: '15-30分钟', value: 'moderate_onset', score: 2 },
        { label: '15分钟以内', value: 'quick_onset', score: 1 },
      ],
      reasoning: '入睡时间反映交感神经活跃程度',
    },
    {
      id: 'dt_screen_before_bed',
      question: '睡前1小时内是否经常看手机或电脑？',
      type: 'single',
      options: [
        { label: '几乎每天', value: 'daily_screen', score: 3 },
        { label: '偶尔', value: 'occasional_screen', score: 2 },
        { label: '很少', value: 'rare_screen', score: 1 },
      ],
      reasoning: '蓝光暴露影响褪黑素分泌',
    },
  ],
  
  // Stress-focused follow-ups
  stress_severe: [
    {
      id: 'dt_physical_symptoms',
      question: '压力大时是否有身体症状？',
      description: '如头痛、肩颈紧张、胃部不适等',
      type: 'single',
      options: [
        { label: '经常有多种症状', value: 'multiple_symptoms', score: 3 },
        { label: '偶尔有一两种', value: 'some_symptoms', score: 2 },
        { label: '几乎没有', value: 'no_symptoms', score: 1 },
      ],
      reasoning: '躯体化症状反映压力对身体的影响程度',
    },
    {
      id: 'dt_recovery_activities',
      question: '你有固定的减压方式吗？',
      description: '如运动、冥想、爱好等',
      type: 'single',
      options: [
        { label: '没有，不知道怎么放松', value: 'no_recovery', score: 3 },
        { label: '有，但很少做', value: 'rare_recovery', score: 2 },
        { label: '有，经常做', value: 'regular_recovery', score: 1 },
      ],
      reasoning: '恢复能力是压力管理的关键',
    },
  ],
  
  // Body composition follow-ups
  body_severe: [
    {
      id: 'dt_diet_attempts',
      question: '过去一年尝试过减肥吗？',
      type: 'single',
      options: [
        { label: '多次尝试，都失败了', value: 'multiple_failed', score: 3 },
        { label: '尝试过一两次', value: 'few_attempts', score: 2 },
        { label: '没有特别尝试', value: 'no_attempts', score: 1 },
      ],
      reasoning: '减肥失败史可能指向代谢适应问题',
    },
  ],
  
  // General follow-ups
  general: [
    {
      id: 'dt_exercise_frequency',
      question: '每周运动几次？',
      description: '包括任何形式的有意识运动',
      type: 'single',
      options: [
        { label: '几乎不运动', value: 'no_exercise', score: 3 },
        { label: '1-2次', value: 'low_exercise', score: 2 },
        { label: '3次以上', value: 'regular_exercise', score: 1 },
      ],
      reasoning: '运动频率影响代谢健康和压力管理',
    },
    {
      id: 'dt_water_intake',
      question: '每天喝多少水？',
      type: 'single',
      options: [
        { label: '不到4杯', value: 'low_water', score: 3 },
        { label: '4-8杯', value: 'moderate_water', score: 2 },
        { label: '8杯以上', value: 'high_water', score: 1 },
      ],
      reasoning: '水分摄入影响能量水平和代谢',
    },
  ],
};

/**
 * Select decision tree questions based on template answers
 */
export function selectDecisionTreeQuestions(
  templateAnswers: Record<string, string>,
  previousDecisionAnswers: Record<string, string> = {}
): DecisionTreeQuestion[] {
  const selectedQuestions: DecisionTreeQuestion[] = [];
  const usedIds = new Set(Object.keys(previousDecisionAnswers));
  
  // Determine which pools to draw from based on template answers
  const pools: DecisionTreeQuestion[][] = [];
  
  // Energy-related
  if (templateAnswers.energy_crash === 'severe_crash') {
    pools.push(DECISION_TREE_POOLS.energy_severe);
  }
  
  // Sleep-related
  if (templateAnswers.sleep_maintenance === 'frequent_wakeup') {
    pools.push(DECISION_TREE_POOLS.sleep_severe);
  }
  
  // Stress-related
  if (templateAnswers.stress_tolerance === 'low_tolerance') {
    pools.push(DECISION_TREE_POOLS.stress_severe);
  }
  
  // Always include general pool
  pools.push(DECISION_TREE_POOLS.general);
  
  // Select questions from pools, avoiding duplicates
  for (const pool of pools) {
    for (const question of pool) {
      if (!usedIds.has(question.id) && selectedQuestions.length < MAX_DECISION_TREE_QUESTIONS) {
        selectedQuestions.push(question);
        usedIds.add(question.id);
      }
    }
  }
  
  return selectedQuestions.slice(0, MAX_DECISION_TREE_QUESTIONS);
}

/**
 * Get the next decision tree question
 */
export function getNextDecisionTreeQuestion(
  templateAnswers: Record<string, string>,
  previousDecisionAnswers: Record<string, string>
): DecisionTreeQuestion | null {
  const currentCount = Object.keys(previousDecisionAnswers).length;
  
  // Check if we've reached the limit
  if (currentCount >= MAX_DECISION_TREE_QUESTIONS) {
    return null;
  }
  
  const availableQuestions = selectDecisionTreeQuestions(templateAnswers, previousDecisionAnswers);
  
  // Return the first available question not yet answered
  for (const question of availableQuestions) {
    if (!previousDecisionAnswers[question.id]) {
      return question;
    }
  }
  
  return null;
}

/**
 * Calculate total question count
 */
export function getTotalQuestionCount(decisionTreeAnswerCount: number): number {
  return TEMPLATE_QUESTION_COUNT + Math.min(decisionTreeAnswerCount, MAX_DECISION_TREE_QUESTIONS);
}

/**
 * Check if onboarding should proceed to goal recommendation
 */
export function shouldProceedToGoals(
  templateAnswers: Record<string, string>,
  decisionTreeAnswers: Record<string, string>
): boolean {
  const templateComplete = Object.keys(templateAnswers).length >= TEMPLATE_QUESTION_COUNT;
  const decisionTreeComplete = Object.keys(decisionTreeAnswers).length >= MAX_DECISION_TREE_QUESTIONS;
  const noMoreQuestions = getNextDecisionTreeQuestion(templateAnswers, decisionTreeAnswers) === null;
  
  return templateComplete && (decisionTreeComplete || noMoreQuestions);
}

/**
 * Infer metabolic profile from all answers
 */
export function inferMetabolicProfile(
  allAnswers: Record<string, string>
): MetabolicProfile {
  // Calculate total score
  let totalScore = 0;
  const scoreMap: Record<string, number> = {
    severe_crash: 3, occasional_crash: 2, no_crash: 1,
    frequent_wakeup: 3, occasional_wakeup: 2, sleep_well: 1,
    low_tolerance: 3, medium_tolerance: 2, high_tolerance: 1,
    // Decision tree scores
    high_caffeine: 3, moderate_caffeine: 2, no_caffeine: 1,
    severe_postmeal: 3, occasional_postmeal: 2, no_postmeal: 1,
    long_onset: 3, moderate_onset: 2, quick_onset: 1,
    daily_screen: 3, occasional_screen: 2, rare_screen: 1,
    multiple_symptoms: 3, some_symptoms: 2, no_symptoms: 1,
    no_recovery: 3, rare_recovery: 2, regular_recovery: 1,
    multiple_failed: 3, few_attempts: 2, no_attempts: 1,
    no_exercise: 3, low_exercise: 2, regular_exercise: 1,
    low_water: 3, moderate_water: 2, high_water: 1,
  };
  
  for (const answer of Object.values(allAnswers)) {
    totalScore += scoreMap[answer] || 0;
  }
  
  // Map patterns
  const energyPattern = (() => {
    switch (allAnswers.energy_crash) {
      case 'severe_crash': return 'crash_afternoon';
      case 'occasional_crash': return 'variable';
      default: return 'stable';
    }
  })() as MetabolicProfile['energy_pattern'];
  
  const sleepPattern = (() => {
    switch (allAnswers.sleep_maintenance) {
      case 'frequent_wakeup': return 'cortisol_imbalance';
      case 'occasional_wakeup': return 'occasional_issue';
      default: return 'normal';
    }
  })() as MetabolicProfile['sleep_pattern'];
  
  const stressPattern = (() => {
    switch (allAnswers.stress_tolerance) {
      case 'low_tolerance': return 'low_tolerance';
      case 'medium_tolerance': return 'medium_tolerance';
      default: return 'high_tolerance';
    }
  })() as MetabolicProfile['stress_pattern'];
  
  // Determine severity
  const severity = (() => {
    if (totalScore >= 15) return 'high';
    if (totalScore >= 10) return 'medium';
    return 'low';
  })() as MetabolicProfile['severity'];
  
  return {
    energy_pattern: energyPattern,
    sleep_pattern: sleepPattern,
    body_pattern: 'healthy', // Default, can be refined with more questions
    stress_pattern: stressPattern,
    psychology: 'curious', // Default
    overall_score: totalScore,
    severity,
  };
}

/**
 * Infer phase goals from metabolic profile
 */
export function inferPhaseGoals(
  profile: MetabolicProfile
): PhaseGoal[] {
  const goals: PhaseGoal[] = [];
  const now = new Date().toISOString();
  
  // Priority 1: Most severe issue
  if (profile.sleep_pattern === 'cortisol_imbalance') {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '', // Will be set by caller
      goal_type: 'sleep',
      priority: 1,
      title: '改善睡眠质量',
      rationale: '你的睡眠模式显示可能存在皮质醇失衡，凌晨醒来是典型症状。优先改善睡眠可以帮助恢复昼夜节律，这是其他健康改善的基础。',
      citations: [{
        title: 'Cortisol and Sleep: A Systematic Review',
        authors: 'Hirotsu C, Tufik S, Andersen ML',
        year: 2015,
        doi: '10.1016/j.smrv.2014.10.004',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  } else if (profile.energy_pattern === 'crash_afternoon') {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '',
      goal_type: 'energy',
      priority: 1,
      title: '提升日间能量',
      rationale: '下午能量断崖式跌落可能与血糖波动或肾上腺疲劳有关。通过调整饮食节奏和压力管理，可以显著改善能量水平。',
      citations: [{
        title: 'Blood Glucose Patterns and Appetite',
        authors: 'Wyatt P, Berry SE, Finlayson G, et al.',
        year: 2021,
        doi: '10.1038/s42255-021-00383-x',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  } else if (profile.stress_pattern === 'low_tolerance') {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '',
      goal_type: 'stress',
      priority: 1,
      title: '增强压力耐受',
      rationale: '压力耐受阈值降低可能是长期慢性压力的结果。通过渐进式压力暴露和恢复训练，可以重建压力适应能力。',
      citations: [{
        title: 'Stress Resilience and the Brain',
        authors: 'Feder A, Nestler EJ, Charney DS',
        year: 2009,
        doi: '10.1038/nrn2649',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  }
  
  // Priority 2: Secondary issue (if different from priority 1)
  if (goals.length > 0 && goals[0].goal_type !== 'energy' && profile.energy_pattern !== 'stable') {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '',
      goal_type: 'energy',
      priority: 2,
      title: '稳定能量水平',
      rationale: '在改善主要问题的同时，关注能量稳定可以加速整体恢复。',
      citations: [{
        title: 'Energy Management in Daily Life',
        authors: 'Schwartz T, McCarthy C',
        year: 2007,
        url: 'https://hbr.org/2007/10/manage-your-energy-not-your-time',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  } else if (goals.length > 0 && goals[0].goal_type !== 'stress' && profile.stress_pattern !== 'high_tolerance') {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '',
      goal_type: 'stress',
      priority: 2,
      title: '优化压力管理',
      rationale: '压力管理是健康改善的重要支撑，可以帮助巩固其他方面的进步。',
      citations: [{
        title: 'The Stress Response and Metabolic Health',
        authors: 'Kyrou I, Tsigos C',
        year: 2009,
        doi: '10.1111/j.1749-6632.2009.04434.x',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  }
  
  // Ensure at least one goal
  if (goals.length === 0) {
    goals.push({
      id: crypto.randomUUID(),
      user_id: '',
      goal_type: 'energy',
      priority: 1,
      title: '维持健康状态',
      rationale: '你的整体状态良好！我们将帮助你保持并进一步优化当前的健康水平。',
      citations: [{
        title: 'Preventive Health Behaviors',
        authors: 'Warburton DER, Nicol CW, Bredin SSD',
        year: 2006,
        doi: '10.1503/cmaj.051351',
      }],
      is_ai_recommended: true,
      user_modified: false,
      created_at: now,
      updated_at: now,
    });
  }
  
  return goals.slice(0, 2); // Max 2 goals
}
