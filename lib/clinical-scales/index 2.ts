/**
 * Clinical Scales Library - Main Export
 * 
 * Unified access to all clinical assessment scales used in the platform.
 */

// Types
export type {
    ScaleQuestion,
    ScaleOption,
    ScaleDefinition,
    ScoreInterpretation,
    UserScaleResponse,
    ScaleTriggerLog,
} from './types';

// GAD-7 / GAD-2 (Anxiety)
export {
    GAD7,
    GAD2_QUESTION_IDS,
    GAD2_TRIGGER_THRESHOLD,
    getGAD2Questions,
    shouldTriggerFullGAD7,
    interpretGAD7Score,
} from './gad';

// PHQ-9 / PHQ-2 (Depression)
export {
    PHQ9,
    PHQ2_QUESTION_IDS,
    PHQ2_TRIGGER_THRESHOLD,
    PHQ9_SAFETY_QUESTION_ID,
    getPHQ2Questions,
    shouldTriggerFullPHQ9,
    isSafetyQuestionTriggered,
    interpretPHQ9Score,
} from './phq';

// ISI (Insomnia)
export {
    ISI,
    interpretISIScore,
} from './isi';

// PSS-10 / PSS-4 (Stress)
export {
    PSS10,
    PSS4_QUESTION_IDS,
    getPSS4Questions,
    interpretPSS10Score,
} from './pss';

// Safety System
export {
    CRISIS_HOTLINES,
    SAFETY_MESSAGE,
    SAFETY_MESSAGE_EN,
    SAFETY_KEYWORDS,
    checkSafetyTrigger,
    getSafetyMessage,
    logSafetyEvent,
    containsSafetyKeywords,
} from './safety-system';

// Daily Questions
export {
    SLEEP_DURATION_QUESTION,
    SLEEP_QUALITY_QUESTION,
    STRESS_LEVEL_QUESTION,
    getDailyQuestions,
    calculateDailyIndex,
    checkDailyRedFlags,
} from './daily-questions';
export type { DailyQuestion } from './daily-questions';

// All scales in one object for dynamic access
export const SCALES = {
    GAD7: () => import('./gad').then(m => m.GAD7),
    PHQ9: () => import('./phq').then(m => m.PHQ9),
    ISI: () => import('./isi').then(m => m.ISI),
    PSS10: () => import('./pss').then(m => m.PSS10),
};
