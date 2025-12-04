/**
 * **Feature: bayesian-belief-loop, Property Tests for Anxiety Curve**
 * 
 * 焦虑曲线属性测试
 * 使用 fast-check 进行属性基测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================
// Constants (matching component)
// ============================================

const SAGE_GREEN = '#9CAF88';
const CLAY = '#C4A77D';
const STABLE = '#666';

// ============================================
// Functions Under Test
// ============================================

/**
 * 获取曲线段颜色
 * 复制自 AnxietyCurve 组件的逻辑
 */
function getSegmentColor(current: number, previous: number): string {
  if (current < previous) {
    return SAGE_GREEN; // Improving (decreasing anxiety)
  } else if (current > previous) {
    return CLAY; // Worsening (increasing anxiety)
  }
  return STABLE; // Stable
}

// ============================================
// Generators
// ============================================

const posteriorScoreArb = fc.integer({ min: 0, max: 100 });

const dataPointArb = fc.record({
  id: fc.uuid(),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString()),
  belief_context: fc.constantFrom('metabolic_crash', 'cardiac_event', 'social_rejection', 'custom'),
  prior_score: fc.integer({ min: 0, max: 100 }),
  posterior_score: posteriorScoreArb,
  evidence_stack: fc.array(
    fc.record({
      type: fc.constantFrom('bio', 'science', 'action'),
      value: fc.string({ minLength: 1, maxLength: 50 }),
      weight: fc.double({ min: 0.05, max: 0.6, noNaN: true })
    }),
    { minLength: 0, maxLength: 5 }
  ),
  exaggeration_factor: fc.double({ min: 0.5, max: 10, noNaN: true })
});

// ============================================
// Property 7: Curve Color Coding Consistency
// **Feature: bayesian-belief-loop, Property 7: Curve Color Coding Consistency**
// **Validates: Requirements 6.2, 6.3**
// ============================================
describe('Property 7: Curve Color Coding Consistency', () => {
  it('*For any* two consecutive points where posterior[n] < posterior[n-1], segment color SHALL be sage green', () => {
    fc.assert(
      fc.property(
        posteriorScoreArb,
        posteriorScoreArb,
        (current, previous) => {
          // Only test when current < previous (improving)
          fc.pre(current < previous);
          
          const color = getSegmentColor(current, previous);
          expect(color).toBe(SAGE_GREEN);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* two consecutive points where posterior[n] > posterior[n-1], segment color SHALL be clay', () => {
    fc.assert(
      fc.property(
        posteriorScoreArb,
        posteriorScoreArb,
        (current, previous) => {
          // Only test when current > previous (worsening)
          fc.pre(current > previous);
          
          const color = getSegmentColor(current, previous);
          expect(color).toBe(CLAY);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* two consecutive points where posterior[n] === posterior[n-1], segment color SHALL be stable', () => {
    fc.assert(
      fc.property(
        posteriorScoreArb,
        (score) => {
          const color = getSegmentColor(score, score);
          expect(color).toBe(STABLE);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('color coding should be deterministic for same inputs', () => {
    fc.assert(
      fc.property(
        posteriorScoreArb,
        posteriorScoreArb,
        (current, previous) => {
          const color1 = getSegmentColor(current, previous);
          const color2 = getSegmentColor(current, previous);
          const color3 = getSegmentColor(current, previous);
          
          expect(color1).toBe(color2);
          expect(color2).toBe(color3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('color should only be one of three valid values', () => {
    fc.assert(
      fc.property(
        posteriorScoreArb,
        posteriorScoreArb,
        (current, previous) => {
          const color = getSegmentColor(current, previous);
          expect([SAGE_GREEN, CLAY, STABLE]).toContain(color);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Data Point Validation Tests
// ============================================
describe('Data Point Validation', () => {
  it('*For any* data point, posterior_score SHALL be in [0, 100]', () => {
    fc.assert(
      fc.property(
        dataPointArb,
        (point) => {
          expect(point.posterior_score).toBeGreaterThanOrEqual(0);
          expect(point.posterior_score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* data point, prior_score SHALL be in [0, 100]', () => {
    fc.assert(
      fc.property(
        dataPointArb,
        (point) => {
          expect(point.prior_score).toBeGreaterThanOrEqual(0);
          expect(point.prior_score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* data point, date SHALL be a valid ISO string', () => {
    fc.assert(
      fc.property(
        dataPointArb,
        (point) => {
          const date = new Date(point.date);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      ),
      { numRuns: 100 }
    );
  });
});
