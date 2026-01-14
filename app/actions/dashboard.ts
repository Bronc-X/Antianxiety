'use server';

/**
 * Dashboard Server Actions (The Brain)
 * 
 * Pure server-side functions for dashboard data operations.
 * No UI code, no client-side imports.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type {
  ActionResult,
  DashboardData,
  UnifiedProfile,
  WellnessLog,
  HardwareData,
  HardwareDataPoint
} from '@/types/architecture';

// ============================================
// Data Fetching Actions
// ============================================

/**
 * Get dashboard data including profile, weekly logs, and hardware data.
 * 
 * @returns ActionResult with DashboardData
 */
export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Please sign in to view your dashboard'
      };
    }

    const userId = user.id;

    // Fetch all data in parallel for performance
    const [profileResult, logsResult, hardwareResult] = await Promise.all([
      fetchUnifiedProfile(supabase, userId),
      fetchWeeklyLogs(supabase, userId),
      fetchHardwareData(supabase, userId),
    ]);

    // Build dashboard data (all values are already serializable)
    const dashboardData: DashboardData = {
      profile: profileResult,
      weeklyLogs: logsResult,
      hardwareData: hardwareResult,
    };

    return toSerializable({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('[Dashboard Action] getDashboardData error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Something went wrong loading your dashboard',
    };
  }
}

/**
 * Trigger profile aggregation/sync.
 * 
 * @returns ActionResult indicating success or failure
 */
export async function syncProfile(): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Please sign in to sync your profile'
      };
    }

    // Import aggregator dynamically to avoid bundling issues
    const { aggregateUserProfile } = await import('@/lib/user-profile-aggregator');

    const result = await aggregateUserProfile(user.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Profile sync failed',
      };
    }

    return { success: true };

  } catch (error) {
    console.error('[Dashboard Action] syncProfile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Something went wrong syncing your profile',
    };
  }
}

// ============================================
// Internal Helper Functions
// ============================================

/**
 * Fetch unified profile from database.
 */
async function fetchUnifiedProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<UnifiedProfile | null> {
  const { data, error } = await supabase
    .from('unified_user_profiles')
    .select(`
      demographics,
      health_goals,
      health_concerns,
      lifestyle_factors,
      recent_mood_trend,
      ai_inferred_traits,
      last_aggregated_at
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Try fallback to profiles table
    const { data: fallbackProfile } = await supabase
      .from('profiles')
      .select('age, gender, height, weight, primary_concern, current_focus')
      .eq('id', userId)
      .single();

    if (!fallbackProfile) return null;

    // Build minimal profile from fallback data
    return {
      demographics: {
        gender: fallbackProfile.gender || undefined,
        age: fallbackProfile.age || undefined,
        bmi: fallbackProfile.height && fallbackProfile.weight
          ? fallbackProfile.weight / ((fallbackProfile.height / 100) ** 2)
          : undefined,
      },
      health_goals: [],
      health_concerns: fallbackProfile.current_focus
        ? [fallbackProfile.current_focus]
        : [],
      lifestyle_factors: {},
      recent_mood_trend: 'stable',
      ai_inferred_traits: {},
      last_aggregated_at: new Date().toISOString(),
    };
  }

  // Transform to ensure serializable format
  return {
    demographics: data.demographics || {},
    health_goals: data.health_goals || [],
    health_concerns: data.health_concerns || [],
    lifestyle_factors: data.lifestyle_factors || {},
    recent_mood_trend: data.recent_mood_trend || 'stable',
    ai_inferred_traits: data.ai_inferred_traits || {},
    last_aggregated_at: dateToISO(data.last_aggregated_at) || new Date().toISOString(),
  };
}

/**
 * Fetch weekly wellness logs.
 */
async function fetchWeeklyLogs(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<WellnessLog[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('daily_wellness_logs')
    .select('log_date, sleep_duration_minutes, exercise_duration_minutes, mood_status, stress_level, mindfulness_minutes, sleep_quality, overall_readiness, ai_recommendation, morning_energy')
    .eq('user_id', userId)
    .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('log_date', { ascending: false });

  if (error || !data) {
    return [];
  }

  // Transform to ensure serializable format
  return data.map(log => ({
    log_date: log.log_date,
    sleep_duration_minutes: log.sleep_duration_minutes,
    exercise_duration_minutes: log.exercise_duration_minutes || null,
    mindfulness_minutes: log.mindfulness_minutes,
    sleep_quality: log.sleep_quality ?? null,
    morning_energy: log.morning_energy ?? null,
    overall_readiness: log.overall_readiness ?? null,
    ai_recommendation: log.ai_recommendation ?? null,
    mood_status: log.mood_status,
    stress_level: log.stress_level,
  }));
}

/**
 * Fetch latest hardware/wearable data.
 */
async function fetchHardwareData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<HardwareData | null> {
  const { data, error } = await supabase
    .from('user_health_data')
    .select('data_type, value, source, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Group by data type, take latest of each
  const latestByType: Record<string, HardwareDataPoint> = {};

  for (const item of data) {
    if (!latestByType[item.data_type]) {
      latestByType[item.data_type] = {
        value: item.value,
        source: item.source,
        recorded_at: dateToISO(item.recorded_at) || new Date().toISOString(),
      };
    }
  }

  // Build hardware data object
  const hardwareData: HardwareData = {};

  if (latestByType.hrv) hardwareData.hrv = latestByType.hrv;
  if (latestByType.resting_heart_rate) hardwareData.resting_heart_rate = latestByType.resting_heart_rate;
  if (latestByType.sleep_score) hardwareData.sleep_score = latestByType.sleep_score;
  if (latestByType.spo2) hardwareData.spo2 = latestByType.spo2;

  return Object.keys(hardwareData).length > 0 ? hardwareData : null;
}

// ============================================
// Digital Twin Actions
// ============================================

import { getDataCollectionStatus } from '@/lib/digital-twin/data-aggregator';
import { filterSensitiveData } from '@/lib/digital-twin/dashboard-generator';
import type { DashboardResponse, DashboardData as TwinDashboardData, AdaptivePlan } from '@/types/digital-twin';

type CollectionStatus = Awaited<ReturnType<typeof getDataCollectionStatus>>;

export async function getDigitalTwinData(): Promise<ActionResult<DashboardResponse | { status: string; collectionStatus?: CollectionStatus; message?: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: 'Please sign in' };

    const userId = user.id;
    const collectionStatus = await getDataCollectionStatus(userId);

    if (!collectionStatus.isReady) {
      return {
        success: true,
        data: {
          status: 'collecting_data',
          collectionStatus,
          message: collectionStatus.message,
        }
      };
    }

    const { data: latestAnalysis, error: fetchError } = await supabase
      .from('digital_twin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !latestAnalysis) {
      return {
        success: true,
        data: {
          status: 'no_analysis',
          collectionStatus,
          message: 'Data ready for analysis',
        }
      };
    }

    const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;
    const isStale = Date.now() - new Date(latestAnalysis.created_at).getTime() > STALE_THRESHOLD_MS;

    const { data: profile } = await supabase
      .from('profiles')
      .select('medical_history_consent')
      .eq('id', userId)
      .single();

    let dashboardData: TwinDashboardData = latestAnalysis.dashboard_data;
    dashboardData = filterSensitiveData(dashboardData, profile?.medical_history_consent ?? false);

    return {
      success: true,
      data: {
        dashboardData,
        adaptivePlan: latestAnalysis.adaptive_plan as AdaptivePlan,
        isStale,
        lastAnalyzed: latestAnalysis.created_at,
      } as DashboardResponse
    };

  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return { success: false, error: 'Failed to load Digital Twin data' };
  }
}
