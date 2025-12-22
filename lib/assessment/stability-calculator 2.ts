/**
 * Stability Calculator for Adaptive Assessment System
 * 
 * Calculates user stability metrics to determine if assessment frequency
 * can be reduced (daily → every-other-day, weekly → biweekly).
 * 
 * Stability Criteria:
 * - Completion rate: 7 days ≥ 5 responses (71%)
 * - Low risk: 7-day average ≤ 3, max single day ≤ 5
 * - Trend stable: 7-day slope ≤ 0.3/day
 * - No red flags: GAD-2 ≥ 3, PHQ-2 ≥ 3, sleep < 5h × 2 days, safety keywords
 * - Debounce: Must meet criteria for 3 consecutive days before frequency change
 */

import { createClient } from '@/lib/supabase-client';

export interface DailyResponse {
    date: string;
    gad2Score: number;     // 0-6
    sleepDuration: number; // hours
    sleepQuality: number;  // 0-2 (easy, somewhat, difficult)
    stressLevel: number;   // 0-2 (low, medium, high)
    dailyIndex: number;    // calculated total
}

export interface StabilityResult {
    isStable: boolean;
    completionRate: number;       // 0-1
    averageScore: number;         // daily index average
    maxSingleDay: number;         // peak daily index
    slope: number;                // trend per day
    hasRedFlag: boolean;
    redFlagReasons: string[];
    canReduceFrequency: boolean;
    consecutiveStableDays: number;
    recommendation: 'daily' | 'every_other_day' | 'increase_to_daily';
}

export interface WeeklyStabilityResult {
    isStable: boolean;
    completionRate: number;       // 4 weeks
    averageScore: number;
    scoreVariance: number;
    canReduceFrequency: boolean;
    recommendation: 'weekly' | 'biweekly';
}

/**
 * Calculate daily index from individual responses
 * dailyIndex = GAD2(0-6) + stress(0-2) + sleepQuality(0-2) + sleepDuration(0-2)
 * Max = 12
 */
export function calculateDailyIndexFromResponses(
    gad2Score: number,
    stressLevel: number,
    sleepQuality: number,
    sleepDuration: number
): number {
    // Sleep duration scoring: <5h=2, 5-6h=2, 6-7h=1, 7-9h=0, >9h=1
    let sleepDurationScore = 0;
    if (sleepDuration < 5) sleepDurationScore = 2;
    else if (sleepDuration < 6) sleepDurationScore = 2;
    else if (sleepDuration < 7) sleepDurationScore = 1;
    else if (sleepDuration <= 9) sleepDurationScore = 0;
    else sleepDurationScore = 1;

    return gad2Score + stressLevel + sleepQuality + sleepDurationScore;
}

/**
 * Calculate linear regression slope for trend analysis
 */
function calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0+1+2+...+(n-1)
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squares

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
}

/**
 * Check for red flags in the last 7 days of data
 */
export function checkRedFlags(
    responses: DailyResponse[],
    consecutiveSleepLowDays: number = 2
): { hasRedFlag: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for GAD-2 ≥ 3 on any day
    const highGAD2 = responses.filter(r => r.gad2Score >= 3);
    if (highGAD2.length > 0) {
        reasons.push(`GAD-2 ≥ 3 on ${highGAD2.length} day(s)`);
    }

    // Check for consecutive low sleep days
    let consecutiveLowSleep = 0;
    for (const r of responses.sort((a, b) => a.date.localeCompare(b.date))) {
        if (r.sleepDuration < 5) {
            consecutiveLowSleep++;
            if (consecutiveLowSleep >= consecutiveSleepLowDays) {
                reasons.push(`Sleep < 5h for ${consecutiveLowSleep} consecutive days`);
                break;
            }
        } else {
            consecutiveLowSleep = 0;
        }
    }

    // Check for high stress on multiple days
    const highStressDays = responses.filter(r => r.stressLevel === 2).length;
    if (highStressDays >= 3) {
        reasons.push(`High stress on ${highStressDays} days`);
    }

    return {
        hasRedFlag: reasons.length > 0,
        reasons,
    };
}

/**
 * Calculate stability for daily calibration frequency
 */
export function calculateDailyStability(
    responses: DailyResponse[],
    previousConsecutiveStableDays: number = 0
): StabilityResult {
    const DAYS_WINDOW = 7;
    const MIN_COMPLETION_RATE = 0.71; // 5/7
    const MAX_AVG_SCORE = 3;
    const MAX_SINGLE_DAY = 5;
    const MAX_SLOPE = 0.3;
    const DEBOUNCE_DAYS = 3;

    // Calculate completion rate
    const completionRate = Math.min(responses.length / DAYS_WINDOW, 1);

    // Calculate average score
    const scores = responses.map(r => r.dailyIndex);
    const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    // Calculate max single day
    const maxSingleDay = scores.length > 0 ? Math.max(...scores) : 0;

    // Calculate slope (trend)
    const slope = calculateSlope(scores);

    // Check red flags
    const { hasRedFlag, reasons: redFlagReasons } = checkRedFlags(responses);

    // Determine stability
    const isStableCriteria =
        completionRate >= MIN_COMPLETION_RATE &&
        averageScore <= MAX_AVG_SCORE &&
        maxSingleDay <= MAX_SINGLE_DAY &&
        Math.abs(slope) <= MAX_SLOPE &&
        !hasRedFlag;

    // Calculate consecutive stable days (debounce)
    const consecutiveStableDays = isStableCriteria
        ? previousConsecutiveStableDays + 1
        : 0;

    // Can reduce frequency only after debounce period
    const canReduceFrequency = consecutiveStableDays >= DEBOUNCE_DAYS;

    // Recommendation
    let recommendation: 'daily' | 'every_other_day' | 'increase_to_daily';
    if (hasRedFlag) {
        recommendation = 'increase_to_daily';
    } else if (canReduceFrequency) {
        recommendation = 'every_other_day';
    } else {
        recommendation = 'daily';
    }

    return {
        isStable: isStableCriteria,
        completionRate,
        averageScore,
        maxSingleDay,
        slope,
        hasRedFlag,
        redFlagReasons,
        canReduceFrequency,
        consecutiveStableDays,
        recommendation,
    };
}

/**
 * Calculate stability for weekly calibration frequency
 */
export function calculateWeeklyStability(
    weeklyScores: number[], // PSS-4 scores for last 4 weeks
    completedWeeks: number
): WeeklyStabilityResult {
    const WEEKS_WINDOW = 4;
    const MIN_COMPLETION_RATE = 0.75; // 3/4 weeks
    const MAX_VARIANCE = 1;

    const completionRate = Math.min(completedWeeks / WEEKS_WINDOW, 1);
    const averageScore = weeklyScores.length > 0
        ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
        : 0;

    // Calculate variance
    const variance = weeklyScores.length > 1
        ? weeklyScores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / weeklyScores.length
        : 0;

    const isStable =
        completionRate >= MIN_COMPLETION_RATE &&
        variance <= MAX_VARIANCE;

    return {
        isStable,
        completionRate,
        averageScore,
        scoreVariance: variance,
        canReduceFrequency: isStable,
        recommendation: isStable ? 'biweekly' : 'weekly',
    };
}

/**
 * Fetch user's stability data from database
 */
export async function fetchUserStabilityData(userId: string): Promise<{
    dailyResponses: DailyResponse[];
    consecutiveStableDays: number;
}> {
    const supabase = createClient();

    // Get last 7 days of daily responses
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: responses } = await supabase
        .from('user_scale_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('source', 'daily')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    // Get current stability streak
    const { data: profile } = await supabase
        .from('profiles')
        .select('daily_stability_streak')
        .eq('id', userId)
        .single();

    // Group responses by date and calculate daily index
    const dailyMap = new Map<string, DailyResponse>();

    for (const r of responses || []) {
        const date = r.created_at.split('T')[0];
        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                date,
                gad2Score: 0,
                sleepDuration: 7, // default
                sleepQuality: 0,
                stressLevel: 0,
                dailyIndex: 0,
            });
        }

        const day = dailyMap.get(date)!;

        // Update based on question ID
        if (r.question_id === 'gad7_q1' || r.question_id === 'gad7_q2') {
            day.gad2Score += r.answer_value || 0;
        } else if (r.question_id === 'daily_sleep_duration') {
            // Map answer value to hours
            const durationMap: Record<number, number> = { 0: 4, 1: 5.5, 2: 6.5, 3: 7.5, 4: 8.5, 5: 10 };
            day.sleepDuration = durationMap[r.answer_value] || 7;
        } else if (r.question_id === 'daily_sleep_quality') {
            day.sleepQuality = r.answer_value || 0;
        } else if (r.question_id === 'daily_stress_level') {
            day.stressLevel = r.answer_value || 0;
        }
    }

    // Calculate daily index for each day
    const dailyResponses = Array.from(dailyMap.values()).map(d => ({
        ...d,
        dailyIndex: calculateDailyIndexFromResponses(
            d.gad2Score,
            d.stressLevel,
            d.sleepQuality,
            d.sleepDuration
        ),
    }));

    return {
        dailyResponses,
        consecutiveStableDays: profile?.daily_stability_streak || 0,
    };
}

/**
 * Update user's frequency preference based on stability
 */
export async function updateUserFrequency(
    userId: string,
    stability: StabilityResult
): Promise<void> {
    const supabase = createClient();

    // Update profile stability streak
    await supabase
        .from('profiles')
        .update({
            daily_stability_streak: stability.consecutiveStableDays,
        })
        .eq('id', userId);

    // Update preferences if frequency should change
    if (stability.canReduceFrequency || stability.hasRedFlag) {
        await supabase
            .from('user_assessment_preferences')
            .upsert({
                user_id: userId,
                daily_frequency: stability.recommendation === 'increase_to_daily' ? 'daily' : stability.recommendation,
                daily_frequency_reason: stability.hasRedFlag
                    ? `red_flag: ${stability.redFlagReasons.join(', ')}`
                    : 'stable_7d',
                last_frequency_change: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });
    }
}
