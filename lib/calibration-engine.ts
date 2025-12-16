/**
 * Calibration Engine for Adaptive Daily Check-in
 * 
 * Generates daily calibration questions based on user's Phase Goals.
 * Implements 7-day evolution logic and anchor question requirements.
 * 
 * **Property 7: Daily Calibration Goal Alignment**
 * **Property 8: Anchor Question Presence**
 * **Property 9: Seven-Day Evolution Trigger**
 * **Property 10: Goal Change Adaptation**
 */

import type {
  CalibrationQuestion,
  PhaseGoal,
  GoalType,
  CalibrationRecord,
  ProgressMetrics,
} from '@/types/adaptive-interaction';

// Constants
export const EVOLUTION_TRIGGER_DAYS = 7;

/**
 * Anchor questions - always included in daily calibration
 * These provide baseline tracking data
 */
export const ANCHOR_QUESTIONS: CalibrationQuestion[] = [
  {
    id: 'anchor_sleep_hours',
    type: 'anchor',
    question: '昨晚睡了多少小时？',
    inputType: 'slider',
    min: 0,
    max: 12,
  },
  {
    id: 'anchor_stress_level',
    type: 'anchor',
    question: '当前压力水平？',
    inputType: 'single',
    options: [
      { label: '低压', value: 'low' },
      { label: '中压', value: 'medium' },
      { label: '高压', value: 'high' },
    ],
  },
];

/**
 * Goal-specific adaptive questions
 */
const GOAL_QUESTIONS: Record<GoalType, CalibrationQuestion[]> = {
  sleep: [
    {
      id: 'sleep_quality',
      type: 'adaptive',
      question: '睡眠质量如何？',
      inputType: 'slider',
      min: 1,
      max: 10,
      goalRelation: 'sleep',
    },
    {
      id: 'sleep_onset_time',
      type: 'adaptive',
      question: '入睡花了多长时间？',
      inputType: 'single',
      options: [
        { label: '15分钟以内', value: 'quick' },
        { label: '15-30分钟', value: 'moderate' },
        { label: '超过30分钟', value: 'long' },
      ],
      goalRelation: 'sleep',
    },
    {
      id: 'night_wakeups',
      type: 'adaptive',
      question: '夜间醒来几次？',
      inputType: 'single',
      options: [
        { label: '没有', value: '0' },
        { label: '1-2次', value: '1-2' },
        { label: '3次以上', value: '3+' },
      ],
      goalRelation: 'sleep',
    },
  ],
  energy: [
    {
      id: 'morning_energy',
      type: 'adaptive',
      question: '早上起床时精力如何？',
      inputType: 'slider',
      min: 1,
      max: 10,
      goalRelation: 'energy',
    },
    {
      id: 'afternoon_crash',
      type: 'adaptive',
      question: '下午是否有能量低谷？',
      inputType: 'single',
      options: [
        { label: '没有', value: 'none' },
        { label: '轻微', value: 'mild' },
        { label: '明显', value: 'severe' },
      ],
      goalRelation: 'energy',
    },
    {
      id: 'caffeine_intake',
      type: 'adaptive',
      question: '今天喝了多少咖啡/茶？',
      inputType: 'single',
      options: [
        { label: '没喝', value: '0' },
        { label: '1-2杯', value: '1-2' },
        { label: '3杯以上', value: '3+' },
      ],
      goalRelation: 'energy',
    },
  ],
  stress: [
    {
      id: 'stress_triggers',
      type: 'adaptive',
      question: '今天主要的压力来源是？',
      inputType: 'single',
      options: [
        { label: '工作', value: 'work' },
        { label: '人际关系', value: 'relationships' },
        { label: '健康', value: 'health' },
        { label: '其他', value: 'other' },
      ],
      goalRelation: 'stress',
    },
    {
      id: 'recovery_activity',
      type: 'adaptive',
      question: '今天做了什么放松活动？',
      inputType: 'single',
      options: [
        { label: '运动', value: 'exercise' },
        { label: '冥想/呼吸', value: 'meditation' },
        { label: '社交', value: 'social' },
        { label: '没有', value: 'none' },
      ],
      goalRelation: 'stress',
    },
  ],
  weight: [
    {
      id: 'meal_quality',
      type: 'adaptive',
      question: '今天饮食质量如何？',
      inputType: 'slider',
      min: 1,
      max: 10,
      goalRelation: 'weight',
    },
    {
      id: 'hunger_level',
      type: 'adaptive',
      question: '今天饥饿感如何？',
      inputType: 'single',
      options: [
        { label: '正常', value: 'normal' },
        { label: '经常饿', value: 'hungry' },
        { label: '没什么食欲', value: 'low' },
      ],
      goalRelation: 'weight',
    },
  ],
  fitness: [
    {
      id: 'exercise_done',
      type: 'adaptive',
      question: '今天运动了吗？',
      inputType: 'single',
      options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ],
      goalRelation: 'fitness',
    },
    {
      id: 'exercise_intensity',
      type: 'adaptive',
      question: '运动强度如何？',
      inputType: 'single',
      options: [
        { label: '轻度', value: 'light' },
        { label: '中度', value: 'moderate' },
        { label: '高强度', value: 'intense' },
      ],
      goalRelation: 'fitness',
    },
  ],
};

/**
 * Evolution questions - introduced after 7 consecutive days
 */
const EVOLUTION_QUESTIONS: CalibrationQuestion[] = [
  {
    id: 'evo_overall_progress',
    type: 'evolution',
    question: '这周整体感觉如何？',
    inputType: 'slider',
    min: 1,
    max: 10,
  },
  {
    id: 'evo_biggest_challenge',
    type: 'evolution',
    question: '这周最大的挑战是什么？',
    inputType: 'text',
  },
  {
    id: 'evo_next_week_focus',
    type: 'evolution',
    question: '下周想重点改善什么？',
    inputType: 'single',
    options: [
      { label: '睡眠', value: 'sleep' },
      { label: '能量', value: 'energy' },
      { label: '压力', value: 'stress' },
      { label: '运动', value: 'fitness' },
    ],
  },
];

/**
 * Check if evolution should be triggered
 */
export function shouldEvolve(consecutiveDays: number): boolean {
  return consecutiveDays > 0 && consecutiveDays % EVOLUTION_TRIGGER_DAYS === 0;
}

/**
 * Calculate evolution level based on consecutive days
 */
export function calculateEvolutionLevel(consecutiveDays: number): number {
  return Math.floor(consecutiveDays / EVOLUTION_TRIGGER_DAYS) + 1;
}

/**
 * Generate daily calibration questions
 */
export function generateDailyQuestions(
  phaseGoals: PhaseGoal[],
  consecutiveDays: number = 0,
  previousQuestions: CalibrationQuestion[] = []
): CalibrationQuestion[] {
  const questions: CalibrationQuestion[] = [];
  
  // Always include anchor questions
  questions.push(...ANCHOR_QUESTIONS);
  
  // Add goal-specific adaptive questions
  for (const goal of phaseGoals) {
    const goalQuestions = GOAL_QUESTIONS[goal.goal_type] || [];
    // Add 1-2 questions per goal
    const selectedGoalQuestions = goalQuestions.slice(0, 2);
    questions.push(...selectedGoalQuestions);
  }
  
  // Add evolution questions if triggered
  if (shouldEvolve(consecutiveDays)) {
    const evolutionLevel = calculateEvolutionLevel(consecutiveDays);
    // Add more evolution questions as level increases
    const evolutionCount = Math.min(evolutionLevel, EVOLUTION_QUESTIONS.length);
    questions.push(...EVOLUTION_QUESTIONS.slice(0, evolutionCount));
  }
  
  return questions;
}

/**
 * Check if questions should change due to goal change
 */
export function detectGoalChange(
  currentGoals: PhaseGoal[],
  previousGoals: PhaseGoal[]
): boolean {
  if (currentGoals.length !== previousGoals.length) return true;
  
  const currentTypes = new Set(currentGoals.map(g => g.goal_type));
  const previousTypes = new Set(previousGoals.map(g => g.goal_type));
  
  for (const type of currentTypes) {
    if (!previousTypes.has(type)) return true;
  }
  
  return false;
}

/**
 * Get questions that differ from previous day
 */
export function getAdaptedQuestions(
  currentQuestions: CalibrationQuestion[],
  previousQuestions: CalibrationQuestion[]
): CalibrationQuestion[] {
  const previousIds = new Set(previousQuestions.map(q => q.id));
  return currentQuestions.filter(q => !previousIds.has(q.id) || q.type === 'anchor');
}
