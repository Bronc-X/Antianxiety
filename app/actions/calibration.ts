'use server';

/**
 * Calibration Server Actions (The Brain)
 * 
 * Pure server-side functions for daily calibration operations.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface CalibrationData {
    id: string;
    user_id: string;
    log_date: string;
    sleep_duration_minutes: number | null;
    sleep_quality: string | number | null;
    exercise_duration_minutes: number | null;
    exercise_type?: string | null;
    body_tension?: number | null;
    mental_clarity?: number | null;
    morning_energy?: number | null;
    mood_status: string | null;
    energy_level: number | null;
    stress_level: number | null;
    anxiety_level: number | null;
    overall_readiness?: number | null;
    ai_recommendation?: string | null;
    notes: string | null;
    created_at: string;
}

export interface CalibrationInput {
    sleep_duration_minutes?: number;
    sleep_quality?: string | number | null;
    exercise_duration_minutes?: number | null;
    exercise_type?: string | null;
    body_tension?: number | null;
    mental_clarity?: number | null;
    morning_energy?: number | null;
    mood_status?: string;
    energy_level?: number;
    stress_level?: number;
    anxiety_level?: number;
    overall_readiness?: number | null;
    ai_recommendation?: string | null;
    notes?: string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get today's calibration data.
 */
export async function getTodayCalibration(): Promise<ActionResult<CalibrationData | null>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_wellness_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('log_date', today)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: true, data: null };
        }

        const calibration: CalibrationData = {
            id: data.id,
            user_id: data.user_id,
            log_date: data.log_date,
            sleep_duration_minutes: data.sleep_duration_minutes,
            sleep_quality: data.sleep_quality,
            exercise_duration_minutes: data.exercise_duration_minutes,
            exercise_type: data.exercise_type,
            body_tension: data.body_tension ?? null,
            mental_clarity: data.mental_clarity ?? null,
            morning_energy: data.morning_energy,
            mood_status: data.mood_status,
            energy_level: data.energy_level,
            stress_level: data.stress_level,
            anxiety_level: data.anxiety_level,
            overall_readiness: data.overall_readiness,
            ai_recommendation: data.ai_recommendation,
            notes: data.notes,
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: calibration });

    } catch (error) {
        console.error('[Calibration Action] getTodayCalibration error:', error);
        return { success: false, error: 'Failed to load today\'s data' };
    }
}

/**
 * Save daily calibration.
 */
export async function saveCalibration(input: CalibrationInput): Promise<ActionResult<CalibrationData>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_wellness_logs')
            .upsert({
                user_id: user.id,
                log_date: today,
                ...input,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,log_date',
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        const calibration: CalibrationData = {
            id: data.id,
            user_id: data.user_id,
            log_date: data.log_date,
            sleep_duration_minutes: data.sleep_duration_minutes,
            sleep_quality: data.sleep_quality,
            exercise_duration_minutes: data.exercise_duration_minutes,
            exercise_type: data.exercise_type,
            body_tension: data.body_tension ?? null,
            mental_clarity: data.mental_clarity ?? null,
            morning_energy: data.morning_energy,
            mood_status: data.mood_status,
            energy_level: data.energy_level,
            stress_level: data.stress_level,
            anxiety_level: data.anxiety_level,
            overall_readiness: data.overall_readiness,
            ai_recommendation: data.ai_recommendation,
            notes: data.notes,
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: calibration });

    } catch (error) {
        console.error('[Calibration Action] saveCalibration error:', error);
        return { success: false, error: 'Failed to save calibration' };
    }
}

/**
 * Get calibration history.
 */
export async function getCalibrationHistory(days = 7): Promise<ActionResult<CalibrationData[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('daily_wellness_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('log_date', startDate.toISOString().split('T')[0])
            .order('log_date', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        const history: CalibrationData[] = (data || []).map(d => ({
            id: d.id,
            user_id: d.user_id,
            log_date: d.log_date,
            sleep_duration_minutes: d.sleep_duration_minutes,
            sleep_quality: d.sleep_quality,
            exercise_duration_minutes: d.exercise_duration_minutes,
            exercise_type: d.exercise_type,
            body_tension: d.body_tension ?? null,
            mental_clarity: d.mental_clarity ?? null,
            morning_energy: d.morning_energy,
            mood_status: d.mood_status,
            energy_level: d.energy_level,
            stress_level: d.stress_level,
            anxiety_level: d.anxiety_level,
            overall_readiness: d.overall_readiness,
            ai_recommendation: d.ai_recommendation,
            notes: d.notes,
            created_at: dateToISO(d.created_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: history });

    } catch (error) {
        console.error('[Calibration Action] getCalibrationHistory error:', error);
        return { success: false, error: 'Failed to load history' };
    }
}
