/**
 * Daily Calibration Integration
 * 
 * Bridges the clinical scales library with the UnifiedDailyCalibration component.
 * Handles:
 * - Question generation from clinical scales
 * - Response storage to user_scale_responses
 * - Stability calculation and frequency adaptation
 * - Trigger detection for full scales
 * - Safety system integration
 */

import { createClient } from '@/lib/supabase-client';
import {
    getDailyQuestions,
    calculateDailyIndex,
    GAD2_TRIGGER_THRESHOLD,
    shouldTriggerFullGAD7,
    checkSafetyTrigger,
    logSafetyEvent,
} from '@/lib/clinical-scales';
import { getSleepDurationScore } from '@/lib/clinical-scales/daily-questions';
import {
    calculateDailyStability,
    fetchUserStabilityData,
    updateUserFrequency,
    type StabilityResult,
} from './stability-calculator';

export interface DailyCalibrationQuestion {
    id: string;
    text: string;
    type: 'single' | 'slider';
    category: 'anxiety' | 'sleep' | 'stress' | 'ai_pick';
    options?: { value: number; label: string }[];
    min?: number;
    max?: number;
    isSafetyQuestion?: boolean;
}

export interface DailyCalibrationResult {
    dailyIndex: number;
    gad2Score: number;
    sleepDurationScore: number;
    sleepQualityScore: number;
    stressScore: number;
    triggerFullScale: 'GAD7' | 'PHQ9' | null;
    safetyTriggered: boolean;
    stability: StabilityResult | null;
}

/**
 * Get daily calibration questions
 * Returns 5 fixed questions from clinical scales
 */
export function getDailyCalibrationQuestions(): DailyCalibrationQuestion[] {
    const clinicalQuestions = getDailyQuestions();

    return clinicalQuestions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.options ? 'single' : 'slider',
        category: q.category,
        options: q.options,
        min: (q as any).min,
        max: (q as any).max,
        isSafetyQuestion: q.isSafetyQuestion,
    }));
}

/**
 * Save daily calibration responses to database
 */
export async function saveDailyCalibrationResponses(
    userId: string,
    responses: Record<string, number>
): Promise<void> {
    const supabase = createClient();
    const now = new Date();
    const responseDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const records = Object.entries(responses).map(([questionId, value]) => ({
        user_id: userId,
        scale_id: 'DAILY',
        question_id: questionId,
        answer_value: value,
        source: 'daily',
        response_date: responseDate,
        created_at: now.toISOString(),
    }));

    await supabase
        .from('user_scale_responses')
        .upsert(records, {
            onConflict: 'user_id,scale_id,question_id,response_date',
            ignoreDuplicates: false,
        });
}

/**
 * Process daily calibration responses
 * Returns result with scores, triggers, and stability
 */
export async function processDailyCalibration(
    userId: string,
    responses: Record<string, number>
): Promise<DailyCalibrationResult> {
    // Save responses
    await saveDailyCalibrationResponses(userId, responses);

    // Calculate scores
    const gad2Score = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    const sleepDurationScore = getSleepDurationScore(responses['daily_sleep_duration'] ?? 0);
    const sleepQualityScore = responses['daily_sleep_quality'] || 0;
    const stressScore = responses['daily_stress_level'] || 0;

    const dailyIndex = calculateDailyIndex(responses);

    // Check for triggers
    let triggerFullScale: 'GAD7' | 'PHQ9' | null = null;
    if (shouldTriggerFullGAD7(gad2Score)) {
        triggerFullScale = 'GAD7';
        await logScaleTrigger(userId, 'GAD2', gad2Score, 'GAD7');
    }

    // Check for safety triggers (PHQ-9 Q9 won't be in daily, but check anyway)
    const safetyTriggered = Object.entries(responses).some(
        ([qId, value]) => checkSafetyTrigger(qId, value)
    );

    if (safetyTriggered) {
        await logSafetyEvent(userId, 'daily_calibration', 1);
    }

    // Calculate stability
    const { dailyResponses, consecutiveStableDays } = await fetchUserStabilityData(userId);
    const stability = calculateDailyStability(dailyResponses, consecutiveStableDays);

    // Update frequency if needed
    await updateUserFrequency(userId, stability);

    // Update profile
    const supabase = createClient();
    await supabase
        .from('profiles')
        .update({
            last_daily_calibration: new Date().toISOString(),
            daily_stability_streak: stability.consecutiveStableDays,
        })
        .eq('id', userId);

    return {
        dailyIndex,
        gad2Score,
        sleepDurationScore,
        sleepQualityScore,
        stressScore,
        triggerFullScale,
        safetyTriggered,
        stability,
    };
}

/**
 * Log when a short scale triggers a full scale
 */
async function logScaleTrigger(
    userId: string,
    shortScale: string,
    shortScore: number,
    fullScale: string
): Promise<void> {
    const supabase = createClient();

    await supabase.from('scale_trigger_logs').insert({
        user_id: userId,
        short_scale: shortScale,
        short_score: shortScore,
        triggered_full_scale: fullScale,
        trigger_reason: `score >= ${GAD2_TRIGGER_THRESHOLD}`,
        confidence: 0.85,
    });
}

/**
 * Get user's current calibration frequency
 */
export async function getUserCalibrationFrequency(userId: string): Promise<{
    dailyFrequency: 'daily' | 'every_other_day';
    weeklyFrequency: 'weekly' | 'biweekly';
    nextDailyDate: Date;
    frequencyReason?: string;
}> {
    const supabase = createClient();

    const { data: prefs } = await supabase
        .from('user_assessment_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    const { data: profile } = await supabase
        .from('profiles')
        .select('last_daily_calibration')
        .eq('id', userId)
        .single();

    const dailyFrequency = (prefs?.daily_frequency as 'daily' | 'every_other_day') || 'daily';
    const weeklyFrequency = (prefs?.weekly_frequency as 'weekly' | 'biweekly') || 'weekly';

    // Calculate next daily date
    const lastDaily = profile?.last_daily_calibration
        ? new Date(profile.last_daily_calibration)
        : new Date(0);

    const nextDailyDate = new Date(lastDaily);
    if (dailyFrequency === 'daily') {
        nextDailyDate.setDate(nextDailyDate.getDate() + 1);
    } else {
        nextDailyDate.setDate(nextDailyDate.getDate() + 2);
    }

    return {
        dailyFrequency,
        weeklyFrequency,
        nextDailyDate,
        frequencyReason: prefs?.daily_frequency_reason,
    };
}

/**
 * Check if user should do calibration today
 */
export async function shouldCalibrateToday(userId: string): Promise<boolean> {
    const { dailyFrequency, nextDailyDate } = await getUserCalibrationFrequency(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDailyDate.setHours(0, 0, 0, 0);

    return today >= nextDailyDate;
}

/**
 * Reset user to daily frequency (user-initiated)
 */
export async function resetToDailyFrequency(userId: string): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            daily_frequency: 'daily',
            daily_frequency_reason: 'user_choice',
            last_frequency_change: new Date().toISOString(),
        }, {
            onConflict: 'user_id',
        });

    await supabase
        .from('profiles')
        .update({ daily_stability_streak: 0 })
        .eq('id', userId);
}
