'use server';

/**
 * Onboarding Server Actions (The Brain)
 * 
 * Pure server-side functions for onboarding flow.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import { POST as recommendGoalsRoute } from '@/app/api/onboarding/recommend-goals/route';
import { POST as modifyGoalRoute } from '@/app/api/onboarding/modify-goal/route';

// ============================================
// Types
// ============================================

export interface OnboardingProgress {
    current_step: number;
    total_steps: number;
    completed_steps: string[];
    is_complete: boolean;
}

export interface OnboardingData {
    // Step 1: Basic Info
    first_name?: string;
    age?: number;
    gender?: string;

    // Step 2: Health Goals
    primary_goal?: string;
    secondary_goals?: string[];

    // Step 3: Current State
    sleep_quality?: number;
    stress_level?: number;
    energy_level?: number;

    // Step 4: Lifestyle
    exercise_frequency?: string;
    diet_type?: string;
    work_hours?: number;

    // Step 5: Preferences
    notification_time?: string;
    language?: string;
    ai_personality?: string;

    // Additional Profile Data (Step 4/4 in UI)
    height?: number;
    weight?: number;
}

export interface ClinicalAssessmentResult {
    gad7Score: number;
    phq9Score: number;
    isiScore: number;
    interpretations: {
        anxiety: string;
        depression: string;
        insomnia: string;
    };
    answers: Record<string, number>;
    onboardingResult: {
        gad7Score: number;
        phq9Score: number;
        isiScore: number;
        safetyTriggered: boolean;
        interpretations: {
            anxiety: string;
            depression: string;
            insomnia: string;
        };
    }
}

type OnboardingPayload = {
    error?: string;
} & Record<string, unknown>;

function parseJsonResponse(response: Response): Promise<unknown> {
    return response.text().then(raw => {
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    });
}

// ============================================
// Server Actions
// ============================================

/**
 * Get onboarding progress.
 */
export async function getOnboardingProgress(): Promise<ActionResult<OnboardingProgress>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_step, onboarding_completed_steps, onboarding_complete')
            .eq('id', user.id)
            .single();

        const progress: OnboardingProgress = {
            current_step: profile?.onboarding_step || 1,
            total_steps: 5,
            completed_steps: profile?.onboarding_completed_steps || [],
            is_complete: profile?.onboarding_complete || false,
        };

        return toSerializable({ success: true, data: progress });

    } catch (error) {
        console.error('[Onboarding Action] getOnboardingProgress error:', error);
        return { success: false, error: 'Failed to load progress' };
    }
}

/**
 * Save onboarding step data.
 */
export async function saveOnboardingStep(
    step: number,
    data: Partial<OnboardingData>
): Promise<ActionResult<OnboardingProgress>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Get current progress
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed_steps')
            .eq('id', user.id)
            .single();

        const completedSteps = profile?.onboarding_completed_steps || [];
        const stepKey = `step_${step}`;
        if (!completedSteps.includes(stepKey)) {
            completedSteps.push(stepKey);
        }

        // Build update payload
        const updatePayload: Record<string, unknown> = {
            onboarding_step: step + 1,
            onboarding_completed_steps: completedSteps,
            updated_at: new Date().toISOString(),
        };

        // Map data to profile fields
        if (data.first_name) {
            updatePayload.first_name = data.first_name;
            // Also update full_name if available (often mapped loosely)
            updatePayload.full_name = data.first_name;
        }
        if (data.age) updatePayload.age = data.age;
        if (data.gender) updatePayload.gender = data.gender;
        if (data.height) updatePayload.height = data.height; // New field
        if (data.weight) updatePayload.weight = data.weight; // New field

        if (data.primary_goal) updatePayload.primary_goal = data.primary_goal;
        if (data.sleep_quality) updatePayload.sleep_quality_baseline = data.sleep_quality;
        if (data.stress_level) updatePayload.stress_level_baseline = data.stress_level;
        if (data.energy_level) updatePayload.energy_level_baseline = data.energy_level;
        if (data.exercise_frequency) updatePayload.exercise_frequency = data.exercise_frequency;
        if (data.language) updatePayload.preferred_language = data.language;
        if (data.ai_personality) updatePayload.ai_personality = data.ai_personality;

        // Check if onboarding is complete
        const isComplete = step >= 5;
        if (isComplete) {
            updatePayload.onboarding_complete = true;
        }

        await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id);

        const newProgress: OnboardingProgress = {
            current_step: step + 1,
            total_steps: 5,
            completed_steps: completedSteps,
            is_complete: isComplete,
        };

        return toSerializable({ success: true, data: newProgress });

    } catch (error) {
        console.error('[Onboarding Action] saveOnboardingStep error:', error);
        return { success: false, error: 'Failed to save step' };
    }
}

/**
 * Skip onboarding.
 */
export async function skipOnboarding(): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        await supabase
            .from('profiles')
            .update({
                onboarding_complete: true,
                onboarding_skipped: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        return { success: true };

    } catch (error) {
        console.error('[Onboarding Action] skipOnboarding error:', error);
        return { success: false, error: 'Failed to skip onboarding' };
    }
}

/**
 * Reset onboarding (for re-onboarding).
 */
export async function resetOnboarding(): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        await supabase
            .from('profiles')
            .update({
                onboarding_step: 1,
                onboarding_completed_steps: [],
                onboarding_complete: false,
                onboarding_skipped: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        return { success: true };

    } catch (error) {
        console.error('[Onboarding Action] resetOnboarding error:', error);
        return { success: false, error: 'Failed to reset onboarding' };
    }
}

/**
 * Recommend phase goals based on onboarding answers.
 */
export async function recommendGoals(
    answers: Record<string, string>
): Promise<ActionResult<unknown>> {
    try {
        const request = new Request('http://onboarding.local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
        });

        const response = await recommendGoalsRoute(request as Request);
        const data = await parseJsonResponse(response);
        const payload = typeof data === 'object' && data !== null ? (data as OnboardingPayload) : null;

        if (!response.ok) {
            return { success: false, error: payload?.error || 'Failed to recommend goals' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Onboarding Action] recommendGoals error:', error);
        return { success: false, error: 'Failed to recommend goals' };
    }
}

/**
 * Explain or confirm a modified goal.
 */
export async function modifyGoal(
    payload: { goalId: string; action: 'explain' | 'confirm'; newGoalType?: string; newTitle?: string }
): Promise<ActionResult<unknown>> {
    try {
        const request = new Request('http://onboarding.local/modify-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const response = await modifyGoalRoute(request as Request);
        const data = await parseJsonResponse(response);
        const payloadData = typeof data === 'object' && data !== null ? (data as OnboardingPayload) : null;

        if (!response.ok) {
            return { success: false, error: payloadData?.error || 'Failed to modify goal' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Onboarding Action] modifyGoal error:', error);
        return { success: false, error: 'Failed to modify goal' };
    }
}

/**
 * Save clinical assessment results.
 */
export async function saveClinicalAssessment(
    userId: string,
    result: ClinicalAssessmentResult
): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();
        const now = new Date().toISOString();

        // 1. Save all responses to user_scale_responses
        // We need to map answers (record) to records
        // Note: In server action we might need to know the scale IDs.
        // For simplicity, we accept that the client logic grouped them or we infer?
        // Actually, the original code had SCALES_ORDER and ALL_QUESTIONS available.
        // We can pass the prepared records from the client or reconstruct here.
        // To be safe and "dumb client", the client should pass structured answer data?
        // Or we pass the raw map and look up scale info?
        // Let's rely on the answer map and just save generic records if we don't have scale metadata here.
        // Actually, let's keep it simple: client prepares the records? No, Brain should handle persistence logic.
        // We will infer scale ID based on Question ID convention (GAD7_1, PHQ9_1 etc) if possible,
        // OR we just take the answers map and save.

        // Let's assume quesiton IDs contain scale prefix or we map them.
        // GAD7_x, PHQ9_x, ISI_x.

        const records = Object.entries(result.answers).map(([questionId, answerValue]) => {
            let scaleId = 'UNKNOWN';
            if (questionId.startsWith('GAD7')) scaleId = 'GAD7';
            else if (questionId.startsWith('PHQ9')) scaleId = 'PHQ9';
            else if (questionId.startsWith('ISI')) scaleId = 'ISI';

            return {
                user_id: userId,
                scale_id: scaleId,
                question_id: questionId,
                answer_value: answerValue,
                source: 'onboarding',
                created_at: now,
            };
        });

        const { error: insertError } = await supabase.from('user_scale_responses').insert(records);
        if (insertError) throw insertError;

        // 2. Update profiles
        await supabase
            .from('profiles')
            .update({
                inferred_scale_scores: {
                    GAD7: { score: result.gad7Score, interpretation: result.interpretations.anxiety, updatedAt: now },
                    PHQ9: { score: result.phq9Score, interpretation: result.interpretations.depression, updatedAt: now },
                    ISI: { score: result.isiScore, interpretation: result.interpretations.insomnia, updatedAt: now },
                },
                metabolic_profile: {
                    completed: true,
                    completedAt: now,
                    gad7Score: result.gad7Score,
                    phq9Score: result.phq9Score,
                    isiScore: result.isiScore,
                    interpretations: result.interpretations,
                },
            })
            .eq('id', userId);

        return { success: true };

    } catch (error) {
        console.error('[Onboarding Action] saveClinicalAssessment error:', error);
        return { success: false, error: 'Failed to save clinical assessment' };
    }
}
