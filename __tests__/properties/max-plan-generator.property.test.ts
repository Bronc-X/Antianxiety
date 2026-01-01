/**
 * Property Test: Plan Generator for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 4: Plan Generation Completeness
 * Feature: max-plan-creation-dialog, Property 5: HRV Data Integration
 * Validates: Requirements 3.1, 3.2, 3.3
 * 
 * Property 4: For any plan generation request with sufficient data, the generated plan
 * SHALL contain between 3 and 5 items (inclusive), and each item SHALL have non-empty
 * values for: title, action, rationale, difficulty, and category.
 * 
 * Property 5: For any plan generation where HRV data is available, at least one plan
 * item's rationale or action SHALL reference HRV-related insights.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateAndNormalize,
  validatePlanCompleteness,
  hasHrvContent,
  generateFallbackPlan,
  MIN_PLAN_ITEMS,
  MAX_PLAN_ITEMS,
} from '@/lib/max/plan-generator';
import type {
  PlanItemDraft,
  AggregatedPlanData,
  HrvData,
  CalibrationData,
  DifficultyLevel,
  PlanCategory,
} from '@/types/max-plan';

// ============================================
// Generators
// ============================================

const uuidArb = fc.uuid();

const difficultyArb: fc.Arbitrary<DifficultyLevel> = fc.constantFrom('easy', 'medium', 'hard');

const categoryArb: fc.Arbitrary<PlanCategory> = fc.constantFrom(
  'sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'
);

/** Generate a valid plan item */
const validPlanItemArb: fc.Arbitrary<PlanItemDraft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  action: fc.string({ minLength: 1, maxLength: 200 }),
  rationale: fc.string({ minLength: 1, maxLength: 100 }),
  difficulty: difficultyArb,
  category: categoryArb,
});

/** Generate an invalid plan item (missing required fields) */
const invalidPlanItemArb: fc.Arbitrary<PlanItemDraft> = fc.oneof(
  // Missing title
  fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.constant(''),
    action: fc.string({ minLength: 1 }),
    rationale: fc.string({ minLength: 1 }),
    difficulty: difficultyArb,
    category: categoryArb,
  }),
  // Missing action
  fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    action: fc.constant(''),
    rationale: fc.string({ minLength: 1 }),
    difficulty: difficultyArb,
    category: categoryArb,
  }),
  // Missing rationale
  fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    action: fc.string({ minLength: 1 }),
    rationale: fc.constant(''),
    difficulty: difficultyArb,
    category: categoryArb,
  })
);

/** Generate a list of valid plan items */
const validPlanItemsArb = (count: number): fc.Arbitrary<PlanItemDraft[]> =>
  fc.array(validPlanItemArb, { minLength: count, maxLength: count });

const isoDateArb = fc.integer({ min: 0, max: 365 * 5 }).map(daysAgo => {
  const date = new Date('2025-12-31T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString();
});

/** Generate HRV data */
const hrvDataArb: fc.Arbitrary<HrvData> = fc.record({
  date: isoDateArb,
  avgHrv: fc.integer({ min: 20, max: 100 }),
  minHrv: fc.integer({ min: 10, max: 50 }),
  maxHrv: fc.integer({ min: 50, max: 150 }),
  restingHr: fc.integer({ min: 40, max: 100 }),
  hrvTrend: fc.constantFrom('improving' as const, 'stable' as const, 'declining' as const),
  source: fc.string({ minLength: 1, maxLength: 20 }),
});

/** Generate calibration data */
const calibrationDataArb: fc.Arbitrary<CalibrationData> = fc.record({
  date: isoDateArb,
  sleepHours: fc.integer({ min: 0, max: 12 }),
  sleepQuality: fc.integer({ min: 0, max: 10 }),
  moodScore: fc.integer({ min: 0, max: 10 }),
  stressLevel: fc.integer({ min: 0, max: 10 }),
  energyLevel: fc.integer({ min: 0, max: 10 }),
});

/** Generate aggregated plan data */
const aggregatedDataArb: fc.Arbitrary<AggregatedPlanData> = fc.record({
  userId: uuidArb,
  inquiry: fc.constant(null),
  calibration: fc.option(calibrationDataArb, { nil: null }),
  hrv: fc.option(hrvDataArb, { nil: null }),
  profile: fc.constant(null),
  dataStatus: fc.record({
    hasInquiryData: fc.boolean(),
    hasCalibrationData: fc.boolean(),
    hasHrvData: fc.boolean(),
  }),
});

/** Generate aggregated data with HRV */
const aggregatedDataWithHrvArb: fc.Arbitrary<AggregatedPlanData> = fc.record({
  userId: uuidArb,
  inquiry: fc.constant(null),
  calibration: fc.option(calibrationDataArb, { nil: null }),
  hrv: hrvDataArb.filter(h => h.avgHrv > 0),
  profile: fc.constant(null),
  dataStatus: fc.record({
    hasInquiryData: fc.boolean(),
    hasCalibrationData: fc.boolean(),
    hasHrvData: fc.constant(true),
  }),
});

const languageArb = fc.constantFrom('zh' as const, 'en' as const);

const userResponsesArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.string({ minLength: 1, maxLength: 50 })
);

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 4: Plan Generation Completeness', () => {
  it('should validate plans with correct item count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_PLAN_ITEMS, max: MAX_PLAN_ITEMS }),
        (count) => {
          return fc.assert(
            fc.property(
              validPlanItemsArb(count),
              (items) => {
                // Property: Valid plans should pass completeness check
                expect(validatePlanCompleteness(items)).toBe(true);
              }
            ),
            { numRuns: 20 }
          );
        }
      ),
      { numRuns: 3 }
    );
  });

  it('should reject plans with too few items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MIN_PLAN_ITEMS - 1 }),
        (count) => {
          return fc.assert(
            fc.property(
              validPlanItemsArb(count),
              (items) => {
                // Property: Plans with too few items should fail
                expect(validatePlanCompleteness(items)).toBe(false);
              }
            ),
            { numRuns: 20 }
          );
        }
      ),
      { numRuns: 3 }
    );
  });

  it('should reject plans with too many items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_PLAN_ITEMS + 1, max: 10 }),
        (count) => {
          return fc.assert(
            fc.property(
              validPlanItemsArb(count),
              (items) => {
                // Property: Plans with too many items should fail
                expect(validatePlanCompleteness(items)).toBe(false);
              }
            ),
            { numRuns: 20 }
          );
        }
      ),
      { numRuns: 3 }
    );
  });

  it('should reject plans with invalid items', () => {
    fc.assert(
      fc.property(
        fc.array(invalidPlanItemArb, { minLength: MIN_PLAN_ITEMS, maxLength: MAX_PLAN_ITEMS }),
        (items) => {
          // Property: Plans with invalid items should fail
          expect(validatePlanCompleteness(items)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should normalize and validate items correctly', () => {
    fc.assert(
      fc.property(
        fc.array(validPlanItemArb, { minLength: 1, maxLength: 10 }),
        (items) => {
          const normalized = validateAndNormalize(items);
          
          // Property: Normalized items should not exceed MAX_PLAN_ITEMS
          expect(normalized.length).toBeLessThanOrEqual(MAX_PLAN_ITEMS);
          
          // Property: All normalized items should have required fields
          normalized.forEach(item => {
            expect(item.title.length).toBeGreaterThan(0);
            expect(item.action.length).toBeGreaterThan(0);
            expect(item.rationale.length).toBeGreaterThan(0);
            expect(['easy', 'medium', 'hard']).toContain(item.difficulty);
            expect(['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits']).toContain(item.category);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate fallback plan with correct structure', () => {
    fc.assert(
      fc.property(
        aggregatedDataArb,
        userResponsesArb,
        languageArb,
        (data, responses, language) => {
          const plan = generateFallbackPlan(data, responses, language);
          
          // Property: Fallback plan should have valid item count
          expect(plan.length).toBeGreaterThanOrEqual(MIN_PLAN_ITEMS);
          expect(plan.length).toBeLessThanOrEqual(MAX_PLAN_ITEMS);
          
          // Property: All items should have required fields
          plan.forEach(item => {
            expect(item.id.length).toBeGreaterThan(0);
            expect(item.title.length).toBeGreaterThan(0);
            expect(item.action.length).toBeGreaterThan(0);
            expect(item.rationale.length).toBeGreaterThan(0);
            expect(['easy', 'medium', 'hard']).toContain(item.difficulty);
            expect(['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits']).toContain(item.category);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: max-plan-creation-dialog, Property 5: HRV Data Integration', () => {
  it('should include HRV content when HRV data is available', () => {
    fc.assert(
      fc.property(
        aggregatedDataWithHrvArb,
        userResponsesArb,
        languageArb,
        (data, responses, language) => {
          const plan = generateFallbackPlan(data, responses, language);
          
          // Property: When HRV data is available, plan should reference HRV
          expect(hasHrvContent(plan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect HRV keywords correctly', () => {
    const hrvKeywordItems: PlanItemDraft[] = [
      {
        id: 'test1',
        title: 'Test',
        action: 'Test action',
        rationale: 'Based on your HRV data',
        difficulty: 'easy',
        category: 'mental',
      },
    ];
    
    const noHrvItems: PlanItemDraft[] = [
      {
        id: 'test2',
        title: 'Test',
        action: 'Test action',
        rationale: 'General health advice',
        difficulty: 'easy',
        category: 'mental',
      },
    ];
    
    // Property: Items with HRV keywords should be detected
    expect(hasHrvContent(hrvKeywordItems)).toBe(true);
    expect(hasHrvContent(noHrvItems)).toBe(false);
  });

  it('should detect Chinese HRV keywords', () => {
    const chineseHrvItems: PlanItemDraft[] = [
      {
        id: 'test3',
        title: '测试',
        action: '测试动作',
        rationale: '基于您的心率变异性数据',
        difficulty: 'easy',
        category: 'mental',
      },
    ];
    
    // Property: Chinese HRV keywords should be detected
    expect(hasHrvContent(chineseHrvItems)).toBe(true);
  });

  it('should generate language-appropriate content', () => {
    fc.assert(
      fc.property(
        aggregatedDataWithHrvArb,
        userResponsesArb,
        (data, responses) => {
          const zhPlan = generateFallbackPlan(data, responses, 'zh');
          const enPlan = generateFallbackPlan(data, responses, 'en');
          
          // Property: Chinese plan should contain Chinese characters
          const zhHasChinese = zhPlan.some(item =>
            /[\u4e00-\u9fa5]/.test(item.title) ||
            /[\u4e00-\u9fa5]/.test(item.action) ||
            /[\u4e00-\u9fa5]/.test(item.rationale)
          );
          expect(zhHasChinese).toBe(true);
          
          // Property: English plan should not contain Chinese characters in main content
          // (HRV note might be added which could contain Chinese)
          const enMainContent = enPlan.map(item => item.title + item.action).join('');
          expect(/[\u4e00-\u9fa5]/.test(enMainContent)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
