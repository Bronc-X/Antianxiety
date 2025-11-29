/**
 * **Feature: web-ux-improvements, Property 1: Energy Level Calculation Consistency**
 * **Validates: Requirements 1.1, 1.3**
 * 
 * 属性测试：能量值计算一致性
 * 
 * 对于任何有效的健康指标输入（睡眠 0-12 小时，运动 0-180 分钟，
 * 压力 1-10，HRV 20-100），计算出的能量值应该是 0-100 之间的数字，
 * 且电池图标填充百分比应等于计算出的能量值。
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  calculateEnergyLevel, 
  EnergyCalculationInput,
  getEnergyLabel,
  convertLogToEnergyInput 
} from '../energy-calculator';

describe('Energy Calculator - Property Tests', () => {
  /**
   * Property 1: 能量值始终在 0-100 范围内
   */
  it('should always return totalScore between 0 and 100 for any valid input', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleepHours: fc.option(fc.float({ min: 0, max: 12, noNaN: true }), { nil: null }),
          sleepQuality: fc.option(
            fc.constantFrom('excellent', 'good', 'average', 'poor', 'very_poor'),
            { nil: null }
          ),
          exerciseMinutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: null }),
          stressLevel: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          hrv: fc.option(fc.integer({ min: 20, max: 100 }), { nil: null }),
          metabolicResetCompletion: fc.integer({ min: 0, max: 100 }),
        }),
        (input: EnergyCalculationInput) => {
          const result = calculateEnergyLevel(input);
          
          expect(result.totalScore).toBeGreaterThanOrEqual(0);
          expect(result.totalScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 所有因素得分都在 0-100 范围内
   */
  it('should always return factor scores between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleepHours: fc.option(fc.float({ min: 0, max: 12, noNaN: true }), { nil: null }),
          sleepQuality: fc.option(
            fc.constantFrom('excellent', 'good', 'average', 'poor', 'very_poor'),
            { nil: null }
          ),
          exerciseMinutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: null }),
          stressLevel: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          hrv: fc.option(fc.integer({ min: 20, max: 100 }), { nil: null }),
          metabolicResetCompletion: fc.integer({ min: 0, max: 100 }),
        }),
        (input: EnergyCalculationInput) => {
          const result = calculateEnergyLevel(input);
          
          // 检查每个因素得分
          expect(result.factors.sleep.score).toBeGreaterThanOrEqual(0);
          expect(result.factors.sleep.score).toBeLessThanOrEqual(100);
          
          expect(result.factors.exercise.score).toBeGreaterThanOrEqual(0);
          expect(result.factors.exercise.score).toBeLessThanOrEqual(100);
          
          expect(result.factors.stress.score).toBeGreaterThanOrEqual(0);
          expect(result.factors.stress.score).toBeLessThanOrEqual(100);
          
          expect(result.factors.recovery.score).toBeGreaterThanOrEqual(0);
          expect(result.factors.recovery.score).toBeLessThanOrEqual(100);
          
          expect(result.factors.habits.score).toBeGreaterThanOrEqual(0);
          expect(result.factors.habits.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: 权重总和等于 1
   */
  it('should have factor weights that sum to 1', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleepHours: fc.option(fc.float({ min: 0, max: 12, noNaN: true }), { nil: null }),
          sleepQuality: fc.constant(null),
          exerciseMinutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: null }),
          stressLevel: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          hrv: fc.option(fc.integer({ min: 20, max: 100 }), { nil: null }),
          metabolicResetCompletion: fc.integer({ min: 0, max: 100 }),
        }),
        (input: EnergyCalculationInput) => {
          const result = calculateEnergyLevel(input);
          
          const totalWeight = 
            result.factors.sleep.weight +
            result.factors.exercise.weight +
            result.factors.stress.weight +
            result.factors.recovery.weight +
            result.factors.habits.weight;
          
          expect(totalWeight).toBeCloseTo(1, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: 总分是各因素加权平均的结果
   */
  it('should calculate totalScore as weighted average of factor scores', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleepHours: fc.option(fc.float({ min: 0, max: 12, noNaN: true }), { nil: null }),
          sleepQuality: fc.option(
            fc.constantFrom('excellent', 'good', 'average', 'poor', 'very_poor'),
            { nil: null }
          ),
          exerciseMinutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: null }),
          stressLevel: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          hrv: fc.option(fc.integer({ min: 20, max: 100 }), { nil: null }),
          metabolicResetCompletion: fc.integer({ min: 0, max: 100 }),
        }),
        (input: EnergyCalculationInput) => {
          const result = calculateEnergyLevel(input);
          
          const expectedTotal = Math.round(
            result.factors.sleep.score * result.factors.sleep.weight +
            result.factors.exercise.score * result.factors.exercise.weight +
            result.factors.stress.score * result.factors.stress.weight +
            result.factors.recovery.score * result.factors.recovery.weight +
            result.factors.habits.score * result.factors.habits.weight
          );
          
          expect(result.totalScore).toBe(Math.max(0, Math.min(100, expectedTotal)));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: 更好的输入应该产生更高或相等的分数
   * 睡眠 7-8 小时应该比 <5 小时得分高
   */
  it('should give higher sleep score for optimal sleep hours', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (metabolicCompletion) => {
          const optimalInput: EnergyCalculationInput = {
            sleepHours: 7.5,
            sleepQuality: 'good',
            exerciseMinutes: 30,
            stressLevel: 3,
            hrv: 60,
            metabolicResetCompletion: metabolicCompletion,
          };
          
          const poorInput: EnergyCalculationInput = {
            sleepHours: 4,
            sleepQuality: 'poor',
            exerciseMinutes: 30,
            stressLevel: 3,
            hrv: 60,
            metabolicResetCompletion: metabolicCompletion,
          };
          
          const optimalResult = calculateEnergyLevel(optimalInput);
          const poorResult = calculateEnergyLevel(poorInput);
          
          expect(optimalResult.factors.sleep.score).toBeGreaterThan(poorResult.factors.sleep.score);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: 低压力应该产生高压力得分
   */
  it('should give higher stress score for lower stress level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 6, max: 10 }),
        (lowStress, highStress) => {
          const lowStressInput: EnergyCalculationInput = {
            sleepHours: 7,
            sleepQuality: null,
            exerciseMinutes: 30,
            stressLevel: lowStress,
            hrv: 50,
            metabolicResetCompletion: 50,
          };
          
          const highStressInput: EnergyCalculationInput = {
            sleepHours: 7,
            sleepQuality: null,
            exerciseMinutes: 30,
            stressLevel: highStress,
            hrv: 50,
            metabolicResetCompletion: 50,
          };
          
          const lowStressResult = calculateEnergyLevel(lowStressInput);
          const highStressResult = calculateEnergyLevel(highStressInput);
          
          expect(lowStressResult.factors.stress.score).toBeGreaterThan(highStressResult.factors.stress.score);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: getEnergyLabel 应该返回有效的标签
   */
  it('should return valid energy labels for any score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (score) => {
          const label = getEnergyLabel(score);
          
          expect(label.label).toBeTruthy();
          expect(label.labelEn).toBeTruthy();
          expect(label.color).toMatch(/^text-/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: convertLogToEnergyInput 应该正确转换日志数据
   */
  it('should correctly convert log data to energy input', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleep_hours: fc.option(fc.float({ min: 0, max: 12, noNaN: true }), { nil: undefined }),
          sleep_duration_minutes: fc.option(fc.integer({ min: 0, max: 720 }), { nil: undefined }),
          sleep_quality: fc.option(
            fc.constantFrom('excellent', 'good', 'average', 'poor', 'very_poor'),
            { nil: undefined }
          ),
          exercise_duration_minutes: fc.option(fc.integer({ min: 0, max: 180 }), { nil: undefined }),
          stress_level: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
          hrv: fc.option(fc.integer({ min: 20, max: 100 }), { nil: undefined }),
          metabolic_reset_completion: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        }),
        (log) => {
          const input = convertLogToEnergyInput(log);
          
          // 验证转换后的数据类型正确
          expect(typeof input.metabolicResetCompletion).toBe('number');
          
          if (input.sleepHours !== null) {
            expect(typeof input.sleepHours).toBe('number');
          }
          if (input.exerciseMinutes !== null) {
            expect(typeof input.exerciseMinutes).toBe('number');
          }
          if (input.stressLevel !== null) {
            expect(typeof input.stressLevel).toBe('number');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: null 输入应该返回默认值
   */
  it('should handle null log input gracefully', () => {
    const input = convertLogToEnergyInput(null);
    const result = calculateEnergyLevel(input);
    
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});
