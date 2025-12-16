/**
 * Content Validator 属性测试
 * 
 * **Feature: neuromind-backend, Property 6: Non-Health Content Rejection**
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  validateContentRelevance, 
  BLOCKED_KEYWORDS,
  KEYWORD_CATEGORIES 
} from '../../lib/services/content-validator';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

describe('Property 6: Non-Health Content Rejection', () => {
  /**
   * **Feature: neuromind-backend, Property 6: Non-Health Content Rejection**
   * 
   * *For any* user query containing keywords from the blocked list 
   * (politics, gossip, entertainment, sales), validateContentRelevance 
   * SHALL return isHealthRelated=false with a polite decline message.
   * 
   * **Validates: Requirements 4.2**
   */

  it('should reject all queries containing blocked keywords', () => {
    fc.assert(
      fc.property(
        // 从屏蔽关键词列表中随机选择一个
        fc.constantFrom(...BLOCKED_KEYWORDS),
        // 生成随机前缀和后缀文本
        fc.string({ minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (keyword, prefix, suffix) => {
          // 构造包含屏蔽关键词的查询
          const query = `${prefix}${keyword}${suffix}`;
          const result = validateContentRelevance(query);
          
          // 验证返回 isHealthRelated=false
          expect(result.isHealthRelated).toBe(false);
          // 验证有建议回复
          expect(result.suggestedResponse).toBeDefined();
          expect(result.suggestedResponse!.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('should reject all politics-related queries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYWORD_CATEGORIES.politics),
        fc.string({ minLength: 0, maxLength: 30 }),
        (keyword, context) => {
          const query = `我想问问${keyword}${context}`;
          const result = validateContentRelevance(query);
          
          expect(result.isHealthRelated).toBe(false);
          expect(result.blockedReason).toBe('politics');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject all gossip/entertainment queries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYWORD_CATEGORIES.gossip),
        fc.string({ minLength: 0, maxLength: 30 }),
        (keyword, context) => {
          const query = `${context}${keyword}怎么样`;
          const result = validateContentRelevance(query);
          
          expect(result.isHealthRelated).toBe(false);
          expect(result.blockedReason).toBe('gossip');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject all sales/marketing queries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYWORD_CATEGORIES.sales),
        fc.string({ minLength: 0, maxLength: 30 }),
        (keyword, context) => {
          const query = `${keyword}${context}`;
          const result = validateContentRelevance(query);
          
          expect(result.isHealthRelated).toBe(false);
          expect(result.blockedReason).toBe('sales');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept health-related queries without blocked keywords', () => {
    const healthQueries = [
      '我最近睡眠不好怎么办',
      '如何提高新陈代谢',
      '运动后肌肉酸痛正常吗',
      '压力大导致头痛怎么缓解',
      '饮食如何影响能量水平',
      '间歇性禁食对身体有什么好处',
      '如何改善疲劳感',
      '什么运动对心脏健康最好'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...healthQueries),
        (query) => {
          const result = validateContentRelevance(query);
          
          expect(result.isHealthRelated).toBe(true);
          expect(result.blockedReason).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle empty and whitespace queries as health-related', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n', '  \n  '),
        (query) => {
          const result = validateContentRelevance(query);
          
          // 空查询视为健康相关（让后续逻辑处理）
          expect(result.isHealthRelated).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should provide polite decline message for all rejected queries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BLOCKED_KEYWORDS),
        (keyword) => {
          const result = validateContentRelevance(keyword);
          
          expect(result.isHealthRelated).toBe(false);
          expect(result.suggestedResponse).toBeDefined();
          // 验证回复是礼貌的（包含"健康"相关词汇）
          expect(result.suggestedResponse).toMatch(/健康|帮助|专注/);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should track matched keywords for debugging', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BLOCKED_KEYWORDS),
        (keyword) => {
          const result = validateContentRelevance(`这是关于${keyword}的问题`);
          
          expect(result.isHealthRelated).toBe(false);
          expect(result.matchedKeywords).toBeDefined();
          expect(result.matchedKeywords!.length).toBeGreaterThan(0);
          expect(result.matchedKeywords).toContain(keyword);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
