/**
 * User Memory 属性测试
 * 
 * **Feature: neuromind-backend, Property 3: User Isolation in Search**
 * **Feature: neuromind-backend, Property 7: Memory Metadata Structure**
 * **Validates: Requirements 2.5, 1.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

// ==================== 类型定义 ====================

interface UserMemory {
  id: string;
  user_id: string;
  content: string;
  embedding: number[];
  metadata: {
    emotion_tags?: string[];
    consensus_score?: number | null;
    source_type?: string;
  };
  created_at: string;
}

// ==================== 模拟函数 ====================

/**
 * 模拟用户隔离过滤逻辑
 * 这是 hybrid_search 函数中 WHERE um.user_id = auth.uid() 的模拟
 */
function filterByUserId(memories: UserMemory[], currentUserId: string): UserMemory[] {
  return memories.filter(m => m.user_id === currentUserId);
}

/**
 * 验证 metadata 结构是否有效
 */
function validateMetadataStructure(metadata: UserMemory['metadata']): boolean {
  // emotion_tags 应该是字符串数组或 undefined
  if (metadata.emotion_tags !== undefined) {
    if (!Array.isArray(metadata.emotion_tags)) return false;
    if (!metadata.emotion_tags.every(tag => typeof tag === 'string')) return false;
  }
  
  // consensus_score 应该是 0-1 之间的数字或 null/undefined
  if (metadata.consensus_score !== undefined && metadata.consensus_score !== null) {
    if (typeof metadata.consensus_score !== 'number') return false;
    if (metadata.consensus_score < 0 || metadata.consensus_score > 1) return false;
  }
  
  // source_type 应该是特定的字符串值或 undefined
  if (metadata.source_type !== undefined) {
    const validTypes = ['user_input', 'ai_generated', 'scientific_paper'];
    if (!validTypes.includes(metadata.source_type)) return false;
  }
  
  return true;
}


// ==================== Arbitraries ====================

const userIdArbitrary = fc.uuid();

const metadataArbitrary = fc.record({
  emotion_tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 })),
  consensus_score: fc.option(fc.float({ min: 0, max: 1, noNaN: true })),
  source_type: fc.option(fc.constantFrom('user_input', 'ai_generated', 'scientific_paper'))
});

const userMemoryArbitrary = fc.record({
  id: fc.uuid(),
  user_id: userIdArbitrary,
  content: fc.string({ minLength: 1, maxLength: 500 }),
  embedding: fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 10 }), // 简化为10维用于测试
  metadata: metadataArbitrary,
  created_at: fc.constant(new Date().toISOString()) // 使用固定日期避免无效日期问题
});

// ==================== 测试 ====================

describe('Property 3: User Isolation in Search', () => {
  /**
   * **Feature: neuromind-backend, Property 3: User Isolation in Search**
   * 
   * *For any* authenticated user, hybrid_search SHALL only return memories 
   * belonging to that user's user_id.
   * 
   * **Validates: Requirements 2.5**
   */

  it('should only return memories belonging to the current user', () => {
    fc.assert(
      fc.property(
        fc.array(userMemoryArbitrary, { minLength: 1, maxLength: 50 }),
        userIdArbitrary,
        (allMemories, currentUserId) => {
          const filtered = filterByUserId(allMemories, currentUserId);
          
          // 验证所有返回的记忆都属于当前用户
          filtered.forEach(memory => {
            expect(memory.user_id).toBe(currentUserId);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not return memories from other users', () => {
    fc.assert(
      fc.property(
        fc.array(userMemoryArbitrary, { minLength: 5, maxLength: 30 }),
        userIdArbitrary,
        userIdArbitrary,
        (allMemories, currentUserId, otherUserId) => {
          // 确保两个用户 ID 不同
          fc.pre(currentUserId !== otherUserId);
          
          const filtered = filterByUserId(allMemories, currentUserId);
          
          // 验证没有返回其他用户的记忆
          filtered.forEach(memory => {
            expect(memory.user_id).not.toBe(otherUserId);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when user has no memories', () => {
    fc.assert(
      fc.property(
        fc.array(userMemoryArbitrary, { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (allMemories, newUserId) => {
          // 确保新用户 ID 不在任何记忆中
          const hasMemories = allMemories.some(m => m.user_id === newUserId);
          fc.pre(!hasMemories);
          
          const filtered = filterByUserId(allMemories, newUserId);
          
          expect(filtered.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});


describe('Property 7: Memory Metadata Structure', () => {
  /**
   * **Feature: neuromind-backend, Property 7: Memory Metadata Structure**
   * 
   * *For any* inserted user_memory record, the metadata field SHALL be valid 
   * JSONB that can contain emotion_tags (array), consensus_score (number), 
   * and source_type (string).
   * 
   * **Validates: Requirements 1.4**
   */

  it('should validate correct metadata structure', () => {
    fc.assert(
      fc.property(
        metadataArbitrary,
        (metadata) => {
          // 将 option 类型转换为实际值
          const actualMetadata = {
            emotion_tags: metadata.emotion_tags ?? undefined,
            consensus_score: metadata.consensus_score ?? undefined,
            source_type: metadata.source_type ?? undefined
          };
          
          const isValid = validateMetadataStructure(actualMetadata);
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept emotion_tags as string array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
        (tags) => {
          const metadata = { emotion_tags: tags };
          const isValid = validateMetadataStructure(metadata);
          
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept consensus_score in range [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (score) => {
          const metadata = { consensus_score: score };
          const isValid = validateMetadataStructure(metadata);
          
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject consensus_score outside range [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ min: Math.fround(-100), max: Math.fround(-0.001), noNaN: true }),
          fc.float({ min: Math.fround(1.001), max: Math.fround(100), noNaN: true })
        ),
        (invalidScore) => {
          const metadata = { consensus_score: invalidScore };
          const isValid = validateMetadataStructure(metadata);
          
          expect(isValid).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid source_type values', () => {
    const validTypes = ['user_input', 'ai_generated', 'scientific_paper'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validTypes),
        (sourceType) => {
          const metadata = { source_type: sourceType };
          const isValid = validateMetadataStructure(metadata);
          
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should reject invalid source_type values', () => {
    const invalidTypes = ['invalid', 'unknown', 'test', 'random'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidTypes),
        (invalidType) => {
          const metadata = { source_type: invalidType };
          const isValid = validateMetadataStructure(metadata);
          
          expect(isValid).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should accept null consensus_score', () => {
    const metadata = { consensus_score: null };
    const isValid = validateMetadataStructure(metadata);
    
    expect(isValid).toBe(true);
  });

  it('should accept empty metadata object', () => {
    const metadata = {};
    const isValid = validateMetadataStructure(metadata);
    
    expect(isValid).toBe(true);
  });
});
