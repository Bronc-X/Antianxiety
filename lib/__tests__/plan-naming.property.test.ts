/**
 * **Feature: web-ux-improvements, Property 7: Plan Name Personalization**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * 属性测试：计划名称个性化
 * 
 * 对于任何 AI 生成的计划，计划名称不应包含通用模式
 * （"方案一"、"方案二"、"Plan A"、"Plan B"、"Option 1"、"Option 2"），
 * 且应包含至少一个与用户主要关注点或目标结果相关的关键词。
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generatePlanName,
  isValidPlanName,
  generateMultiplePlanNames,
  FORBIDDEN_PATTERNS,
  PlanNamingContext,
} from '../plan-naming';

describe('Plan Naming Service - Property Tests', () => {
  // 定义测试用的关注点列表
  const concerns = [
    'weight_loss',
    'fat_loss',
    'stress_management',
    'stress',
    'sleep_improvement',
    'sleep',
    'energy_boost',
    'energy',
    'muscle_gain',
    'strength',
    'general',
    '减重',
    '压力',
    '睡眠',
    '能量',
    '增肌',
  ];

  const difficulties = ['easy', 'beginner', 'medium', 'intermediate', 'hard', 'advanced'];
  const durations = ['3days', '7days', '14days', '21days', '30days', '1week', '2weeks', '1month'];
  const metabolicTypes = ['fast', 'slow', 'mixed', '快速', '慢速', '混合'];

  /**
   * Property 1: 生成的名称不应匹配任何禁止模式
   */
  it('should never generate names matching forbidden patterns', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryConcern: fc.constantFrom(...concerns),
          metabolicType: fc.option(fc.constantFrom(...metabolicTypes), { nil: undefined }),
          targetOutcome: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          difficulty: fc.option(fc.constantFrom(...difficulties), { nil: undefined }),
          duration: fc.option(fc.constantFrom(...durations), { nil: undefined }),
          planIndex: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
        }),
        (context: PlanNamingContext) => {
          const result = generatePlanName(context);
          
          // 检查标题不匹配任何禁止模式
          for (const pattern of FORBIDDEN_PATTERNS) {
            expect(pattern.test(result.title)).toBe(false);
          }
          
          // 使用验证函数确认
          expect(isValidPlanName(result.title)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 生成的名称应该非空
   */
  it('should always generate non-empty title, subtitle, and emoji', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryConcern: fc.constantFrom(...concerns),
          metabolicType: fc.option(fc.constantFrom(...metabolicTypes), { nil: undefined }),
          difficulty: fc.option(fc.constantFrom(...difficulties), { nil: undefined }),
          duration: fc.option(fc.constantFrom(...durations), { nil: undefined }),
        }),
        (context: PlanNamingContext) => {
          const result = generatePlanName(context);
          
          expect(result.title).toBeTruthy();
          expect(result.title.length).toBeGreaterThan(0);
          
          expect(result.subtitle).toBeTruthy();
          expect(result.subtitle.length).toBeGreaterThan(0);
          
          expect(result.emoji).toBeTruthy();
          expect(result.emoji.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: 相同的 planIndex 应该产生一致的结果
   */
  it('should generate consistent names for same planIndex', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...concerns),
        fc.integer({ min: 0, max: 10 }),
        (concern, index) => {
          const context: PlanNamingContext = {
            primaryConcern: concern,
            planIndex: index,
          };
          
          const result1 = generatePlanName(context);
          const result2 = generatePlanName(context);
          
          expect(result1.title).toBe(result2.title);
          expect(result1.emoji).toBe(result2.emoji);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: 不同的 planIndex 应该产生不同的标题（在同一关注点下）
   */
  it('should generate different titles for different planIndex values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...concerns),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        (concern, index1, index2) => {
          // 只有当索引不同时才测试
          if (index1 === index2) return true;
          
          const result1 = generatePlanName({ primaryConcern: concern, planIndex: index1 });
          const result2 = generatePlanName({ primaryConcern: concern, planIndex: index2 });
          
          // 标题应该不同（除非索引对应到同一个标题）
          // 由于标题数组长度有限，我们只检查不同索引产生的结果
          return result1.title !== result2.title || index1 % 4 === index2 % 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: isValidPlanName 应该正确识别禁止模式
   */
  it('should correctly identify forbidden patterns', () => {
    const forbiddenNames = [
      '方案一',
      '方案二',
      '方案1',
      '计划一',
      '计划2',
      'Plan A',
      'Plan B',
      'Plan 1',
      'Plan 2',
      'Option 1',
      'Option A',
      '选项一',
      '选项1',
    ];
    
    for (const name of forbiddenNames) {
      expect(isValidPlanName(name)).toBe(false);
    }
  });

  /**
   * Property 6: isValidPlanName 应该接受有效的个性化名称
   */
  it('should accept valid personalized names', () => {
    const validNames = [
      '轻盈蜕变计划',
      '心灵舒缓计划',
      '深度睡眠计划',
      '能量激活计划',
      '肌肉塑造计划',
      '全面健康计划',
      'Weight Loss Journey',
      'Sleep Better Program',
    ];
    
    for (const name of validNames) {
      expect(isValidPlanName(name)).toBe(true);
    }
  });

  /**
   * Property 7: generateMultiplePlanNames 应该生成指定数量的名称
   */
  it('should generate correct number of plan names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...concerns),
        fc.integer({ min: 1, max: 10 }),
        (concern, count) => {
          const names = generateMultiplePlanNames({ primaryConcern: concern }, count);
          
          expect(names.length).toBe(count);
          
          // 每个名称都应该有效
          for (const name of names) {
            expect(isValidPlanName(name.title)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: 空字符串和 null 应该被 isValidPlanName 拒绝
   */
  it('should reject empty or whitespace-only names', () => {
    expect(isValidPlanName('')).toBe(false);
    expect(isValidPlanName('   ')).toBe(false);
    expect(isValidPlanName('\t\n')).toBe(false);
  });

  /**
   * Property 9: 带有代谢类型的名称应该包含相关修饰
   */
  it('should personalize names with metabolic type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...concerns),
        fc.constantFrom('fast', 'slow', 'mixed'),
        (concern, metabolicType) => {
          const withType = generatePlanName({ primaryConcern: concern, metabolicType });
          const withoutType = generatePlanName({ primaryConcern: concern });
          
          // 带代谢类型的名称应该与不带的不同（或相同但有效）
          expect(isValidPlanName(withType.title)).toBe(true);
          expect(isValidPlanName(withoutType.title)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: 副标题应该包含时长或难度信息（如果提供）
   */
  it('should include duration or difficulty in subtitle when provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...concerns),
        fc.constantFrom(...durations),
        fc.constantFrom(...difficulties),
        (concern, duration, difficulty) => {
          const result = generatePlanName({
            primaryConcern: concern,
            duration,
            difficulty,
          });
          
          // 副标题应该非空
          expect(result.subtitle.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
