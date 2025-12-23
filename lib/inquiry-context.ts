/**
 * Inquiry Context Provider
 * 
 * Provides inquiry history and insights to other systems
 * (AI chat, content curation, etc.)
 */

import { createClient } from '@/lib/supabase/server';

export interface InquiryInsight {
  recentSleepPattern: 'poor' | 'average' | 'good' | null;
  recentStressLevel: 'low' | 'medium' | 'high' | null;
  recentExercise: 'none' | 'light' | 'moderate' | 'intense' | null;
  recentMood: 'bad' | 'okay' | 'great' | null;
  lastInquiryTime: string | null;
  totalResponses: number;
  responseRate: number; // 0-1
}

export interface InquiryContextSummary {
  insights: InquiryInsight;
  recentResponses: Array<{
    question: string;
    response: string;
    timestamp: string;
    dataGap: string;
  }>;
  suggestedTopics: string[]; // Topics to focus on based on responses
}

/**
 * Get inquiry context for a user
 * Used by AI chat and content curation systems
 */
export async function getInquiryContext(userId: string): Promise<InquiryContextSummary> {
  const supabase = await createClient();
  
  // Get recent inquiry responses (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: recentInquiries } = await supabase
    .from('inquiry_history')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Calculate insights
  const insights: InquiryInsight = {
    recentSleepPattern: null,
    recentStressLevel: null,
    recentExercise: null,
    recentMood: null,
    lastInquiryTime: null,
    totalResponses: 0,
    responseRate: 0,
  };
  
  const recentResponses: InquiryContextSummary['recentResponses'] = [];
  const suggestedTopics: string[] = [];
  
  if (recentInquiries && recentInquiries.length > 0) {
    let respondedCount = 0;
    
    for (const inquiry of recentInquiries) {
      if (inquiry.user_response) {
        respondedCount++;
        
        const dataGap = inquiry.data_gaps_addressed?.[0] || 'unknown';
        
        // Extract insights from responses
        switch (dataGap) {
          case 'sleep_hours':
            if (!insights.recentSleepPattern) {
              insights.recentSleepPattern = 
                inquiry.user_response === 'under_6' ? 'poor' :
                inquiry.user_response === 'over_8' ? 'good' : 'average';
              
              if (insights.recentSleepPattern === 'poor') {
                suggestedTopics.push('sleep_optimization', 'circadian_rhythm');
              }
            }
            break;
            
          case 'stress_level':
            if (!insights.recentStressLevel) {
              insights.recentStressLevel = inquiry.user_response as any;
              
              if (insights.recentStressLevel === 'high') {
                suggestedTopics.push('stress_management', 'cortisol_regulation', 'breathing_exercises');
              }
            }
            break;
            
          case 'exercise_duration':
            if (!insights.recentExercise) {
              insights.recentExercise = inquiry.user_response as any;
              
              if (insights.recentExercise === 'none') {
                suggestedTopics.push('exercise_benefits', 'zone2_cardio');
              }
            }
            break;
            
          case 'mood':
            if (!insights.recentMood) {
              insights.recentMood = inquiry.user_response as any;
              
              if (insights.recentMood === 'bad') {
                suggestedTopics.push('mental_health', 'neurotransmitters');
              }
            }
            break;
        }
        
        // Add to recent responses
        recentResponses.push({
          question: inquiry.question_text,
          response: inquiry.user_response,
          timestamp: inquiry.responded_at || inquiry.created_at,
          dataGap,
        });
      }
      
      if (!insights.lastInquiryTime) {
        insights.lastInquiryTime = inquiry.created_at;
      }
    }
    
    insights.totalResponses = respondedCount;
    insights.responseRate = respondedCount / recentInquiries.length;
  }
  
  return {
    insights,
    recentResponses: recentResponses.slice(0, 5), // Last 5 responses
    suggestedTopics: [...new Set(suggestedTopics)], // Remove duplicates
  };
}

/**
 * Generate a natural language summary of inquiry insights
 * For use in AI system prompts
 */
export function generateInquirySummary(context: InquiryContextSummary, language: 'zh' | 'en' = 'zh'): string {
  const { insights, recentResponses } = context;
  
  if (recentResponses.length === 0) {
    return language === 'en' 
      ? 'No recent inquiry data available.'
      : '暂无最近的问询数据。';
  }
  
  const parts: string[] = [];
  
  if (language === 'zh') {
    parts.push('用户最近的状态：');
    
    if (insights.recentSleepPattern) {
      const sleepText = {
        poor: '睡眠不足（少于6小时）',
        average: '睡眠一般（6-8小时）',
        good: '睡眠充足（8小时以上）',
      };
      parts.push(`- 睡眠：${sleepText[insights.recentSleepPattern]}`);
    }
    
    if (insights.recentStressLevel) {
      const stressText = {
        low: '压力较低',
        medium: '压力中等',
        high: '压力较大',
      };
      parts.push(`- 压力：${stressText[insights.recentStressLevel]}`);
    }
    
    if (insights.recentExercise) {
      const exerciseText = {
        none: '未运动',
        light: '轻度运动',
        moderate: '中等强度运动',
        intense: '高强度运动',
      };
      parts.push(`- 运动：${exerciseText[insights.recentExercise]}`);
    }
    
    if (insights.recentMood) {
      const moodText = {
        bad: '心情不佳',
        okay: '心情一般',
        great: '心情很好',
      };
      parts.push(`- 情绪：${moodText[insights.recentMood]}`);
    }
    
    parts.push(`\n响应率：${Math.round(insights.responseRate * 100)}%`);
  } else {
    parts.push('User\'s recent status:');
    
    if (insights.recentSleepPattern) {
      const sleepText = {
        poor: 'Poor sleep (less than 6 hours)',
        average: 'Average sleep (6-8 hours)',
        good: 'Good sleep (8+ hours)',
      };
      parts.push(`- Sleep: ${sleepText[insights.recentSleepPattern]}`);
    }
    
    if (insights.recentStressLevel) {
      const stressText = {
        low: 'Low stress',
        medium: 'Medium stress',
        high: 'High stress',
      };
      parts.push(`- Stress: ${stressText[insights.recentStressLevel]}`);
    }
    
    if (insights.recentExercise) {
      const exerciseText = {
        none: 'No exercise',
        light: 'Light exercise',
        moderate: 'Moderate exercise',
        intense: 'Intense exercise',
      };
      parts.push(`- Exercise: ${exerciseText[insights.recentExercise]}`);
    }
    
    if (insights.recentMood) {
      const moodText = {
        bad: 'Bad mood',
        okay: 'Okay mood',
        great: 'Great mood',
      };
      parts.push(`- Mood: ${moodText[insights.recentMood]}`);
    }
    
    parts.push(`\nResponse rate: ${Math.round(insights.responseRate * 100)}%`);
  }
  
  return parts.join('\n');
}
