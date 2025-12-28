/**
 * Property Test: Plan Item Replacer for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 6: Replacement Consistency
 * Validates: Requirements 4.1, 4.2
 * 
 * For any plan item replacement request, the returned replacement item SHALL have
 * the same category as the original item, AND the replacement item's title and
 * action SHALL be different from the original.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateReplacement,
  validateReplacementConsistency,
  generateReplacementOptions,
  getTemplatesForCategory,
} from '@/lib/max/plan-replacer';
import type {
  PlanItemDraft,
  PlanCategory,
  DifficultyLevel,
} from '@/types/max-plan';

// ============================================
// Generators
// ============================================

const difficultyArb: fc.Arbitrary<DifficultyLevel> = fc.constantFrom('easy', 'medium', 'hard');

const categoryArb: fc.Arbitrary<PlanCategory> = fc.constantFrom(
  'sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'
);

const languageArb = fc.constantFrom('zh' as const, 'en' as const);

/** Generate a valid plan item */
const planItemArb: fc.Arbitrary<PlanItemDraft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  action: fc.string({ minLength: 1, maxLength: 200 }),
  rationale: fc.string({ minLength: 1, maxLength: 100 }),
  difficulty: difficultyArb,
  category: categoryArb,
});

/** Generate a plan item with specific category */
const planItemWithCategoryArb = (category: PlanCategory): fc.Arbitrary<PlanItemDraft> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    action: fc.string({ minLength: 1, maxLength: 200 }),
    rationale: fc.string({ minLength: 1, maxLength: 100 }),
    difficulty: difficultyArb,
    category: fc.constant(category),
  });

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 6: Replacement Consistency', () => {
  it('should generate replacement with same category as original', () => {
    fc.assert(
      fc.property(
        categoryArb,
        languageArb,
        (category, language) => {
          return fc.assert(
            fc.property(
              planItemWithCategoryArb(category),
              (originalItem) => {
                const replacement = generateReplacement(originalItem, language);
                
                // Property: Replacement category must match original
                expect(replacement.category).toBe(originalItem.category);
              }
            ),
            { numRuns: 20 }
          );
        }
      ),
      { numRuns: 6 }
    );
  });

  it('should generate replacement with different title', () => {
    fc.assert(
      fc.property(
        planItemArb,
        languageArb,
        (originalItem, language) => {
          const replacement = generateReplacement(originalItem, language);
          
          // Property: Replacement title must be different from original
          // (unless there are no other templates available)
          const templates = getTemplatesForCategory(originalItem.category, language);
          if (templates.length > 1) {
            expect(replacement.title).not.toBe(originalItem.title);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate replacement with different action', () => {
    fc.assert(
      fc.property(
        planItemArb,
        languageArb,
        (originalItem, language) => {
          const replacement = generateReplacement(originalItem, language);
          
          // Property: Replacement action must be different from original
          const templates = getTemplatesForCategory(originalItem.category, language);
          if (templates.length > 1) {
            expect(replacement.action).not.toBe(originalItem.action);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate replacement with all required fields', () => {
    fc.assert(
      fc.property(
        planItemArb,
        languageArb,
        (originalItem, language) => {
          const replacement = generateReplacement(originalItem, language);
          
          // Property: Replacement must have all required fields
          expect(replacement.id).toBeDefined();
          expect(replacement.id.length).toBeGreaterThan(0);
          
          expect(replacement.title).toBeDefined();
          expect(replacement.title.length).toBeGreaterThan(0);
          
          expect(replacement.action).toBeDefined();
          expect(replacement.action.length).toBeGreaterThan(0);
          
          expect(replacement.rationale).toBeDefined();
          expect(replacement.rationale.length).toBeGreaterThan(0);
          
          expect(['easy', 'medium', 'hard']).toContain(replacement.difficulty);
          expect(['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits']).toContain(replacement.category);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate replacement consistency correctly', () => {
    fc.assert(
      fc.property(
        categoryArb,
        languageArb,
        (category, language) => {
          return fc.assert(
            fc.property(
              planItemWithCategoryArb(category),
              (originalItem) => {
                const replacement = generateReplacement(originalItem, language);
                
                // Property: Generated replacement should pass consistency validation
                const isConsistent = validateReplacementConsistency(originalItem, replacement);
                
                // Should be consistent if title and action are different
                const templates = getTemplatesForCategory(category, language);
                if (templates.length > 1) {
                  expect(isConsistent).toBe(true);
                }
              }
            ),
            { numRuns: 20 }
          );
        }
      ),
      { numRuns: 6 }
    );
  });

  it('should reject inconsistent replacements', () => {
    fc.assert(
      fc.property(
        planItemArb,
        (item) => {
          // Create a replacement with same title (invalid)
          const invalidReplacement: PlanItemDraft = {
            ...item,
            id: 'new_id',
          };
          
          // Property: Same title should fail consistency check
          expect(validateReplacementConsistency(item, invalidReplacement)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject replacements with different category', () => {
    fc.assert(
      fc.property(
        planItemArb,
        categoryArb,
        (item, differentCategory) => {
          // Skip if categories happen to match
          fc.pre(item.category !== differentCategory);
          
          // Create a replacement with different category (invalid)
          const invalidReplacement: PlanItemDraft = {
            id: 'new_id',
            title: 'Different Title',
            action: 'Different action',
            rationale: 'Different rationale',
            difficulty: 'easy',
            category: differentCategory,
          };
          
          // Property: Different category should fail consistency check
          expect(validateReplacementConsistency(item, invalidReplacement)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate multiple unique replacement options', () => {
    fc.assert(
      fc.property(
        categoryArb,
        languageArb,
        fc.integer({ min: 1, max: 3 }),
        (category, language, count) => {
          return fc.assert(
            fc.property(
              planItemWithCategoryArb(category),
              (originalItem) => {
                const options = generateReplacementOptions(originalItem, count, language);
                
                // Property: Should generate requested number of options (or less if not enough templates)
                expect(options.length).toBeLessThanOrEqual(count);
                
                // Property: All options should have same category
                options.forEach(option => {
                  expect(option.category).toBe(originalItem.category);
                });
                
                // Property: All options should have unique titles
                const titles = options.map(o => o.title);
                const uniqueTitles = new Set(titles);
                expect(uniqueTitles.size).toBe(titles.length);
                
                // Property: None of the options should match original title
                options.forEach(option => {
                  expect(option.title).not.toBe(originalItem.title);
                });
              }
            ),
            { numRuns: 10 }
          );
        }
      ),
      { numRuns: 6 }
    );
  });

  it('should support both Chinese and English languages', () => {
    fc.assert(
      fc.property(
        categoryArb,
        (category) => {
          return fc.assert(
            fc.property(
              planItemWithCategoryArb(category),
              (originalItem) => {
                const zhReplacement = generateReplacement(originalItem, 'zh');
                const enReplacement = generateReplacement(originalItem, 'en');
                
                // Property: Both should have same category
                expect(zhReplacement.category).toBe(originalItem.category);
                expect(enReplacement.category).toBe(originalItem.category);
                
                // Property: Chinese replacement should contain Chinese characters
                const zhHasChinese = /[\u4e00-\u9fa5]/.test(zhReplacement.title) ||
                  /[\u4e00-\u9fa5]/.test(zhReplacement.action) ||
                  /[\u4e00-\u9fa5]/.test(zhReplacement.rationale);
                expect(zhHasChinese).toBe(true);
                
                // Property: English replacement should not contain Chinese characters
                const enHasChinese = /[\u4e00-\u9fa5]/.test(enReplacement.title) ||
                  /[\u4e00-\u9fa5]/.test(enReplacement.action) ||
                  /[\u4e00-\u9fa5]/.test(enReplacement.rationale);
                expect(enHasChinese).toBe(false);
              }
            ),
            { numRuns: 10 }
          );
        }
      ),
      { numRuns: 6 }
    );
  });
});
