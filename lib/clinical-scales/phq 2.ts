/**
 * PHQ-9 / PHQ-2 - Patient Health Questionnaire
 * 
 * Reference: Kroenke K, Spitzer RL, Williams JB. (2001)
 * The PHQ-9: validity of a brief depression severity measure.
 * Journal of General Internal Medicine, 16(9), 606-613.
 * 
 * Public Domain - Free to use
 * 
 * ⚠️ SAFETY NOTE: Question 9 assesses suicidal ideation.
 * Must implement safety branch when value ≥ 1.
 */

import type { ScaleDefinition } from './types';

export const PHQ9: ScaleDefinition = {
    id: 'PHQ9',
    name: '患者健康问卷-9',
    nameEn: 'Patient Health Questionnaire-9',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        {
            id: 'phq9_q1',
            text: '做事时提不起劲或没有兴趣',
            textEn: 'Little interest or pleasure in doing things',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q2',
            text: '感到心情低落、沮丧或绝望',
            textEn: 'Feeling down, depressed, or hopeless',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q3',
            text: '入睡困难、睡不安稳或睡眠过多',
            textEn: 'Trouble falling or staying asleep, or sleeping too much',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q4',
            text: '感觉疲倦或没有活力',
            textEn: 'Feeling tired or having little energy',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q5',
            text: '食欲不振或吃太多',
            textEn: 'Poor appetite or overeating',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q6',
            text: '觉得自己很糟糕或觉得自己很失败，或让自己或家人失望',
            textEn: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q7',
            text: '对事物专注有困难，例如阅读报纸或看电视',
            textEn: 'Trouble concentrating on things, such as reading the newspaper or watching television',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q8',
            text: '动作或说话速度缓慢到别人可以觉察，或正好相反——Loss烦躁或坐立不安',
            textEn: 'Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q9',
            text: '有不如死掉或用某种方式伤害自己的念头',
            textEn: 'Thoughts that you would be better off dead or of hurting yourself in some way',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
            isSafetyQuestion: true,
            safetyThreshold: 1, // ≥ 1 triggers safety branch
        },
    ],

    shortVersion: {
        questionIds: ['phq9_q1', 'phq9_q2'],
        triggerThreshold: 3, // PHQ-2 ≥ 3 triggers full PHQ-9
    },

    scoring: {
        minScore: 0,
        maxScore: 27,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微抑郁', labelEn: 'Minimal depression' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度抑郁', labelEn: 'Mild depression' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度抑郁', labelEn: 'Moderate depression' },
            { minScore: 15, maxScore: 19, level: 'moderately_severe', label: '中重度抑郁', labelEn: 'Moderately severe depression' },
            { minScore: 20, maxScore: 27, level: 'severe', label: '重度抑郁', labelEn: 'Severe depression' },
        ],
    },
};

// PHQ-2 helper functions
export const PHQ2_QUESTION_IDS = PHQ9.shortVersion!.questionIds;
export const PHQ2_TRIGGER_THRESHOLD = PHQ9.shortVersion!.triggerThreshold;
export const PHQ9_SAFETY_QUESTION_ID = 'phq9_q9';

export function getPHQ2Questions() {
    return PHQ9.questions.filter(q => PHQ2_QUESTION_IDS.includes(q.id));
}

export function shouldTriggerFullPHQ9(phq2Score: number): boolean {
    return phq2Score >= PHQ2_TRIGGER_THRESHOLD;
}

export function isSafetyQuestionTriggered(questionId: string, value: number): boolean {
    if (questionId !== PHQ9_SAFETY_QUESTION_ID) return false;
    const question = PHQ9.questions.find(q => q.id === questionId);
    return question?.isSafetyQuestion && value >= (question.safetyThreshold || 1);
}

export function interpretPHQ9Score(score: number): string {
    const interpretation = PHQ9.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}
