/**
 * Property Test: Language Preference for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 9: Language Preference Compliance
 * Validates: Requirements 7.1, 7.4
 * 
 * All user-facing messages SHALL be displayed in the user's preferred language,
 * AND the language preference SHALL be consistently applied across all dialog states.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateQuestionsFromDataStatus } from '@/lib/max/question-generator';
import { generateFallbackPlan } from '@/lib/max/plan-generator';
import { generateReplacement } from '@/lib/max/plan-replacer';
import type { DataStatus, PlanItemDraft, PlanCategory } from '@/types/max-plan';

// ============================================
// Generators
// ============================================

const languageArb = fc.constantFrom('zh' as const, 'en' as const);

const dataStatusArb: fc.Arbitrary<DataStatus> = fc.record({
  hasInquiryData: fc.boolean(),
  hasCalibrationData: fc.boolean(),
  hasHrvData: fc.boolean(),
  inquirySummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  calibrationSummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  hrvSummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  lastInquiryDate: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  lastCalibrationDate: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

const categoryArb: fc.Arbitrary<PlanCategory> = fc.constantFrom(
  'sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'
);

const planItemArb: fc.Arbitrary<PlanItemDraft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  action: fc.string({ minLength: 1, maxLength: 200 }),
  rationale: fc.string({ minLength: 1, maxLength: 100 }),
  difficulty: fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const),
  category: categoryArb,
});

// ============================================
// Helper Functions
// ============================================

/**
 * Check if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Check if text is primarily English (no Chinese characters)
 */
function isPrimarilyEnglish(text: string): boolean {
  return !containsChinese(text);
}

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 9: Language Preference Compliance', () => {
  it('should generate questions in the specified language', () => {
    fc.assert(
      fc.property(
        dataStatusArb,
        languageArb,
        (dataStatus, language) => {
          const questions = generateQuestionsFromDataStatus(dataStatus, language);
          
          if (questions.length === 0) return; // Skip if no questions generated
          
          questions.forEach(question => {
            if (language === 'zh') {
              // Chinese questions should contain Chinese characters
              expect(containsChinese(question.text)).toBe(true);
            } else {
              // English questions should not contain Chinese characters
              expect(isPrimarilyEnglish(question.text)).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate question options in the specified language', () => {
    fc.assert(
      fc.property(
        dataStatusArb,
        languageArb,
        (dataStatus, language) => {
          const questions = generateQuestionsFromDataStatus(dataStatus, language);
          
          if (questions.length === 0) return;
          
          questions.forEach(question => {
            if (question.options && question.options.length > 0) {
              question.options.forEach(option => {
                if (language === 'zh') {
                  expect(containsChinese(option.label)).toBe(true);
                } else {
                  expect(isPrimarilyEnglish(option.label)).toBe(true);
                }
              });
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate fallback plan items in the specified language', () => {
    fc.assert(
      fc.property(
        languageArb,
        (language) => {
          const mockData = {
            userId: 'test-user',
            inquiry: null,
            calibration: null,
            hrv: null,
            profile: null,
            dataStatus: {
              hasInquiryData: false,
              hasCalibrationData: false,
              hasHrvData: false,
            },
          };
          
          const items = generateFallbackPlan(mockData, {}, language);
          
          expect(items.length).toBeGreaterThan(0);
          
          items.forEach(item => {
            if (language === 'zh') {
              // Chinese items should contain Chinese characters
              const hasChinese = containsChinese(item.title) || 
                containsChinese(item.action) || 
                containsChinese(item.rationale);
              expect(hasChinese).toBe(true);
            } else {
              // English items should not contain Chinese characters
              expect(isPrimarilyEnglish(item.title)).toBe(true);
              expect(isPrimarilyEnglish(item.action)).toBe(true);
              expect(isPrimarilyEnglish(item.rationale)).toBe(true);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate replacement items in the specified language', () => {
    fc.assert(
      fc.property(
        planItemArb,
        languageArb,
        (originalItem, language) => {
          const replacement = generateReplacement(originalItem, language);
          
          if (language === 'zh') {
            // Chinese replacement should contain Chinese characters
            const hasChinese = containsChinese(replacement.title) || 
              containsChinese(replacement.action) || 
              containsChinese(replacement.rationale);
            expect(hasChinese).toBe(true);
          } else {
            // English replacement should not contain Chinese characters
            expect(isPrimarilyEnglish(replacement.title)).toBe(true);
            expect(isPrimarilyEnglish(replacement.action)).toBe(true);
            expect(isPrimarilyEnglish(replacement.rationale)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain language consistency across all generated content', () => {
    fc.assert(
      fc.property(
        languageArb,
        (language) => {
          // Generate questions
          const dataStatus: DataStatus = {
            hasInquiryData: false,
            hasCalibrationData: false,
            hasHrvData: false,
          };
          const questions = generateQuestionsFromDataStatus(dataStatus, language);
          
          // Generate fallback plan
          const mockData = {
            userId: 'test-user',
            inquiry: null,
            calibration: null,
            hrv: null,
            profile: null,
            dataStatus,
          };
          const planItems = generateFallbackPlan(mockData, {}, language);
          
          // All content should be in the same language
          const allContent = [
            ...questions.map(q => q.text),
            ...questions.flatMap(q => q.options?.map(o => o.label) || []),
            ...planItems.map(p => p.title),
            ...planItems.map(p => p.action),
            ...planItems.map(p => p.rationale),
          ];
          
          if (language === 'zh') {
            // At least some content should contain Chinese
            const hasAnyChinese = allContent.some(text => containsChinese(text));
            expect(hasAnyChinese).toBe(true);
          } else {
            // No content should contain Chinese
            const hasAnyChinese = allContent.some(text => containsChinese(text));
            expect(hasAnyChinese).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should support both zh and en languages', () => {
    const dataStatus: DataStatus = {
      hasInquiryData: false,
      hasCalibrationData: false,
      hasHrvData: false,
    };
    
    const zhQuestions = generateQuestionsFromDataStatus(dataStatus, 'zh');
    const enQuestions = generateQuestionsFromDataStatus(dataStatus, 'en');
    
    // Both should generate questions
    expect(zhQuestions.length).toBeGreaterThan(0);
    expect(enQuestions.length).toBeGreaterThan(0);
    
    // Questions should be different
    expect(zhQuestions[0].text).not.toBe(enQuestions[0].text);
  });

  it('should handle language switching correctly', () => {
    fc.assert(
      fc.property(
        planItemArb,
        (originalItem) => {
          const zhReplacement = generateReplacement(originalItem, 'zh');
          const enReplacement = generateReplacement(originalItem, 'en');
          
          // Both should have same category
          expect(zhReplacement.category).toBe(originalItem.category);
          expect(enReplacement.category).toBe(originalItem.category);
          
          // Content should be in different languages
          const zhHasChinese = containsChinese(zhReplacement.title) || 
            containsChinese(zhReplacement.action);
          const enHasChinese = containsChinese(enReplacement.title) || 
            containsChinese(enReplacement.action);
          
          expect(zhHasChinese).toBe(true);
          expect(enHasChinese).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});
