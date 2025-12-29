'use server';

/**
 * Assessment Server Actions (The Brain)
 * 
 * Pure server-side functions for clinical assessment/scales.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface AssessmentType {
    id: string;
    name: string;
    name_zh: string;
    description: string;
    category: string;
    question_count: number;
    estimated_minutes: number;
}

export interface AssessmentQuestion {
    id: string;
    order: number;
    text: string;
    text_zh: string;
    type: 'scale' | 'choice' | 'text';
    options?: { value: number; label: string; label_zh: string }[];
    min_value?: number;
    max_value?: number;
}

export interface AssessmentResult {
    id: string;
    assessment_type_id: string;
    user_id: string;
    score: number;
    max_score: number;
    severity_level: 'minimal' | 'mild' | 'moderate' | 'severe';
    interpretation: string;
    interpretation_zh: string;
    completed_at: string;
}

export interface AssessmentResponse {
    question_id: string;
    value: number | string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get available assessment types.
 */
export async function getAssessmentTypes(): Promise<ActionResult<AssessmentType[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data, error } = await supabase
            .from('assessment_types')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            // Table might not exist
            console.warn('[Assessment Action] getAssessmentTypes error:', error);

            // Return default assessment types
            const defaults: AssessmentType[] = [
                { id: 'phq9', name: 'PHQ-9', name_zh: '抑郁症筛查量表', description: 'Depression screening', category: 'mental', question_count: 9, estimated_minutes: 5 },
                { id: 'gad7', name: 'GAD-7', name_zh: '焦虑症筛查量表', description: 'Anxiety screening', category: 'mental', question_count: 7, estimated_minutes: 3 },
                { id: 'psqi', name: 'PSQI', name_zh: '匹兹堡睡眠质量指数', description: 'Sleep quality', category: 'sleep', question_count: 19, estimated_minutes: 10 },
                { id: 'pss10', name: 'PSS-10', name_zh: '知觉压力量表', description: 'Perceived stress', category: 'stress', question_count: 10, estimated_minutes: 5 },
            ];

            return { success: true, data: defaults };
        }

        const types: AssessmentType[] = (data || []).map(t => ({
            id: t.id,
            name: t.name,
            name_zh: t.name_zh || t.name,
            description: t.description || '',
            category: t.category || 'general',
            question_count: t.question_count || 10,
            estimated_minutes: t.estimated_minutes || 5,
        }));

        return toSerializable({ success: true, data: types });

    } catch (error) {
        console.error('[Assessment Action] getAssessmentTypes error:', error);
        return { success: false, error: 'Failed to load assessments' };
    }
}

/**
 * Get questions for an assessment.
 */
export async function getAssessmentQuestions(
    assessmentTypeId: string
): Promise<ActionResult<AssessmentQuestion[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data, error } = await supabase
            .from('assessment_questions')
            .select('*')
            .eq('assessment_type_id', assessmentTypeId)
            .order('order', { ascending: true });

        if (error) {
            console.warn('[Assessment Action] getAssessmentQuestions error:', error);
            return { success: true, data: [] };
        }

        const questions: AssessmentQuestion[] = (data || []).map(q => ({
            id: q.id,
            order: q.order,
            text: q.text,
            text_zh: q.text_zh || q.text,
            type: q.type || 'scale',
            options: q.options,
            min_value: q.min_value,
            max_value: q.max_value,
        }));

        return toSerializable({ success: true, data: questions });

    } catch (error) {
        console.error('[Assessment Action] getAssessmentQuestions error:', error);
        return { success: false, error: 'Failed to load questions' };
    }
}

/**
 * Submit assessment responses.
 */
export async function submitAssessment(
    assessmentTypeId: string,
    responses: AssessmentResponse[]
): Promise<ActionResult<AssessmentResult>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Calculate score
        const score = responses.reduce((sum, r) => {
            return sum + (typeof r.value === 'number' ? r.value : 0);
        }, 0);

        // Determine severity (PHQ-9 / GAD-7 style scoring)
        let severity: AssessmentResult['severity_level'] = 'minimal';
        let interpretation = '';
        let interpretation_zh = '';

        const maxScore = responses.length * 3; // Assuming 0-3 scale

        const percentage = score / maxScore;
        if (percentage >= 0.7) {
            severity = 'severe';
            interpretation = 'Your score indicates severe symptoms. Professional support is recommended.';
            interpretation_zh = '您的分数表明症状较重。建议寻求专业支持。';
        } else if (percentage >= 0.5) {
            severity = 'moderate';
            interpretation = 'Your score indicates moderate symptoms. Consider consulting a professional.';
            interpretation_zh = '您的分数表明症状处于中等水平。建议咨询专业人士。';
        } else if (percentage >= 0.25) {
            severity = 'mild';
            interpretation = 'Your score indicates mild symptoms. Self-care strategies may help.';
            interpretation_zh = '您的分数表明症状较轻。自我调节可能会有所帮助。';
        } else {
            severity = 'minimal';
            interpretation = 'Your score indicates minimal symptoms. Keep up your healthy habits!';
            interpretation_zh = '您的分数表明症状极轻。请继续保持健康的生活习惯！';
        }

        // Save result
        const { data, error } = await supabase
            .from('assessment_results')
            .insert({
                user_id: user.id,
                assessment_type_id: assessmentTypeId,
                score,
                max_score: maxScore,
                severity_level: severity,
                interpretation,
                interpretation_zh,
                responses,
                completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            // If table doesn't exist, return calculated result anyway
            const result: AssessmentResult = {
                id: 'temp-' + Date.now(),
                assessment_type_id: assessmentTypeId,
                user_id: user.id,
                score,
                max_score: maxScore,
                severity_level: severity,
                interpretation,
                interpretation_zh,
                completed_at: new Date().toISOString(),
            };

            return toSerializable({ success: true, data: result });
        }

        const result: AssessmentResult = {
            id: data.id,
            assessment_type_id: data.assessment_type_id,
            user_id: data.user_id,
            score: data.score,
            max_score: data.max_score,
            severity_level: data.severity_level,
            interpretation: data.interpretation,
            interpretation_zh: data.interpretation_zh,
            completed_at: dateToISO(data.completed_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: result });

    } catch (error) {
        console.error('[Assessment Action] submitAssessment error:', error);
        return { success: false, error: 'Failed to submit assessment' };
    }
}

/**
 * Get assessment history.
 */
export async function getAssessmentHistory(
    assessmentTypeId?: string
): Promise<ActionResult<AssessmentResult[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        let query = supabase
            .from('assessment_results')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

        if (assessmentTypeId) {
            query = query.eq('assessment_type_id', assessmentTypeId);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.warn('[Assessment Action] getAssessmentHistory error:', error);
            return { success: true, data: [] };
        }

        const results: AssessmentResult[] = (data || []).map(r => ({
            id: r.id,
            assessment_type_id: r.assessment_type_id,
            user_id: r.user_id,
            score: r.score,
            max_score: r.max_score,
            severity_level: r.severity_level,
            interpretation: r.interpretation,
            interpretation_zh: r.interpretation_zh,
            completed_at: dateToISO(r.completed_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: results });

    } catch (error) {
        console.error('[Assessment Action] getAssessmentHistory error:', error);
        return { success: false, error: 'Failed to load history' };
    }
}
