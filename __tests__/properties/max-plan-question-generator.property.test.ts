/**
 * Property Test: Question Generator for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 2: Data-Driven Question Generation
 * Validates: Requirements 1.2, 1.3, 2.1, 2.2, 2.4
 * 
 * For any user data state, if inquiry data is empty or older than 7 days,
 * OR if calibration data is missing, the system SHALL generate proactive questions,
 * and the total number of questions SHALL NOT exceed 3.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateQuestions,
  generateQuestionsFromDataStatus,
  getNextQuestion,
  identifyMissingData,
  validateQuestionCount,
  MAX_QUESTIONS,
} from '@/lib/max/question-generator';
import type {
  DataStatus,
  QuestionType,
  QuestionContext,
  GeneratedQuestion,
} from '@/types/max-plan';

// ============================================
// Generators
// ============================================

/** Generate a random data status */
const dataStatusArb: fc.Arbitrary<DataStatus> = fc.record({
  hasInquiryData: fc.boolean(),
  hasCalibrationData: fc.boolean(),
  hasHrvData: fc.boolean(),
  inquirySummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  calibrationSummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  hrvSummary: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

/** Generate a data status with missing data */
const missingDataStatusArb: fc.Arbitrary<DataStatus> = fc.record({
  hasInquiryData: fc.constant(false),
  hasCalibrationData: fc.constant(false),
  hasHrvData: fc.boolean(),
});

/** Generate a language */
const languageArb = fc.constantFrom('zh' as const, 'en' as const);

/** Generate a list of question types */
const questionTypesArb: fc.Arbitrary<QuestionType[]> = fc.subarray(
  ['concern', 'sleep', 'stress', 'energy', 'mood', 'goal'] as QuestionType[],
  { minLength: 0, maxLength: 6 }
);

/** Generate asked questions (0 to MAX_QUESTIONS) */
const askedQuestionsArb: fc.Arbitrary<QuestionType[]> = fc.subarray(
  ['concern', 'sleep', 'stress', 'energy', 'mood', 'goal'] as QuestionType[],
  { minLength: 0, maxLength: MAX_QUESTIONS }
);

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 2: Data-Driven Question Generation', () => {
  it('should never generate more than MAX_QUESTIONS questions', () => {
    fc.assert(
      fc.property(
        dataStatusArb,
        languageArb,
        (dataStatus, language) => {
          const questions = generateQuestionsFromDataStatus(dataStatus, language);
          
          // Property: Question count should never exceed MAX_QUESTIONS
          expect(questions.length).toBeLessThanOrEqual(MAX_QUESTIONS);
          expect(validateQuestionCount(questions)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate questions when inquiry data is missing', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasInquiryData: fc.constant(false),
          hasCalibrationData: fc.boolean(),
          hasHrvData: fc.boolean(),
        }),
        (dataStatus) => {
          const missingData = identifyMissingData(dataStatus);
          
          // Property: Missing inquiry data should trigger concern question
          expect(missingData).toContain('concern');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate questions when calibration data is missing', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasInquiryData: fc.boolean(),
          hasCalibrationData: fc.constant(false),
          hasHrvData: fc.boolean(),
        }),
        (dataStatus) => {
          const missingData = identifyMissingData(dataStatus);
          
          // Property: Missing calibration data should trigger sleep, stress, energy questions
          expect(missingData).toContain('sleep');
          expect(missingData).toContain('stress');
          expect(missingData).toContain('energy');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate questions with correct structure', () => {
    fc.assert(
      fc.property(
        questionTypesArb.filter(types => types.length > 0),
        languageArb,
        (missingData, language) => {
          const context: QuestionContext = {
            missingData,
            userProfile: null,
            language,
          };
          
          const questions = generateQuestions(context);
          
          // Property: Each question should have required fields
          questions.forEach(question => {
            expect(question.id).toBeDefined();
            expect(typeof question.id).toBe('string');
            expect(question.id.length).toBeGreaterThan(0);
            
            expect(question.type).toBeDefined();
            expect(['concern', 'sleep', 'stress', 'energy', 'mood', 'goal']).toContain(question.type);
            
            expect(question.text).toBeDefined();
            expect(typeof question.text).toBe('string');
            expect(question.text.length).toBeGreaterThan(0);
            
            expect(question.options).toBeDefined();
            expect(Array.isArray(question.options)).toBe(true);
            expect(question.options!.length).toBeGreaterThan(0);
            
            expect(typeof question.priority).toBe('number');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect question limit when getting next question', () => {
    fc.assert(
      fc.property(
        askedQuestionsArb,
        dataStatusArb,
        languageArb,
        (askedQuestions, dataStatus, language) => {
          const nextQuestion = getNextQuestion(askedQuestions, dataStatus, language);
          
          // Property: If MAX_QUESTIONS already asked, should return null
          if (askedQuestions.length >= MAX_QUESTIONS) {
            expect(nextQuestion).toBeNull();
          }
          
          // Property: If next question exists, it should not be in asked questions
          if (nextQuestion !== null) {
            expect(askedQuestions).not.toContain(nextQuestion.type);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not repeat questions that have been asked', () => {
    fc.assert(
      fc.property(
        missingDataStatusArb,
        languageArb,
        (dataStatus, language) => {
          const askedQuestions: QuestionType[] = [];
          const allQuestions: GeneratedQuestion[] = [];
          
          // Simulate asking questions one by one
          for (let i = 0; i < MAX_QUESTIONS + 1; i++) {
            const nextQuestion = getNextQuestion(askedQuestions, dataStatus, language);
            
            if (nextQuestion) {
              // Property: Question type should not be repeated
              expect(askedQuestions).not.toContain(nextQuestion.type);
              
              askedQuestions.push(nextQuestion.type);
              allQuestions.push(nextQuestion);
            }
          }
          
          // Property: Total questions should not exceed MAX_QUESTIONS
          expect(allQuestions.length).toBeLessThanOrEqual(MAX_QUESTIONS);
          
          // Property: All question types should be unique
          const types = allQuestions.map(q => q.type);
          const uniqueTypes = new Set(types);
          expect(uniqueTypes.size).toBe(types.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate questions in priority order', () => {
    fc.assert(
      fc.property(
        missingDataStatusArb,
        languageArb,
        (dataStatus, language) => {
          const questions = generateQuestionsFromDataStatus(dataStatus, language);
          
          // Property: Questions should be sorted by priority (ascending)
          for (let i = 1; i < questions.length; i++) {
            expect(questions[i].priority).toBeGreaterThanOrEqual(questions[i - 1].priority);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support both Chinese and English languages', () => {
    fc.assert(
      fc.property(
        missingDataStatusArb,
        (dataStatus) => {
          const zhQuestions = generateQuestionsFromDataStatus(dataStatus, 'zh');
          const enQuestions = generateQuestionsFromDataStatus(dataStatus, 'en');
          
          // Property: Both languages should generate same number of questions
          expect(zhQuestions.length).toBe(enQuestions.length);
          
          // Property: Question types should be the same
          const zhTypes = zhQuestions.map(q => q.type).sort();
          const enTypes = enQuestions.map(q => q.type).sort();
          expect(zhTypes).toEqual(enTypes);
          
          // Property: Chinese questions should contain Chinese characters
          zhQuestions.forEach(q => {
            expect(/[\u4e00-\u9fa5]/.test(q.text)).toBe(true);
          });
          
          // Property: English questions should not contain Chinese characters
          enQuestions.forEach(q => {
            expect(/[\u4e00-\u9fa5]/.test(q.text)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
