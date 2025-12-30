'use server';

/**
 * Plans Server Actions (The Brain)
 * 
 * Pure server-side functions for health plan operations.
 * No UI code, no client-side imports.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface PlanData {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    category: string;
    status: 'active' | 'completed' | 'paused';
    progress: number;
    target_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreatePlanInput {
    name: string;
    description?: string;
    category: string;
    target_date?: string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get all plans for the current user.
 */
export async function getPlans(): Promise<ActionResult<PlanData[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view your plans' };
        }

        const { data, error } = await supabase
            .from('user_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        const plans: PlanData[] = (data || []).map(plan => ({
            id: plan.id,
            user_id: plan.user_id,
            name: plan.name || plan.title || 'Untitled',
            description: plan.description,
            category: plan.category || 'general',
            status: plan.status || 'active',
            progress: plan.progress || 0,
            target_date: plan.target_date ? dateToISO(plan.target_date) : null,
            created_at: dateToISO(plan.created_at) || new Date().toISOString(),
            updated_at: dateToISO(plan.updated_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: plans });

    } catch (error) {
        console.error('[Plans Action] getPlans error:', error);
        return { success: false, error: 'Failed to load plans' };
    }
}

/**
 * Create a new plan.
 */
export async function createPlan(input: CreatePlanInput): Promise<ActionResult<PlanData>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to create a plan' };
        }

        const { data, error } = await supabase
            .from('user_plans')
            .insert({
                user_id: user.id,
                title: input.name, // For legacy NOT NULL constraint
                name: input.name,
                description: input.description || null,
                content: { text: input.description || '' }, // content is jsonb type
                category: input.category,
                target_date: input.target_date || null,
                status: 'active',
                progress: 0,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        const plan: PlanData = {
            id: data.id,
            user_id: data.user_id,
            name: data.name || data.title || 'Untitled',
            description: data.description,
            category: data.category || 'general',
            status: data.status || 'active',
            progress: data.progress || 0,
            target_date: data.target_date ? dateToISO(data.target_date) : null,
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
            updated_at: dateToISO(data.updated_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: plan });

    } catch (error) {
        console.error('[Plans Action] createPlan error:', error);
        return { success: false, error: 'Failed to create plan' };
    }
}

/**
 * Update plan status.
 */
export async function updatePlanStatus(
    planId: string,
    status: 'active' | 'completed' | 'paused'
): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { error } = await supabase
            .from('user_plans')
            .update({
                status,
                updated_at: new Date().toISOString(),
                ...(status === 'completed' ? { progress: 100 } : {})
            })
            .eq('id', planId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error('[Plans Action] updatePlanStatus error:', error);
        return { success: false, error: 'Failed to update plan' };
    }
}

/**
 * Delete a plan.
 */
export async function deletePlan(planId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { error } = await supabase
            .from('user_plans')
            .delete()
            .eq('id', planId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error('[Plans Action] deletePlan error:', error);
        return { success: false, error: 'Failed to delete plan' };
    }
}
