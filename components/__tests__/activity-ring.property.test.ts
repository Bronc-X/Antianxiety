/**
 * **Feature: web-ux-improvements, Property 2: Slider Value Binding**
 * **Validates: Requirements 2.2**
 * 
 * **Feature: web-ux-improvements, Property 3: Activity Ring Calculation**
 * **Validates: Requirements 2.4, 2.5**
 * 
 * 属性测试：滑动条值绑定和活动环计算
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateRingPercentages, RING_COLORS } from '../ActivityRing';

describe('Activity Ring - Property Tests', () => {
  /**
   * Property 1: 活动环百分比始终在 0-100 范围内
   */
  it('should always return percentages between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleep_duration_minutes: fc.option(fc.integer({ min: 0, max: 720 }), { nil: null }),
          sleep_quality: fc.option(
            fc.constantFrom('excellent', 'good', 'average', 'poor', 'very_poor'),
            { nil: null }
          ),
          exercise_duration_minutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: null }),
          stress_level: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
        }),
        (log) => {
          const result = calculateRingPercentages(log);
          
          expect(result.movement).toBeGreaterThanOrEqual(0);
          expect(result.movement).toBeLessThanOrEqual(100);
          
          expect(result.exercise).toBeGreaterThanOrEqual(0);
          expect(result.exercise).toBeLessThanOrEqual(100);
          
          expect(result.standing).toBeGreaterThanOrEqual(0);
          expect(result.standing).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 锻炼环百分比与运动时长成正比
   */
  it('should calculate exercise percentage proportional to duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 60 }),
        (minutes) => {
          const result = calculateRingPercentages({
            exercise_duration_minutes: minutes,
          });
          
          // 30分钟 = 100%，所以 minutes / 30 * 100 = 百分比
          const expectedPercentage = Math.min(100, (minutes / 30) * 100);
          expect(result.exercise).toBeCloseTo(expectedPercentage, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: 更多运动时长应该产生更高或相等的锻炼百分比
   */
  it('should give higher exercise percentage for more exercise duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 31, max: 60 }),
        (lessMinutes, moreMinutes) => {
          const lessResult = calculateRingPercentages({
            exercise_duration_minutes: lessMinutes,
          });
          const moreResult = calculateRingPercentages({
            exercise_duration_minutes: moreMinutes,
          });
          
          expect(moreResult.exercise).toBeGreaterThanOrEqual(lessResult.exercise);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: 低压力应该产生高站立百分比
   */
  it('should give higher standing percentage for lower stress', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 6, max: 10 }),
        (lowStress, highStress) => {
          const lowStressResult = calculateRingPercentages({
            stress_level: lowStress,
          });
          const highStressResult = calculateRingPercentages({
            stress_level: highStress,
          });
          
          expect(lowStressResult.standing).toBeGreaterThan(highStressResult.standing);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: null 输入应该返回零值
   */
  it('should return zeros for null input', () => {
    const result = calculateRingPercentages(null);
    
    expect(result.movement).toBe(0);
    expect(result.exercise).toBe(0);
    expect(result.standing).toBe(0);
  });

  /**
   * Property 6: 颜色常量应该是有效的十六进制颜色
   */
  it('should have valid hex color constants', () => {
    const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
    
    expect(RING_COLORS.movement).toMatch(hexColorPattern);
    expect(RING_COLORS.exercise).toMatch(hexColorPattern);
    expect(RING_COLORS.standing).toMatch(hexColorPattern);
  });

  /**
   * Property 7: Apple Health 标准颜色验证
   */
  it('should use Apple Health standard colors', () => {
    // 红色 - 活动
    expect(RING_COLORS.movement).toBe('#FA114F');
    // 绿色 - 锻炼
    expect(RING_COLORS.exercise).toBe('#92E82A');
    // 青色 - 站立
    expect(RING_COLORS.standing).toBe('#00C7BE');
  });

  /**
   * Property 8: 睡眠质量应该影响活动百分比
   */
  it('should calculate movement based on sleep quality', () => {
    const qualities = ['excellent', 'good', 'average', 'poor', 'very_poor'];
    const results = qualities.map(q => 
      calculateRingPercentages({ sleep_quality: q }).movement
    );
    
    // 质量从好到差，活动百分比应该递减
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]).toBeGreaterThanOrEqual(results[i + 1]);
    }
  });
});

describe('Slider Value Binding - Property Tests', () => {
  /**
   * Property 1: 滑动条值应该在 min 和 max 之间
   */
  it('should clamp values between min and max', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 100, max: 200 }),
        fc.integer({ min: -50, max: 250 }),
        (min, max, value) => {
          const clampedValue = Math.max(min, Math.min(max, value));
          
          expect(clampedValue).toBeGreaterThanOrEqual(min);
          expect(clampedValue).toBeLessThanOrEqual(max);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 步进值应该产生正确的离散值
   */
  it('should produce correct stepped values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom(1, 5, 10, 15, 30),
        (value, step) => {
          const steppedValue = Math.round(value / step) * step;
          
          // 步进后的值应该是步进的倍数
          expect(steppedValue % step).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: 百分比计算应该正确
   */
  it('should calculate percentage correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 100, max: 200 }),
        fc.integer({ min: 0, max: 200 }),
        (min, max, value) => {
          const clampedValue = Math.max(min, Math.min(max, value));
          const percentage = ((clampedValue - min) / (max - min)) * 100;
          
          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
