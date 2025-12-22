/**
 * Daily Calibration Questions
 * 
 * Minimal set of questions for daily check-in:
 * - GAD-2 (anxiety short screen, 2 questions)
 * - Sleep duration (1 question)
 * - Sleep quality/ease (1 question)
 * - Stress level (1 question)
 * 
 * Total: 5 fixed questions + 1 AI-selected question = 5-6 questions
 */

import type { ScaleQuestion } from './types';
import { getGAD2Questions } from './gad';

export interface DailyQuestion extends ScaleQuestion {
    category: 'anxiety' | 'sleep' | 'stress' | 'ai_pick';
}

/**
 * Sleep duration question
 */
export const SLEEP_DURATION_QUESTION: DailyQuestion = {
    id: 'daily_sleep_duration',
    text: '昨晚睡了多少小时？',
    textEn: 'How many hours did you sleep last night?',
    category: 'sleep',
    options: [
        { value: 2, label: '少于5小时', labelEn: 'Less than 5 hours' },
        { value: 2, label: '5-6小时', labelEn: '5-6 hours' },
        { value: 1, label: '6-7小时', labelEn: '6-7 hours' },
        { value: 0, label: '7-8小时', labelEn: '7-8 hours' },
        { value: 0, label: '8-9小时', labelEn: '8-9 hours' },
        { value: 1, label: '超过9小时', labelEn: 'More than 9 hours' },
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
 * Calculate daily index score
 * dailyIndex = GAD2(0-6) + stress(0-2) + sleepQuality(0-2) + sleepDuration(0-2)
 * Max = 12
 */
export function calculateDailyIndex(responses: Record<string, number>): number {
    let score = 0;

    // GAD-2 (0-6)
    score += responses['gad7_q1'] || 0;
    score += responses['gad7_q2'] || 0;

    // Sleep duration (0-2)
    score += responses['daily_sleep_duration'] || 0;

    // Sleep quality (0-2)
    score += responses['daily_sleep_quality'] || 0;

    // Stress (0-2)
    score += responses['daily_stress_level'] || 0;

    return score;
}

/**
 * Check for red flags in daily responses
 */
export function checkDailyRedFlags(responses: Record<string, number>): {
    hasRedFlag: boolean;
    reasons: string[];
} {
    const reasons: string[] = [];

    // GAD-2 ≥ 3
    const gad2Score = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    if (gad2Score >= 3) {
        reasons.push('GAD-2 ≥ 3');
    }

    // Sleep < 5h (value = 2 for <5h option)
    if (responses['daily_sleep_duration'] === 2 &&
        (responses['daily_sleep_duration_raw'] || 0) < 5) {
        reasons.push('Sleep < 5h');
    }

    // High stress
    if (responses['daily_stress_level'] === 2) {
        reasons.push('High stress');
    }

    return {
        hasRedFlag: reasons.length > 0,
        reasons,
    };
}
