'use server';

/**
 * User Refresh & Sync Server Actions (The Brain)
 *
 * - refreshUserProfile: recompute AI analysis + persona embedding
 * - syncUserProfile: aggregate unified profile
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { analyzeUserProfileAndSave } from '@/lib/aiAnalysis';
import { updateUserPersonaEmbedding } from '@/lib/userPersona';
import { aggregateUserProfile } from '@/lib/user-profile-aggregator';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

type DailyWellnessLogRow = {
  log_date: string;
  sleep_duration_minutes?: number | null;
  stress_level?: number | null;
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function parseAgeFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

function parseAgeFromRange(ageRange: string | null | undefined): number | null {
  if (!ageRange) return null;
  const match = ageRange.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0 || end < start) {
    return null;
  }
  return Math.round((start + end) / 2);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export interface RefreshSummary {
  analysisUpdated: boolean;
  personaUpdated: boolean;
  personaError?: string | null;
  derived?: {
    sleep_hours: number | null;
    stress_level: number | null;
    samples: {
      sleep: number;
      stress: number;
    };
  };
}

/**
 * Refresh AI analysis and persona embedding for the current user.
 */
export async function refreshUserProfile(): Promise<ActionResult<RefreshSummary>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        age,
        birth_date,
        age_range,
        gender,
        height_cm,
        weight_kg,
        height,
        weight,
        sleep_hours,
        stress_level,
        energy_level,
        exercise_types,
        exercise_frequency,
        exercise_duration_minutes,
        work_schedule,
        meal_pattern,
        caffeine_intake,
        alcohol_intake,
        smoking_status,
        medical_conditions,
        medications,
        primary_concern,
        activity_level,
        circadian_rhythm,
        metabolic_concerns
      `)
      .eq('id', user.id)
      .single<Record<string, unknown>>();

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' };
    }

    const { data: recentLogs } = await supabase
      .from('daily_wellness_logs')
      .select('log_date, sleep_duration_minutes, stress_level')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(7)
      .returns<DailyWellnessLogRow[]>();

    const sleepHoursValues =
      recentLogs
        ?.map(row => toNumber(row.sleep_duration_minutes))
        .filter((minutes): minutes is number => minutes !== null)
        .map(minutes => minutes / 60) ?? [];

    const stressValues =
      recentLogs
        ?.map(row => toNumber(row.stress_level))
        .filter((stress): stress is number => stress !== null) ?? [];

    const derivedSleepHours = average(sleepHoursValues);
    const derivedStress = average(stressValues);

    const age =
      toNumber(profile.age) ??
      parseAgeFromBirthDate(profile.birth_date as string | null | undefined) ??
      parseAgeFromRange(profile.age_range as string | null | undefined);

    const heightCm = toNumber(profile.height_cm) ?? toNumber(profile.height);
    const weightKg = toNumber(profile.weight_kg) ?? toNumber(profile.weight);

    const analysisInputProfile = {
      id: user.id,
      age,
      gender: (profile.gender as string | null | undefined) ?? null,
      height_cm: heightCm,
      weight_kg: weightKg,
      sleep_hours: derivedSleepHours ?? toNumber(profile.sleep_hours),
      stress_level: (derivedStress != null ? Math.round(derivedStress) : null) ?? toNumber(profile.stress_level),
      energy_level: toNumber(profile.energy_level),
      exercise_types: (profile.exercise_types as string[] | null | undefined) ?? null,
      exercise_frequency: (profile.exercise_frequency as string | null | undefined) ?? null,
      exercise_duration_minutes: toNumber(profile.exercise_duration_minutes),
      work_schedule: (profile.work_schedule as string | null | undefined) ?? null,
      meal_pattern: (profile.meal_pattern as string | null | undefined) ?? null,
      caffeine_intake: (profile.caffeine_intake as string | null | undefined) ?? null,
      alcohol_intake: (profile.alcohol_intake as string | null | undefined) ?? null,
      smoking_status: (profile.smoking_status as string | null | undefined) ?? null,
      medical_conditions: (profile.medical_conditions as string[] | null | undefined) ?? null,
      medications: (profile.medications as string[] | null | undefined) ?? null,
      primary_concern: (profile.primary_concern as string | null | undefined) ?? null,
      activity_level: (profile.activity_level as string | null | undefined) ?? null,
      circadian_rhythm: (profile.circadian_rhythm as string | null | undefined) ?? null,
      metabolic_concerns: Array.isArray(profile.metabolic_concerns)
        ? (profile.metabolic_concerns as string[])
        : null,
    };

    await analyzeUserProfileAndSave(analysisInputProfile);

    const personaResult = await updateUserPersonaEmbedding(user.id);

    return toSerializable({
      success: true,
      data: {
        analysisUpdated: true,
        personaUpdated: personaResult.success,
        personaError: personaResult.success ? null : personaResult.error || 'Failed to update persona',
        derived: {
          sleep_hours: derivedSleepHours,
          stress_level: derivedStress,
          samples: {
            sleep: sleepHoursValues.length,
            stress: stressValues.length,
          },
        },
      },
    });
  } catch (error) {
    console.error('[User Action] refreshUserProfile error:', error);
    return { success: false, error: 'Failed to refresh profile' };
  }
}

/**
 * Aggregate unified user profile (non-blocking background sync).
 */
export async function syncUserProfile(): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const result = await aggregateUserProfile(user.id);
    if (!result.success) {
      return { success: false, error: result.error || 'Sync failed' };
    }

    return toSerializable({ success: true });
  } catch (error) {
    console.error('[User Action] syncUserProfile error:', error);
    return { success: false, error: 'Failed to sync profile' };
  }
}
