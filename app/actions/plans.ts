'use server';

/**
 * Plans Server Actions (The Brain)
 * 
 * Pure server-side functions for health plan operations.
 * No UI code, no client-side imports.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import { formatPlanForStorage, type ParsedPlan } from '@/lib/plan-parser';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

// ============================================
// Types
// ============================================

export interface PlanItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface PlanData {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    category: string;
    status: 'active' | 'completed' | 'paused';
    progress: number;
    items: PlanItem[];
    target_date: string | null;
    created_at: string;
    updated_at: string;

    // UI specific fields from DB
    difficulty?: 'easy' | 'medium' | 'hard';
    plan_type?: string;
    expected_duration_days?: number;
}

export interface CreatePlanInput {
    name: string;
    description?: string;
    category: string;
    target_date?: string;
    items?: string[];
}

export interface PlanCompletionItem {
    id: string;
    completed: boolean;
    text?: string;
}

export interface CompletePlanInput {
    planId: string;
    completionDate?: string;
    status: 'completed' | 'partial' | 'skipped' | 'archived';
    completedItems?: PlanCompletionItem[];
    notes?: string;
    feelingScore?: number;
}

export interface PlanStatsSummary {
    total_completions: number;
    completed_days: number;
    total_days: number;
    completion_rate: number;
    avg_feeling_score: number | null;
}

export interface PlanStatsData {
    total_plans: number;
    plans: Array<{
        id: string;
        title: string;
        plan_type?: string | null;
    }>;
    completions: any[];
    summary: PlanStatsSummary;
}

function parsePlanItems(plan: any): PlanItem[] {
    let items: PlanItem[] = [];
    try {
        const content = typeof plan.content === 'string'
            ? JSON.parse(plan.content)
            : plan.content || {};

        const rawItems = Array.isArray(content.items)
            ? content.items
            : Array.isArray(content.actions)
                ? content.actions
                : [];

        items = rawItems.map((item: any, index: number) => ({
            id: item.id?.toString() || `${plan.id}-${index}`,
            text: item.text || item.title || String(item),
            completed: item.completed === true || item.status === 'completed',
        }));
    } catch (e) {
        console.error('Failed to parse plan content:', e);
    }
    return items;
}

function normalizeCompletedItems(raw: any): PlanCompletionItem[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .filter(Boolean)
            .map((item: any) => ({
                id: item?.id?.toString() || '',
                completed: item?.completed === true || item?.completed === 'true',
            }))
            .filter(item => item.id);
    }
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return normalizeCompletedItems(parsed);
        } catch {
            return [];
        }
    }
    return [];
}

function applyCompletionItems(
    items: PlanItem[],
    completedItems: PlanCompletionItem[],
    planId: string
): PlanItem[] {
    if (!completedItems.length) return items;

    return items.map((item, index) => {
        const itemId = item.id?.toString() || `${planId}-${index}`;
        const matched = completedItems.find(ci => {
            const ciId = ci.id?.toString();
            return ciId === itemId ||
                ciId === `${planId}-${index}` ||
                ciId === index.toString();
        });
        const completed = matched?.completed ?? item.completed;

        return {
            ...item,
            id: itemId,
            completed: completed === true,
        };
    });
}

function mapPlanRow(plan: any): PlanData {
    const items = parsePlanItems(plan);

    return {
        id: plan.id,
        user_id: plan.user_id,
        name: plan.name || plan.title || 'Untitled',
        description: plan.description,
        category: plan.category || 'general',
        status: plan.status || 'active',
        progress: plan.progress || 0,
        items,
        target_date: plan.target_date ? dateToISO(plan.target_date) : null,
        created_at: dateToISO(plan.created_at) || new Date().toISOString(),
        updated_at: dateToISO(plan.updated_at) || new Date().toISOString(),

        difficulty: plan.difficulty,
        plan_type: plan.plan_type,
        expected_duration_days: plan.expected_duration_days
    };
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

        const plans: PlanData[] = (data || []).map(mapPlanRow);

        if (!plans.length) {
            return toSerializable({ success: true, data: plans });
        }

        const planIds = plans.map(plan => plan.id);
        const { data: completions } = await supabase
            .from('user_plan_completions')
            .select('plan_id, completed_items, completion_date')
            .eq('user_id', user.id)
            .in('plan_id', planIds)
            .order('completion_date', { ascending: false });

        const completionMap = new Map<string, PlanCompletionItem[]>();
        (completions || []).forEach((row: any) => {
            if (completionMap.has(row.plan_id)) return;
            const normalized = normalizeCompletedItems(row.completed_items);
            if (normalized.length > 0) {
                completionMap.set(row.plan_id, normalized);
            }
        });

        const mergedPlans = plans.map(plan => {
            const completionItems = completionMap.get(plan.id);
            if (!completionItems?.length) {
                // If no completions found in external table, rely on user_plans items
                // console.log(`[Plans Debug] Plan ${plan.id} has no completion records, using internal state`);
                return plan;
            }

            // console.log(`[Plans Debug] Plan ${plan.id} merging with completion record`, completionItems);
            return {
                ...plan,
                items: applyCompletionItems(plan.items, completionItems, plan.id),
            };
        });

        // console.log('[Plans Debug] getPlans returning:', mergedPlans.length, 'plans');
        return toSerializable({ success: true, data: mergedPlans });

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

        // Prepare content with items
        const itemsList = (input.items || []).map((text, index) => ({
            id: `${Date.now()}-${index}`,
            text,
            completed: false
        }));

        const content = {
            description: input.description || '',
            items: itemsList
        };

        const { data, error } = await supabase
            .from('user_plans')
            .insert({
                user_id: user.id,
                title: input.name, // For legacy NOT NULL constraint
                name: input.name,
                description: input.description || null,
                content: content,
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

        const plan: PlanData = mapPlanRow({ ...data, content });

        return toSerializable({ success: true, data: plan });

    } catch (error) {
        console.error('[Plans Action] createPlan error:', error);
        return { success: false, error: 'Failed to create plan' };
    }
}

/**
 * Create plans from AI output (ParsedPlan list).
 */
export async function createPlansFromAI(
    plans: ParsedPlan[],
    sessionId?: string
): Promise<ActionResult<PlanData[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to create a plan' };
        }

        if (!plans || plans.length === 0) {
            return { success: false, error: 'Plan list is empty' };
        }

        const formattedPlans = plans.map(plan => {
            const formatted = formatPlanForStorage(plan);
            const planType = inferPlanType(plan.content);

            return {
                user_id: user.id,
                source: 'ai_assistant',
                plan_type: planType,
                title: plan.title,
                content: {
                    description: plan.content,
                    items: formatted.items,
                    sessionId: sessionId || null,
                },
                difficulty: formatted.difficulty,
                expected_duration_days: formatted.expected_duration_days,
                status: 'active',
            };
        });

        const { data: insertedPlans, error } = await supabase
            .from('user_plans')
            .insert(formattedPlans)
            .select();

        if (error || !insertedPlans) {
            return { success: false, error: error?.message || 'Failed to save plan' };
        }

        const mapped = insertedPlans.map(mapPlanRow);
        return toSerializable({ success: true, data: mapped });

    } catch (error) {
        console.error('[Plans Action] createPlansFromAI error:', error);
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
 * Update plan completion + items, and log completion status.
 */
export async function completePlan(
    input: CompletePlanInput
): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: plan, error: planError } = await supabase
            .from('user_plans')
            .select('id, content')
            .eq('id', input.planId)
            .eq('user_id', user.id)
            .single();

        if (planError || !plan) {
            return { success: false, error: 'Plan not found' };
        }

        if (input.status === 'archived') {
            const { error } = await supabase
                .from('user_plans')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', input.planId)
                .eq('user_id', user.id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        }

        const completionDate = input.completionDate || new Date().toISOString().split('T')[0];
        const { error: completionError } = await supabase
            .from('user_plan_completions')
            .upsert({
                user_id: user.id,
                plan_id: input.planId,
                completion_date: completionDate,
                status: input.status,
                completed_items: input.completedItems || null,
                notes: input.notes || null,
                feeling_score: input.feelingScore || null,
            }, {
                onConflict: 'user_id,plan_id,completion_date',
            });

        if (completionError) {
            console.error('[Plans Debug] Completion upsert failed:', completionError);
            return { success: false, error: completionError.message };
        } else {
            // console.log('[Plans Debug] Completion upserted successfully for', input.planId);
        }

        let updateError: { message?: string } | null = null;

        try {
            const content = typeof plan.content === 'string'
                ? JSON.parse(plan.content)
                : plan.content || {};

            if (!content.items) {
                content.items = content.actions || [];
            }

            if (Array.isArray(input.completedItems)) {
                content.items = content.items.map((item: any, index: number) => {
                    const itemId = item.id?.toString() || `${input.planId}-${index}`;
                    const matched = input.completedItems?.find(ci => {
                        const ciId = ci.id?.toString();
                        return ciId === itemId ||
                            ciId === `${input.planId}-${index}` ||
                            ciId === index.toString() ||
                            ciId === item.id?.toString() ||
                            // Fallback: match by text content
                            (ci.text && item.text && ci.text.trim() === item.text.trim());
                    });

                    const itemByIndex = input.completedItems?.[index];
                    const isCompleted = matched?.completed ?? itemByIndex?.completed ?? item.completed;

                    return {
                        ...item,
                        id: itemId,
                        completed: isCompleted === true,
                        status: isCompleted ? 'completed' : 'pending',
                    };
                });
            }

            const completedCount = content.items.filter((i: any) => i.completed === true).length;
            const progress = content.items.length > 0
                ? Math.round((completedCount / content.items.length) * 100)
                : 0;

            const { error } = await supabase
                .from('user_plans')
                .update({
                    content,
                    progress,
                    updated_at: new Date().toISOString(),
                    ...(progress === 100 ? { status: 'completed' } : {}),
                })
                .eq('id', input.planId)
                .eq('user_id', user.id);

            if (error) {
                updateError = error;
            }
        } catch (error) {
            updateError = error instanceof Error ? error : { message: 'Failed to update plan content' };
        }

        if (updateError) {
            console.warn('[Plans Action] update content failed:', updateError);
        }

        return { success: true };

    } catch (error) {
        console.error('[Plans Action] completePlan error:', error);
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

/**
 * Get plan completion statistics for the current user.
 */
export async function getPlanStatsSummary(days = 30): Promise<ActionResult<PlanStatsData>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view stats' };
        }

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        const { data: plans } = await supabase
            .from('user_plans')
            .select('id, title, plan_type')
            .eq('user_id', user.id)
            .eq('status', 'active');

        if (!plans || plans.length === 0) {
            return toSerializable({
                success: true,
                data: {
                    total_plans: 0,
                    plans: [],
                    completions: [],
                    summary: {
                        total_completions: 0,
                        completed_days: 0,
                        total_days: days,
                        completion_rate: 0,
                        avg_feeling_score: null,
                    },
                },
            });
        }

        const { data: completions } = await supabase
            .from('user_plan_completions')
            .select('*')
            .eq('user_id', user.id)
            .in('plan_id', plans.map(p => p.id))
            .gte('completion_date', dateFrom.toISOString().split('T')[0])
            .order('completion_date', { ascending: false });

        const completedDays = new Set(
            completions?.filter(c => c.status === 'completed').map(c => c.completion_date)
        ).size;

        const avgFeelingScore = completions && completions.length > 0
            ? completions
                .filter(c => c.feeling_score)
                .reduce((sum, c) => sum + (c.feeling_score || 0), 0)
            / completions.filter(c => c.feeling_score).length
            : 0;

        return toSerializable({
            success: true,
            data: {
                total_plans: plans.length,
                plans: plans.map(p => ({
                    id: p.id,
                    title: p.title,
                    plan_type: p.plan_type,
                })),
                completions: completions || [],
                summary: {
                    total_completions: completions?.length || 0,
                    completed_days: completedDays,
                    total_days: days,
                    completion_rate: days > 0 ? Math.round((completedDays / days) * 100) : 0,
                    avg_feeling_score: avgFeelingScore ? Math.round(avgFeelingScore * 10) / 10 : null,
                },
            },
        });
    } catch (error) {
        console.error('[Plans Action] getPlanStatsSummary error:', error);
        return { success: false, error: 'Failed to load stats' };
    }
}

function inferPlanType(content: string): string {
    const hasExercise = /运动|健身|训练|跑步|有氧|抗阻/i.test(content);
    const hasDiet = /饮食|禁食|营养|蛋白质|碳水|脂肪/i.test(content);
    const hasSleep = /睡眠|休息|作息/i.test(content);

    const count = [hasExercise, hasDiet, hasSleep].filter(Boolean).length;

    if (count >= 2) return 'comprehensive';
    if (hasExercise) return 'exercise';
    if (hasDiet) return 'diet';
    if (hasSleep) return 'sleep';

    return 'comprehensive';
}
