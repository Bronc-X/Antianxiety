/**
 * Hybrid Search 属性测试
 * 
 * **Feature: neuromind-backend, Property 1: Hybrid Score Formula Correctness**
 * **Feature: neuromind-backend, Property 2: Result Ordering and Limiting**
 * **Validates: Requirements 2.2, 2.3, 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  calculateHybridScore, 
  orderAndLimitResults,
  HybridSearchWeights 
} from '../../lib/services/hybrid-score';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

describe('Property 1: Hybrid Score Formula Correctness', () => {
  /**
   * **Feature: neuromind-backend, Property 1: Hybrid Score Formula Correctness**
   * 
   * *For any* user memory record with similarity_score S and consensus_score C 
   * (or 0 if null), and weights W_s and W_a, the final_score SHALL equal 
   * (S * W_s) + (C * W_a)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */

  it('should calculate correct hybrid score for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),  // similarity
        fc.float({ min: 0, max: 1, noNaN: true }),  // consensus
        fc.float({ min: 0, max: 1, noNaN: true }),  // similarity_weight
        fc.float({ min: 0, max: 1, noNaN: true }),  // authority_weight
        (similarity, consensus, simWeight, authWeight) => {
          const weights: HybridSearchWeights = {
            similarity: simWeight,
            authority: authWeight
          };
          
          const result = calculateHybridScore(similarity, consensus, weights);
          const expected = (similarity * simWeight) + (consensus * authWeight);
          
          // 允许浮点数精度误差
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('should treat null consensus_score as 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),  // similarity
        fc.float({ min: 0, max: 1, noNaN: true }),  // similarity_weight
        fc.float({ min: 0, max: 1, noNaN: true }),  // authority_weight
        (similarity, simWeight, authWeight) => {
          const weights: HybridSearchWeights = {
            similarity: simWeight,
            authority: authWeight
          };
          
          // 使用 null consensus
          const resultWithNull = calculateHybridScore(similarity, null, weights);
          // 使用 0 consensus
          const resultWithZero = calculateHybridScore(similarity, 0, weights);
          
          // 两者应该相等
          expect(Math.abs(resultWithNull - resultWithZero)).toBeLessThan(0.0001);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default weights (0.6, 0.4) when not specified', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),  // similarity
        fc.float({ min: 0, max: 1, noNaN: true }),  // consensus
        (similarity, consensus) => {
          const result = calculateHybridScore(similarity, consensus);
          const expected = (similarity * 0.6) + (consensus * 0.4);
          
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return value in valid range [0, max_weight_sum]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (similarity, consensus, simWeight, authWeight) => {
          const weights: HybridSearchWeights = {
            similarity: simWeight,
            authority: authWeight
          };
          
          const result = calculateHybridScore(similarity, consensus, weights);
          const maxPossible = simWeight + authWeight;
          
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(maxPossible + 0.0001);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 2: Result Ordering and Limiting', () => {
  /**
   * **Feature: neuromind-backend, Property 2: Result Ordering and Limiting**
   * 
   * *For any* hybrid_search call with match_count N, the returned results 
   * SHALL be ordered by final_score descending and contain at most N records.
   * 
   * **Validates: Requirements 2.4**
   */

  it('should order results by final_score descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            final_score: fc.float({ min: 0, max: 1, noNaN: true })
          }),
          { minLength: 2, maxLength: 50 }
        ),
        fc.integer({ min: 1, max: 20 }),
        (results, matchCount) => {
          const ordered = orderAndLimitResults(results, matchCount);
          
          // 验证结果按 final_score 降序排列
          for (let i = 1; i < ordered.length; i++) {
            expect(ordered[i - 1].final_score).toBeGreaterThanOrEqual(ordered[i].final_score);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should limit results to match_count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            final_score: fc.float({ min: 0, max: 1, noNaN: true })
          }),
          { minLength: 0, maxLength: 100 }
        ),
        fc.integer({ min: 1, max: 50 }),
        (results, matchCount) => {
          const ordered = orderAndLimitResults(results, matchCount);
          
          // 验证结果数量不超过 match_count
          expect(ordered.length).toBeLessThanOrEqual(matchCount);
          // 验证结果数量等于 min(results.length, matchCount)
          expect(ordered.length).toBe(Math.min(results.length, matchCount));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no results', () => {
    const ordered = orderAndLimitResults([], 10);
    expect(ordered.length).toBe(0);
  });

  it('should return all results when match_count exceeds result count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            final_score: fc.float({ min: 0, max: 1, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (results) => {
          // match_count 大于结果数量
          const matchCount = results.length + 10;
          const ordered = orderAndLimitResults(results, matchCount);
          
          // 应该返回所有结果
          expect(ordered.length).toBe(results.length);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
