/**
 * **Feature: bayesian-belief-loop, Property Tests for Bayesian Scholar**
 * 
 * 贝叶斯学术搜索服务属性测试
 * 使用 fast-check 进行属性基测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateConsensusScore,
  validateCitationCount,
  CONFIG
} from '../services/bayesian-scholar';
import { Paper, filterPapersByCitation } from '../services/semantic-scholar';
import { calculateBayesianPosterior } from '../bayesian-evidence';

// ============================================
// Generators
// ============================================

const paperIdArb = fc.string({ minLength: 5, maxLength: 20 });
const titleArb = fc.string({ minLength: 10, maxLength: 200 });
const abstractArb = fc.string({ minLength: 0, maxLength: 500 });
const urlArb = fc.webUrl();

// Paper with valid citation count (> 50)
const validPaperArb: fc.Arbitrary<Paper> = fc.record({
  paperId: paperIdArb,
  title: titleArb,
  abstract: abstractArb,
  citationCount: fc.integer({ min: 51, max: 10000 }),
  url: urlArb
});

// Paper with any citation count
const anyPaperArb: fc.Arbitrary<Paper> = fc.record({
  paperId: paperIdArb,
  title: titleArb,
  abstract: abstractArb,
  citationCount: fc.integer({ min: 0, max: 10000 }),
  url: urlArb
});

// Paper with low citation count (< 50)
const lowCitationPaperArb: fc.Arbitrary<Paper> = fc.record({
  paperId: paperIdArb,
  title: titleArb,
  abstract: abstractArb,
  citationCount: fc.integer({ min: 0, max: 49 }),
  url: urlArb
});

// ============================================
// Property 9: Science Evidence Citation Filter
// **Feature: bayesian-belief-loop, Property 9: Science Evidence Citation Filter**
// **Validates: Requirements 8.2**
// ============================================
describe('Property 9: Science Evidence Citation Filter', () => {
  it('*For any* paper returned from filter, citation_count SHALL be greater than 50', () => {
    fc.assert(
      fc.property(
        fc.array(anyPaperArb, { minLength: 1, maxLength: 20 }),
        (papers) => {
          const filtered = filterPapersByCitation(
            papers.map(p => ({
              paperId: p.paperId,
              title: p.title,
              abstract: p.abstract,
              citationCount: p.citationCount,
              url: p.url
            })),
            CONFIG.MIN_CITATION_COUNT
          );
          
          // All filtered papers must have citation count > 50
          for (const paper of filtered) {
            expect(paper.citationCount).toBeGreaterThanOrEqual(CONFIG.MIN_CITATION_COUNT);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* paper with citation count <= 50, it SHALL be excluded from results', () => {
    fc.assert(
      fc.property(
        fc.array(lowCitationPaperArb, { minLength: 1, maxLength: 10 }),
        (papers) => {
          const filtered = filterPapersByCitation(
            papers.map(p => ({
              paperId: p.paperId,
              title: p.title,
              abstract: p.abstract,
              citationCount: p.citationCount,
              url: p.url
            })),
            CONFIG.MIN_CITATION_COUNT
          );
          
          // All low citation papers should be filtered out
          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* paper with citation count > 50, it SHALL be included in results', () => {
    fc.assert(
      fc.property(
        fc.array(validPaperArb, { minLength: 1, maxLength: 10 }),
        (papers) => {
          const filtered = filterPapersByCitation(
            papers.map(p => ({
              paperId: p.paperId,
              title: p.title,
              abstract: p.abstract,
              citationCount: p.citationCount,
              url: p.url
            })),
            CONFIG.MIN_CITATION_COUNT
          );
          
          // All valid papers should be included
          expect(filtered.length).toBe(papers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateCitationCount should correctly validate papers', () => {
    fc.assert(
      fc.property(
        anyPaperArb,
        (paper) => {
          const isValid = validateCitationCount(paper);
          
          if (paper.citationCount > CONFIG.MIN_CITATION_COUNT) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
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
  // Bio evidence generator
  const bioEvidenceArb = fc.record({
    type: fc.constant('bio') as fc.Arbitrary<'bio'>,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.2, max: 0.4, noNaN: true }),
    consensus: fc.double({ min: 0, max: 1, noNaN: true })
  });

  // Action evidence generator
  const actionEvidenceArb = fc.record({
    type: fc.constant('action') as fc.Arbitrary<'action'>,
    value: fc.string({ minLength: 1, maxLength: 50 }),
    weight: fc.double({ min: 0.05, max: 0.2, noNaN: true }),
    consensus: fc.double({ min: 0, max: 1, noNaN: true })
  });

  const priorScoreArb = fc.integer({ min: 0, max: 100 });

  it('*For any* calculation with only bio and action evidence (no science), posterior SHALL be in [0, 100]', () => {
    const bioAndActionStackArb = fc.array(
      fc.oneof(bioEvidenceArb, actionEvidenceArb),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.property(
        priorScoreArb,
        bioAndActionStackArb,
        (prior, evidenceStack) => {
          // Simulate API failure scenario - only bio and action evidence available
          const posterior = calculateBayesianPosterior(prior, evidenceStack);
          
          expect(posterior).toBeGreaterThanOrEqual(0);
          expect(posterior).toBeLessThanOrEqual(100);
          expect(Number.isInteger(posterior)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* empty evidence stack (complete API failure), posterior SHALL equal prior', () => {
    fc.assert(
      fc.property(
        priorScoreArb,
        (prior) => {
          // Complete failure - no evidence at all
          const posterior = calculateBayesianPosterior(prior, []);
          
          expect(posterior).toBe(prior);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fallback papers should all have citation count > 50', () => {
    for (const paper of CONFIG.FALLBACK_PAPERS) {
      expect(paper.citationCount).toBeGreaterThan(CONFIG.MIN_CITATION_COUNT);
    }
  });
});

// ============================================
// Consensus Score Calculation Tests
// ============================================
describe('Consensus Score Calculation', () => {
  it('*For any* citation count, consensus score SHALL be in [0.3, 0.95]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        (citationCount) => {
          const score = calculateConsensusScore(citationCount);
          
          expect(score).toBeGreaterThanOrEqual(0.3);
          expect(score).toBeLessThanOrEqual(0.95);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* two citation counts where a > b, consensus(a) >= consensus(b)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000 }),
        fc.integer({ min: 1, max: 50000 }),
        (a, b) => {
          const higher = Math.max(a, b);
          const lower = Math.min(a, b);
          
          const scoreHigher = calculateConsensusScore(higher);
          const scoreLower = calculateConsensusScore(lower);
          
          expect(scoreHigher).toBeGreaterThanOrEqual(scoreLower);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return expected scores for known citation counts', () => {
    // 50 citations should give ~0.5
    const score50 = calculateConsensusScore(50);
    expect(score50).toBeGreaterThanOrEqual(0.4);
    expect(score50).toBeLessThanOrEqual(0.6);

    // 500 citations should give ~0.7-0.8
    const score500 = calculateConsensusScore(500);
    expect(score500).toBeGreaterThanOrEqual(0.6);
    expect(score500).toBeLessThanOrEqual(0.85);

    // 5000 citations should give ~0.9
    const score5000 = calculateConsensusScore(5000);
    expect(score5000).toBeGreaterThanOrEqual(0.8);
    expect(score5000).toBeLessThanOrEqual(0.95);
  });
});
