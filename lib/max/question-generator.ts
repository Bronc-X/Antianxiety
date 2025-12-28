/**
 * Question Generator for Max Plan Creation
 * 
 * 根据缺失数据生成主动问询问题
 * 实现 3 个问题上限，避免用户疲劳
 * 
 * @module lib/max/question-generator
 */

import type {
  GeneratedQuestion,
  QuestionType,
  QuestionContext,
  DataStatus,
  QuickReplyOption,
} from '@/types/max-plan';

// ============================================
// 常量定义
// ============================================

/** 最大问题数量 - 增加到5个以获取更全面的用户画像 */
export const MAX_QUESTIONS = 5;

/** 问题优先级（数字越小优先级越高） */
const QUESTION_PRIORITY: Record<QuestionType, number> = {
  concern: 1,    // 最重要：了解用户关注点
  sleep: 2,      // 睡眠对健康影响大
  stress: 3,     // 压力水平
  energy: 4,     // 能量水平
  mood: 5,       // 情绪状态
  lifestyle: 6,  // 生活方式
  exercise: 7,   // 运动习惯
  goal: 8,       // 目标设定
};

// ============================================
// 问题模板
// ============================================

interface QuestionTemplate {
  zh: {
    text: string;
    options: QuickReplyOption[];
  };
  en: {
    text: string;
    options: QuickReplyOption[];
  };
}

const QUESTION_TEMPLATES: Record<QuestionType, QuestionTemplate> = {
  concern: {
    zh: {
      text: '最近有什么让你感到不舒服或困扰的地方吗？',
      options: [
        { label: '睡眠问题', value: 'sleep_issue' },
        { label: '焦虑紧张', value: 'anxiety' },
        { label: '疲劳乏力', value: 'fatigue' },
        { label: '情绪低落', value: 'low_mood' },
        { label: '暂时没有', value: 'none' },
      ],
    },
    en: {
      text: 'Is there anything bothering you or making you uncomfortable lately?',
      options: [
        { label: 'Sleep issues', value: 'sleep_issue' },
        { label: 'Anxiety', value: 'anxiety' },
        { label: 'Fatigue', value: 'fatigue' },
        { label: 'Low mood', value: 'low_mood' },
        { label: 'Nothing right now', value: 'none' },
      ],
    },
  },
  sleep: {
    zh: {
      text: '最近睡眠情况怎么样？',
      options: [
        { label: '睡得很好', value: 'good' },
        { label: '还可以', value: 'okay' },
        { label: '有点难入睡', value: 'hard_to_fall_asleep' },
        { label: '容易醒来', value: 'wake_up_often' },
        { label: '睡眠不足', value: 'not_enough' },
      ],
    },
    en: {
      text: 'How has your sleep been lately?',
      options: [
        { label: 'Sleeping well', value: 'good' },
        { label: 'Okay', value: 'okay' },
        { label: 'Hard to fall asleep', value: 'hard_to_fall_asleep' },
        { label: 'Wake up often', value: 'wake_up_often' },
        { label: 'Not enough sleep', value: 'not_enough' },
      ],
    },
  },
  stress: {
    zh: {
      text: '最近感觉压力大吗？',
      options: [
        { label: '很轻松', value: 'low' },
        { label: '有一点', value: 'mild' },
        { label: '中等压力', value: 'moderate' },
        { label: '压力较大', value: 'high' },
        { label: '压力很大', value: 'very_high' },
      ],
    },
    en: {
      text: 'How stressed have you been feeling lately?',
      options: [
        { label: 'Very relaxed', value: 'low' },
        { label: 'A little', value: 'mild' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Quite stressed', value: 'high' },
        { label: 'Very stressed', value: 'very_high' },
      ],
    },
  },
  energy: {
    zh: {
      text: '今天精力如何？',
      options: [
        { label: '精力充沛', value: 'high' },
        { label: '还不错', value: 'good' },
        { label: '一般', value: 'moderate' },
        { label: '有点累', value: 'low' },
        { label: '很疲惫', value: 'very_low' },
      ],
    },
    en: {
      text: 'How is your energy level today?',
      options: [
        { label: 'Full of energy', value: 'high' },
        { label: 'Pretty good', value: 'good' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'A bit tired', value: 'low' },
        { label: 'Very tired', value: 'very_low' },
      ],
    },
  },
  mood: {
    zh: {
      text: '现在心情怎么样？',
      options: [
        { label: '很好', value: 'great' },
        { label: '不错', value: 'good' },
        { label: '一般', value: 'neutral' },
        { label: '有点低落', value: 'low' },
        { label: '不太好', value: 'bad' },
      ],
    },
    en: {
      text: 'How are you feeling right now?',
      options: [
        { label: 'Great', value: 'great' },
        { label: 'Good', value: 'good' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'A bit down', value: 'low' },
        { label: 'Not good', value: 'bad' },
      ],
    },
  },
  goal: {
    zh: {
      text: '这次计划你最想改善什么？',
      options: [
        { label: '改善睡眠', value: 'improve_sleep' },
        { label: '减轻压力', value: 'reduce_stress' },
        { label: '提升精力', value: 'boost_energy' },
        { label: '稳定情绪', value: 'stabilize_mood' },
        { label: '建立习惯', value: 'build_habits' },
      ],
    },
    en: {
      text: 'What would you most like to improve with this plan?',
      options: [
        { label: 'Improve sleep', value: 'improve_sleep' },
        { label: 'Reduce stress', value: 'reduce_stress' },
        { label: 'Boost energy', value: 'boost_energy' },
        { label: 'Stabilize mood', value: 'stabilize_mood' },
        { label: 'Build habits', value: 'build_habits' },
      ],
    },
  },
  lifestyle: {
    zh: {
      text: '你的日常作息是怎样的？',
      options: [
        { label: '规律作息', value: 'regular' },
        { label: '经常熬夜', value: 'late_nights' },
        { label: '作息不规律', value: 'irregular' },
        { label: '早睡早起', value: 'early_bird' },
        { label: '夜猫子', value: 'night_owl' },
      ],
    },
    en: {
      text: 'What is your daily routine like?',
      options: [
        { label: 'Regular schedule', value: 'regular' },
        { label: 'Often stay up late', value: 'late_nights' },
        { label: 'Irregular schedule', value: 'irregular' },
        { label: 'Early bird', value: 'early_bird' },
        { label: 'Night owl', value: 'night_owl' },
      ],
    },
  },
  exercise: {
    zh: {
      text: '你平时运动多吗？',
      options: [
        { label: '每天运动', value: 'daily' },
        { label: '每周几次', value: 'weekly' },
        { label: '偶尔运动', value: 'occasional' },
        { label: '很少运动', value: 'rarely' },
        { label: '几乎不运动', value: 'never' },
      ],
    },
    en: {
      text: 'How often do you exercise?',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Few times a week', value: 'weekly' },
        { label: 'Occasionally', value: 'occasional' },
        { label: 'Rarely', value: 'rarely' },
        { label: 'Almost never', value: 'never' },
      ],
    },
  },
};

// ============================================
// 核心函数
// ============================================

/**
 * 根据数据状态识别缺失的数据类型
 */
export function identifyMissingData(dataStatus: DataStatus): QuestionType[] {
  const missing: QuestionType[] = [];

  // 如果没有问询数据，需要了解用户关注点
  if (!dataStatus.hasInquiryData) {
    missing.push('concern');
  }

  // 如果没有校准数据，需要了解基本状态
  if (!dataStatus.hasCalibrationData) {
    missing.push('sleep');
    missing.push('stress');
    missing.push('energy');
    missing.push('mood');
  }

  // 总是问生活方式和运动习惯（如果还有空间）
  if (!missing.includes('lifestyle')) {
    missing.push('lifestyle');
  }
  if (!missing.includes('exercise')) {
    missing.push('exercise');
  }

  // 总是可以问目标（如果还有空间）
  if (!missing.includes('goal')) {
    missing.push('goal');
  }

  return missing;
}

/**
 * 生成问题列表
 * 
 * @param context - 问题生成上下文
 * @returns 生成的问题列表（最多 MAX_QUESTIONS 个）
 */
export function generateQuestions(context: QuestionContext): GeneratedQuestion[] {
  const { missingData, language } = context;

  // 按优先级排序
  const sortedTypes = [...missingData].sort(
    (a, b) => QUESTION_PRIORITY[a] - QUESTION_PRIORITY[b]
  );

  // 限制问题数量
  const limitedTypes = sortedTypes.slice(0, MAX_QUESTIONS);

  // 生成问题
  return limitedTypes.map((type, index) => {
    const template = QUESTION_TEMPLATES[type];
    const langTemplate = template[language] || template.zh;

    return {
      id: `question_${type}_${Date.now()}_${index}`,
      type,
      text: langTemplate.text,
      options: langTemplate.options,
      priority: QUESTION_PRIORITY[type],
    };
  });
}

/**
 * 从数据状态生成问题
 * 
 * @param dataStatus - 数据状态
 * @param language - 语言
 * @returns 生成的问题列表
 */
export function generateQuestionsFromDataStatus(
  dataStatus: DataStatus,
  language: 'zh' | 'en' = 'zh'
): GeneratedQuestion[] {
  const missingData = identifyMissingData(dataStatus);
  
  return generateQuestions({
    missingData,
    userProfile: null,
    language,
  });
}

/**
 * 获取下一个问题
 * 
 * @param askedQuestions - 已问过的问题类型
 * @param dataStatus - 数据状态
 * @param language - 语言
 * @returns 下一个问题，如果没有更多问题则返回 null
 */
export function getNextQuestion(
  askedQuestions: QuestionType[],
  dataStatus: DataStatus,
  language: 'zh' | 'en' = 'zh'
): GeneratedQuestion | null {
  // 检查是否已达到问题上限
  if (askedQuestions.length >= MAX_QUESTIONS) {
    return null;
  }

  const missingData = identifyMissingData(dataStatus);
  
  // 过滤掉已问过的问题
  const remainingTypes = missingData.filter(type => !askedQuestions.includes(type));

  if (remainingTypes.length === 0) {
    return null;
  }

  // 按优先级排序并取第一个
  const sortedTypes = remainingTypes.sort(
    (a, b) => QUESTION_PRIORITY[a] - QUESTION_PRIORITY[b]
  );

  const nextType = sortedTypes[0];
  const template = QUESTION_TEMPLATES[nextType];
  const langTemplate = template[language] || template.zh;

  return {
    id: `question_${nextType}_${Date.now()}`,
    type: nextType,
    text: langTemplate.text,
    options: langTemplate.options,
    priority: QUESTION_PRIORITY[nextType],
  };
}

/**
 * 验证问题数量不超过上限
 */
export function validateQuestionCount(questions: GeneratedQuestion[]): boolean {
  return questions.length <= MAX_QUESTIONS;
}

/**
 * 解析用户回答并提取关键信息
 */
export function parseQuestionResponse(
  questionType: QuestionType,
  responseValue: string
): Record<string, unknown> {
  const extracted: Record<string, unknown> = {
    questionType,
    responseValue,
    timestamp: new Date().toISOString(),
  };

  // 根据问题类型提取特定信息
  switch (questionType) {
    case 'concern':
      extracted.primaryConcern = responseValue;
      extracted.hasConcern = responseValue !== 'none';
      break;
    case 'sleep':
      extracted.sleepQuality = responseValue;
      extracted.hasSleepIssue = ['hard_to_fall_asleep', 'wake_up_often', 'not_enough'].includes(responseValue);
      break;
    case 'stress':
      extracted.stressLevel = responseValue;
      extracted.isHighStress = ['high', 'very_high'].includes(responseValue);
      break;
    case 'energy':
      extracted.energyLevel = responseValue;
      extracted.isLowEnergy = ['low', 'very_low'].includes(responseValue);
      break;
    case 'mood':
      extracted.moodLevel = responseValue;
      extracted.isLowMood = ['low', 'bad'].includes(responseValue);
      break;
    case 'goal':
      extracted.primaryGoal = responseValue;
      break;
    case 'lifestyle':
      extracted.lifestylePattern = responseValue;
      extracted.hasIrregularSchedule = ['late_nights', 'irregular'].includes(responseValue);
      break;
    case 'exercise':
      extracted.exerciseFrequency = responseValue;
      extracted.isLowExercise = ['rarely', 'never'].includes(responseValue);
      break;
  }

  return extracted;
}
