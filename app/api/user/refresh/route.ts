import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { analyzeUserProfileAndSave } from '@/lib/aiAnalysis';
import { updateUserPersonaEmbedding } from '@/lib/userPersona';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
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
        `
      )
      .eq('id', user.id)
      .single<Record<string, unknown>>();

    if (profileError || !profile) {
      return NextResponse.json({ error: '用户资料不存在' }, { status: 404 });
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
        ?.map((row) => toNumber(row.sleep_duration_minutes))
        .filter((minutes): minutes is number => minutes !== null)
        .map((minutes) => minutes / 60) ?? [];

    const stressValues =
      recentLogs
        ?.map((row) => toNumber(row.stress_level))
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

    // 1) Refresh analysis + recommendation plan (grounded on latest profile + recent logs)
    await analyzeUserProfileAndSave(analysisInputProfile);

    // 2) Refresh persona embedding (for /api/feed personalization)
    const personaResult = await updateUserPersonaEmbedding(user.id);

    return NextResponse.json({
      success: true,
      analysisUpdated: true,
      personaUpdated: personaResult.success,
      personaError: personaResult.success ? null : personaResult.error || '更新用户画像向量失败',
      derived: {
        sleep_hours: derivedSleepHours,
        stress_level: derivedStress,
        samples: {
          sleep: sleepHoursValues.length,
          stress: stressValues.length,
        },
      },
    });
  } catch (error) {
    console.error('User refresh API error:', error);
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 });
  }
}

