/**
 * **Feature: bayesian-belief-loop, Property Tests**
 * 
 * 贝叶斯信念循环属性测试
 * 使用 fast-check 进行属性基测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Evidence,
  calculateBayesianPosterior,
  normalizeWeights,
  validateEvidenceWeight,
  serializeEvidenceStack,
  deserializeEvidenceStack,
  calculateExaggerationFactor
} from '../bayesian-evidence';

// ============================================
// Property Tests
// ============================================

describe('Bayesian Belief Loop - Property Tests', () => {
  // ============================================
  // Generators
  // ============================================
  
  const priorScoreArb = fc.integer({ min: 0, max: 100 });
  
  const evidenceTypeArb = fc.constantFrom('bio', 'science', 'action') as fc.Arbitrary<'bio' | 'science' | 'action'>;
  
  const evidenceArb: fc.Arbitrary<Evidence> = fc.record({
    type: evidenceTypeArb,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.05, max: 0.6, noNaN: true }),
    source_id: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
    consensus: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined })
  });
  
  const evidenceStackArb = fc.array(evidenceArb, { minLength: 1, maxLength: 5 });

  // Bio evidence with valid weight bounds
  const bioEvidenceArb: fc.Arbitrary<Evidence> = fc.record({
    type: fc.constant('bio') as fc.Arbitrary<'bio'>,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.2, max: 0.4, noNaN: true }),
    consensus: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined })
  });

  // Science evidence with valid weight bounds
  const scienceEvidenceArb: fc.Arbitrary<Evidence> = fc.record({
    type: fc.constant('science') as fc.Arbitrary<'science'>,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.3, max: 0.6, noNaN: true }),
    source_id: fc.string({ minLength: 5, maxLength: 20 }),
    consensus: fc.double({ min: 0, max: 1, noNaN: true })
  });

  // Action evidence with valid weight bounds
  const actionEvidenceArb: fc.Arbitrary<Evidence> = fc.record({
    type: fc.constant('action') as fc.Arbitrary<'action'>,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.05, max: 0.2, noNaN: true }),
    consensus: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined })
  });

  // ============================================
  // Property 1: Posterior Score Bounds Invariant
  // **Feature: bayesian-belief-loop, Property 1: Posterior Score Bounds Invariant**
  // **Validates: Requirements 3.2, 7.2**
  // ============================================
  describe('Property 1: Posterior Score Bounds Invariant', () => {
    it('*For any* prior score (0-100) and any evidence stack, posterior SHALL be in [0, 100]', () => {
      fc.assert(
        fc.property(
          priorScoreArb,
          evidenceStackArb,
          (prior, evidenceStack) => {
            const posterior = calculateBayesianPosterior(prior, evidenceStack);
            
            expect(posterior).toBeGreaterThanOrEqual(0);
            expect(posterior).toBeLessThanOrEqual(100);
            expect(Number.isInteger(posterior)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return prior when evidence stack is empty', () => {
      fc.assert(
        fc.property(
          priorScoreArb,
          (prior) => {
            const posterior = calculateBayesianPosterior(prior, []);
            expect(posterior).toBe(prior);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for invalid prior scores', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: -1 }),
            fc.integer({ min: 101, max: 1000 })
          ),
          evidenceStackArb,
          (invalidPrior, evidenceStack) => {
            expect(() => calculateBayesianPosterior(invalidPrior, evidenceStack))
              .toThrow('Prior score must be between 0 and 100');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================
  // Property 2: Evidence Weight Bounds
  // **Feature: bayesian-belief-loop, Property 2: Evidence Weight Bounds**
  // **Validates: Requirements 5.2, 5.3, 5.4**
  // ============================================
  describe('Property 2: Evidence Weight Bounds', () => {
    it('*For any* bio evidence, weight SHALL be in [0.2, 0.4]', () => {
      fc.assert(
        fc.property(
          bioEvidenceArb,
          (evidence) => {
            expect(validateEvidenceWeight(evidence)).toBe(true);
            expect(evidence.weight).toBeGreaterThanOrEqual(0.2);
            expect(evidence.weight).toBeLessThanOrEqual(0.4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('*For any* science evidence, weight SHALL be in [0.3, 0.6]', () => {
      fc.assert(
        fc.property(
          scienceEvidenceArb,
          (evidence) => {
            expect(validateEvidenceWeight(evidence)).toBe(true);
            expect(evidence.weight).toBeGreaterThanOrEqual(0.3);
            expect(evidence.weight).toBeLessThanOrEqual(0.6);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('*For any* action evidence, weight SHALL be in [0.05, 0.2]', () => {
      fc.assert(
        fc.property(
          actionEvidenceArb,
          (evidence) => {
            expect(validateEvidenceWeight(evidence)).toBe(true);
            expect(evidence.weight).toBeGreaterThanOrEqual(0.05);
            expect(evidence.weight).toBeLessThanOrEqual(0.2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject evidence with out-of-bounds weights', () => {
      // Bio evidence with invalid weight
      const invalidBio: Evidence = { type: 'bio', value: 'test', weight: 0.5 };
      expect(validateEvidenceWeight(invalidBio)).toBe(false);

      // Science evidence with invalid weight
      const invalidScience: Evidence = { type: 'science', value: 'test', weight: 0.1 };
      expect(validateEvidenceWeight(invalidScience)).toBe(false);

      // Action evidence with invalid weight
      const invalidAction: Evidence = { type: 'action', value: 'test', weight: 0.5 };
      expect(validateEvidenceWeight(invalidAction)).toBe(false);
    });
  });

  // ============================================
  // Property 3: Weight Normalization Invariant
  // **Feature: bayesian-belief-loop, Property 3: Weight Normalization Invariant**
  // **Validates: Requirements 5.5**
  // ============================================
  describe('Property 3: Weight Normalization Invariant', () => {
    it('*For any* evidence stack, normalized weights SHALL sum to 1.0', () => {
      fc.assert(
        fc.property(
          evidenceStackArb,
          (evidenceStack) => {
            const normalized = normalizeWeights(evidenceStack);
            const totalWeight = normalized.reduce((sum, e) => sum + e.weight, 0);
            
            expect(totalWeight).toBeCloseTo(1.0, 3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve evidence properties after normalization', () => {
      fc.assert(
        fc.property(
          evidenceStackArb,
          (evidenceStack) => {
            const normalized = normalizeWeights(evidenceStack);
            
            expect(normalized.length).toBe(evidenceStack.length);
            
            for (let i = 0; i < evidenceStack.length; i++) {
              expect(normalized[i].type).toBe(evidenceStack[i].type);
              expect(normalized[i].value).toBe(evidenceStack[i].value);
              expect(normalized[i].source_id).toBe(evidenceStack[i].source_id);
              expect(normalized[i].consensus).toBe(evidenceStack[i].consensus);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for empty input', () => {
      const result = normalizeWeights([]);
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // Property 4: Evidence Stack Round Trip
  // **Feature: bayesian-belief-loop, Property 4: Evidence Stack Round Trip**
  // **Validates: Requirements 3.5, 7.3, 7.5**
  // ============================================
  describe('Property 4: Evidence Stack Round Trip', () => {
    it('*For any* valid evidence stack, serialize then deserialize SHALL produce equivalent object', () => {
      fc.assert(
        fc.property(
          evidenceStackArb,
          (evidenceStack) => {
            const serialized = serializeEvidenceStack(evidenceStack);
            const deserialized = deserializeEvidenceStack(serialized);
            
            expect(deserialized.length).toBe(evidenceStack.length);
            
            for (let i = 0; i < evidenceStack.length; i++) {
              expect(deserialized[i].type).toBe(evidenceStack[i].type);
              expect(deserialized[i].value).toBe(evidenceStack[i].value);
              expect(deserialized[i].weight).toBeCloseTo(evidenceStack[i].weight, 10);
              expect(deserialized[i].source_id).toBe(evidenceStack[i].source_id);
              
              if (evidenceStack[i].consensus !== undefined) {
                expect(deserialized[i].consensus).toBeCloseTo(evidenceStack[i].consensus!, 10);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for invalid JSON', () => {
      expect(() => deserializeEvidenceStack('not valid json')).toThrow();
      expect(() => deserializeEvidenceStack('{"not": "array"}')).toThrow('Evidence stack must be an array');
    });
  });

  // ============================================
  // Property 6: Exaggeration Factor Calculation
  // **Feature: bayesian-belief-loop, Property 6: Exaggeration Factor Calculation**
  // **Validates: Requirements 3.3**
  // ============================================
  describe('Property 6: Exaggeration Factor Calculation', () => {
    it('*For any* prior and posterior where posterior > 0, exaggeration factor SHALL equal prior/posterior', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (prior, posterior) => {
            const factor = calculateExaggerationFactor(prior, posterior);
            const expected = Math.round((prior / posterior) * 10) / 10;
            
            expect(factor).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return Infinity when posterior is 0', () => {
      const factor = calculateExaggerationFactor(50, 0);
      expect(factor).toBe(Infinity);
    });

    it('should return 1.0 when prior equals posterior', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (score) => {
            const factor = calculateExaggerationFactor(score, score);
            expect(factor).toBe(1.0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 10: Database Trigger Idempotency
  // **Feature: bayesian-belief-loop, Property 10: Database Trigger Idempotency**
  // **Validates: Requirements 7.1, 7.2**
  // ============================================
  describe('Property 10: Database Trigger Idempotency', () => {
    it('*For any* belief record, multiple calculations with same evidence SHALL produce same posterior', () => {
      fc.assert(
        fc.property(
          priorScoreArb,
          evidenceStackArb,
          (prior, evidenceStack) => {
            const posterior1 = calculateBayesianPosterior(prior, evidenceStack);
            const posterior2 = calculateBayesianPosterior(prior, evidenceStack);
            const posterior3 = calculateBayesianPosterior(prior, evidenceStack);
            
            expect(posterior1).toBe(posterior2);
            expect(posterior2).toBe(posterior3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 11: Graceful Degradation on API Failure
  // **Feature: bayesian-belief-loop, Property 11: Graceful Degradation on API Failure**
  // **Validates: Requirements 8.5**
  // ============================================
  describe('Property 11: Graceful Degradation on API Failure', () => {
    it('*For any* calculation with only bio and action evidence, posterior SHALL be in [0, 100]', () => {
      const bioAndActionStackArb = fc.array(
        fc.oneof(bioEvidenceArb, actionEvidenceArb),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(
          priorScoreArb,
          bioAndActionStackArb,
          (prior, evidenceStack) => {
            const posterior = calculateBayesianPosterior(prior, evidenceStack);
            
            expect(posterior).toBeGreaterThanOrEqual(0);
            expect(posterior).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
