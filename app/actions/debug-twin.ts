'use server';

/**
 * Debug Action: Get all raw data used for Digital Twin curve generation
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function getDigitalTwinDebugData() {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Please sign in' };
    }

    // 1. Get profile data (GAD7, PHQ9, ISI scores)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // 2. Get all daily wellness logs
    const { data: wellnessLogs } = await supabase
        .from('daily_wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

    // 3. Get all daily calibrations  
    const { data: calibrations } = await supabase
        .from('daily_calibrations')
        .select('*')
        .eq('user_id', user.id)
        .order('calibration_date', { ascending: false })
        .limit(30);

    // 4. Get assessment results (GAD7, PHQ9, etc)
    const { data: assessments } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    // 5. Get user_completed_assessments
    const { data: completedAssessments } = await supabase
        .from('user_completed_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        success: true,
        data: {
            userId: user.id,
            email: user.email,
            profile: profile ? {
                full_name: profile.full_name,
                gad7_score: profile.gad7_score,
                phq9_score: profile.phq9_score,
                isi_score: profile.isi_score,
                pss10_score: profile.pss10_score,
                registration_date: profile.created_at,
                inferred_scale_scores: profile.inferred_scale_scores,
            } : null,
            wellnessLogsCount: wellnessLogs?.length || 0,
            wellnessLogs: wellnessLogs?.slice(0, 7) || [],
            calibrationsCount: calibrations?.length || 0,
            calibrations: calibrations?.slice(0, 7) || [],
            assessmentsCount: assessments?.length || 0,
            assessments: assessments || [],
            completedAssessments: completedAssessments || [],
        }
    };
}
