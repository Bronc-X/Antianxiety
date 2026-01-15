/**
 * Semantic Scholar Service 属性测试
 * 
 * **Feature: neuromind-backend, Property 4: Citation Filtering**
 * **Feature: neuromind-backend, Property 5: Paper Data Extraction Completeness**
 * **Validates: Requirements 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  filterPapersByCitation, 
  mockSummarize,
  CONFIG
} from '../../lib/services/semantic-scholar';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

// 生成随机论文数据的 Arbitrary
const paperArbitrary = fc.record({
  paperId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  abstract: fc.oneof(fc.string({ minLength: 0, maxLength: 500 }), fc.constant(null)),
  citationCount: fc.integer({ min: 0, max: 100000 }),
  url: fc.webUrl()
});

describe('Property 4: Citation Filtering', () => {
  /**
   * **Feature: neuromind-backend, Property 4: Citation Filtering**
   * 
   * *For any* set of papers returned by Semantic Scholar service, 
   * all papers SHALL have citationCount >= 50.
   * 
   * **Validates: Requirements 3.2**
   */

  it('should filter out all papers with citations < 50', () => {
    fc.assert(
      fc.property(
        fc.array(paperArbitrary, { minLength: 0, maxLength: 50 }),
        (papers) => {
          const filtered = filterPapersByCitation(papers, CONFIG.MIN_CITATION_COUNT);
          
          // 验证所有返回的论文引用数 >= 50
          filtered.forEach(paper => {
            expect(paper.citationCount).toBeGreaterThanOrEqual(50);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('should preserve all papers with citations >= 50', () => {
    fc.assert(
      fc.property(
        fc.array(paperArbitrary, { minLength: 1, maxLength: 30 }),
        (papers) => {
          const filtered = filterPapersByCitation(papers, CONFIG.MIN_CITATION_COUNT);
          
          // 计算原始数据中符合条件的论文数量
          const expectedCount = papers.filter(p => p.citationCount >= 50).length;
          
          // 验证过滤后的数量正确
          expect(filtered.length).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when all papers have low citations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            paperId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            abstract: fc.string({ minLength: 0, maxLength: 200 }),
            citationCount: fc.integer({ min: 0, max: 49 }), // 所有引用数 < 50
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lowCitationPapers) => {
          const filtered = filterPapersByCitation(lowCitationPapers, CONFIG.MIN_CITATION_COUNT);
          
          // 应该返回空数组
          expect(filtered.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve all papers when all have high citations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            paperId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            abstract: fc.string({ minLength: 0, maxLength: 200 }),
            citationCount: fc.integer({ min: 50, max: 10000 }), // 所有引用数 >= 50
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (highCitationPapers) => {
          const filtered = filterPapersByCitation(highCitationPapers, CONFIG.MIN_CITATION_COUNT);
          
          // 应该保留所有论文
          expect(filtered.length).toBe(highCitationPapers.length);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Property 5: Paper Data Extraction Completeness', () => {
  /**
   * **Feature: neuromind-backend, Property 5: Paper Data Extraction Completeness**
   * 
   * *For any* valid Semantic Scholar API response, the extracted Paper object 
   * SHALL contain non-null title, abstract, citationCount, and url fields.
   * 
   * **Validates: Requirements 3.3**
   */

  it('should extract all required fields from valid papers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            paperId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 200 }),
            abstract: fc.oneof(fc.string({ minLength: 1, maxLength: 500 }), fc.constant(null)),
            citationCount: fc.integer({ min: 50, max: 10000 }),
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (papers) => {
          const filtered = filterPapersByCitation(papers, CONFIG.MIN_CITATION_COUNT);
          
          // 验证每个返回的论文都有所有必需字段
          filtered.forEach(paper => {
            expect(paper.paperId).toBeDefined();
            expect(typeof paper.paperId).toBe('string');
            expect(paper.paperId.length).toBeGreaterThan(0);
            
            expect(paper.title).toBeDefined();
            expect(typeof paper.title).toBe('string');
            
            expect(paper.abstract).toBeDefined();
            expect(typeof paper.abstract).toBe('string');
            
            expect(paper.citationCount).toBeDefined();
            expect(typeof paper.citationCount).toBe('number');
            
            expect(paper.url).toBeDefined();
            expect(typeof paper.url).toBe('string');
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null abstract by converting to empty string', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            paperId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            abstract: fc.constant(null), // 所有摘要为 null
            citationCount: fc.integer({ min: 50, max: 10000 }),
            url: fc.webUrl()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (papersWithNullAbstract) => {
          const filtered = filterPapersByCitation(papersWithNullAbstract, CONFIG.MIN_CITATION_COUNT);
          
          // 验证 null 摘要被转换为空字符串
          filtered.forEach(paper => {
            expect(paper.abstract).toBe('');
            expect(typeof paper.abstract).toBe('string');
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate fallback URL when missing', () => {
    const papersWithoutUrl = [
      {
        paperId: 'test-paper-id-123',
        title: 'Test Paper',
        abstract: 'Test abstract',
        citationCount: 100,
        url: '' // 空 URL
      }
    ];
    
    const filtered = filterPapersByCitation(papersWithoutUrl, CONFIG.MIN_CITATION_COUNT);
    
    // 验证生成了回退 URL
    expect(filtered[0].url).toContain('semanticscholar.org');
  });
});

describe('mockSummarize function', () => {
  it('should return non-empty string for any input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        (abstract) => {
          const summary = mockSummarize(abstract);
          
          expect(summary).toBeDefined();
          expect(typeof summary).toBe('string');
          expect(summary.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return default message for empty abstract', () => {
    const emptyInputs = ['', '   ', '\t', '\n'];
    
    emptyInputs.forEach(input => {
      const summary = mockSummarize(input);
      expect(summary).toContain('研究');
    });
  });
});
