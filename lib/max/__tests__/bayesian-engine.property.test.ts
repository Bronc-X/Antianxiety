/**
 * Property-Based Tests for Bayesian Engine
 * 
 * @module lib/max/__tests__/bayesian-engine.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateEvidenceWeight,
  calculateBayesianPosterior,
  calculateLikelihood
} from '../bayesian-engine';
import { Paper, EVIDENCE_WEIGHT_RANGE } from '@/types/max';

// Configure fast-check for 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Arbitrary for generating valid papers
const paperArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  relevance_score: fc.float({ min: 0, max: 1, noNaN: true }),
  url: fc.webUrl()
});

const papersArb = fc.array(paperArb, { minLength: 0, maxLength: 10 });

// Helper to create 32-bit float arbitraries
const float32 = (min: number, max: number) => 
  fc.float({ min: Math.fround(min), max: Math.fround(max), noNaN: true });

describe('Bayesian Engine Property Tests', () => {
  /**
   * **Feature: max-logic-engine, Property 4: Bayesian Formula Correctness**
   * **Validates: Requirements 3.2, 3.4**
   * 
   * For any valid Prior (0-100), Likelihood (0-1), and Evidence (0.1-0.9),
   * the calculated Posterior SHALL equal (Prior × Likelihood) / Evidence,
   * clamped to 0-100.
   */
  describe('Property 4: Bayesian Formula Correctness', () => {
    it('should calculate posterior using the correct formula', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          float32(0.01, 0.99),
          float32(EVIDENCE_WEIGHT_RANGE.min, EVIDENCE_WEIGHT_RANGE.max),
          (prior, likelihood, evidence) => {
            const posterior = calculateBayesianPosterior(prior, likelihood, evidence);
            
            // Calculate expected value
            const expected = Math.round((prior * likelihood) / evidence);
            const clampedExpected = Math.max(0, Math.min(100, expected));
            
            expect(posterior).toBe(clampedExpected);
          }
        )
      );
    });

    it('should always return posterior in 0-100 range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          float32(0.01, 0.99),
          float32(EVIDENCE_WEIGHT_RANGE.min, EVIDENCE_WEIGHT_RANGE.max),
          (prior, likelihood, evidence) => {
            const posterior = calculateBayesianPosterior(prior, likelihood, evidence);
            
            expect(posterior).toBeGreaterThanOrEqual(0);
            expect(posterior).toBeLessThanOrEqual(100);
          }
        )
      );
    });

    it('should handle edge case: prior = 0 always results in posterior = 0', () => {
      fc.assert(
        fc.property(
          float32(0.01, 0.99),
          float32(EVIDENCE_WEIGHT_RANGE.min, EVIDENCE_WEIGHT_RANGE.max),
          (likelihood, evidence) => {
            const posterior = calculateBayesianPosterior(0, likelihood, evidence);
            expect(posterior).toBe(0);
          }
        )
      );
    });

    it('should decrease posterior when evidence increases (inverse relationship)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 90 }),
          float32(0.3, 0.7),
          (prior, likelihood) => {
            const lowEvidence = EVIDENCE_WEIGHT_RANGE.min + 0.1;
            const highEvidence = EVIDENCE_WEIGHT_RANGE.max - 0.1;
            
            const posteriorLowEvidence = calculateBayesianPosterior(prior, likelihood, lowEvidence);
            const posteriorHighEvidence = calculateBayesianPosterior(prior, likelihood, highEvidence);
            
            // Higher evidence should result in lower or equal posterior
            expect(posteriorHighEvidence).toBeLessThanOrEqual(posteriorLowEvidence);
          }
        )
      );
    });
  });

  /**
   * **Feature: max-logic-engine, Property 5: Evidence Weight Bounds**
   * **Validates: Requirements 3.3**
   * 
   * For any set of Semantic Scholar papers, the calculated evidence weight
   * SHALL always be within the range 0.1 to 0.9.
   */
  describe('Property 5: Evidence Weight Bounds', () => {
    it('should always return evidence weight in 0.1-0.9 range', () => {
      fc.assert(
        fc.property(papersArb, (papers) => {
          const weight = calculateEvidenceWeight(papers);
          
          expect(weight).toBeGreaterThanOrEqual(EVIDENCE_WEIGHT_RANGE.min);
          expect(weight).toBeLessThanOrEqual(EVIDENCE_WEIGHT_RANGE.max);
        })
      );
    });

    it('should return default 0.5 for empty papers array', () => {
      const weight = calculateEvidenceWeight([]);
      expect(weight).toBe(0.5);
    });

    it('should return default 0.5 for undefined papers', () => {
      const weight = calculateEvidenceWeight(undefined as unknown as Paper[]);
      expect(weight).toBe(0.5);
    });

    it('should handle papers with extreme relevance scores', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              relevance_score: fc.float({ min: -100, max: 100, noNaN: true }),
              url: fc.string()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (papers) => {
            const weight = calculateEvidenceWeight(papers as Paper[]);
            
            // Even with extreme inputs, weight should be bounded
            expect(weight).toBeGreaterThanOrEqual(EVIDENCE_WEIGHT_RANGE.min);
            expect(weight).toBeLessThanOrEqual(EVIDENCE_WEIGHT_RANGE.max);
          }
        )
      );
    });
  });

  describe('Likelihood Calculation', () => {
    it('should return 0.5 for undefined HRV data', () => {
      const likelihood = calculateLikelihood(undefined);
      expect(likelihood).toBe(0.5);
    });

    it('should always return likelihood between 0.01 and 0.99', () => {
      fc.assert(
        fc.property(
          fc.record({
            rmssd: fc.float({ min: Math.fround(-100), max: Math.fround(200), noNaN: true }),
            sdnn: fc.float({ min: Math.fround(-100), max: Math.fround(200), noNaN: true }),
            lf_hf_ratio: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
            timestamp: fc.constant(new Date().toISOString())
          }),
          (hrvData) => {
            const likelihood = calculateLikelihood(hrvData);
            
            expect(likelihood).toBeGreaterThanOrEqual(0.01);
            expect(likelihood).toBeLessThanOrEqual(0.99);
          }
        )
      );
    });
  });
});
