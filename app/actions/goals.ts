'use server';

/**
 * Goals Server Actions (The Brain)
 * 
 * Pure server-side functions for phase goals operations.
 * No UI code, no client-side imports.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface PhaseGoal {
    id: string;
    user_id: string;
    goal_text: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    target_date: string | null;
    progress: number;
    is_completed: boolean;
    created_at: string;
}

export interface CreateGoalInput {
    goal_text: string;
    category: string;
    priority?: 'high' | 'medium' | 'low';
    target_date?: string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get all goals for the current user.
 */
export async function getGoals(): Promise<ActionResult<PhaseGoal[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view your goals' };
        }

        const { data, error } = await supabase
            .from('phase_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        const goals: PhaseGoal[] = (data || []).map(goal => ({
            id: goal.id,
            user_id: goal.user_id,
            goal_text: goal.goal_text,
            category: goal.category || 'general',
            priority: goal.priority || 'medium',
            target_date: goal.target_date ? dateToISO(goal.target_date) : null,
            progress: goal.progress || 0,
            is_completed: goal.is_completed || false,
            created_at: dateToISO(goal.created_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: goals });

    } catch (error) {
        console.error('[Goals Action] getGoals error:', error);
        return { success: false, error: 'Failed to load goals' };
    }
}

/**
 * Create a new goal.
 */
export async function createGoal(input: CreateGoalInput): Promise<ActionResult<PhaseGoal>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to create a goal' };
        }

        const { data, error } = await supabase
            .from('phase_goals')
            .insert({
                user_id: user.id,
                goal_text: input.goal_text,
                category: input.category,
                priority: input.priority || 'medium',
                target_date: input.target_date || null,
                progress: 0,
                is_completed: false,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        const goal: PhaseGoal = {
            id: data.id,
            user_id: data.user_id,
            goal_text: data.goal_text,
            category: data.category || 'general',
            priority: data.priority || 'medium',
            target_date: data.target_date ? dateToISO(data.target_date) : null,
            progress: data.progress || 0,
            is_completed: data.is_completed || false,
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: goal });

    } catch (error) {
        console.error('[Goals Action] createGoal error:', error);
        return { success: false, error: 'Failed to create goal' };
    }
}

/**
 * Toggle goal completion status.
 */
export async function toggleGoalComplete(goalId: string): Promise<ActionResult<PhaseGoal>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Get current state
        const { data: current, error: fetchError } = await supabase
            .from('phase_goals')
            .select('is_completed')
            .eq('id', goalId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !current) {
            return { success: false, error: 'Goal not found' };
        }

        const newCompleted = !current.is_completed;

        const { data, error } = await supabase
            .from('phase_goals')
            .update({
                is_completed: newCompleted,
                progress: newCompleted ? 100 : 0,
            })
            .eq('id', goalId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        const goal: PhaseGoal = {
            id: data.id,
            user_id: data.user_id,
            goal_text: data.goal_text,
            category: data.category || 'general',
            priority: data.priority || 'medium',
            target_date: data.target_date ? dateToISO(data.target_date) : null,
            progress: data.progress || 0,
            is_completed: data.is_completed || false,
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: goal });

    } catch (error) {
        console.error('[Goals Action] toggleGoalComplete error:', error);
        return { success: false, error: 'Failed to update goal' };
    }
}

/**
 * Delete a goal.
 */
export async function deleteGoal(goalId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { error } = await supabase
            .from('phase_goals')
            .delete()
            .eq('id', goalId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error('[Goals Action] deleteGoal error:', error);
        return { success: false, error: 'Failed to delete goal' };
    }
}
