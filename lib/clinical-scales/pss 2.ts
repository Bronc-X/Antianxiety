/**
 * PSS-10 / PSS-4 - Perceived Stress Scale
 * 
 * Reference: Cohen S, Kamarck T, Mermelstein R. (1983)
 * A global measure of perceived stress.
 * Journal of Health and Social Behavior, 24(4), 385-396.
 * 
 * Public Domain - Free to use
 */

import type { ScaleDefinition } from './types';

export const PSS10: ScaleDefinition = {
    id: 'PSS10',
    name: '感知压力量表-10',
    nameEn: 'Perceived Stress Scale-10',
    description: '请评估您过去一个月内的感受和想法',

    questions: [
        {
            id: 'pss_q1',
            text: '在过去一个月中，因为意外发生的事情而感到心烦意乱的频率是？',
            textEn: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q2',
            text: '在过去一个月中，感觉无法控制生活中重要事情的频率是？',
            textEn: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q3',
            text: '在过去一个月中，感到紧张和有压力的频率是？',
            textEn: 'In the last month, how often have you felt nervous and stressed?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q4',
            text: '在过去一个月中，对处理个人问题感到信心十足的频率是？',
            textEn: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
            options: [
                { value: 4, label: '从不', labelEn: 'Never' }, // Reverse scored
                { value: 3, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 1, label: '经常', labelEn: 'Fairly often' },
                { value: 0, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q5',
            text: '在过去一个月中，感觉事情进展顺利的频率是？',
            textEn: 'In the last month, how often have you felt that things were going your way?',
            options: [
                { value: 4, label: '从不', labelEn: 'Never' }, // Reverse scored
                { value: 3, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 1, label: '经常', labelEn: 'Fairly often' },
                { value: 0, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q6',
            text: '在过去一个月中，发现自己无法应对必须做的事情的频率是？',
            textEn: 'In the last month, how often have you found that you could not cope with all the things that you had to do?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q7',
            text: '在过去一个月中，能够控制生活中恼人事情的频率是？',
            textEn: 'In the last month, how often have you been able to control irritations in your life?',
            options: [
                { value: 4, label: '从不', labelEn: 'Never' }, // Reverse scored
                { value: 3, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 1, label: '经常', labelEn: 'Fairly often' },
                { value: 0, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q8',
            text: '在过去一个月中，感觉自己掌控一切的频率是？',
            textEn: 'In the last month, how often have you felt that you were on top of things?',
            options: [
                { value: 4, label: '从不', labelEn: 'Never' }, // Reverse scored
                { value: 3, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 1, label: '经常', labelEn: 'Fairly often' },
                { value: 0, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q9',
            text: '在过去一个月中，因为无法控制的事情而愤怒的频率是？',
            textEn: 'In the last month, how often have you been angered because of things that happened that were outside of your control?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
        {
            id: 'pss_q10',
            text: '在过去一个月中，感觉困难堆积太多以至于无法克服的频率是？',
            textEn: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
            options: [
                { value: 0, label: '从不', labelEn: 'Never' },
                { value: 1, label: '偶尔', labelEn: 'Almost never' },
                { value: 2, label: '有时', labelEn: 'Sometimes' },
                { value: 3, label: '经常', labelEn: 'Fairly often' },
                { value: 4, label: '很频繁', labelEn: 'Very often' },
            ],
        },
    ],

    shortVersion: {
        // PSS-4: Questions 2, 4, 5, 10
        questionIds: ['pss_q2', 'pss_q4', 'pss_q5', 'pss_q10'],
        triggerThreshold: 8, // PSS-4 ≥ 8 suggests elevated stress
    },

    scoring: {
        minScore: 0,
        maxScore: 40,
        interpretation: [
            { minScore: 0, maxScore: 13, level: 'minimal', label: '低压力', labelEn: 'Low stress' },
            { minScore: 14, maxScore: 26, level: 'moderate', label: '中等压力', labelEn: 'Moderate stress' },
            { minScore: 27, maxScore: 40, level: 'severe', label: '高压力', labelEn: 'High perceived stress' },
        ],
    },
};

// PSS-4 helper functions
export const PSS4_QUESTION_IDS = PSS10.shortVersion!.questionIds;

export function getPSS4Questions() {
    return PSS10.questions.filter(q => PSS4_QUESTION_IDS.includes(q.id));
}

export function interpretPSS10Score(score: number): string {
    const interpretation = PSS10.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}
