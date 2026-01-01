/**
 * Property-Based Tests for Health Assessment Engine
 * 
 * Using fast-check for property-based testing to verify:
 * - Tag invariants
 * - Score bounds
 * - Cross-analysis trigger conditions
 * - Severity calculation consistency
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    HealthAssessmentEngine,
    runHealthAssessment,
    extractTagsForStorage,
    requiresImmediateAttention,
    AVAILABLE_TAGS,
    type UserProfile,
    type QuestionnaireScores,
} from '../health-assessment-engine';
import {
    calculateScaleScore,
    GAD7_SCALE,
    SHSQ25_SCALE,
} from '../questionnaire-scales';

// ============ Arbitraries ============

const userProfileArb = fc.record({
    id: fc.uuid(),
    gender: fc.constantFrom('male', 'female', 'other') as fc.Arbitrary<'male' | 'female' | 'other'>,
    age: fc.integer({ min: 18, max: 100 }),
    height: fc.double({ min: 1.4, max: 2.2, noNaN: true, noDefaultInfinity: true }),
    weight: fc.double({ min: 40, max: 190, noNaN: true, noDefaultInfinity: true }),
    waistLine: fc.double({ min: 50, max: 150, noNaN: true, noDefaultInfinity: true }),
});

const gad7AnswerArb = fc.constantFrom('not_at_all', 'several_days', 'more_than_half', 'nearly_every_day');

const gad7ScoresArb = fc.record({
    gad7_1: gad7AnswerArb,
    gad7_2: gad7AnswerArb,
    gad7_3: gad7AnswerArb,
    gad7_4: gad7AnswerArb,
    gad7_5: gad7AnswerArb,
    gad7_6: gad7AnswerArb,
    gad7_7: gad7AnswerArb,
});

const shsq25AnswerArb = fc.constantFrom('never', 'sometimes', 'often', 'always');

const shsq25ScoresArb = fc.record(
    Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => [`shsq_${i + 1}`, shsq25AnswerArb])
    ) as Record<string, fc.Arbitrary<string>>
);

const questionnaireScoresArb = fc.record({
    gad7: fc.option(gad7ScoresArb, { nil: undefined }),
    shsq25: fc.option(shsq25ScoresArb, { nil: undefined }),
    customData: fc.option(
        fc.record({
            muscleWeakness: fc.boolean(),
            hairSkinScore: fc.integer({ min: 0, max: 10 }),
        }),
        { nil: undefined }
    ),
});

// ============ Property Tests ============

describe('HealthAssessmentEngine Properties', () => {
    // Property 1: Tags are always from predefined list
    it('Property 1: All generated tags must be from AVAILABLE_TAGS', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                for (const tag of result.tags) {
                    expect(AVAILABLE_TAGS).toContain(tag);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 2: GAD-7 score >= 10 triggers high cortisol risk tag
    it('Property 2: GAD-7 score >= 10 must trigger "高皮质醇风险" tag', () => {
        fc.assert(
            fc.property(userProfileArb, gad7ScoresArb, (profile, gad7Answers) => {
                const gad7Result = calculateScaleScore(GAD7_SCALE, gad7Answers);

                if (gad7Result.totalScore >= 10) {
                    const result = runHealthAssessment(profile, { gad7: gad7Answers });
                    expect(result.tags).toContain('高皮质醇风险');
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 3: Cross-analysis only triggers when both conditions are met
    it('Property 3: Stress Belly syndrome requires both high anxiety AND central obesity', () => {
        fc.assert(
            fc.property(
                userProfileArb,
                gad7ScoresArb,
                (profile, gad7Answers) => {
                    const result = runHealthAssessment(profile, { gad7: gad7Answers });

                    if (result.tags.includes('压力型肥胖')) {
                        expect(result.tags).toContain('高皮质醇风险');
                        expect(result.tags).toContain('中心性肥胖');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 4: BMI calculation bounds
    it('Property 4: BMI must be positive and within realistic bounds', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                if (result.bmi !== undefined) {
                    expect(result.bmi).toBeGreaterThan(0);
                    expect(result.bmi).toBeLessThan(100); // Realistic upper bound
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 5: Severity is monotonic with tag count
    it('Property 5: High severity requires at least 4 tags OR specific severe conditions', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                if (result.severity === 'high') {
                    const hasHighCondition = (
                        result.tags.includes('重度焦虑') ||
                        result.tags.includes('压力型肥胖') ||
                        result.tags.includes('激素衰退型') ||
                        result.tags.length >= 4
                    );
                    expect(hasHighCondition).toBe(true);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 6: Timestamp is always ISO format
    it('Property 6: Result timestamp must be valid ISO 8601', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                const parsed = Date.parse(result.timestamp);
                expect(Number.isNaN(parsed)).toBe(false);
            }),
            { numRuns: 50 }
        );
    });

    // Property 7: Report arrays have matching lengths (zh/en)
    it('Property 7: Chinese and English reports must have same number of entries', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                expect(result.analysisReport.length).toBe(result.analysisReportEn.length);
            }),
            { numRuns: 100 }
        );
    });

    // Property 8: extractTagsForStorage only returns valid tags
    it('Property 8: extractTagsForStorage filters invalid tags', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);
                const storageTags = extractTagsForStorage(result);

                for (const tag of storageTags) {
                    expect(AVAILABLE_TAGS).toContain(tag);
                }
            }),
            { numRuns: 50 }
        );
    });

    // Property 9: requiresImmediateAttention is true for high severity
    it('Property 9: High severity always requires immediate attention', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                if (result.severity === 'high') {
                    expect(requiresImmediateAttention(result)).toBe(true);
                }
            }),
            { numRuns: 100 }
        );
    });
});

// ============ GAD-7 Scale Properties ============

describe('GAD-7 Scale Properties', () => {
    // Property 10: Score bounds (0-21)
    it('Property 10: GAD-7 total score must be in [0, 21]', () => {
        fc.assert(
            fc.property(gad7ScoresArb, (answers) => {
                const result = calculateScaleScore(GAD7_SCALE, answers);

                expect(result.totalScore).toBeGreaterThanOrEqual(0);
                expect(result.totalScore).toBeLessThanOrEqual(21);
            }),
            { numRuns: 100 }
        );
    });

    // Property 11: Severity thresholds are correct
    it('Property 11: Severity thresholds match clinical standards', () => {
        fc.assert(
            fc.property(gad7ScoresArb, (answers) => {
                const result = calculateScaleScore(GAD7_SCALE, answers);

                if (result.totalScore <= 4) {
                    expect(result.severity).toBe('极轻微焦虑');
                } else if (result.totalScore <= 9) {
                    expect(result.severity).toBe('轻度焦虑');
                } else if (result.totalScore <= 14) {
                    expect(result.severity).toBe('中度焦虑');
                } else {
                    expect(result.severity).toBe('重度焦虑');
                }
            }),
            { numRuns: 100 }
        );
    });
});

// ============ SHSQ-25 Scale Properties ============

describe('SHSQ-25 Scale Properties', () => {
    // Property 12: Score bounds (0-75)
    it('Property 12: SHSQ-25 total score must be in [0, 75]', () => {
        fc.assert(
            fc.property(shsq25ScoresArb, (answers) => {
                const result = calculateScaleScore(SHSQ25_SCALE, answers);

                expect(result.totalScore).toBeGreaterThanOrEqual(0);
                expect(result.totalScore).toBeLessThanOrEqual(75);
            }),
            { numRuns: 100 }
        );
    });

    // Property 13: Subscores sum to total
    it('Property 13: SHSQ-25 subscores must sum to total score', () => {
        fc.assert(
            fc.property(shsq25ScoresArb, (answers) => {
                const result = calculateScaleScore(SHSQ25_SCALE, answers);

                if (result.subscores) {
                    const subscoreSum =
                        result.subscores.fatigue +
                        result.subscores.cardiovascular +
                        result.subscores.digestive +
                        result.subscores.immune +
                        result.subscores.mental;

                    expect(subscoreSum).toBe(result.totalScore);
                }
            }),
            { numRuns: 100 }
        );
    });

    // Property 14: Fatigue subscore bounds (0-27, 9 questions * 3 max)
    it('Property 14: Fatigue subscore must be in [0, 27]', () => {
        fc.assert(
            fc.property(shsq25ScoresArb, (answers) => {
                const result = calculateScaleScore(SHSQ25_SCALE, answers);

                if (result.subscores) {
                    expect(result.subscores.fatigue).toBeGreaterThanOrEqual(0);
                    expect(result.subscores.fatigue).toBeLessThanOrEqual(27);
                }
            }),
            { numRuns: 100 }
        );
    });
});

// ============ Cross-Analysis Properties ============

describe('Cross-Analysis Properties', () => {
    // Property 15: Only one syndrome is assigned at a time
    it('Property 15: At most one cross-analysis syndrome per assessment', () => {
        fc.assert(
            fc.property(userProfileArb, questionnaireScoresArb, (profile, scores) => {
                const result = runHealthAssessment(profile, scores);

                // Count syndrome tags
                const syndromes = ['压力型肥胖', '激素衰退型'].filter(s =>
                    result.tags.includes(s)
                );

                // At most one should be present (since they're mutually exclusive in logic)
                expect(syndromes.length).toBeLessThanOrEqual(1);
            }),
            { numRuns: 100 }
        );
    });
});
