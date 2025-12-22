/**
 * GAD-7 / GAD-2 - Generalized Anxiety Disorder Scale
 * 
 * Reference: Spitzer RL, Kroenke K, Williams JBW, Löwe B. (2006)
 * A Brief Measure for Assessing Generalized Anxiety Disorder.
 * Archives of Internal Medicine, 166(10), 1092-1097.
 * 
 * Public Domain - Free to use
 */

import type { ScaleDefinition } from './types';

export const GAD7: ScaleDefinition = {
    id: 'GAD7',
    name: '广泛性焦虑障碍量表-7',
    nameEn: 'Generalized Anxiety Disorder 7-item Scale',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        {
            id: 'gad7_q1',
            text: '感到紧张、焦虑或急切',
            textEn: 'Feeling nervous, anxious, or on edge',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q2',
            text: '不能停止或控制担忧',
            textEn: 'Not being able to stop or control worrying',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q3',
            text: '对各种各样的事情担忧过多',
            textEn: 'Worrying too much about different things',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q4',
            text: '很难放松下来',
            textEn: 'Trouble relaxing',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q5',
            text: '由于不安而无法静坐',
            textEn: 'Being so restless that it is hard to sit still',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q6',
            text: '变得容易烦恼或急躁',
            textEn: 'Becoming easily annoyed or irritable',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q7',
            text: '感到好像将有可怕的事情发生',
            textEn: 'Feeling afraid, as if something awful might happen',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
    ],

    shortVersion: {
        questionIds: ['gad7_q1', 'gad7_q2'],
        triggerThreshold: 3, // GAD-2 ≥ 3 triggers full GAD-7
    },

    scoring: {
        minScore: 0,
        maxScore: 21,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微焦虑', labelEn: 'Minimal anxiety' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度焦虑', labelEn: 'Mild anxiety' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度焦虑', labelEn: 'Moderate anxiety' },
            { minScore: 15, maxScore: 21, level: 'severe', label: '重度焦虑', labelEn: 'Severe anxiety' },
        ],
    },
};

// GAD-2 helper functions
export const GAD2_QUESTION_IDS = GAD7.shortVersion!.questionIds;
export const GAD2_TRIGGER_THRESHOLD = GAD7.shortVersion!.triggerThreshold;

export function getGAD2Questions() {
    return GAD7.questions.filter(q => GAD2_QUESTION_IDS.includes(q.id));
}

export function shouldTriggerFullGAD7(gad2Score: number): boolean {
    return gad2Score >= GAD2_TRIGGER_THRESHOLD;
}

export function interpretGAD7Score(score: number): string {
    const interpretation = GAD7.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}
