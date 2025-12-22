/**
 * Daily Calibration Questions
 * 
 * Minimal set of questions for daily check-in:
 * - GAD-2 (anxiety short screen, 2 questions)
 * - Sleep duration (1 question)
 * - Sleep quality/ease (1 question)
 * - Stress level (1 question)
 * 
 * Total: 5 fixed questions
 * 
 * DESIGN: Each question uses incremental values (0,1,2,3...) for storage.
 * Actual hours/meanings are derived via mapping tables.
 */

import type { ScaleQuestion } from './types';
import { getGAD2Questions } from './gad';

export interface DailyQuestion extends ScaleQuestion {
    category: 'anxiety' | 'sleep' | 'stress' | 'ai_pick';
}

/**
 * Sleep duration mapping: value -> hours range
 * Values are ordered by "concern level" (0 = optimal, higher = more concerning)
 */
export const SLEEP_DURATION_MAP: Record<number, { hours: string; minHours: number; maxHours: number }> = {
    0: { hours: '7-8小时', minHours: 7, maxHours: 8 },
    1: { hours: '8-9小时', minHours: 8, maxHours: 9 },
    2: { hours: '6-7小时', minHours: 6, maxHours: 7 },
    3: { hours: '5-6小时', minHours: 5, maxHours: 6 },
    4: { hours: '超过9小时', minHours: 9, maxHours: 12 },
    5: { hours: '少于5小时', minHours: 0, maxHours: 5 },
};

/**
 * Sleep duration question
 * value: 0=optimal(7-8h), higher=more concerning
 */
export const SLEEP_DURATION_QUESTION: DailyQuestion = {
    id: 'daily_sleep_duration',
    text: '昨晚睡了多少小时？',
    textEn: 'How many hours did you sleep last night?',
    category: 'sleep',
    options: [
        { value: 0, label: '7-8小时', labelEn: '7-8 hours' },      // optimal
        { value: 1, label: '8-9小时', labelEn: '8-9 hours' },      // slightly long
        { value: 2, label: '6-7小时', labelEn: '6-7 hours' },      // slightly short
        { value: 3, label: '5-6小时', labelEn: '5-6 hours' },      // concerning
        { value: 4, label: '超过9小时', labelEn: 'More than 9 hours' }, // oversleep
        { value: 5, label: '少于5小时', labelEn: 'Less than 5 hours' }, // critical
    ],
};

/**
 * Sleep quality / ease of falling asleep question
 */
export const SLEEP_QUALITY_QUESTION: DailyQuestion = {
    id: 'daily_sleep_quality',
    text: '入睡容易吗？',
    textEn: 'Was it easy to fall asleep?',
    category: 'sleep',
    options: [
        { value: 0, label: '很容易', labelEn: 'Very easy' },
        { value: 1, label: '有点困难', labelEn: 'Somewhat difficult' },
        { value: 2, label: '很困难', labelEn: 'Very difficult' },
    ],
};

/**
 * Stress level question
 */
export const STRESS_LEVEL_QUESTION: DailyQuestion = {
    id: 'daily_stress_level',
    text: '当前压力水平？',
    textEn: 'Current stress level?',
    category: 'stress',
    options: [
        { value: 0, label: '低压', labelEn: 'Low' },
        { value: 1, label: '中压', labelEn: 'Medium' },
        { value: 2, label: '高压', labelEn: 'High' },
    ],
};

/**
 * Get all daily calibration questions
 */
export function getDailyQuestions(): DailyQuestion[] {
    const gad2 = getGAD2Questions().map(q => ({
        ...q,
        category: 'anxiety' as const,
    }));

    return [
        ...gad2,
        SLEEP_DURATION_QUESTION,
        SLEEP_QUALITY_QUESTION,
        STRESS_LEVEL_QUESTION,
    ];
}

/**
 * Get sleep hours from answer value
 */
export function getSleepHoursFromValue(value: number): number {
    const mapping = SLEEP_DURATION_MAP[value];
    if (!mapping) return 7; // default
    // Return midpoint of range
    return (mapping.minHours + mapping.maxHours) / 2;
}

/**
 * Check if sleep duration is critically low
 */
export function isSleepCriticallyLow(value: number): boolean {
    // value 5 = <5 hours, value 3 = 5-6 hours (also concerning)
    return value >= 5;
}

/**
 * Get sleep duration severity score (0-2)
 */
export function getSleepDurationScore(value: number): number {
    // 5=<5h, 3=5-6h -> 2 (high concern)
    if (value === 5 || value === 3) return 2;
    // 2=6-7h, 4=>9h -> 1 (mild concern)
    if (value === 2 || value === 4) return 1;
    // 0=7-8h, 1=8-9h -> 0 (optimal)
    return 0;
}

/**
 * Calculate daily index score (0-12 scale)
 * dailyIndex = GAD2(0-6) + stress(0-2) + sleepQuality(0-2) + sleepDurationScore(0-2)
 */
export function calculateDailyIndex(responses: Record<string, number>): number {
    const gad2 = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    const sleepDur = responses['daily_sleep_duration'] || 0;
    const sleepDurationScore = getSleepDurationScore(sleepDur);
    const sleepQual = responses['daily_sleep_quality'] || 0;
    const stress = responses['daily_stress_level'] || 0;
    return gad2 + sleepDurationScore + sleepQual + stress;
}

/**
 * Calculate raw daily score (for backward compatibility)
 * Sum of all values, max = 6 + 5 + 2 + 2 = 15
 */
export function calculateDailyRawScore(responses: Record<string, number>): number {
    return (
        (responses['gad7_q1'] || 0) +
        (responses['gad7_q2'] || 0) +
        (responses['daily_sleep_duration'] || 0) +
        (responses['daily_sleep_quality'] || 0) +
        (responses['daily_stress_level'] || 0)
    );
}

/**
 * Check for red flags in daily responses
 */
export function checkDailyRedFlags(responses: Record<string, number>): {
    hasRedFlag: boolean;
    reasons: string[];
} {
    const reasons: string[] = [];

    // GAD-2 ≥ 3 (triggers full GAD-7)
    const gad2Score = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    if (gad2Score >= 3) {
        reasons.push('GAD-2 ≥ 3');
    }

    // Sleep < 5h (value = 5)
    const sleepValue = responses['daily_sleep_duration'];
    if (sleepValue !== undefined && isSleepCriticallyLow(sleepValue)) {
        reasons.push('Sleep < 5h');
    }

    // High stress (value = 2)
    if (responses['daily_stress_level'] === 2) {
        reasons.push('High stress');
    }

    return {
        hasRedFlag: reasons.length > 0,
        reasons,
    };
}
