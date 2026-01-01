'use server';

/**
 * Profile Server Actions (The Brain)
 * 
 * Pure server-side functions for user profile operations.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import { POST as saveProfileRoute } from '@/app/api/profile/save/route';

// ============================================
// Types
// ============================================

export interface UserProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    nickname?: string | null;
    username: string | null;
    avatar_url: string | null;

    // Demographics
    age: number | null;
    gender: string | null;
    height: number | null;
    weight: number | null;
    birth_date?: string | null;
    age_range?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    body_fat_percentage?: number | null;
    location?: string | null;

    // Preferences
    language: string;
    timezone: string | null;
    notification_enabled: boolean;
    notification_email?: string | null;
    daily_checkin_time?: string | null;
    reminder_preferences?: Record<string, unknown> | null;

    // Health Profile
    primary_goal: string | null;
    primary_concern: string | null;
    activity_level: string | null;
    circadian_rhythm: string | null;
    ai_personality: string | null;
    current_focus: string | null;
    goal_focus_notes?: string | null;
    target_weight_kg?: number | null;
    weekly_goal_rate?: string | null;
    weekly_goal_custom?: number | null;
    sleep_hours?: number | null;
    stress_level?: number | null;
    energy_level?: number | null;
    exercise_frequency?: string | null;
    exercise_duration_minutes?: number | null;
    exercise_types?: string[] | null;
    chronic_conditions?: string[] | null;
    primary_focus_topics?: string[] | null;
    medical_conditions?: string[] | null;
    medications?: string[] | null;
    hobbies?: string[] | null;
    work_schedule?: string | null;
    meal_pattern?: string | null;
    caffeine_intake?: string | null;
    alcohol_intake?: string | null;
    smoking_status?: string | null;
    has_fitness_app?: boolean | null;
    fitness_app_name?: string | null;
    can_sync_fitness_data?: boolean | null;
    body_function_score?: number | null;
    ai_profile_completed?: boolean | null;
    ai_analysis_result?: Record<string, unknown> | null;
    ai_recommendation_plan?: Record<string, unknown> | null;
    ai_persona_context?: string | null;
    ai_settings?: Record<string, unknown> | null;
    metabolic_concerns?: string[] | null;

    // Integrations
    wearable_connected: boolean;
    wearable_type: string | null;

    // Stats
    member_since: string;
    streak_days: number;
    total_logs: number;
}

export interface UpdateProfileInput {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    nickname?: string | null;
    username?: string;
    avatar_url?: string;
    age?: number | string | null;
    gender?: string | null;
    height?: number | string | null;
    weight?: number | string | null;
    birth_date?: string | null;
    age_range?: string | null;
    height_cm?: number | string | null;
    weight_kg?: number | string | null;
    body_fat_percentage?: number | string | null;
    location?: string | null;
    language?: string;
    timezone?: string;
    notification_enabled?: boolean;
    notification_email?: string | null;
    daily_checkin_time?: string | null;
    reminder_preferences?: Record<string, unknown> | null;
    primary_goal?: string;
    primary_concern?: string;
    activity_level?: string;
    circadian_rhythm?: string;
    ai_personality?: string;
    current_focus?: string;
    goal_focus_notes?: string | null;
    target_weight_kg?: number | string | null;
    weekly_goal_rate?: string | null;
    weekly_goal_custom?: number | string | null;
    sleep_hours?: number | string | null;
    stress_level?: number | string | null;
    energy_level?: number | string | null;
    exercise_frequency?: string | null;
    exercise_duration_minutes?: number | string | null;
    exercise_types?: string[] | null;
    chronic_conditions?: string[] | null;
    primary_focus_topics?: string[] | null;
    medical_conditions?: string[] | null;
    medications?: string[] | null;
    hobbies?: string[] | null;
    work_schedule?: string | null;
    meal_pattern?: string | null;
    caffeine_intake?: string | null;
    alcohol_intake?: string | null;
    smoking_status?: string | null;
    has_fitness_app?: boolean | null;
    fitness_app_name?: string | null;
    can_sync_fitness_data?: boolean | null;
    body_function_score?: number | string | null;
    ai_profile_completed?: boolean | null;
    ai_analysis_result?: Record<string, unknown> | null;
    ai_recommendation_plan?: Record<string, unknown> | null;
    ai_persona_context?: string | null;
    ai_settings?: Record<string, unknown> | null;
    metabolic_concerns?: string[] | null;
}

export interface SaveHealthProfileInput {
    gender?: string | null;
    birth_date?: string | null;
    age_range?: string | null;
    height_cm?: number | string | null;
    weight_kg?: number | string | null;
    activity_level?: string | null;
    body_fat_percentage?: number | string | null;
    primary_goal?: string | null;
    goal_focus_notes?: string | null;
    target_weight_kg?: number | string | null;
    weekly_goal_rate?: string | null;
    weekly_goal_custom?: number | string | null;
    sleep_hours?: number | string | null;
    stress_level?: number | string | null;
    energy_level?: number | string | null;
    exercise_frequency?: string | null;
    exercise_duration_minutes?: number | string | null;
    exercise_types?: string[] | null;
    primary_focus_topics?: string[] | null;
    caffeine_intake?: string | null;
    alcohol_intake?: string | null;
    smoking_status?: string | null;
    work_schedule?: string | null;
    meal_pattern?: string | null;
    chronic_conditions?: string[] | null;
    medical_conditions?: string[] | null;
    medications?: string[] | null;
    hobbies?: string[] | null;
    has_fitness_app?: boolean | null;
    fitness_app_name?: string | null;
    can_sync_fitness_data?: boolean | null;
    location?: string | null;
    daily_checkin_time?: string | null;
    metabolic_concerns?: string[] | null;
}

async function parseJsonResponse(response: Response): Promise<any> {
    const raw = await response.text();
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function parseInteger(value: unknown): number | null {
    const num = parseNumber(value);
    return num === null ? null : Math.round(num);
}

function normalizeTime(value?: string | null): string | null {
    if (!value) return null;
    if (value.length === 5) return `${value}:00`;
    return value;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get current user profile.
 */
export async function getProfile(): Promise<ActionResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            return { success: false, error: 'Profile not found' };
        }

        // Get stats
        const { count: logCount } = await supabase
            .from('daily_wellness_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const userProfile: UserProfile = {
            id: profile.id,
            email: user.email || '',
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: profile.full_name,
            nickname: profile.nickname ?? null,
            username: profile.username,
            avatar_url: profile.avatar_url,
            age: profile.age,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            birth_date: profile.birth_date ? dateToISO(profile.birth_date) : null,
            age_range: profile.age_range ?? null,
            height_cm: profile.height_cm ?? null,
            weight_kg: profile.weight_kg ?? null,
            body_fat_percentage: profile.body_fat_percentage ?? null,
            location: profile.location ?? null,
            language: profile.preferred_language || 'zh',
            timezone: profile.timezone,
            notification_enabled: profile.notification_enabled ?? true,
            notification_email: profile.notification_email ?? null,
            daily_checkin_time: profile.daily_checkin_time ?? null,
            reminder_preferences: profile.reminder_preferences ?? null,
            primary_goal: profile.primary_goal,
            primary_concern: profile.primary_concern,
            activity_level: profile.activity_level,
            circadian_rhythm: profile.circadian_rhythm,
            ai_personality: profile.ai_personality,
            current_focus: profile.current_focus,
            goal_focus_notes: profile.goal_focus_notes ?? null,
            target_weight_kg: profile.target_weight_kg ?? null,
            weekly_goal_rate: profile.weekly_goal_rate ?? null,
            weekly_goal_custom: profile.weekly_goal_custom ?? null,
            sleep_hours: profile.sleep_hours ?? null,
            stress_level: profile.stress_level ?? null,
            energy_level: profile.energy_level ?? null,
            exercise_frequency: profile.exercise_frequency ?? null,
            exercise_duration_minutes: profile.exercise_duration_minutes ?? null,
            exercise_types: Array.isArray(profile.exercise_types) ? profile.exercise_types : null,
            chronic_conditions: Array.isArray(profile.chronic_conditions) ? profile.chronic_conditions : null,
            primary_focus_topics: Array.isArray(profile.primary_focus_topics) ? profile.primary_focus_topics : null,
            medical_conditions: Array.isArray(profile.medical_conditions) ? profile.medical_conditions : null,
            medications: Array.isArray(profile.medications) ? profile.medications : null,
            hobbies: Array.isArray(profile.hobbies) ? profile.hobbies : null,
            work_schedule: profile.work_schedule ?? null,
            meal_pattern: profile.meal_pattern ?? null,
            caffeine_intake: profile.caffeine_intake ?? null,
            alcohol_intake: profile.alcohol_intake ?? null,
            smoking_status: profile.smoking_status ?? null,
            has_fitness_app: profile.has_fitness_app ?? null,
            fitness_app_name: profile.fitness_app_name ?? null,
            can_sync_fitness_data: profile.can_sync_fitness_data ?? null,
            body_function_score: profile.body_function_score ?? null,
            ai_profile_completed: profile.ai_profile_completed ?? null,
            ai_analysis_result: profile.ai_analysis_result ?? null,
            ai_recommendation_plan: profile.ai_recommendation_plan ?? null,
            ai_persona_context: profile.ai_persona_context ?? null,
            ai_settings: profile.ai_settings ?? null,
            metabolic_concerns: Array.isArray(profile.metabolic_concerns) ? profile.metabolic_concerns : null,
            wearable_connected: !!profile.wearable_token,
            wearable_type: profile.wearable_type,
            member_since: dateToISO(profile.created_at) || new Date().toISOString(),
            streak_days: profile.current_streak || 0,
            total_logs: logCount || 0,
        };

        return toSerializable({ success: true, data: userProfile });

    } catch (error) {
        console.error('[Profile Action] getProfile error:', error);
        return { success: false, error: 'Failed to load profile' };
    }
}

/**
 * Update user profile.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.first_name !== undefined) updatePayload.first_name = input.first_name;
        if (input.last_name !== undefined) updatePayload.last_name = input.last_name;
        if (input.full_name !== undefined) updatePayload.full_name = input.full_name;
        if (input.nickname !== undefined) updatePayload.nickname = input.nickname;
        if (input.username !== undefined) updatePayload.username = input.username;
        if (input.avatar_url !== undefined) updatePayload.avatar_url = input.avatar_url;
        if (input.age !== undefined) updatePayload.age = parseInteger(input.age);
        if (input.gender !== undefined) updatePayload.gender = input.gender;
        if (input.height !== undefined) updatePayload.height = parseNumber(input.height);
        if (input.weight !== undefined) updatePayload.weight = parseNumber(input.weight);
        if (input.birth_date !== undefined) updatePayload.birth_date = input.birth_date;
        if (input.age_range !== undefined) updatePayload.age_range = input.age_range;
        if (input.height_cm !== undefined) updatePayload.height_cm = parseNumber(input.height_cm);
        if (input.weight_kg !== undefined) updatePayload.weight_kg = parseNumber(input.weight_kg);
        if (input.body_fat_percentage !== undefined) updatePayload.body_fat_percentage = parseNumber(input.body_fat_percentage);
        if (input.location !== undefined) updatePayload.location = input.location;
        if (input.language !== undefined) updatePayload.preferred_language = input.language;
        if (input.timezone !== undefined) updatePayload.timezone = input.timezone;
        if (input.notification_enabled !== undefined) updatePayload.notification_enabled = input.notification_enabled;
        if (input.notification_email !== undefined) updatePayload.notification_email = input.notification_email;
        if (input.daily_checkin_time !== undefined) updatePayload.daily_checkin_time = normalizeTime(input.daily_checkin_time);
        if (input.reminder_preferences !== undefined) updatePayload.reminder_preferences = input.reminder_preferences;
        if (input.primary_goal !== undefined) updatePayload.primary_goal = input.primary_goal;
        if (input.primary_concern !== undefined) updatePayload.primary_concern = input.primary_concern;
        if (input.activity_level !== undefined) updatePayload.activity_level = input.activity_level;
        if (input.circadian_rhythm !== undefined) updatePayload.circadian_rhythm = input.circadian_rhythm;
        if (input.ai_personality !== undefined) updatePayload.ai_personality = input.ai_personality;
        if (input.current_focus !== undefined) updatePayload.current_focus = input.current_focus;
        if (input.goal_focus_notes !== undefined) updatePayload.goal_focus_notes = input.goal_focus_notes;
        if (input.target_weight_kg !== undefined) updatePayload.target_weight_kg = parseNumber(input.target_weight_kg);
        if (input.weekly_goal_rate !== undefined) updatePayload.weekly_goal_rate = input.weekly_goal_rate;
        if (input.weekly_goal_custom !== undefined) updatePayload.weekly_goal_custom = parseNumber(input.weekly_goal_custom);
        if (input.sleep_hours !== undefined) updatePayload.sleep_hours = parseNumber(input.sleep_hours);
        if (input.stress_level !== undefined) updatePayload.stress_level = parseInteger(input.stress_level);
        if (input.energy_level !== undefined) updatePayload.energy_level = parseInteger(input.energy_level);
        if (input.exercise_frequency !== undefined) updatePayload.exercise_frequency = input.exercise_frequency;
        if (input.exercise_duration_minutes !== undefined) updatePayload.exercise_duration_minutes = parseInteger(input.exercise_duration_minutes);
        if (input.exercise_types !== undefined) updatePayload.exercise_types = input.exercise_types;
        if (input.chronic_conditions !== undefined) updatePayload.chronic_conditions = input.chronic_conditions;
        if (input.primary_focus_topics !== undefined) updatePayload.primary_focus_topics = input.primary_focus_topics;
        if (input.medical_conditions !== undefined) updatePayload.medical_conditions = input.medical_conditions;
        if (input.medications !== undefined) updatePayload.medications = input.medications;
        if (input.hobbies !== undefined) updatePayload.hobbies = input.hobbies;
        if (input.work_schedule !== undefined) updatePayload.work_schedule = input.work_schedule;
        if (input.meal_pattern !== undefined) updatePayload.meal_pattern = input.meal_pattern;
        if (input.caffeine_intake !== undefined) updatePayload.caffeine_intake = input.caffeine_intake;
        if (input.alcohol_intake !== undefined) updatePayload.alcohol_intake = input.alcohol_intake;
        if (input.smoking_status !== undefined) updatePayload.smoking_status = input.smoking_status;
        if (input.has_fitness_app !== undefined) updatePayload.has_fitness_app = input.has_fitness_app;
        if (input.fitness_app_name !== undefined) updatePayload.fitness_app_name = input.fitness_app_name;
        if (input.can_sync_fitness_data !== undefined) updatePayload.can_sync_fitness_data = input.can_sync_fitness_data;
        if (input.body_function_score !== undefined) updatePayload.body_function_score = parseInteger(input.body_function_score);
        if (input.ai_profile_completed !== undefined) updatePayload.ai_profile_completed = input.ai_profile_completed;
        if (input.ai_analysis_result !== undefined) updatePayload.ai_analysis_result = input.ai_analysis_result;
        if (input.ai_recommendation_plan !== undefined) updatePayload.ai_recommendation_plan = input.ai_recommendation_plan;
        if (input.ai_persona_context !== undefined) updatePayload.ai_persona_context = input.ai_persona_context;
        if (input.ai_settings !== undefined) updatePayload.ai_settings = input.ai_settings;
        if (input.metabolic_concerns !== undefined) updatePayload.metabolic_concerns = input.metabolic_concerns;

        const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        // Return updated profile
        return getProfile();

    } catch (error) {
        console.error('[Profile Action] updateProfile error:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

/**
 * Upload avatar.
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const file = formData.get('avatar') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile
        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        return { success: true, data: publicUrl };

    } catch (error) {
        console.error('[Profile Action] uploadAvatar error:', error);
        return { success: false, error: 'Failed to upload avatar' };
    }
}

/**
 * Save extended health profile data (AI profile setup).
 */
export async function saveHealthProfile(
    input: SaveHealthProfileInput
): Promise<ActionResult<any>> {
    try {
        const request = new Request('http://profile.local/api/profile/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });

        const response = await saveProfileRoute(request as Request);
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            return { success: false, error: data?.error || '保存失败' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Profile Action] saveHealthProfile error:', error);
        return { success: false, error: '保存失败' };
    }
}

/**
 * Delete account.
 */
export async function deleteAccount(): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Mark profile as deleted (soft delete)
        await supabase
            .from('profiles')
            .update({
                deleted_at: new Date().toISOString(),
                email_verified: false,
            })
            .eq('id', user.id);

        // Sign out
        await supabase.auth.signOut();

        return { success: true };

    } catch (error) {
        console.error('[Profile Action] deleteAccount error:', error);
        return { success: false, error: 'Failed to delete account' };
    }
}
