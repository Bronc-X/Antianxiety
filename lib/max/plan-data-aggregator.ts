/**
 * Plan Data Aggregator
 * 
 * 聚合用户健康数据用于 Max 计划生成
 * 包括问询数据、校准数据、HRV 数据和用户画像
 * 
 * @module lib/max/plan-data-aggregator
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AggregatedPlanData,
  InquiryData,
  CalibrationData,
  HrvData,
  UserProfileData,
  DataStatus,
} from '@/types/max-plan';

// ============================================
// 常量定义
// ============================================

/** 数据新鲜度阈值（天） */
export const DATA_FRESHNESS_THRESHOLD_DAYS = 7;

/** 校准数据查询天数 */
const CALIBRATION_LOOKBACK_DAYS = 7;

// ============================================
// 核心聚合函数
// ============================================

/**
 * 聚合用户计划相关数据
 * 
 * @param userId - 用户 ID
 * @returns 聚合的用户数据
 */
export async function aggregatePlanData(userId: string): Promise<AggregatedPlanData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 并行获取所有数据
  const [inquiry, calibration, hrv, profile] = await Promise.all([
    fetchInquiryData(supabase, userId),
    fetchCalibrationData(supabase, userId),
    fetchHrvData(supabase, userId),
    fetchUserProfile(supabase, userId),
  ]);

  // 计算数据状态
  const dataStatus = calculateDataStatus(inquiry, calibration, hrv);

  return {
    userId,
    inquiry,
    calibration,
    hrv,
    profile,
    dataStatus,
  };
}

// ============================================
// 数据获取函数
// ============================================

/**
 * 获取最近的问询数据
 */
async function fetchInquiryData(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<InquiryData | null> {
  try {
    // 尝试从 active_inquiries 表获取
    const { data, error } = await supabase
      .from('active_inquiries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // 尝试从 inquiry_responses 表获取
      const { data: responses, error: respError } = await supabase
        .from('inquiry_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (respError || !responses || responses.length === 0) {
        return null;
      }

      // 聚合响应数据
      const aggregatedResponses: Record<string, string> = {};
      const extractedIndicators: Record<string, unknown> = {};

      responses.forEach((resp: { question_id?: string; response_value?: string; extracted_data?: unknown }) => {
        if (resp.question_id && resp.response_value) {
          aggregatedResponses[resp.question_id] = resp.response_value;
        }
        if (resp.extracted_data) {
          Object.assign(extractedIndicators, resp.extracted_data);
        }
      });

      return {
        id: responses[0].id,
        userId,
        topic: 'aggregated',
        responses: aggregatedResponses,
        extractedIndicators,
        createdAt: responses[0].created_at,
        updatedAt: responses[0].created_at,
      };
    }

    return {
      id: data.id,
      userId: data.user_id,
      topic: data.topic || 'general',
      responses: data.responses || {},
      extractedIndicators: data.extracted_indicators || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
    };
  } catch (error) {
    console.error('[PlanDataAggregator] Error fetching inquiry data:', error);
    return null;
  }
}

/**
 * 获取最近的校准数据
 */
async function fetchCalibrationData(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<CalibrationData | null> {
  try {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - CALIBRATION_LOOKBACK_DAYS);

    const { data, error } = await supabase
      .from('daily_wellness_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', lookbackDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      date: data.created_at,
      sleepHours: data.sleep_hours || 0,
      sleepQuality: data.sleep_quality || 0,
      moodScore: data.mood_score || 0,
      stressLevel: data.stress_level || 0,
      energyLevel: data.energy_level || 0,
    };
  } catch (error) {
    console.error('[PlanDataAggregator] Error fetching calibration data:', error);
    return null;
  }
}

/**
 * 获取 HRV 数据
 */
async function fetchHrvData(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<HrvData | null> {
  try {
    // 尝试从 wearable_data 表获取
    const { data, error } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // 尝试从 hrv_readings 表获取
      const { data: hrvData, error: hrvError } = await supabase
        .from('hrv_readings')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (hrvError || !hrvData) {
        return null;
      }

      return {
        date: hrvData.recorded_at,
        avgHrv: hrvData.hrv_value || hrvData.avg_hrv || 0,
        minHrv: hrvData.min_hrv || 0,
        maxHrv: hrvData.max_hrv || 0,
        restingHr: hrvData.resting_hr || 0,
        hrvTrend: calculateHrvTrend(hrvData.hrv_value, hrvData.baseline_hrv),
        source: hrvData.source || 'unknown',
      };
    }

    // 从 wearable_data 提取 HRV
    const hrvValue = data.hrv || data.heart_rate_variability || 0;
    
    return {
      date: data.recorded_at,
      avgHrv: hrvValue,
      minHrv: data.min_hrv || hrvValue * 0.8,
      maxHrv: data.max_hrv || hrvValue * 1.2,
      restingHr: data.resting_heart_rate || data.heart_rate || 0,
      hrvTrend: calculateHrvTrend(hrvValue, data.baseline_hrv),
      source: data.source || data.device_type || 'wearable',
    };
  } catch (error) {
    console.error('[PlanDataAggregator] Error fetching HRV data:', error);
    return null;
  }
}

/**
 * 获取用户画像
 */
async function fetchUserProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserProfileData | null> {
  try {
    // 优先从 unified_user_profiles 获取
    const { data: unified, error: unifiedError } = await supabase
      .from('unified_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!unifiedError && unified) {
      return {
        gender: unified.demographics?.gender,
        age: unified.demographics?.age,
        primaryConcern: unified.health_concerns?.[0],
        healthGoals: unified.health_goals || [],
        healthConcerns: unified.health_concerns || [],
        lifestyleFactors: unified.lifestyle_factors || {},
        recentMoodTrend: unified.recent_mood_trend,
      };
    }

    // 回退到 user_profiles 表
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const currentYear = new Date().getFullYear();
    const age = profile.birth_year ? currentYear - profile.birth_year : undefined;

    return {
      gender: profile.gender,
      age,
      primaryConcern: profile.metabolic_concerns?.[0],
      healthGoals: profile.phase_goals || [],
      healthConcerns: profile.metabolic_concerns || [],
      lifestyleFactors: {
        sleepHours: profile.sleep_hours,
        exerciseFrequency: profile.exercise_frequency,
        stressLevel: profile.stress_level,
      },
      recentMoodTrend: 'stable',
    };
  } catch (error) {
    console.error('[PlanDataAggregator] Error fetching user profile:', error);
    return null;
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 计算数据状态
 */
export function calculateDataStatus(
  inquiry: InquiryData | null,
  calibration: CalibrationData | null,
  hrv: HrvData | null
): DataStatus {
  const now = new Date();
  const thresholdMs = DATA_FRESHNESS_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  // 检查问询数据新鲜度
  const hasInquiryData = inquiry !== null && 
    (now.getTime() - new Date(inquiry.createdAt).getTime()) < thresholdMs;

  // 检查校准数据新鲜度
  const hasCalibrationData = calibration !== null &&
    (now.getTime() - new Date(calibration.date).getTime()) < thresholdMs;

  // 检查 HRV 数据
  const hasHrvData = hrv !== null && hrv.avgHrv > 0;

  return {
    hasInquiryData,
    hasCalibrationData,
    hasHrvData,
    inquirySummary: hasInquiryData ? generateInquirySummary(inquiry!) : undefined,
    calibrationSummary: hasCalibrationData ? generateCalibrationSummary(calibration!) : undefined,
    hrvSummary: hasHrvData ? generateHrvSummary(hrv!) : undefined,
    lastInquiryDate: inquiry?.createdAt,
    lastCalibrationDate: calibration?.date,
  };
}

/**
 * 计算 HRV 趋势
 */
function calculateHrvTrend(
  current: number,
  baseline?: number
): 'improving' | 'stable' | 'declining' {
  if (!baseline || baseline === 0) return 'stable';
  
  const changePercent = ((current - baseline) / baseline) * 100;
  
  if (changePercent > 10) return 'improving';
  if (changePercent < -10) return 'declining';
  return 'stable';
}

/**
 * 生成问询数据摘要
 */
function generateInquirySummary(inquiry: InquiryData): string {
  const responseCount = Object.keys(inquiry.responses).length;
  const topic = inquiry.topic || '健康状况';
  return `最近关于「${topic}」的问询，共 ${responseCount} 条回复`;
}

/**
 * 生成校准数据摘要
 */
function generateCalibrationSummary(calibration: CalibrationData): string {
  const parts: string[] = [];
  
  if (calibration.sleepHours > 0) {
    parts.push(`睡眠 ${calibration.sleepHours} 小时`);
  }
  if (calibration.moodScore > 0) {
    const moodLabel = calibration.moodScore >= 7 ? '良好' : calibration.moodScore >= 4 ? '一般' : '低落';
    parts.push(`情绪${moodLabel}`);
  }
  if (calibration.stressLevel > 0) {
    const stressLabel = calibration.stressLevel >= 7 ? '较高' : calibration.stressLevel >= 4 ? '中等' : '较低';
    parts.push(`压力${stressLabel}`);
  }
  
  return parts.length > 0 ? parts.join('，') : '已完成每日校准';
}

/**
 * 生成 HRV 数据摘要
 */
function generateHrvSummary(hrv: HrvData): string {
  const trendLabel = {
    improving: '上升趋势',
    stable: '稳定',
    declining: '下降趋势',
  }[hrv.hrvTrend];
  
  return `HRV ${hrv.avgHrv}ms (${trendLabel})，静息心率 ${hrv.restingHr} bpm`;
}

/**
 * 检查数据是否过期
 */
export function isDataStale(dateString: string | undefined): boolean {
  if (!dateString) return true;
  
  const dataDate = new Date(dateString);
  const now = new Date();
  const thresholdMs = DATA_FRESHNESS_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  
  return (now.getTime() - dataDate.getTime()) > thresholdMs;
}

/**
 * 验证用户 ID 匹配（用于数据隔离验证）
 */
export function validateUserDataIsolation(
  data: AggregatedPlanData,
  expectedUserId: string
): boolean {
  // 验证主用户 ID
  if (data.userId !== expectedUserId) return false;
  
  // 验证问询数据用户 ID
  if (data.inquiry && data.inquiry.userId !== expectedUserId) return false;
  
  return true;
}
