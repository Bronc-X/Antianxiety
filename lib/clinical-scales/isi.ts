/**
 * ISI - Insomnia Severity Index
 * 
 * Reference: Bastien CH, Vallières A, Morin CM. (2001)
 * Validation of the Insomnia Severity Index as an outcome measure 
 * for insomnia research. Sleep Medicine, 2(4), 297-307.
 * 
 * Public Domain - Free to use
 */

import type { ScaleDefinition } from './types';

export const ISI: ScaleDefinition = {
    id: 'ISI',
    name: '失眠严重程度指数',
    nameEn: 'Insomnia Severity Index',
    description: '请评估您过去两周的睡眠情况',

    questions: [
        {
            id: 'isi_q1',
            text: '入睡困难的严重程度',
            textEn: 'Difficulty falling asleep',
            options: [
                { value: 0, label: '没有', labelEn: 'None' },
                { value: 1, label: '轻微', labelEn: 'Mild' },
                { value: 2, label: '中等', labelEn: 'Moderate' },
                { value: 3, label: '严重', labelEn: 'Severe' },
                { value: 4, label: '非常严重', labelEn: 'Very severe' },
            ],
        },
        {
            id: 'isi_q2',
            text: '睡眠维持困难的严重程度',
            textEn: 'Difficulty staying asleep',
            options: [
                { value: 0, label: '没有', labelEn: 'None' },
                { value: 1, label: '轻微', labelEn: 'Mild' },
                { value: 2, label: '中等', labelEn: 'Moderate' },
                { value: 3, label: '严重', labelEn: 'Severe' },
                { value: 4, label: '非常严重', labelEn: 'Very severe' },
            ],
        },
        {
            id: 'isi_q3',
            text: '早醒的严重程度',
            textEn: 'Problem waking up too early',
            options: [
                { value: 0, label: '没有', labelEn: 'None' },
                { value: 1, label: '轻微', labelEn: 'Mild' },
                { value: 2, label: '中等', labelEn: 'Moderate' },
                { value: 3, label: '严重', labelEn: 'Severe' },
                { value: 4, label: '非常严重', labelEn: 'Very severe' },
            ],
        },
        {
            id: 'isi_q4',
            text: '您对目前的睡眠模式满意程度如何？',
            textEn: 'How satisfied/dissatisfied are you with your current sleep pattern?',
            options: [
                { value: 0, label: '非常满意', labelEn: 'Very satisfied' },
                { value: 1, label: '满意', labelEn: 'Satisfied' },
                { value: 2, label: '一般', labelEn: 'Moderately satisfied' },
                { value: 3, label: '不满意', labelEn: 'Dissatisfied' },
                { value: 4, label: '非常不满意', labelEn: 'Very dissatisfied' },
            ],
        },
        {
            id: 'isi_q5',
            text: '您的睡眠问题在多大程度上影响了您的日常功能？',
            textEn: 'How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?',
            options: [
                { value: 0, label: '完全不影响', labelEn: 'Not at all noticeable' },
                { value: 1, label: '有点影响', labelEn: 'A little' },
                { value: 2, label: '有些影响', labelEn: 'Somewhat' },
                { value: 3, label: '很大影响', labelEn: 'Much' },
                { value: 4, label: '非常大影响', labelEn: 'Very much noticeable' },
            ],
        },
        {
            id: 'isi_q6',
            text: '您有多担心/苦恼自己目前的睡眠问题？',
            textEn: 'How worried/distressed are you about your current sleep problem?',
            options: [
                { value: 0, label: '完全不担心', labelEn: 'Not at all worried' },
                { value: 1, label: '有点担心', labelEn: 'A little' },
                { value: 2, label: '有些担心', labelEn: 'Somewhat' },
                { value: 3, label: '很担心', labelEn: 'Much' },
                { value: 4, label: '非常担心', labelEn: 'Very much worried' },
            ],
        },
        {
            id: 'isi_q7',
            text: '您认为您目前的睡眠问题在多大程度上影响了您的日常功能（如白天疲劳、工作/日常杂务、注意力、记忆力、情绪等）？',
            textEn: 'To what extent do you consider your sleep problem to interfere with your daily functioning (e.g., daytime fatigue, mood, ability to function at work/daily chores, concentration, memory, mood, etc.) currently?',
            options: [
                { value: 0, label: '完全不影响', labelEn: 'Not at all interfering' },
                { value: 1, label: '有点影响', labelEn: 'A little' },
                { value: 2, label: '有些影响', labelEn: 'Somewhat' },
                { value: 3, label: '很大影响', labelEn: 'Much' },
                { value: 4, label: '非常大影响', labelEn: 'Very much interfering' },
            ],
        },
    ],

    scoring: {
        minScore: 0,
        maxScore: 28,
        interpretation: [
            { minScore: 0, maxScore: 7, level: 'minimal', label: '无临床意义的失眠', labelEn: 'No clinically significant insomnia' },
            { minScore: 8, maxScore: 14, level: 'mild', label: '轻度失眠', labelEn: 'Subthreshold insomnia' },
            { minScore: 15, maxScore: 21, level: 'moderate', label: '中度失眠', labelEn: 'Clinical insomnia (moderate severity)' },
            { minScore: 22, maxScore: 28, level: 'severe', label: '重度失眠', labelEn: 'Clinical insomnia (severe)' },
        ],
    },
};

export function interpretISIScore(score: number): string {
    const interpretation = ISI.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}
