'use server';

/**
 * Analysis Server Actions (The Brain)
 * 
 * Pure server-side functions for health analysis/reports.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface AnalysisReport {
    id: string;
    user_id: string;
    report_type: 'weekly' | 'monthly' | 'quarterly';
    period_start: string;
    period_end: string;
    summary: string;
    summary_zh: string;
    insights: AnalysisInsight[];
    metrics: AnalysisMetrics;
    recommendations: string[];
    created_at: string;
}

export interface AnalysisInsight {
    id: string;
    category: string;
    title: string;
    title_zh: string;
    description: string;
    description_zh: string;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
}

export interface AnalysisMetrics {
    sleep_avg: number;
    sleep_trend: number;
    stress_avg: number;
    stress_trend: number;
    mood_avg: number;
    mood_trend: number;
    energy_avg: number;
    energy_trend: number;
    activity_days: number;
}

export interface TrendData {
    date: string;
    sleep: number | null;
    stress: number | null;
    mood: number | null;
    energy: number | null;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get latest analysis report.
 */
export async function getLatestAnalysis(): Promise<ActionResult<AnalysisReport | null>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data, error } = await supabase
            .from('analysis_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.warn('[Analysis Action] getLatestAnalysis error:', error);
            return { success: true, data: null };
        }

        const report: AnalysisReport = {
            id: data.id,
            user_id: data.user_id,
            report_type: data.report_type || 'weekly',
            period_start: data.period_start,
            period_end: data.period_end,
            summary: data.summary || '',
            summary_zh: data.summary_zh || data.summary || '',
            insights: data.insights || [],
            metrics: data.metrics || {},
            recommendations: data.recommendations || [],
            created_at: dateToISO(data.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: report });

    } catch (error) {
        console.error('[Analysis Action] getLatestAnalysis error:', error);
        return { success: false, error: 'Failed to load analysis' };
    }
}

/**
 * Get trend data for charts.
 */
export async function getTrendData(days = 30): Promise<ActionResult<TrendData[]>> {
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
            .select('log_date, sleep_quality, stress_level, mood_status, energy_level')
            .eq('user_id', user.id)
            .gte('log_date', startDate.toISOString().split('T')[0])
            .order('log_date', { ascending: true });

        if (error) {
            console.warn('[Analysis Action] getTrendData error:', error);
            return { success: true, data: [] };
        }

        const trends: TrendData[] = (data || []).map(d => ({
            date: d.log_date,
            sleep: d.sleep_quality,
            stress: d.stress_level,
            mood: typeof d.mood_status === 'number' ? d.mood_status : null,
            energy: d.energy_level,
        }));

        return toSerializable({ success: true, data: trends });

    } catch (error) {
        console.error('[Analysis Action] getTrendData error:', error);
        return { success: false, error: 'Failed to load trends' };
    }
}

/**
 * Generate new analysis.
 */
export async function generateAnalysis(
    reportType: 'weekly' | 'monthly' = 'weekly'
): Promise<ActionResult<AnalysisReport>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (reportType === 'weekly' ? 7 : 30));

        // Get wellness data for period
        const { data: wellnessData } = await supabase
            .from('daily_wellness_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('log_date', startDate.toISOString().split('T')[0])
            .lte('log_date', endDate.toISOString().split('T')[0]);

        const logs = wellnessData || [];

        // Calculate metrics
        const metrics: AnalysisMetrics = {
            sleep_avg: logs.length ? logs.reduce((s, l) => s + (l.sleep_quality || 0), 0) / logs.length : 0,
            sleep_trend: 0,
            stress_avg: logs.length ? logs.reduce((s, l) => s + (l.stress_level || 0), 0) / logs.length : 0,
            stress_trend: 0,
            mood_avg: logs.length ? logs.reduce((s, l) => s + (l.mood_status || 0), 0) / logs.length : 0,
            mood_trend: 0,
            energy_avg: logs.length ? logs.reduce((s, l) => s + (l.energy_level || 0), 0) / logs.length : 0,
            energy_trend: 0,
            activity_days: logs.length,
        };

        // Generate insights
        const insights: AnalysisInsight[] = [];

        if (metrics.sleep_avg < 6) {
            insights.push({
                id: 'sleep-low',
                category: 'sleep',
                title: 'Sleep needs attention',
                title_zh: '睡眠需要关注',
                description: 'Your average sleep quality is below optimal.',
                description_zh: '您的平均睡眠质量低于最佳水平。',
                trend: 'declining',
                confidence: 0.8,
            });
        }

        if (metrics.stress_avg > 6) {
            insights.push({
                id: 'stress-high',
                category: 'stress',
                title: 'Elevated stress levels',
                title_zh: '压力水平偏高',
                description: 'Your stress levels have been consistently high.',
                description_zh: '您的压力水平持续偏高。',
                trend: 'declining',
                confidence: 0.85,
            });
        }

        // Generate recommendations
        const recommendations: string[] = [];
        if (metrics.sleep_avg < 7) {
            recommendations.push('Consider establishing a consistent sleep schedule');
        }
        if (metrics.stress_avg > 5) {
            recommendations.push('Try incorporating relaxation techniques like deep breathing');
        }
        if (logs.length < 5) {
            recommendations.push('Log your daily wellness more consistently for better insights');
        }

        // Summary
        const summary = `Over the past ${reportType === 'weekly' ? 'week' : 'month'}, you logged ${logs.length} days. Your average sleep quality was ${metrics.sleep_avg.toFixed(1)}/10 and stress was ${metrics.stress_avg.toFixed(1)}/10.`;
        const summary_zh = `在过去${reportType === 'weekly' ? '一周' : '一个月'}内，您记录了${logs.length}天。平均睡眠质量为${metrics.sleep_avg.toFixed(1)}/10，压力水平为${metrics.stress_avg.toFixed(1)}/10。`;

        // Save report
        const { data: reportData, error: saveError } = await supabase
            .from('analysis_reports')
            .insert({
                user_id: user.id,
                report_type: reportType,
                period_start: startDate.toISOString().split('T')[0],
                period_end: endDate.toISOString().split('T')[0],
                summary,
                summary_zh,
                insights,
                metrics,
                recommendations,
            })
            .select()
            .single();

        const report: AnalysisReport = {
            id: reportData?.id || 'temp-' + Date.now(),
            user_id: user.id,
            report_type: reportType,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
            summary,
            summary_zh,
            insights,
            metrics,
            recommendations,
            created_at: new Date().toISOString(),
        };

        return toSerializable({ success: true, data: report });

    } catch (error) {
        console.error('[Analysis Action] generateAnalysis error:', error);
        return { success: false, error: 'Failed to generate analysis' };
    }
}

/**
 * Get analysis history.
 */
export async function getAnalysisHistory(): Promise<ActionResult<AnalysisReport[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data, error } = await supabase
            .from('analysis_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.warn('[Analysis Action] getAnalysisHistory error:', error);
            return { success: true, data: [] };
        }

        const reports: AnalysisReport[] = (data || []).map(r => ({
            id: r.id,
            user_id: r.user_id,
            report_type: r.report_type || 'weekly',
            period_start: r.period_start,
            period_end: r.period_end,
            summary: r.summary || '',
            summary_zh: r.summary_zh || r.summary || '',
            insights: r.insights || [],
            metrics: r.metrics || {},
            recommendations: r.recommendations || [],
            created_at: dateToISO(r.created_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: reports });

    } catch (error) {
        console.error('[Analysis Action] getAnalysisHistory error:', error);
        return { success: false, error: 'Failed to load history' };
    }
}
