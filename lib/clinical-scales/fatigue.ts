/**
 * CFS-11 - Chalder Fatigue Scale (11-item version)
 * 
 * Reference: Chalder T, Berelowitz G, Pawlikowska T, et al. (1993)
 * Development of a fatigue scale.
 * Journal of Psychosomatic Research, 37(2), 147-153.
 * 
 * Public Domain - Free to use
 * 
 * 该量表评估躯体疲劳和精神疲劳两个维度
 * Physical fatigue: Q1-Q7
 * Mental fatigue: Q8-Q11
 */

import type { ScaleDefinition } from './types';
import { CFS11_SOURCE } from './source-attributions';

export const CFS11: ScaleDefinition = {
    id: 'CFS11',
    name: 'Chalder 疲劳量表-11',
    nameEn: 'Chalder Fatigue Scale-11',
    description: '过去一个月内，您经历以下情况的频率是？',
    sourceAttribution: CFS11_SOURCE,

    questions: [
        // Physical Fatigue (躯体疲劳) - Q1-Q7
        {
            id: 'cfs_q1',
            text: '即使没有大幅增加运动量，也感到筋疲力尽',
            textEn: 'Do you have problems with tiredness?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q2',
            text: '休息并不能显著缓解疲劳',
            textEn: 'Do you need to rest more?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q3',
            text: '工作时精神萎靡',
            textEn: 'Do you feel sleepy or drowsy?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q4',
            text: '头痛难忍',
            textEn: 'Do you have problems starting things?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q5',
            text: '感到头晕',
            textEn: 'Do you lack energy?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q6',
            text: '眼睛酸痛或疲劳',
            textEn: 'Do you have less strength in your muscles?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q7',
            text: '喉咙痛',
            textEn: 'Do you feel weak?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        // Mental Fatigue (精神疲劳) - Q8-Q11
        {
            id: 'cfs_q8',
            text: '肌肉或关节感觉僵硬',
            textEn: 'Do you have difficulty concentrating?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q9',
            text: '肩膀/脖子/腰部疼痛',
            textEn: 'Do you make slips of the tongue when speaking?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q10',
            text: '难以集中注意力',
            textEn: 'Do you find it more difficult to find the correct word?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Less than usual' },
                { value: 1, label: '偶尔', labelEn: 'No more than usual' },
                { value: 2, label: '经常', labelEn: 'More than usual' },
                { value: 3, label: '总是', labelEn: 'Much more than usual' },
            ],
        },
        {
            id: 'cfs_q11',
            text: '记忆力下降',
            textEn: 'How is your memory?',
            options: [
                { value: 0, label: '从不或几乎从不', labelEn: 'Better than usual' },
                { value: 1, label: '偶尔', labelEn: 'No worse than usual' },
                { value: 2, label: '经常', labelEn: 'Worse than usual' },
                { value: 3, label: '总是', labelEn: 'Much worse than usual' },
            ],
        },
    ],

    scoring: {
        minScore: 0,
        maxScore: 33,
        interpretation: [
            { minScore: 0, maxScore: 11, level: 'minimal', label: '无明显疲劳', labelEn: 'No significant fatigue' },
            { minScore: 12, maxScore: 18, level: 'mild', label: '轻度疲劳', labelEn: 'Mild fatigue' },
            { minScore: 19, maxScore: 26, level: 'moderate', label: '中度疲劳', labelEn: 'Moderate fatigue' },
            { minScore: 27, maxScore: 33, level: 'severe', label: '重度疲劳', labelEn: 'Severe fatigue' },
        ],
    },
};

// CFS-11 维度ID
export const CFS_PHYSICAL_QUESTION_IDS = ['cfs_q1', 'cfs_q2', 'cfs_q3', 'cfs_q4', 'cfs_q5', 'cfs_q6', 'cfs_q7'];
export const CFS_MENTAL_QUESTION_IDS = ['cfs_q8', 'cfs_q9', 'cfs_q10', 'cfs_q11'];

/**
 * 获取躯体疲劳维度问题
 */
export function getPhysicalFatigueQuestions() {
    return CFS11.questions.filter(q => CFS_PHYSICAL_QUESTION_IDS.includes(q.id));
}

/**
 * 获取精神疲劳维度问题
 */
export function getMentalFatigueQuestions() {
    return CFS11.questions.filter(q => CFS_MENTAL_QUESTION_IDS.includes(q.id));
}

/**
 * 解释 CFS-11 总分
 */
export function interpretCFS11Score(score: number): string {
    const interpretation = CFS11.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}

/**
 * 计算维度分数
 */
export function calculateCFS11Subscores(answers: Record<string, number>): {
    physical: number;
    mental: number;
    total: number;
} {
    let physical = 0;
    let mental = 0;

    for (const [questionId, value] of Object.entries(answers)) {
        if (CFS_PHYSICAL_QUESTION_IDS.includes(questionId)) {
            physical += value;
        } else if (CFS_MENTAL_QUESTION_IDS.includes(questionId)) {
            mental += value;
        }
    }

    return {
        physical,
        mental,
        total: physical + mental,
    };
}
