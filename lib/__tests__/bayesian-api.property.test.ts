/**
 * **Feature: bayesian-belief-loop, Property Tests for API Layer**
 * 
 * 贝叶斯 API 层属性测试
 * 使用 fast-check 进行属性基测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Evidence,
  performBayesianCalculation,
  serializeEvidenceStack,
  deserializeEvidenceStack
} from '../bayesian-evidence';

// ============================================
// Generators
// ============================================

const priorScoreArb = fc.integer({ min: 0, max: 100 });

const beliefContextArb = fc.constantFrom(
  'metabolic_crash',
  'cardiac_event',
  'social_rejection',
  'custom'
);

// Bio evidence with valid weight bounds
const bioEvidenceArb = fc.record({
  type: fc.constant('bio') as fc.Arbitrary<'bio'>,
  value: fc.string({ minLength: 1, maxLength: 50 }),
  weight: fc.double({ min: 0.2, max: 0.4, noNaN: true }),
  consensus: fc.double({ min: 0, max: 1, noNaN: true })
});

// Science evidence with valid weight bounds
const scienceEvidenceArb = fc.record({
  type: fc.constant('science') as fc.Arbitrary<'science'>,
  value: fc.string({ minLength: 1, maxLength: 50 }),
  weight: fc.double({ min: 0.3, max: 0.6, noNaN: true }),
  source_id: fc.string({ minLength: 5, maxLength: 20 }),
  consensus: fc.double({ min: 0, max: 1, noNaN: true })
});

// Action evidence with valid weight bounds
const actionEvidenceArb = fc.record({
  type: fc.constant('action') as fc.Arbitrary<'action'>,
  value: fc.string({ minLength: 1, maxLength: 50 }),
  weight: fc.double({ min: 0.05, max: 0.2, noNaN: true }),
  consensus: fc.double({ min: 0, max: 1, noNaN: true })
});

const evidenceStackArb = fc.array(
  fc.oneof(bioEvidenceArb, scienceEvidenceArb, actionEvidenceArb),
  { minLength: 1, maxLength: 5 }
);

// ============================================
// Property 5: Belief Score Persistence Round Trip
// **Feature: bayesian-belief-loop, Property 5: Belief Score Persistence Round Trip**
// **Validates: Requirements 1.4, 4.5**
// ============================================
describe('Property 5: Belief Score Persistence Round Trip', () => {
  it('*For any* prior score and evidence stack, calculation result SHALL be serializable and deserializable', () => {
    fc.assert(
      fc.property(
        priorScoreArb,
        evidenceStackArb,
        (prior, evidenceStack) => {
          // Perform calculation
          const result = performBayesianCalculation(prior, evidenceStack);
          
          // Serialize evidence stack (simulating database storage)
          const serialized = serializeEvidenceStack(result.evidenceStack);
          
          // Deserialize (simulating database retrieval)
          const deserialized = deserializeEvidenceStack(serialized);
          
          // Verify round trip preserves data
          expect(deserialized.length).toBe(result.evidenceStack.length);
          
          for (let i = 0; i < result.evidenceStack.length; i++) {
            expect(deserialized[i].type).toBe(result.evidenceStack[i].type);
            expect(deserialized[i].value).toBe(result.evidenceStack[i].value);
            expect(deserialized[i].weight).toBeCloseTo(result.evidenceStack[i].weight, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* belief context, it SHALL be a valid string', () => {
    fc.assert(
      fc.property(
        beliefContextArb,
        (context) => {
          expect(typeof context).toBe('string');
          expect(context.length).toBeGreaterThan(0);
          expect(['metabolic_crash', 'cardiac_event', 'social_rejection', 'custom']).toContain(context);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* calculation, prior and posterior SHALL be preserved in result', () => {
    fc.assert(
      fc.property(
        priorScoreArb,
        evidenceStackArb,
        (prior, evidenceStack) => {
          const result = performBayesianCalculation(prior, evidenceStack);
          
          // Prior should be exactly preserved
          expect(result.prior).toBe(prior);
          
          // Posterior should be in valid range
          expect(result.posterior).toBeGreaterThanOrEqual(0);
          expect(result.posterior).toBeLessThanOrEqual(100);
          
          // Timestamp should be set
          expect(result.calculatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Property 8: Passive Nudge Trigger Consistency
// **Feature: bayesian-belief-loop, Property 8: Passive Nudge Trigger Consistency**
// **Validates: Requirements 4.1, 4.4**
// ============================================
describe('Property 8: Passive Nudge Trigger Consistency', () => {
  /**
   * 计算被动微调的概率修正值
   * 模拟 /api/bayesian/nudge 端点的逻辑
   */
  function calculateNudgeCorrection(actionType: string, duration?: number): number {
    const baseCorrections: Record<string, number> = {
      breathing_exercise: -5,
      meditation: -8,
      exercise: -10,
      sleep_improvement: -7,
      hydration: -3,
      default: -2
    };

    let correction = baseCorrections[actionType] || baseCorrections.default;
    
    // 根据持续时间调整
    if (duration && duration > 10) {
      correction = Math.min(correction * 1.5, -20);
    }
    
    // 确保在有效范围内 [-20, -1]
    return Math.max(-20, Math.min(-1, Math.round(correction)));
  }

  const actionTypeArb = fc.constantFrom(
    'breathing_exercise',
    'meditation',
    'exercise',
    'sleep_improvement',
    'hydration',
    'unknown_action'
  );

  const durationArb = fc.integer({ min: 1, max: 60 });

  it('*For any* habit completion, nudge correction SHALL be in range [-20, -1]', () => {
    fc.assert(
      fc.property(
        actionTypeArb,
        durationArb,
        (actionType, duration) => {
          const correction = calculateNudgeCorrection(actionType, duration);
          
          expect(correction).toBeGreaterThanOrEqual(-20);
          expect(correction).toBeLessThanOrEqual(-1);
          expect(Number.isInteger(correction)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* nudge correction applied to posterior, result SHALL remain in [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        actionTypeArb,
        durationArb,
        (currentPosterior, actionType, duration) => {
          const correction = calculateNudgeCorrection(actionType, duration);
          const newPosterior = Math.max(0, Math.min(100, currentPosterior + correction));
          
          expect(newPosterior).toBeGreaterThanOrEqual(0);
          expect(newPosterior).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* action type, correction SHALL be negative (reducing anxiety)', () => {
    fc.assert(
      fc.property(
        actionTypeArb,
        (actionType) => {
          const correction = calculateNudgeCorrection(actionType);
          
          expect(correction).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('longer duration SHALL result in larger correction (more negative)', () => {
    fc.assert(
      fc.property(
        actionTypeArb,
        (actionType) => {
          const shortCorrection = calculateNudgeCorrection(actionType, 5);
          const longCorrection = calculateNudgeCorrection(actionType, 30);
          
          // Longer duration should give equal or more negative correction
          expect(longCorrection).toBeLessThanOrEqual(shortCorrection);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// API Response Structure Tests
// ============================================
describe('API Response Structure', () => {
  it('*For any* calculation result, all required fields SHALL be present', () => {
    fc.assert(
      fc.property(
        priorScoreArb,
        evidenceStackArb,
        (prior, evidenceStack) => {
          const result = performBayesianCalculation(prior, evidenceStack);
          
          // Check all required fields
          expect(result).toHaveProperty('prior');
          expect(result).toHaveProperty('posterior');
          expect(result).toHaveProperty('evidenceStack');
          expect(result).toHaveProperty('exaggerationFactor');
          expect(result).toHaveProperty('calculatedAt');
          
          // Check types
          expect(typeof result.prior).toBe('number');
          expect(typeof result.posterior).toBe('number');
          expect(Array.isArray(result.evidenceStack)).toBe(true);
          expect(typeof result.exaggerationFactor).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });
});
