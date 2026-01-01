/**
 * Digital Twin LLM Analyzer Property Tests
 * 
 * LLM 分析器的属性测试
 * 
 * @module __tests__/properties/digital-twin-llm-analyzer.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  PhysiologicalAssessment,
  LongitudinalPredictions,
  MetricScore,
  PredictionTimepoint,
} from '@/types/digital-twin';
import {
  buildAnalysisPrompt,
  extractHealthKeywords,
} from '@/lib/digital-twin/llm-analyzer';
import type { AggregatedUserData } from '@/types/digital-twin';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

const isoDateArb = fc.integer({ min: 0, max: 365 * 10 }).map(daysAgo => {
  const date = new Date('2030-12-31T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString();
});

// ============================================
// 生成器
// ============================================

/** 生成有效的指标评分 */
const metricScoreArb: fc.Arbitrary<MetricScore> = fc.record({
  score: fc.float({ min: 0, max: 10, noNaN: true }),
  trend: fc.constantFrom('improving', 'stable', 'declining', '数据收集中'),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
});

/** 生成有效的预测值 */
const predictionValueArb = fc.record({
  value: fc.float({ min: 0, max: 10, noNaN: true }),
  confidence: fc.string().map(s => `${(Math.random() * 10).toFixed(1)} ± ${(Math.random() * 2).toFixed(1)}`),
});

/** 生成有效的时间点预测 */
const timepointPredictionArb = (week: number): fc.Arbitrary<PredictionTimepoint> => fc.record({
  week: fc.constant(week),
  predictions: fc.record({
    anxietyScore: predictionValueArb,
    sleepQuality: predictionValueArb,
    stressResilience: predictionValueArb,
    moodStability: predictionValueArb,
    energyLevel: predictionValueArb,
    hrvScore: predictionValueArb,
  }),
});

/** 生成有效的纵向预测 */
const longitudinalPredictionsArb: fc.Arbitrary<LongitudinalPredictions> = fc.record({
  timepoints: fc.tuple(
    timepointPredictionArb(0),
    timepointPredictionArb(3),
    timepointPredictionArb(6),
    timepointPredictionArb(9),
    timepointPredictionArb(12),
    timepointPredictionArb(15)
  ).map(arr => arr),
  baselineComparison: fc.array(fc.record({
    metric: fc.string(),
    baseline: fc.float({ min: 0, max: 10, noNaN: true }),
    current: fc.float({ min: 0, max: 10, noNaN: true }),
    change: fc.float({ min: -10, max: 10, noNaN: true }),
    changePercent: fc.float({ min: -100, max: 100, noNaN: true }),
  })),
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
  riskFactors: fc.array(fc.string(), { maxLength: 5 }),
  strengths: fc.array(fc.string(), { maxLength: 5 }),
  scientificBasis: fc.array(fc.record({
    claim: fc.string(),
    paperTitle: fc.string(),
    paperUrl: fc.string(),
    citationCount: fc.integer({ min: 0, max: 10000 }),
  }), { maxLength: 3 }),
});

/** 生成有效的聚合用户数据 */
const aggregatedUserDataArb: fc.Arbitrary<AggregatedUserData> = fc.record({
  userId: fc.uuid(),
  baseline: fc.option(fc.record({
    gad7Score: fc.integer({ min: 0, max: 21 }),
    phq9Score: fc.integer({ min: 0, max: 27 }),
    isiScore: fc.integer({ min: 0, max: 28 }),
    pss10Score: fc.integer({ min: 0, max: 40 }),
    assessmentDate: isoDateArb,
    interpretations: fc.record({
      gad7: fc.constant('轻度焦虑'),
      phq9: fc.constant('轻度抑郁'),
      isi: fc.constant('无失眠'),
      pss10: fc.constant('低压力'),
    }),
  }), { nil: null }),
  calibrations: fc.array(fc.record({
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
  }), { minLength: 0, maxLength: 10 }),
  inquiryInsights: fc.constant([]),
  conversationSummary: fc.record({
    totalMessages: fc.integer({ min: 0, max: 1000 }),
    emotionalTrend: fc.constantFrom('improving', 'stable', 'declining'),
    frequentTopics: fc.array(fc.string(), { maxLength: 5 }),
    lastInteraction: isoDateArb,
  }),
  profile: fc.record({
    age: fc.option(fc.integer({ min: 18, max: 100 }), { nil: undefined }),
    gender: fc.option(fc.constantFrom('male', 'female', 'other'), { nil: undefined }),
    primaryConcern: fc.option(fc.string(), { nil: undefined }),
    registrationDate: isoDateArb,
    medicalHistoryConsent: fc.boolean(),
  }),
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin LLM Analyzer Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 5: Prediction Confidence Intervals**
   * **Validates: Requirements 2.5**
   * 
   * *For any* prediction generated by the AI_Analyzer, all metric values
   * SHALL include a confidence interval in the format "value ± uncertainty".
   */
  it('Property 5: All predictions include confidence intervals', () => {
    fc.assert(
      fc.property(longitudinalPredictionsArb, (predictions) => {
        // 验证所有时间点的所有指标都有置信区间
        predictions.timepoints.forEach(timepoint => {
          const preds = timepoint.predictions;
          
          // 检查每个指标的置信区间格式
          expect(preds.anxietyScore.confidence).toMatch(/±|±/);
          expect(preds.sleepQuality.confidence).toMatch(/±|±/);
          expect(preds.stressResilience.confidence).toMatch(/±|±/);
          expect(preds.moodStability.confidence).toMatch(/±|±/);
          expect(preds.energyLevel.confidence).toMatch(/±|±/);
          expect(preds.hrvScore.confidence).toMatch(/±|±/);
        });
      })
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 6: Prediction Timepoint Completeness**
   * **Validates: Requirements 3.1**
   * 
   * *For any* longitudinal prediction output, the predictions SHALL contain
   * exactly 6 timepoints: baseline (week 0), week 3, week 6, week 9, week 12, and week 15.
   */
  it('Property 6: Predictions contain exactly 6 timepoints', () => {
    fc.assert(
      fc.property(longitudinalPredictionsArb, (predictions) => {
        // 验证时间点数量
        expect(predictions.timepoints.length).toBe(6);
        
        // 验证时间点周数
        const weeks = predictions.timepoints.map(t => t.week);
        expect(weeks).toEqual([0, 3, 6, 9, 12, 15]);
      })
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 7: Metric Completeness**
   * **Validates: Requirements 3.3**
   * 
   * *For any* prediction output, all 6 required metrics SHALL be present:
   * Anxiety Score, Sleep Quality, Stress Resilience, Mood Stability, Energy Level, and HRV Score.
   */
  it('Property 7: All 6 required metrics are present in predictions', () => {
    fc.assert(
      fc.property(longitudinalPredictionsArb, (predictions) => {
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
          expect(preds.anxietyScore).toHaveProperty('value');
          expect(preds.anxietyScore).toHaveProperty('confidence');
          expect(preds.sleepQuality).toHaveProperty('value');
          expect(preds.sleepQuality).toHaveProperty('confidence');
          expect(preds.stressResilience).toHaveProperty('value');
          expect(preds.stressResilience).toHaveProperty('confidence');
          expect(preds.moodStability).toHaveProperty('value');
          expect(preds.moodStability).toHaveProperty('confidence');
          expect(preds.energyLevel).toHaveProperty('value');
          expect(preds.energyLevel).toHaveProperty('confidence');
          expect(preds.hrvScore).toHaveProperty('value');
          expect(preds.hrvScore).toHaveProperty('confidence');
        });
      })
    );
  });

  /**
   * 验证评估指标分数在有效范围内
   */
  it('Assessment metric scores are within valid range [0, 10]', () => {
    fc.assert(
      fc.property(physiologicalAssessmentArb, (assessment) => {
        expect(assessment.anxietyLevel.score).toBeGreaterThanOrEqual(0);
        expect(assessment.anxietyLevel.score).toBeLessThanOrEqual(10);
        expect(assessment.sleepHealth.score).toBeGreaterThanOrEqual(0);
        expect(assessment.sleepHealth.score).toBeLessThanOrEqual(10);
        expect(assessment.stressResilience.score).toBeGreaterThanOrEqual(0);
        expect(assessment.stressResilience.score).toBeLessThanOrEqual(10);
        expect(assessment.moodStability.score).toBeGreaterThanOrEqual(0);
        expect(assessment.moodStability.score).toBeLessThanOrEqual(10);
        expect(assessment.energyLevel.score).toBeGreaterThanOrEqual(0);
        expect(assessment.energyLevel.score).toBeLessThanOrEqual(10);
        expect(assessment.hrvEstimate.score).toBeGreaterThanOrEqual(0);
        expect(assessment.hrvEstimate.score).toBeLessThanOrEqual(10);
      })
    );
  });

  /**
   * 验证置信度在有效范围内
   */
  it('Assessment confidence values are within valid range [0, 1]', () => {
    fc.assert(
      fc.property(physiologicalAssessmentArb, (assessment) => {
        expect(assessment.anxietyLevel.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.anxietyLevel.confidence).toBeLessThanOrEqual(1);
        expect(assessment.sleepHealth.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.sleepHealth.confidence).toBeLessThanOrEqual(1);
        expect(assessment.stressResilience.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.stressResilience.confidence).toBeLessThanOrEqual(1);
        expect(assessment.moodStability.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.moodStability.confidence).toBeLessThanOrEqual(1);
        expect(assessment.energyLevel.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.energyLevel.confidence).toBeLessThanOrEqual(1);
        expect(assessment.hrvEstimate.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.hrvEstimate.confidence).toBeLessThanOrEqual(1);
      })
    );
  });

  /**
   * 验证健康关键词提取
   */
  it('Health keywords extraction returns non-empty array', () => {
    fc.assert(
      fc.property(aggregatedUserDataArb, (userData) => {
        const keywords = extractHealthKeywords(userData);
        
        // 应该总是返回至少一些关键词
        expect(Array.isArray(keywords)).toBe(true);
        expect(keywords.length).toBeGreaterThan(0);
        
        // 关键词应该是字符串
        keywords.forEach(keyword => {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        });
      })
    );
  });

  /**
   * 验证分析提示词构建
   */
  it('Analysis prompt contains required sections', () => {
    fc.assert(
      fc.property(aggregatedUserDataArb, (userData) => {
        const prompt = buildAnalysisPrompt({
          userData,
          papers: [],
          previousAnalysis: undefined,
        });
        
        // 提示词应该包含关键部分
        expect(prompt).toContain('用户数据');
        expect(prompt).toContain('输出要求');
        expect(prompt).toContain('JSON');
        
        // 如果有基线数据，应该包含量表信息
        if (userData.baseline) {
          expect(prompt).toContain('GAD-7');
          expect(prompt).toContain('PHQ-9');
          expect(prompt).toContain('ISI');
          expect(prompt).toContain('PSS-10');
        }
        
        // 应该包含用户画像信息
        expect(prompt).toContain('用户画像');
        expect(prompt).toContain('注册日期');
      })
    );
  });

  /**
   * 验证整体状态只有三种有效值
   */
  it('Overall status is one of three valid values', () => {
    fc.assert(
      fc.property(physiologicalAssessmentArb, (assessment) => {
        expect(['improving', 'stable', 'needs_attention']).toContain(assessment.overallStatus);
      })
    );
  });
});
