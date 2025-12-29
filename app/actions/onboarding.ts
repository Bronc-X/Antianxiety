'use server';

/**
 * Onboarding Server Actions (The Brain)
 * 
 * Pure server-side functions for onboarding flow.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

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
        if (data.first_name) updatePayload.first_name = data.first_name;
        if (data.age) updatePayload.age = data.age;
        if (data.gender) updatePayload.gender = data.gender;
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
