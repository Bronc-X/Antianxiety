'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

export interface AssistantProfileData {
  gender?: string | null;
  age_range?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  sleep_hours?: number | null;
  stress_level?: number | null;
  energy_level?: number | null;
  exercise_types?: string[] | null;
  exercise_frequency?: string | null;
  exercise_duration_minutes?: number | null;
  has_fitness_app?: boolean | null;
  fitness_app_name?: string | null;
  can_sync_fitness_data?: boolean | null;
  hobbies?: string[] | null;
  work_schedule?: string | null;
  meal_pattern?: string | null;
  caffeine_intake?: string | null;
  alcohol_intake?: string | null;
  smoking_status?: string | null;
  chronic_conditions?: string[] | null;
  primary_focus_topics?: string[] | null;
  medical_conditions?: string[] | null;
  medications?: string[] | null;
  daily_checkin_time?: string | null;
  ai_profile_completed?: boolean | null;
}

export type AssistantProfileInput = AssistantProfileData;

export async function getAssistantProfile(): Promise<ActionResult<AssistantProfileData | null>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select([
        'gender',
        'age_range',
        'height_cm',
        'weight_kg',
        'sleep_hours',
        'stress_level',
        'energy_level',
        'exercise_types',
        'exercise_frequency',
        'exercise_duration_minutes',
        'has_fitness_app',
        'fitness_app_name',
        'can_sync_fitness_data',
        'hobbies',
        'work_schedule',
        'meal_pattern',
        'caffeine_intake',
        'alcohol_intake',
        'smoking_status',
        'chronic_conditions',
        'primary_focus_topics',
        'medical_conditions',
        'medications',
        'daily_checkin_time',
        'ai_profile_completed',
      ].join(','))
      .eq('id', user.id)
      .maybeSingle<AssistantProfileData>();

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true, data: data || null });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load profile',
    };
  }
}

export async function saveAssistantProfile(
  input: AssistantProfileInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const metadata = (user.user_metadata || {}) as { username?: string };
    const fallbackUsername = metadata.username || user.email || user.id.slice(0, 8);

    const payload: Record<string, unknown> = {
      id: user.id,
      username: fallbackUsername,
      ai_profile_completed: input.ai_profile_completed ?? true,
      updated_at: new Date().toISOString(),
    };

    if (input.gender !== undefined) payload.gender = input.gender;
    if (input.age_range !== undefined) payload.age_range = input.age_range;
    if (input.height_cm !== undefined) payload.height_cm = input.height_cm;
    if (input.weight_kg !== undefined) payload.weight_kg = input.weight_kg;
    if (input.sleep_hours !== undefined) payload.sleep_hours = input.sleep_hours;
    if (input.stress_level !== undefined) payload.stress_level = input.stress_level;
    if (input.energy_level !== undefined) payload.energy_level = input.energy_level;
    if (input.exercise_types !== undefined) payload.exercise_types = input.exercise_types;
    if (input.exercise_frequency !== undefined) payload.exercise_frequency = input.exercise_frequency;
    if (input.exercise_duration_minutes !== undefined) {
      payload.exercise_duration_minutes = input.exercise_duration_minutes;
    }
    if (input.has_fitness_app !== undefined) payload.has_fitness_app = input.has_fitness_app;
    if (input.fitness_app_name !== undefined) payload.fitness_app_name = input.fitness_app_name;
    if (input.can_sync_fitness_data !== undefined) {
      payload.can_sync_fitness_data = input.can_sync_fitness_data;
    }
    if (input.hobbies !== undefined) payload.hobbies = input.hobbies;
    if (input.work_schedule !== undefined) payload.work_schedule = input.work_schedule;
    if (input.meal_pattern !== undefined) payload.meal_pattern = input.meal_pattern;
    if (input.caffeine_intake !== undefined) payload.caffeine_intake = input.caffeine_intake;
    if (input.alcohol_intake !== undefined) payload.alcohol_intake = input.alcohol_intake;
    if (input.smoking_status !== undefined) payload.smoking_status = input.smoking_status;
    if (input.chronic_conditions !== undefined) payload.chronic_conditions = input.chronic_conditions;
    if (input.primary_focus_topics !== undefined) {
      payload.primary_focus_topics = input.primary_focus_topics;
    }
    if (input.medical_conditions !== undefined) payload.medical_conditions = input.medical_conditions;
    if (input.medications !== undefined) payload.medications = input.medications;
    if (input.daily_checkin_time !== undefined) payload.daily_checkin_time = input.daily_checkin_time;

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save profile',
    };
  }
}
