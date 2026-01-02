/**
 * Digital Twin Curve API
 * 
 * 生成数字孪生曲线结构化输出
 * GET /api/digital-twin/curve
 * 
 * @module app/api/digital-twin/curve/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aggregateUserData } from '@/lib/digital-twin/data-aggregator';
import { generateCurveOutput } from '@/lib/digital-twin/curve-output-generator';

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
    try {
        // ============================================
        // DEV MODE BYPASS - 测试时跳过认证
        // ============================================
        const isDev = process.env.NODE_ENV === 'development';
        const skipAuth = request.headers.get('x-skip-auth') === 'true' ||
            request.nextUrl.searchParams.get('dev') === 'true';

        if (isDev && skipAuth) {
            console.log('🧪 DEV MODE: Generating mock curve data');
            const mockOutput = generateMockCurveOutput();
            return NextResponse.json({ success: true, data: mockOutput });
        }
        // ============================================

        const supabase = await createServerSupabaseClient();

        // 验证用户身份
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // 调试日志
        console.log('🔑 Digital Twin Curve API - Auth Check:');
        console.log('  - User:', user?.id || 'null');
        console.log('  - Auth Error:', authError?.message || 'none');

        if (authError || !user) {
            console.error('❌ 用户未认证:', authError?.message);
            return NextResponse.json(
                { error: '请先登录', debug: authError?.message },
                { status: 401 }
            );
        }

        const userId = user.id;

        // 聚合用户数据
        const userData = await aggregateUserData(userId);

        // 检查是否有基线数据
        if (!userData.baseline) {
            return NextResponse.json(
                {
                    error: '未找到基线数据，请先完成入门评估',
                    status: 'no_baseline',
                    hasBaseline: false,
                    calibrationCount: userData.calibrations.length,
                },
                { status: 400 }
            );
        }

        // 生成曲线输出
        const curveOutput = generateCurveOutput(userData);

        // 返回结构化输出
        return NextResponse.json({
            success: true,
            data: curveOutput,
        });

    } catch (error) {
        console.error('❌ 曲线生成 API 错误:', error);
        return NextResponse.json(
            { error: '生成曲线时出现问题，请稍后再试' },
            { status: 500 }
        );
    }
}

// ============================================
// POST Handler (with emotion trend override)
// ============================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // 验证用户身份
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: '请先登录' },
                { status: 401 }
            );
        }

        // 解析请求
        const body = await request.json();
        const userId = body.userId || user.id;
        const conversationTrend = body.conversationTrend as 'improving' | 'stable' | 'declining' | null ?? null;

        // 安全检查：用户只能查看自己的数据
        if (userId !== user.id) {
            return NextResponse.json(
                { error: '无权访问此数据' },
                { status: 403 }
            );
        }

        // 聚合用户数据
        const userData = await aggregateUserData(userId);

        // 检查是否有基线数据
        if (!userData.baseline) {
            return NextResponse.json(
                {
                    error: '未找到基线数据，请先完成入门评估',
                    status: 'no_baseline',
                    hasBaseline: false,
                    calibrationCount: userData.calibrations.length,
                },
                { status: 400 }
            );
        }

        // 生成曲线输出
        const curveOutput = generateCurveOutput(userData, conversationTrend);

        // 返回结构化输出
        return NextResponse.json({
            success: true,
            data: curveOutput,
        });

    } catch (error) {
        console.error('❌ 曲线生成 API 错误:', error);
        return NextResponse.json(
            { error: '生成曲线时出现问题，请稍后再试' },
            { status: 500 }
        );
    }
}

// ============================================
// Mock Data Generator (DEV only)
// Uses USER's real data for testing
// ============================================

function generateMockCurveOutput() {
    // ===============================
    // USER'S REAL BASELINE DATA
    // ===============================
    const baseline = {
        gad7: 15,   // Moderate-severe anxiety
        phq9: 20,   // Moderately severe depression
        isi: 4,     // None/minimal insomnia
        pss10: 22,  // Moderate stress
    };

    // ===============================
    // USER'S 7-DAY CALIBRATION DATA
    // ===============================
    const calibrations = [
        { day: 1, sleepHours: 7, sleepQuality: 5, mood: 6, stress: 8, energy: 2 },
        { day: 2, sleepHours: 5, sleepQuality: 6, mood: 6, stress: 7, energy: 3 },
        { day: 3, sleepHours: 4, sleepQuality: 4, mood: 2, stress: 8, energy: 8 },
        { day: 4, sleepHours: 3, sleepQuality: 6, mood: 9, stress: 9, energy: 9 },
        { day: 5, sleepHours: 7, sleepQuality: 7, mood: 7, stress: 6, energy: 7 },
        { day: 6, sleepHours: 6, sleepQuality: 9, mood: 3, stress: 3, energy: 6 },
        { day: 7, sleepHours: 5, sleepQuality: 6, mood: 7, stress: 7, energy: 8 },
    ];

    const emotionTrend = 'improving';
    const baselineDate = new Date('2026-01-01');
    const now = new Date();
    const daysSinceBaseline = Math.floor((now.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceBaseline / 7);

    // ===============================
    // CALCULATE WEEK 0 VALUES
    // ===============================
    // Convert scales to 0-100 metrics
    const anxietyScore_w0 = Math.round((baseline.gad7 / 21) * 100);  // 71.4 -> 71
    const moodStability_w0 = Math.round(100 - (baseline.phq9 / 27) * 100);  // 25.9 -> 26
    const sleepQuality_w0_fromISI = Math.round(100 - (baseline.isi / 28) * 100);  // 85.7 -> 86
    const stressResilience_w0 = Math.round(100 - (baseline.pss10 / 40) * 100);  // 45 -> 45

    // Blend with calibration averages
    const avgSleepQuality = calibrations.reduce((s, c) => s + c.sleepQuality, 0) / 7 * 10;  // 6.14 * 10 = 61.4
    const avgMood = calibrations.reduce((s, c) => s + c.mood, 0) / 7 * 10;  // 5.71 * 10 = 57.1
    const avgStress = calibrations.reduce((s, c) => s + c.stress, 0) / 7 * 10;  // 6.86 * 10 = 68.6
    const avgEnergy = calibrations.reduce((s, c) => s + c.energy, 0) / 7 * 10;  // 6.14 * 10 = 61.4

    // Fused Week 0 values (70% scale, 30% daily)
    const sleepQuality_w0 = Math.round(0.7 * sleepQuality_w0_fromISI + 0.3 * avgSleepQuality);  // 78.5
    const moodFused_w0 = Math.round(0.7 * moodStability_w0 + 0.3 * avgMood);  // 35.4
    const stressFused_w0 = Math.round(0.7 * stressResilience_w0 + 0.3 * (100 - avgStress));  // 40.9
    const energyLevel_w0 = Math.round(avgEnergy);  // 61
    const hrvScore_w0 = Math.round(0.3 * sleepQuality_w0 + 0.3 * (100 - anxietyScore_w0) + 0.4 * avgEnergy);  // 56.4

    // ===============================
    // IMPROVEMENT FACTOR
    // ===============================
    // Emotion trend: improving = 1.15, stable = 1.0, declining = 0.85
    const trendFactor = emotionTrend === 'improving' ? 1.15 : emotionTrend === 'declining' ? 0.85 : 1.0;
    const k = 0.12 * trendFactor;  // Decay constant

    // Target values (15-week goals)
    const targets = {
        anxietyScore: 25,      // Reduce from 71 to 25
        sleepQuality: 90,      // Improve to 90
        stressResilience: 80,  // Improve to 80
        moodStability: 75,     // Improve to 75
        energyLevel: 85,       // Improve to 85
        hrvScore: 80,          // Improve to 80
    };

    // Exponential prediction: y(t) = target + (y0 - target) * e^(-k*t)
    const predict = (y0: number, target: number, week: number) => {
        return target + (y0 - target) * Math.exp(-k * week);
    };

    // ===============================
    // GENERATE TIMEPOINTS
    // ===============================
    const weeks = [0, 3, 6, 9, 12, 15];
    const timepoints = weeks.map(week => {
        const halfWidth = 8 + 0.4 * week;
        return {
            week,
            metrics: {
                anxietyScore: {
                    value: Math.round(predict(anxietyScore_w0, targets.anxietyScore, week) * 10) / 10,
                    confidence: `${predict(anxietyScore_w0, targets.anxietyScore, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
                sleepQuality: {
                    value: Math.round(predict(sleepQuality_w0, targets.sleepQuality, week) * 10) / 10,
                    confidence: `${predict(sleepQuality_w0, targets.sleepQuality, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
                stressResilience: {
                    value: Math.round(predict(stressFused_w0, targets.stressResilience, week) * 10) / 10,
                    confidence: `${predict(stressFused_w0, targets.stressResilience, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
                moodStability: {
                    value: Math.round(predict(moodFused_w0, targets.moodStability, week) * 10) / 10,
                    confidence: `${predict(moodFused_w0, targets.moodStability, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
                energyLevel: {
                    value: Math.round(predict(energyLevel_w0, targets.energyLevel, week) * 10) / 10,
                    confidence: `${predict(energyLevel_w0, targets.energyLevel, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
                hrvScore: {
                    value: Math.round(predict(hrvScore_w0, targets.hrvScore, week) * 10) / 10,
                    confidence: `${predict(hrvScore_w0, targets.hrvScore, week).toFixed(1)} ± ${halfWidth.toFixed(1)}`
                },
            }
        };
    });

    // ===============================
    // INTERPRETATION HELPERS
    // ===============================
    const interpretGAD7 = (score: number) => {
        if (score <= 4) return 'minimal';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        return 'severe';
    };
    const interpretPHQ9 = (score: number) => {
        if (score <= 4) return 'minimal';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        if (score <= 19) return 'moderately severe';
        return 'severe';
    };
    const interpretISI = (score: number) => {
        if (score <= 7) return 'none/minimal';
        if (score <= 14) return 'subthreshold';
        if (score <= 21) return 'clinical insomnia (moderate)';
        return 'clinical insomnia (severe)';
    };
    const interpretPSS10 = (score: number) => {
        if (score <= 13) return 'low';
        if (score <= 26) return 'moderate';
        return 'high';
    };

    // ===============================
    // CALCULATE SUMMARY STATS
    // ===============================
    const week15 = timepoints[5].metrics;
    const week0 = timepoints[0].metrics;

    // Overall improvement = average of all metric deltas (anxiety inverted)
    const anxietyDelta = week0.anxietyScore.value - week15.anxietyScore.value;  // Positive = good
    const sleepDelta = week15.sleepQuality.value - week0.sleepQuality.value;
    const stressDelta = week15.stressResilience.value - week0.stressResilience.value;
    const moodDelta = week15.moodStability.value - week0.moodStability.value;
    const energyDelta = week15.energyLevel.value - week0.energyLevel.value;
    const hrvDelta = week15.hrvScore.value - week0.hrvScore.value;

    const overallImprovement = Math.round((anxietyDelta + sleepDelta + stressDelta + moodDelta + energyDelta + hrvDelta) / 6 * 10) / 10;

    // Days to first result (estimate: when goodness improves 8+ points)
    const daysToFirstResult = Math.round(14 / trendFactor);  // ~12 days with improving trend

    // Consistency score based on calibration data (7/7 days = 100%)
    const consistencyScore = Math.round((calibrations.length / 7) * 100 * 0.75 + 25);  // 100%

    return {
        meta: {
            ruleVersion: 'dtwin_rules_v1.0_user_data',
            asOfDate: now.toISOString().split('T')[0],
            baselineDate: baselineDate.toISOString().split('T')[0],
            daysSinceBaseline,
            currentWeek,
            dataQualityFlags: {
                baselineMissing: [],
                dailyCalibrationSparse: false,
                conversationTrendMissing: false,
                pss10Missing: false,
                hrvIsInferred: true,
            }
        },
        A_predictedLongitudinalOutcomes: {
            timepoints,
            curveModel: {
                shape: 'exponential_to_target_with_shock',
                kRangePerWeek: [0.04, 0.25],
                targetHorizonWeeks: 15,
                trendWindowDays: 14,
                notes: [
                    `Baseline: GAD-7=${baseline.gad7}, PHQ-9=${baseline.phq9}, ISI=${baseline.isi}, PSS-10=${baseline.pss10}`,
                    `Emotion trend: ${emotionTrend} (k=${k.toFixed(3)})`,
                    `Based on ${calibrations.length} days of calibration data`,
                ]
            }
        },
        B_timeSinceBaselineVisit: {
            milestones: [
                { week: 0, event: 'Baseline assessment', status: 'completed', detail: `GAD-7: ${baseline.gad7}/21, PHQ-9: ${baseline.phq9}/27`, actualScore: { 'GAD-7': baseline.gad7, 'PHQ-9': baseline.phq9, 'ISI': baseline.isi, 'PSS-10': baseline.pss10 } },
                { week: 3, event: 'Week-3 review', status: currentWeek >= 3 ? 'completed' : currentWeek === 0 ? 'current' : 'upcoming', detail: 'Recalibrate based on 14-day trend', actualScore: null },
                { week: 6, event: 'Week-6 review', status: 'upcoming', detail: 'Check insomnia/stress signals', actualScore: null },
                { week: 9, event: 'Week-9 mid review', status: 'upcoming', detail: 'Check plateau or shock events', actualScore: null },
                { week: 12, event: 'Week-12 re-assessment', status: 'upcoming', detail: 'Re-administer GAD-7/PHQ-9/ISI', actualScore: null },
                { week: 15, event: 'Week-15 closeout', status: 'upcoming', detail: 'Final outcomes + endpoints', actualScore: null },
            ]
        },
        C_participantBaselineData: {
            scales: [
                { name: 'GAD-7', value: baseline.gad7, interpretation: interpretGAD7(baseline.gad7) },
                { name: 'PHQ-9', value: baseline.phq9, interpretation: interpretPHQ9(baseline.phq9) },
                { name: 'ISI', value: baseline.isi, interpretation: interpretISI(baseline.isi) },
                { name: 'PSS-10', value: baseline.pss10, interpretation: interpretPSS10(baseline.pss10) },
            ],
            vitals: {}
        },
        D_metricEndpoints: {
            charts: {
                anxietyTrend: { unit: '0-100 severity (lower=better)', points: timepoints.map(tp => ({ week: tp.week, source: tp.week === 0 ? 'baselineScale' : 'predicted', value: tp.metrics.anxietyScore.value, confidence: tp.metrics.anxietyScore.confidence })) },
                sleepTrend: { unit: '0-100 (higher=better)', points: timepoints.map(tp => ({ week: tp.week, source: tp.week === 0 ? 'baselineScale+daily' : 'predicted', value: tp.metrics.sleepQuality.value, confidence: tp.metrics.sleepQuality.confidence })) },
                hrvTrend: { unit: '0-100 inferred (higher=better)', points: timepoints.map(tp => ({ week: tp.week, source: 'inferred', value: tp.metrics.hrvScore.value, confidence: tp.metrics.hrvScore.confidence })) },
                energyTrend: { unit: '0-100 (higher=better)', points: timepoints.map(tp => ({ week: tp.week, source: tp.week === 0 ? 'dailyCalibration' : 'predicted', value: tp.metrics.energyLevel.value, confidence: tp.metrics.energyLevel.confidence })) },
            },
            summaryStats: {
                overallImprovement: { value: overallImprovement, unit: 'goodness points', method: 'weighted delta of 6 metrics (anxiety inverted)' },
                daysToFirstResult: { value: daysToFirstResult, unit: 'days', method: 'first time goodness improves ≥8 points' },
                consistencyScore: { value: consistencyScore, unit: '0-100', method: '7/7 calibrations completed' },
            }
        },
        schema: {}
    };
}

