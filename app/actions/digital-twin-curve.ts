/**
 * Digital Twin Curve Server Actions
 * 
 * Server-side actions for generating Digital Twin curve data
 * 
 * @module app/actions/digital-twin-curve
 */

'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aggregateUserData } from '@/lib/digital-twin/data-aggregator';
import { generateCurveOutput } from '@/lib/digital-twin/curve-output-generator';
import type { DigitalTwinCurveOutput } from '@/types/digital-twin-curve';

// ============================================
// Server Action Types
// ============================================

export interface GenerateCurveResult {
    success: boolean;
    data?: DigitalTwinCurveOutput;
    error?: string;
    status?: 'no_baseline' | 'error';
}

// ============================================
// Server Actions
// ============================================

/**
 * Generate Digital Twin curve output for authenticated user
 */
export async function generateDigitalTwinCurve(
    conversationTrend?: 'improving' | 'stable' | 'declining' | null
): Promise<GenerateCurveResult> {
    try {
        const supabase = await createServerSupabaseClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return {
                success: false,
                error: '请先登录',
                status: 'error',
            };
        }

        // Aggregate user data
        const userData = await aggregateUserData(user.id);

        // Check for baseline data
        if (!userData.baseline) {
            return {
                success: false,
                error: '未找到基线数据，请先完成入门评估',
                status: 'no_baseline',
            };
        }

        // Generate curve output
        const curveOutput = generateCurveOutput(userData, conversationTrend ?? null);

        return {
            success: true,
            data: curveOutput,
        };

    } catch (error) {
        console.error('❌ generateDigitalTwinCurve error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '生成曲线时出现问题',
            status: 'error',
        };
    }
}

/**
 * Get current curve meta without full generation
 * Useful for checking data readiness
 */
export async function getDigitalTwinCurveMeta(): Promise<{
    hasBaseline: boolean;
    calibrationCount: number;
    daysSinceBaseline: number | null;
    currentWeek: number | null;
    isReady: boolean;
}> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return {
                hasBaseline: false,
                calibrationCount: 0,
                daysSinceBaseline: null,
                currentWeek: null,
                isReady: false,
            };
        }

        // Get baseline info
        const { data: profile } = await supabase
            .from('profiles')
            .select('inferred_scale_scores, created_at')
            .eq('id', user.id)
            .single();

        const hasBaseline = !!(profile?.inferred_scale_scores);

        // Get calibration count
        const { count } = await supabase
            .from('daily_calibrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const calibrationCount = count || 0;

        // Calculate days since baseline
        let daysSinceBaseline: number | null = null;
        let currentWeek: number | null = null;

        if (profile?.created_at) {
            const baselineDate = new Date(profile.created_at);
            const now = new Date();
            daysSinceBaseline = Math.floor((now.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24));
            currentWeek = Math.floor(daysSinceBaseline / 7);
        }

        return {
            hasBaseline,
            calibrationCount,
            daysSinceBaseline,
            currentWeek,
            isReady: hasBaseline && calibrationCount >= 3,
        };

    } catch {
        return {
            hasBaseline: false,
            calibrationCount: 0,
            daysSinceBaseline: null,
            currentWeek: null,
            isReady: false,
        };
    }
}
