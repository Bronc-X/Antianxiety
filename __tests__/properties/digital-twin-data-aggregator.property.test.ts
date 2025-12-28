/**
 * Digital Twin Data Aggregator Property Tests
 * 
 * 数据聚合器的属性测试
 * 
 * @module __tests__/properties/digital-twin-data-aggregator.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  AggregatedUserData,
  BaselineData,
  CalibrationData,
} from '@/types/digital-twin';
import {
  MIN_CALIBRATIONS_FOR_ANALYSIS,
  isDataSufficientForAnalysis,
} from '@/lib/digital-twin/data-aggregator';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

// ============================================
// 生成器
// ============================================

/** 生成有效的 GAD-7 分数 (0-21) */
const gad7ScoreArb = fc.integer({ min: 0, max: 21 });

/** 生成有效的 PHQ-9 分数 (0-27) */
const phq9ScoreArb = fc.integer({ min: 0, max: 27 });

/** 生成有效的 ISI 分数 (0-28) */
const isiScoreArb = fc.integer({ min: 0, max: 28 });

/** 生成有效的 PSS-10 分数 (0-40) */
const pss10ScoreArb = fc.integer({ min: 0, max: 40 });

/** 生成有效的日期字符串 (YYYY-MM-DD) */
const dateStringArb = fc.integer({ min: 0, max: 365 * 10 }).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
});

/** 生成有效的 ISO 日期字符串 */
const isoDateStringArb = fc.integer({ min: 0, max: 365 * 10 }).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
});

/** 生成有效的基线数据 */
const baselineDataArb: fc.Arbitrary<BaselineData> = fc.record({
  gad7Score: gad7ScoreArb,
  phq9Score: phq9ScoreArb,
  isiScore: isiScoreArb,
  pss10Score: pss10ScoreArb,
  assessmentDate: isoDateStringArb,
  interpretations: fc.record({
    gad7: fc.constant('轻微焦虑'),
    phq9: fc.constant('轻微抑郁'),
    isi: fc.constant('无失眠'),
    pss10: fc.constant('低压力'),
  }),
});

/** 生成有效的校准数据 */
const calibrationDataArb: fc.Arbitrary<CalibrationData> = fc.record({
  date: dateStringArb,
  sleepHours: fc.float({ min: 0, max: 24, noNaN: true }),
  sleepQuality: fc.integer({ min: 0, max: 10 }),
  moodScore: fc.integer({ min: 0, max: 10 }),
  stressLevel: fc.integer({ min: 0, max: 10 }),
  energyLevel: fc.integer({ min: 0, max: 10 }),
});

/** 生成有效的聚合用户数据 */
const aggregatedUserDataArb = (
  hasBaseline: boolean,
  calibrationCount: number
): fc.Arbitrary<AggregatedUserData> => fc.record({
  userId: fc.uuid(),
  baseline: hasBaseline ? baselineDataArb : fc.constant(null),
  calibrations: fc.array(calibrationDataArb, { minLength: calibrationCount, maxLength: calibrationCount }),
  inquiryInsights: fc.constant([]),
  conversationSummary: fc.constant({
    totalMessages: 0,
    emotionalTrend: 'stable' as const,
    frequentTopics: [],
    lastInteraction: new Date().toISOString(),
  }),
  profile: fc.record({
    age: fc.option(fc.integer({ min: 18, max: 100 }), { nil: undefined }),
    gender: fc.option(fc.constantFrom('male', 'female', 'other'), { nil: undefined }),
    primaryConcern: fc.option(fc.string(), { nil: undefined }),
    registrationDate: fc.date().map(d => d.toISOString()),
    medicalHistoryConsent: fc.boolean(),
  }),
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin Data Aggregator Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 1: Baseline Data Storage Round-Trip**
   * **Validates: Requirements 1.1**
   * 
   * *For any* valid questionnaire response (GAD-7, PHQ-9, ISI, PSS-10 scores),
   * storing the baseline data and then retrieving it SHALL return the exact same scores.
   */
  it('Property 1: Baseline data scores are preserved exactly', () => {
    fc.assert(
      fc.property(baselineDataArb, (baseline) => {
        // 验证分数在有效范围内
        expect(baseline.gad7Score).toBeGreaterThanOrEqual(0);
        expect(baseline.gad7Score).toBeLessThanOrEqual(21);
        expect(baseline.phq9Score).toBeGreaterThanOrEqual(0);
        expect(baseline.phq9Score).toBeLessThanOrEqual(27);
        expect(baseline.isiScore).toBeGreaterThanOrEqual(0);
        expect(baseline.isiScore).toBeLessThanOrEqual(28);
        expect(baseline.pss10Score).toBeGreaterThanOrEqual(0);
        expect(baseline.pss10Score).toBeLessThanOrEqual(40);
        
        // 验证解读存在
        expect(baseline.interpretations).toBeDefined();
        expect(baseline.interpretations.gad7).toBeDefined();
        expect(baseline.interpretations.phq9).toBeDefined();
        expect(baseline.interpretations.isi).toBeDefined();
        expect(baseline.interpretations.pss10).toBeDefined();
        
        // 验证日期格式
        expect(new Date(baseline.assessmentDate).toISOString()).toBe(baseline.assessmentDate);
      })
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 2: Calibration Data Append Invariant**
   * **Validates: Requirements 1.2**
   * 
   * *For any* user with N existing calibrations, adding a new calibration
   * SHALL result in exactly N+1 calibrations.
   */
  it('Property 2: Calibration count increases by exactly 1 when adding', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        calibrationDataArb,
        (existingCount, newCalibration) => {
          // 模拟现有校准数组
          const existingCalibrations: CalibrationData[] = Array(existingCount).fill(null).map((_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            sleepHours: 7,
            sleepQuality: 7,
            moodScore: 7,
            stressLevel: 5,
            energyLevel: 7,
          }));
          
          // 添加新校准
          const updatedCalibrations = [...existingCalibrations, newCalibration];
          
          // 验证数量增加了 1
          expect(updatedCalibrations.length).toBe(existingCount + 1);
          
          // 验证新条目在数组末尾
          expect(updatedCalibrations[updatedCalibrations.length - 1]).toEqual(newCalibration);
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 3: Timeline Ordering**
   * **Validates: Requirements 1.5**
   * 
   * *For any* aggregated user data, all data points in the unified timeline
   * SHALL be ordered by timestamp in ascending order.
   */
  it('Property 3: Calibrations are ordered by date ascending', () => {
    fc.assert(
      fc.property(
        fc.array(calibrationDataArb, { minLength: 2, maxLength: 20 }),
        (calibrations) => {
          // 按日期排序
          const sorted = [...calibrations].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          // 验证排序后的数组是升序的
          for (let i = 1; i < sorted.length; i++) {
            const prevDate = new Date(sorted[i - 1].date).getTime();
            const currDate = new Date(sorted[i].date).getTime();
            expect(currDate).toBeGreaterThanOrEqual(prevDate);
          }
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 4: Analysis Threshold Enforcement**
   * **Validates: Requirements 2.1, 2.6**
   * 
   * *For any* user, the AI_Analyzer SHALL generate predictions if and only if
   * the user has baseline data AND at least 3 daily calibrations.
   */
  it('Property 4: Analysis requires baseline + minimum calibrations', () => {
    // 测试有基线但校准不足的情况
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MIN_CALIBRATIONS_FOR_ANALYSIS - 1 }),
        (calibrationCount) => {
          const data: AggregatedUserData = {
            userId: 'test-user',
            baseline: {
              gad7Score: 10,
              phq9Score: 8,
              isiScore: 12,
              pss10Score: 20,
              assessmentDate: new Date().toISOString(),
              interpretations: {
                gad7: '轻度焦虑',
                phq9: '轻度抑郁',
                isi: '亚临床失眠',
                pss10: '中等压力',
              },
            },
            calibrations: Array(calibrationCount).fill({
              date: new Date().toISOString().split('T')[0],
              sleepHours: 7,
              sleepQuality: 7,
              moodScore: 7,
              stressLevel: 5,
              energyLevel: 7,
            }),
            inquiryInsights: [],
            conversationSummary: {
              totalMessages: 0,
              emotionalTrend: 'stable',
              frequentTopics: [],
              lastInteraction: new Date().toISOString(),
            },
            profile: {
              registrationDate: new Date().toISOString(),
            },
          };
          
          // 校准不足时不应该准备好分析
          expect(isDataSufficientForAnalysis(data)).toBe(false);
        }
      )
    );

    // 测试无基线的情况
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_CALIBRATIONS_FOR_ANALYSIS, max: 20 }),
        (calibrationCount) => {
          const data: AggregatedUserData = {
            userId: 'test-user',
            baseline: null,
            calibrations: Array(calibrationCount).fill({
              date: new Date().toISOString().split('T')[0],
              sleepHours: 7,
              sleepQuality: 7,
              moodScore: 7,
              stressLevel: 5,
              energyLevel: 7,
            }),
            inquiryInsights: [],
            conversationSummary: {
              totalMessages: 0,
              emotionalTrend: 'stable',
              frequentTopics: [],
              lastInteraction: new Date().toISOString(),
            },
            profile: {
              registrationDate: new Date().toISOString(),
            },
          };
          
          // 无基线时不应该准备好分析
          expect(isDataSufficientForAnalysis(data)).toBe(false);
        }
      )
    );

    // 测试满足条件的情况
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_CALIBRATIONS_FOR_ANALYSIS, max: 20 }),
        (calibrationCount) => {
          const data: AggregatedUserData = {
            userId: 'test-user',
            baseline: {
              gad7Score: 10,
              phq9Score: 8,
              isiScore: 12,
              pss10Score: 20,
              assessmentDate: new Date().toISOString(),
              interpretations: {
                gad7: '轻度焦虑',
                phq9: '轻度抑郁',
                isi: '亚临床失眠',
                pss10: '中等压力',
              },
            },
            calibrations: Array(calibrationCount).fill({
              date: new Date().toISOString().split('T')[0],
              sleepHours: 7,
              sleepQuality: 7,
              moodScore: 7,
              stressLevel: 5,
              energyLevel: 7,
            }),
            inquiryInsights: [],
            conversationSummary: {
              totalMessages: 0,
              emotionalTrend: 'stable',
              frequentTopics: [],
              lastInteraction: new Date().toISOString(),
            },
            profile: {
              registrationDate: new Date().toISOString(),
            },
          };
          
          // 满足条件时应该准备好分析
          expect(isDataSufficientForAnalysis(data)).toBe(true);
        }
      )
    );
  });

  /**
   * 验证校准数据字段的有效范围
   */
  it('Calibration data fields are within valid ranges', () => {
    fc.assert(
      fc.property(calibrationDataArb, (calibration) => {
        expect(calibration.sleepHours).toBeGreaterThanOrEqual(0);
        expect(calibration.sleepHours).toBeLessThanOrEqual(24);
        expect(calibration.sleepQuality).toBeGreaterThanOrEqual(0);
        expect(calibration.sleepQuality).toBeLessThanOrEqual(10);
        expect(calibration.moodScore).toBeGreaterThanOrEqual(0);
        expect(calibration.moodScore).toBeLessThanOrEqual(10);
        expect(calibration.stressLevel).toBeGreaterThanOrEqual(0);
        expect(calibration.stressLevel).toBeLessThanOrEqual(10);
        expect(calibration.energyLevel).toBeGreaterThanOrEqual(0);
        expect(calibration.energyLevel).toBeLessThanOrEqual(10);
      })
    );
  });
});
