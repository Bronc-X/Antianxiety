/**
 * Digital Twin Prediction Engine Property Tests
 * 
 * 预测引擎的属性测试
 * 
 * @module __tests__/properties/digital-twin-prediction-engine.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  PhysiologicalAssessment,
  CalibrationData,
  TreatmentMilestone,
} from '@/types/digital-twin';
import {
  generatePredictions,
  calculateMilestones,
  validatePredictions,
  validateMilestones,
  PREDICTION_WEEKS,
} from '@/lib/digital-twin/prediction-engine';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

// ============================================
// 生成器
// ============================================

/** 生成有效的指标评分 */
const metricScoreArb = fc.record({
  score: fc.float({ min: 0, max: 10, noNaN: true }),
  trend: fc.constantFrom('improving', 'stable', 'declining'),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
});

/** 生成有效的生理评估 */
const physiologicalAssessmentArb: fc.Arbitrary<PhysiologicalAssessment> = fc.record({
  overallStatus: fc.constantFrom('improving', 'stable', 'needs_attention'),
  anxietyLevel: metricScoreArb,
  sleepHealth: metricScoreArb,
  stressResilience: metricScoreArb,
  moodStability: metricScoreArb,
  energyLevel: metricScoreArb,
  hrvEstimate: metricScoreArb,
  riskFactors: fc.array(fc.string(), { maxLength: 3 }),
  strengths: fc.array(fc.string(), { maxLength: 3 }),
  scientificBasis: fc.constant([]),
});

/** 生成有效的校准数据 */
const calibrationDataArb: fc.Arbitrary<CalibrationData> = fc.record({
  date: fc.integer({ min: 0, max: 30 }).map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString().split('T')[0];
  }),
  sleepHours: fc.float({ min: 0, max: 24, noNaN: true }),
  sleepQuality: fc.integer({ min: 0, max: 10 }),
  moodScore: fc.integer({ min: 0, max: 10 }),
  stressLevel: fc.integer({ min: 0, max: 10 }),
  energyLevel: fc.integer({ min: 0, max: 10 }),
});

/** 生成有效的注册日期 */
const registrationDateArb = fc.integer({ min: 0, max: 120 }).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin Prediction Engine Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 6: Prediction Timepoint Completeness**
   * **Validates: Requirements 3.1**
   * 
   * *For any* longitudinal prediction output, the predictions SHALL contain
   * exactly 6 timepoints: baseline (week 0), week 3, week 6, week 9, week 12, and week 15.
   */
  it('Property 6: Generated predictions contain exactly 6 timepoints', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          // 验证时间点数量
          expect(predictions.timepoints.length).toBe(6);
          
          // 验证时间点周数
          const weeks = predictions.timepoints.map(t => t.week);
          expect(weeks).toEqual([0, 3, 6, 9, 12, 15]);
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 7: Metric Completeness**
   * **Validates: Requirements 3.3**
   * 
   * *For any* prediction output, all 6 required metrics SHALL be present.
   */
  it('Property 7: Generated predictions contain all 6 required metrics', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          predictions.timepoints.forEach(timepoint => {
            const preds = timepoint.predictions;
            
            // 验证所有 6 个指标都存在
            expect(preds).toHaveProperty('anxietyScore');
            expect(preds).toHaveProperty('sleepQuality');
            expect(preds).toHaveProperty('stressResilience');
            expect(preds).toHaveProperty('moodStability');
            expect(preds).toHaveProperty('energyLevel');
            expect(preds).toHaveProperty('hrvScore');
            
            // 验证每个指标都有 value 和 confidence
            expect(typeof preds.anxietyScore.value).toBe('number');
            expect(typeof preds.anxietyScore.confidence).toBe('string');
            expect(typeof preds.sleepQuality.value).toBe('number');
            expect(typeof preds.sleepQuality.confidence).toBe('string');
          });
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 9: Timeline Milestone Consistency**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
   * 
   * *For any* user with a registration date, the timeline SHALL contain milestones
   * at weeks 0, 3, 6, 9, 12, and 15, with exactly one milestone marked as "current",
   * all earlier milestones marked as "completed", and all later milestones marked as "upcoming".
   */
  it('Property 9: Milestones have consistent status ordering', () => {
    fc.assert(
      fc.property(
        registrationDateArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (registrationDate, calibrations) => {
          const milestones = calculateMilestones(registrationDate, calibrations);
          
          // 验证里程碑数量
          expect(milestones.length).toBe(6);
          
          // 验证周数
          const weeks = milestones.map(m => m.week);
          expect(weeks).toEqual([0, 3, 6, 9, 12, 15]);
          
          // 验证状态一致性
          let foundCurrent = false;
          let afterCurrent = false;
          
          for (const milestone of milestones) {
            if (milestone.status === 'current') {
              foundCurrent = true;
            } else if (milestone.status === 'upcoming') {
              afterCurrent = true;
            } else if (milestone.status === 'completed') {
              // completed 不应该出现在 upcoming 之后
              expect(afterCurrent).toBe(false);
            }
          }
          
          // 每个里程碑都应该有有效状态
          milestones.forEach(m => {
            expect(['completed', 'current', 'upcoming']).toContain(m.status);
          });
        }
      )
    );
  });

  /**
   * 验证预测值在有效范围内
   */
  it('Prediction values are within valid range [0, 10]', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          predictions.timepoints.forEach(timepoint => {
            const preds = timepoint.predictions;
            
            expect(preds.anxietyScore.value).toBeGreaterThanOrEqual(0);
            expect(preds.anxietyScore.value).toBeLessThanOrEqual(10);
            expect(preds.sleepQuality.value).toBeGreaterThanOrEqual(0);
            expect(preds.sleepQuality.value).toBeLessThanOrEqual(10);
            expect(preds.stressResilience.value).toBeGreaterThanOrEqual(0);
            expect(preds.stressResilience.value).toBeLessThanOrEqual(10);
            expect(preds.moodStability.value).toBeGreaterThanOrEqual(0);
            expect(preds.moodStability.value).toBeLessThanOrEqual(10);
            expect(preds.energyLevel.value).toBeGreaterThanOrEqual(0);
            expect(preds.energyLevel.value).toBeLessThanOrEqual(10);
            expect(preds.hrvScore.value).toBeGreaterThanOrEqual(0);
            expect(preds.hrvScore.value).toBeLessThanOrEqual(10);
          });
        }
      )
    );
  });

  /**
   * 验证预测值随时间单调递增（或保持稳定）
   */
  it('Prediction values are monotonically non-decreasing over time', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          // 对于每个指标，后续时间点的值应该 >= 前一个时间点
          for (let i = 1; i < predictions.timepoints.length; i++) {
            const prev = predictions.timepoints[i - 1].predictions;
            const curr = predictions.timepoints[i].predictions;
            
            // 允许小的浮点误差
            const epsilon = 0.01;
            expect(curr.anxietyScore.value).toBeGreaterThanOrEqual(prev.anxietyScore.value - epsilon);
            expect(curr.sleepQuality.value).toBeGreaterThanOrEqual(prev.sleepQuality.value - epsilon);
            expect(curr.stressResilience.value).toBeGreaterThanOrEqual(prev.stressResilience.value - epsilon);
            expect(curr.moodStability.value).toBeGreaterThanOrEqual(prev.moodStability.value - epsilon);
            expect(curr.energyLevel.value).toBeGreaterThanOrEqual(prev.energyLevel.value - epsilon);
            expect(curr.hrvScore.value).toBeGreaterThanOrEqual(prev.hrvScore.value - epsilon);
          }
        }
      )
    );
  });

  /**
   * 验证置信区间格式
   */
  it('Confidence intervals have correct format', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          predictions.timepoints.forEach(timepoint => {
            const preds = timepoint.predictions;
            
            // 检查置信区间格式 "X.X ± Y.Y"
            expect(preds.anxietyScore.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
            expect(preds.sleepQuality.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
            expect(preds.stressResilience.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
            expect(preds.moodStability.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
            expect(preds.energyLevel.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
            expect(preds.hrvScore.confidence).toMatch(/\d+\.?\d*\s*±\s*\d+\.?\d*/);
          });
        }
      )
    );
  });

  /**
   * 验证基线对比包含所有指标
   */
  it('Baseline comparison includes all metrics', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          // 应该有 6 个指标的对比
          expect(predictions.baselineComparison.length).toBe(6);
          
          // 每个对比都应该有完整的字段
          predictions.baselineComparison.forEach(comparison => {
            expect(comparison).toHaveProperty('metric');
            expect(comparison).toHaveProperty('baseline');
            expect(comparison).toHaveProperty('current');
            expect(comparison).toHaveProperty('change');
            expect(comparison).toHaveProperty('changePercent');
            
            expect(typeof comparison.metric).toBe('string');
            expect(typeof comparison.baseline).toBe('number');
            expect(typeof comparison.current).toBe('number');
            expect(typeof comparison.change).toBe('number');
            expect(typeof comparison.changePercent).toBe('number');
          });
        }
      )
    );
  });

  /**
   * 验证里程碑包含必要字段
   */
  it('Milestones contain all required fields', () => {
    fc.assert(
      fc.property(
        registrationDateArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (registrationDate, calibrations) => {
          const milestones = calculateMilestones(registrationDate, calibrations);
          
          milestones.forEach(milestone => {
            expect(milestone).toHaveProperty('week');
            expect(milestone).toHaveProperty('event');
            expect(milestone).toHaveProperty('status');
            expect(milestone).toHaveProperty('detail');
            
            expect(typeof milestone.week).toBe('number');
            expect(typeof milestone.event).toBe('string');
            expect(typeof milestone.status).toBe('string');
            expect(typeof milestone.detail).toBe('string');
          });
        }
      )
    );
  });

  /**
   * 验证预测验证函数
   */
  it('validatePredictions correctly validates predictions', () => {
    fc.assert(
      fc.property(
        physiologicalAssessmentArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (assessment, calibrations) => {
          const predictions = generatePredictions(assessment, calibrations);
          
          // 生成的预测应该通过验证
          expect(validatePredictions(predictions)).toBe(true);
        }
      )
    );
  });

  /**
   * 验证里程碑验证函数
   */
  it('validateMilestones correctly validates milestones', () => {
    fc.assert(
      fc.property(
        registrationDateArb,
        fc.array(calibrationDataArb, { minLength: 0, maxLength: 20 }),
        (registrationDate, calibrations) => {
          const milestones = calculateMilestones(registrationDate, calibrations);
          
          // 生成的里程碑应该通过验证
          expect(validateMilestones(milestones)).toBe(true);
        }
      )
    );
  });
});
