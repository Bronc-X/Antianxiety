/**
 * Inquiry Engine for AI Active Inquiry System
 * 
 * Generates proactive diagnostic questions based on user data gaps.
 * Calculates optimal inquiry timing based on activity patterns.
 * 
 * **Property 11: Inquiry Data Gap Prioritization**
 * **Property 12: Inquiry Response Tracking**
 */

import type {
  InquiryQuestion,
  InquiryContext,
  InquiryTiming,
  DataGap,
  PhaseGoal,
  ActivityPattern,
  InquiryPriority,
} from '@/types/adaptive-interaction';

// Data gap definitions
const DATA_GAP_DEFINITIONS: DataGap[] = [
  {
    field: 'sleep_hours',
    importance: 'high',
    description: '睡眠时长数据',
  },
  {
    field: 'stress_level',
    importance: 'high',
    description: '压力水平数据',
  },
  {
    field: 'exercise_duration',
    importance: 'medium',
    description: '运动时长数据',
  },
  {
    field: 'meal_quality',
    importance: 'medium',
    description: '饮食质量数据',
  },
  {
    field: 'mood',
    importance: 'low',
    description: '情绪状态数据',
  },
  {
    field: 'water_intake',
    importance: 'low',
    description: '饮水量数据',
  },
];

// Inquiry question templates
const INQUIRY_TEMPLATES: Record<string, Record<'zh' | 'en', InquiryQuestion>> = {
  sleep_hours: {
    zh: {
      id: 'inquiry_sleep',
      question_text: '昨晚睡得怎么样？大概睡了几个小时？',
      question_type: 'diagnostic',
      priority: 'high',
      data_gaps_addressed: ['sleep_hours'],
      options: [
        { label: '不到6小时', value: 'under_6' },
        { label: '6-7小时', value: '6_7' },
        { label: '7-8小时', value: '7_8' },
        { label: '8小时以上', value: 'over_8' },
      ],
    },
    en: {
      id: 'inquiry_sleep',
      question_text: 'How did you sleep last night? About how many hours?',
      question_type: 'diagnostic',
      priority: 'high',
      data_gaps_addressed: ['sleep_hours'],
      options: [
        { label: 'Less than 6 hours', value: 'under_6' },
        { label: '6-7 hours', value: '6_7' },
        { label: '7-8 hours', value: '7_8' },
        { label: 'More than 8 hours', value: 'over_8' },
      ],
    },
  },
  stress_level: {
    zh: {
      id: 'inquiry_stress',
      question_text: '今天感觉压力大吗？',
      question_type: 'diagnostic',
      priority: 'high',
      data_gaps_addressed: ['stress_level'],
      options: [
        { label: '很轻松', value: 'low' },
        { label: '有点紧张', value: 'medium' },
        { label: '压力很大', value: 'high' },
      ],
    },
    en: {
      id: 'inquiry_stress',
      question_text: 'Are you feeling stressed today?',
      question_type: 'diagnostic',
      priority: 'high',
      data_gaps_addressed: ['stress_level'],
      options: [
        { label: 'Very relaxed', value: 'low' },
        { label: 'A bit tense', value: 'medium' },
        { label: 'Very stressed', value: 'high' },
      ],
    },
  },
  exercise_duration: {
    zh: {
      id: 'inquiry_exercise',
      question_text: '今天有运动吗？',
      question_type: 'diagnostic',
      priority: 'medium',
      data_gaps_addressed: ['exercise_duration'],
      options: [
        { label: '没有', value: 'none' },
        { label: '轻度活动', value: 'light' },
        { label: '中等强度', value: 'moderate' },
        { label: '高强度', value: 'intense' },
      ],
    },
    en: {
      id: 'inquiry_exercise',
      question_text: 'Did you exercise today?',
      question_type: 'diagnostic',
      priority: 'medium',
      data_gaps_addressed: ['exercise_duration'],
      options: [
        { label: 'No', value: 'none' },
        { label: 'Light activity', value: 'light' },
        { label: 'Moderate intensity', value: 'moderate' },
        { label: 'High intensity', value: 'intense' },
      ],
    },
  },
  meal_quality: {
    zh: {
      id: 'inquiry_meal',
      question_text: '今天吃得健康吗？',
      question_type: 'diagnostic',
      priority: 'medium',
      data_gaps_addressed: ['meal_quality'],
      options: [
        { label: '很健康', value: 'healthy' },
        { label: '一般', value: 'average' },
        { label: '不太健康', value: 'unhealthy' },
      ],
    },
    en: {
      id: 'inquiry_meal',
      question_text: 'Did you eat healthy today?',
      question_type: 'diagnostic',
      priority: 'medium',
      data_gaps_addressed: ['meal_quality'],
      options: [
        { label: 'Very healthy', value: 'healthy' },
        { label: 'Average', value: 'average' },
        { label: 'Not very healthy', value: 'unhealthy' },
      ],
    },
  },
  mood: {
    zh: {
      id: 'inquiry_mood',
      question_text: '现在心情如何？',
      question_type: 'diagnostic',
      priority: 'low',
      data_gaps_addressed: ['mood'],
      options: [
        { label: '很好', value: 'great' },
        { label: '还行', value: 'okay' },
        { label: '不太好', value: 'bad' },
      ],
    },
    en: {
      id: 'inquiry_mood',
      question_text: 'How are you feeling right now?',
      question_type: 'diagnostic',
      priority: 'low',
      data_gaps_addressed: ['mood'],
      options: [
        { label: 'Great', value: 'great' },
        { label: 'Okay', value: 'okay' },
        { label: 'Not good', value: 'bad' },
      ],
    },
  },
  water_intake: {
    zh: {
      id: 'inquiry_water',
      question_text: '今天喝了多少水？',
      question_type: 'diagnostic',
      priority: 'low',
      data_gaps_addressed: ['water_intake'],
      options: [
        { label: '不到4杯', value: 'low' },
        { label: '4-8杯', value: 'moderate' },
        { label: '8杯以上', value: 'high' },
      ],
    },
    en: {
      id: 'inquiry_water',
      question_text: 'How much water did you drink today?',
      question_type: 'diagnostic',
      priority: 'low',
      data_gaps_addressed: ['water_intake'],
      options: [
        { label: 'Less than 4 cups', value: 'low' },
        { label: '4-8 cups', value: 'moderate' },
        { label: 'More than 8 cups', value: 'high' },
      ],
    },
  },
};

/**
 * Identify data gaps for a user
 */
export function identifyDataGaps(
  recentData: Record<string, { value: string; timestamp: string }>,
  staleThresholdHours: number = 24
): DataGap[] {
  const now = new Date();
  const gaps: DataGap[] = [];
  
  for (const gapDef of DATA_GAP_DEFINITIONS) {
    const data = recentData[gapDef.field];
    
    if (!data) {
      // No data at all
      gaps.push(gapDef);
    } else {
      // Check if data is stale
      const dataTime = new Date(data.timestamp);
      const hoursSinceUpdate = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > staleThresholdHours) {
        gaps.push({
          ...gapDef,
          lastUpdated: data.timestamp,
        });
      }
    }
  }
  
  return gaps;
}

/**
 * Prioritize data gaps by importance
 */
export function prioritizeDataGaps(gaps: DataGap[]): DataGap[] {
  const priorityOrder: InquiryPriority[] = ['high', 'medium', 'low'];
  
  return [...gaps].sort((a, b) => {
    return priorityOrder.indexOf(a.importance) - priorityOrder.indexOf(b.importance);
  });
}

/**
 * Generate inquiry question for the highest priority gap
 */
export function generateInquiryQuestion(
  gaps: DataGap[],
  phaseGoals: PhaseGoal[] = [],
  language: 'zh' | 'en' = 'zh'
): InquiryQuestion | null {
  if (gaps.length === 0) return null;
  
  const prioritizedGaps = prioritizeDataGaps(gaps);
  const topGap = prioritizedGaps[0];
  
  const templates = INQUIRY_TEMPLATES[topGap.field];
  if (!templates) return null;
  
  const template = templates[language];
  if (!template) return templates['zh']; // Fallback to Chinese
  
  // Customize question based on phase goals if relevant
  let customizedQuestion = { ...template };
  
  if (phaseGoals.length > 0) {
    const primaryGoal = phaseGoals.find(g => g.priority === 1);
    if (primaryGoal) {
      // Add goal context to question
      const prefix = language === 'en' 
        ? `Regarding your "${primaryGoal.title}" goal, `
        : `关于你的「${primaryGoal.title}」目标，`;
      customizedQuestion = {
        ...customizedQuestion,
        question_text: `${prefix}${template.question_text}`,
      };
    }
  }
  
  return customizedQuestion;
}

export function getInquiryOptionsForGap(field: string, language: 'zh' | 'en' = 'zh') {
  const templates = INQUIRY_TEMPLATES[field];
  if (!templates) return null;
  
  const template = templates[language] || templates['zh'];
  if (!template?.options || template.options.length === 0) {
    return null;
  }
  return template.options;
}

/**
 * Calculate optimal inquiry timing based on activity patterns
 */
export function calculateOptimalTiming(
  activityPatterns: ActivityPattern[],
  currentTime: Date = new Date()
): InquiryTiming {
  // Default times if no patterns available
  const defaultTimes = [9, 15]; // 9 AM and 3 PM
  
  if (activityPatterns.length === 0) {
    const nextDefaultHour = defaultTimes.find(h => h > currentTime.getHours()) || defaultTimes[0];
    const suggestedTime = new Date(currentTime);
    suggestedTime.setHours(nextDefaultHour, 0, 0, 0);
    
    if (nextDefaultHour <= currentTime.getHours()) {
      suggestedTime.setDate(suggestedTime.getDate() + 1);
    }
    
    return {
      suggestedTime,
      confidence: 0.5,
      reasoning: '使用默认时间，因为还没有足够的活动数据',
    };
  }
  
  // Find the hour with highest activity score for current day of week
  const dayOfWeek = currentTime.getDay();
  const todayPatterns = activityPatterns.filter(p => p.day_of_week === dayOfWeek);
  
  if (todayPatterns.length === 0) {
    return {
      suggestedTime: new Date(currentTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      confidence: 0.3,
      reasoning: '今天没有活动数据，建议2小时后',
    };
  }
  
  // Sort by activity score and find best upcoming hour
  const sortedPatterns = [...todayPatterns].sort((a, b) => b.activity_score - a.activity_score);
  const currentHour = currentTime.getHours();
  
  // Find best hour that's still in the future
  const futurePatterns = sortedPatterns.filter(p => p.hour_of_day > currentHour);
  const bestPattern = futurePatterns[0] || sortedPatterns[0];
  
  const suggestedTime = new Date(currentTime);
  suggestedTime.setHours(bestPattern.hour_of_day, 0, 0, 0);
  
  if (bestPattern.hour_of_day <= currentHour) {
    suggestedTime.setDate(suggestedTime.getDate() + 1);
  }
  
  return {
    suggestedTime,
    confidence: bestPattern.activity_score,
    reasoning: `基于历史活动数据，${bestPattern.hour_of_day}点是你最活跃的时间`,
  };
}

/**
 * Update activity pattern based on user interaction
 */
export function updateActivityPattern(
  existingPatterns: ActivityPattern[],
  interactionTime: Date,
  userId: string
): ActivityPattern {
  const dayOfWeek = interactionTime.getDay();
  const hourOfDay = interactionTime.getHours();
  
  const existingPattern = existingPatterns.find(
    p => p.day_of_week === dayOfWeek && p.hour_of_day === hourOfDay
  );
  
  if (existingPattern) {
    // Increase activity score (exponential moving average)
    const alpha = 0.3;
    const newScore = alpha * 1 + (1 - alpha) * existingPattern.activity_score;
    
    return {
      ...existingPattern,
      activity_score: Math.min(newScore, 1),
      updated_at: interactionTime.toISOString(),
    };
  }
  
  // Create new pattern
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    day_of_week: dayOfWeek,
    hour_of_day: hourOfDay,
    activity_score: 0.5, // Initial score
    updated_at: interactionTime.toISOString(),
  };
}
