/**
 * Digital Twin Data Aggregator
 * 
 * 从多个数据源收集和聚合用户健康数据：
 * - 问卷基线数据 (GAD-7, PHQ-9, ISI, PSS-10)
 * - 每日校准数据
 * - 主动问询数据
 * - 对话历史
 * 
 * @module lib/digital-twin/data-aggregator
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import type {
  AggregatedUserData,
  BaselineData,
  CalibrationData,
  InquiryInsight,
  ConversationSummary,
  UserProfile,
  DataCollectionStatus,
} from '@/types/digital-twin';

// ============================================
// 常量
// ============================================

/** 触发分析所需的最小校准次数 */
export const MIN_CALIBRATIONS_FOR_ANALYSIS = 3;

/** 获取校准数据的默认天数 */
const DEFAULT_CALIBRATION_DAYS = 30;

/** 获取对话历史的默认天数 */
const DEFAULT_CONVERSATION_DAYS = 14;

// ============================================
// 量表解读
// ============================================

const GAD7_INTERPRETATIONS: Record<string, string> = {
  minimal: '轻微焦虑',
  mild: '轻度焦虑',
  moderate: '中度焦虑',
  severe: '重度焦虑',
};

const PHQ9_INTERPRETATIONS: Record<string, string> = {
  minimal: '轻微抑郁',
  mild: '轻度抑郁',
  moderate: '中度抑郁',
  moderately_severe: '中重度抑郁',
  severe: '重度抑郁',
};

const ISI_INTERPRETATIONS: Record<string, string> = {
  none: '无失眠',
  subthreshold: '亚临床失眠',
  moderate: '中度失眠',
  severe: '重度失眠',
};

const PSS10_INTERPRETATIONS: Record<string, string> = {
  low: '低压力',
  moderate: '中等压力',
  high: '高压力',
};

function getGAD7Interpretation(score: number): string {
  if (score <= 4) return GAD7_INTERPRETATIONS.minimal;
  if (score <= 9) return GAD7_INTERPRETATIONS.mild;
  if (score <= 14) return GAD7_INTERPRETATIONS.moderate;
  return GAD7_INTERPRETATIONS.severe;
}

function getPHQ9Interpretation(score: number): string {
  if (score <= 4) return PHQ9_INTERPRETATIONS.minimal;
  if (score <= 9) return PHQ9_INTERPRETATIONS.mild;
  if (score <= 14) return PHQ9_INTERPRETATIONS.moderate;
  if (score <= 19) return PHQ9_INTERPRETATIONS.moderately_severe;
  return PHQ9_INTERPRETATIONS.severe;
}

function getISIInterpretation(score: number): string {
  if (score <= 7) return ISI_INTERPRETATIONS.none;
  if (score <= 14) return ISI_INTERPRETATIONS.subthreshold;
  if (score <= 21) return ISI_INTERPRETATIONS.moderate;
  return ISI_INTERPRETATIONS.severe;
}

function getPSS10Interpretation(score: number): string {
  if (score <= 13) return PSS10_INTERPRETATIONS.low;
  if (score <= 26) return PSS10_INTERPRETATIONS.moderate;
  return PSS10_INTERPRETATIONS.high;
}

// ============================================
// 核心函数
// ============================================

/**
 * 聚合用户的所有健康数据
 */
export async function aggregateUserData(userId: string): Promise<AggregatedUserData> {
  const supabase = await createServerSupabaseClient();

  // 并行获取所有数据
  const [baseline, calibrations, inquiryInsights, conversationSummary, profile] = await Promise.all([
    fetchBaselineData(supabase, userId),
    fetchCalibrationData(supabase, userId, DEFAULT_CALIBRATION_DAYS),
    fetchInquiryInsights(supabase, userId),
    fetchConversationSummary(supabase, userId, DEFAULT_CONVERSATION_DAYS),
    fetchUserProfile(supabase, userId),
  ]);

  return {
    userId,
    baseline,
    calibrations,
    inquiryInsights,
    conversationSummary,
    profile,
  };
}

/**
 * 获取问卷基线数据
 */
async function fetchBaselineData(supabase: any, userId: string): Promise<BaselineData | null> {
  // 从 profiles 表获取推断的量表分数
  const { data: profile } = await supabase
    .from('profiles')
    .select('inferred_scale_scores, created_at')
    .eq('id', userId)
    .single();

  if (!profile?.inferred_scale_scores) {
    return null;
  }

  const scores = profile.inferred_scale_scores as Record<string, number>;

  // 检查是否有完整的基线数据
  const gad7Score = scores.gad7 ?? scores.GAD7 ?? null;
  const phq9Score = scores.phq9 ?? scores.PHQ9 ?? null;
  const isiScore = scores.isi ?? scores.ISI ?? null;
  const pss10Score = scores.pss10 ?? scores.PSS10 ?? null;

  if (gad7Score === null && phq9Score === null && isiScore === null && pss10Score === null) {
    return null;
  }

  return {
    gad7Score: gad7Score ?? 0,
    phq9Score: phq9Score ?? 0,
    isiScore: isiScore ?? 0,
    pss10Score: pss10Score ?? 0,
    assessmentDate: profile.created_at,
    interpretations: {
      gad7: getGAD7Interpretation(gad7Score ?? 0),
      phq9: getPHQ9Interpretation(phq9Score ?? 0),
      isi: getISIInterpretation(isiScore ?? 0),
      pss10: getPSS10Interpretation(pss10Score ?? 0),
    },
  };
}

/**
 * 获取每日校准数据
 */
async function fetchCalibrationData(
  supabase: any,
  userId: string,
  days: number
): Promise<CalibrationData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: calibrations } = await supabase
    .from('daily_calibrations')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (!calibrations || calibrations.length === 0) {
    return [];
  }

  return calibrations.map((c: any) => ({
    date: c.date,
    sleepHours: c.sleep_hours ?? c.sleep_duration ?? 0,
    sleepQuality: c.sleep_quality ?? 0,
    moodScore: c.mood_score ?? c.mood ?? 0,
    stressLevel: c.stress_level ?? 0,
    energyLevel: c.energy_level ?? 0,
  }));
}

/**
 * 获取主动问询洞察
 */
async function fetchInquiryInsights(supabase: any, userId: string): Promise<InquiryInsight[]> {
  const { data: sessions } = await supabase
    .from('active_inquiry_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!sessions || sessions.length === 0) {
    return [];
  }

  return sessions.map((s: any) => ({
    date: s.created_at,
    topic: s.topic || s.question_type || 'general',
    userResponse: s.user_response || '',
    extractedIndicators: s.extracted_data || {},
  }));
}

/**
 * 获取对话摘要
 */
async function fetchConversationSummary(
  supabase: any,
  userId: string,
  days: number
): Promise<ConversationSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 获取消息统计
  const { data: messages, count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  const totalMessages = count || 0;
  const lastInteraction = messages?.[0]?.created_at || new Date().toISOString();

  // 简单的情绪趋势分析（基于消息数量变化）
  let emotionalTrend: 'improving' | 'stable' | 'declining' = 'stable';

  if (messages && messages.length > 0) {
    // 分析最近消息的情绪标签（如果有）
    const recentEmotions = messages
      .slice(0, 10)
      .map((m: any) => m.emotion_label || m.sentiment)
      .filter(Boolean);

    if (recentEmotions.length > 0) {
      const positiveCount = recentEmotions.filter((e: string) =>
        ['positive', 'happy', 'calm', 'hopeful'].includes(e.toLowerCase())
      ).length;
      const negativeCount = recentEmotions.filter((e: string) =>
        ['negative', 'anxious', 'sad', 'stressed'].includes(e.toLowerCase())
      ).length;

      if (positiveCount > negativeCount * 1.5) {
        emotionalTrend = 'improving';
      } else if (negativeCount > positiveCount * 1.5) {
        emotionalTrend = 'declining';
      }
    }
  }

  // 提取常见话题
  const frequentTopics: string[] = [];
  if (messages && messages.length > 0) {
    const topicCounts: Record<string, number> = {};
    messages.forEach((m: any) => {
      const topic = m.topic || m.category;
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });

    const sortedTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    frequentTopics.push(...sortedTopics);
  }

  return {
    totalMessages,
    emotionalTrend,
    frequentTopics,
    lastInteraction,
  };
}

/**
 * 获取用户画像
 */
async function fetchUserProfile(supabase: any, userId: string): Promise<UserProfile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('age, gender, primary_concern, created_at, medical_history_consent')
    .eq('id', userId)
    .single();

  return {
    age: profile?.age,
    gender: profile?.gender,
    primaryConcern: profile?.primary_concern,
    registrationDate: profile?.created_at || new Date().toISOString(),
    medicalHistoryConsent: profile?.medical_history_consent ?? false,
  };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取校准趋势数据
 */
export async function getCalibrationTrend(
  userId: string,
  days: number = 7
): Promise<{
  sleepTrend: 'improving' | 'stable' | 'declining';
  moodTrend: 'improving' | 'stable' | 'declining';
  stressTrend: 'improving' | 'stable' | 'declining';
  energyTrend: 'improving' | 'stable' | 'declining';
}> {
  const supabase = await createServerSupabaseClient();
  const calibrations = await fetchCalibrationData(supabase, userId, days);

  if (calibrations.length < 2) {
    return {
      sleepTrend: 'stable',
      moodTrend: 'stable',
      stressTrend: 'stable',
      energyTrend: 'stable',
    };
  }

  const calculateTrend = (values: number[]): 'improving' | 'stable' | 'declining' => {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const threshold = 0.5; // 0.5 分的变化视为显著

    if (diff > threshold) return 'improving';
    if (diff < -threshold) return 'declining';
    return 'stable';
  };

  // 对于压力，下降是好的
  const calculateStressTrend = (values: number[]): 'improving' | 'stable' | 'declining' => {
    const trend = calculateTrend(values);
    if (trend === 'improving') return 'declining'; // 压力上升是不好的
    if (trend === 'declining') return 'improving'; // 压力下降是好的
    return 'stable';
  };

  return {
    sleepTrend: calculateTrend(calibrations.map(c => c.sleepQuality)),
    moodTrend: calculateTrend(calibrations.map(c => c.moodScore)),
    stressTrend: calculateStressTrend(calibrations.map(c => c.stressLevel)),
    energyTrend: calculateTrend(calibrations.map(c => c.energyLevel)),
  };
}

/**
 * 检查数据收集状态
 */
export async function getDataCollectionStatus(userId: string): Promise<DataCollectionStatus> {
  const supabase = await createServerSupabaseClient();

  // 检查基线数据
  const { data: profile } = await supabase
    .from('profiles')
    .select('inferred_scale_scores')
    .eq('id', userId)
    .single();

  const hasBaseline = !!(profile?.inferred_scale_scores);

  // 检查校准次数
  const { count } = await supabase
    .from('daily_calibrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const calibrationCount = count || 0;
  let firstCalibrationDate: string | null = null;
  let lastCalibrationDate: string | null = null;

  if (calibrationCount > 0) {
    const { data: earliestCalibration } = await supabase
      .from('daily_calibrations')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(1);

    const { data: latestCalibration } = await supabase
      .from('daily_calibrations')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);

    firstCalibrationDate = earliestCalibration?.[0]?.date ?? null;
    lastCalibrationDate = latestCalibration?.[0]?.date ?? null;
  }
  const requiredCalibrations = MIN_CALIBRATIONS_FOR_ANALYSIS;
  const isReady = hasBaseline && calibrationCount >= requiredCalibrations;

  // 计算进度
  let progress = 0;
  if (requiredCalibrations > 0) {
    progress = Math.min(100, (calibrationCount / requiredCalibrations) * 100);
  }


  // 生成消息
  let message = '';
  if (!hasBaseline) {
    message = '请先完成入门问卷';
  } else if (calibrationCount < requiredCalibrations) {
    message = `还需要 ${requiredCalibrations - calibrationCount} 次每日校准`;
  } else {
    message = '数据收集完成，可以生成分析';
  }

  return {
    hasBaseline,
    calibrationCount,
    calibrationDays: calibrationCount,
    firstCalibrationDate,
    lastCalibrationDate,
    requiredCalibrations,
    isReady,
    progress: Math.round(progress),
    message,
  };
}

/**
 * 验证聚合数据是否足够进行分析
 */
export function isDataSufficientForAnalysis(data: AggregatedUserData): boolean {
  return !!data.baseline && data.calibrations.length >= MIN_CALIBRATIONS_FOR_ANALYSIS;
}
