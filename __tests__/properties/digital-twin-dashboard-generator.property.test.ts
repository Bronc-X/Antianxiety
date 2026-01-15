/**
 * Digital Twin Dashboard Generator Property Tests
 * 
 * 仪表盘生成器的属性测试
 * 
 * @module __tests__/properties/digital-twin-dashboard-generator.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  AggregatedUserData,
  PhysiologicalAssessment,
  LongitudinalPredictions,
  AdaptivePlan,
} from '@/types/digital-twin';
import {
  generateDashboardData,
  validateDashboardData,
  filterSensitiveData,
  type LLMAnalysisResult,
} from '@/lib/digital-twin/dashboard-generator';

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

/** 生成有效的预测值 */
const predictionValueArb = fc.record({
  value: fc.float({ min: 0, max: 10, noNaN: true }),
  confidence: fc.string().map(() => `${(Math.random() * 10).toFixed(1)} ± ${(Math.random() * 2).toFixed(1)}`),
});

/** 生成有效的时间点预测 */
const timepointPredictionArb = (week: number) => fc.record({
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

/** 生成有效的自适应计划 */
const adaptivePlanArb: fc.Arbitrary<AdaptivePlan> = fc.record({
  dailyFocus: fc.array(fc.record({
    area: fc.string(),
    priority: fc.constantFrom('high', 'medium', 'low'),
    action: fc.string(),
    rationale: fc.string(),
    scientificBasis: fc.option(fc.string(), { nil: undefined }),
  }), { minLength: 1, maxLength: 3 }),
  breathingExercises: fc.array(fc.record({
    name: fc.string(),
    duration: fc.string(),
    timing: fc.string(),
    benefit: fc.string(),
  }), { minLength: 1, maxLength: 3 }),
  sleepRecommendations: fc.array(fc.record({
    recommendation: fc.string(),
    reason: fc.string(),
    expectedImpact: fc.string(),
  }), { minLength: 1, maxLength: 3 }),
  activitySuggestions: fc.array(fc.record({
    activity: fc.string(),
    frequency: fc.string(),
    duration: fc.string(),
    benefit: fc.string(),
  }), { maxLength: 3 }),
  avoidanceBehaviors: fc.array(fc.string(), { maxLength: 5 }),
  nextCheckpoint: fc.record({
    date: fc.integer({ min: 1, max: 30 }).map(daysAhead => {
      const date = new Date();
      date.setDate(date.getDate() + daysAhead);
      return date.toISOString().split('T')[0];
    }),
    focus: fc.string(),
  }),
});

/** 生成有效的 LLM 分析结果 */
const llmAnalysisResultArb: fc.Arbitrary<LLMAnalysisResult> = fc.record({
  assessment: physiologicalAssessmentArb,
  predictions: longitudinalPredictionsArb,
  adaptivePlan: adaptivePlanArb,
  analysisTimestamp: fc.integer({ min: 0, max: 365 }).map(daysAgo => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }),
  modelUsed: fc.constantFrom('claude-sonnet', 'deepseek-v3', 'rule-based'),
  confidenceScore: fc.float({ min: 0, max: 1, noNaN: true }),
});

/** 生成有效的聚合用户数据 */
const aggregatedUserDataArb: fc.Arbitrary<AggregatedUserData> = fc.record({
  userId: fc.uuid(),
  baseline: fc.option(fc.record({
    gad7Score: fc.integer({ min: 0, max: 21 }),
    phq9Score: fc.integer({ min: 0, max: 27 }),
    isiScore: fc.integer({ min: 0, max: 28 }),
    pss10Score: fc.integer({ min: 0, max: 40 }),
    assessmentDate: fc.integer({ min: 0, max: 365 }).map(daysAgo => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    }),
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
    lastInteraction: fc.integer({ min: 0, max: 30 }).map(daysAgo => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    }),
  }),
  profile: fc.record({
    age: fc.option(fc.integer({ min: 18, max: 100 }), { nil: undefined }),
    gender: fc.option(fc.constantFrom('male', 'female', 'other'), { nil: undefined }),
    primaryConcern: fc.option(fc.string(), { nil: undefined }),
    registrationDate: fc.integer({ min: 0, max: 120 }).map(d => {
      const date = new Date();
      date.setDate(date.getDate() - d);
      return date.toISOString();
    }),
    medicalHistoryConsent: fc.boolean(),
  }),
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin Dashboard Generator Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 8: Baseline Display Completeness**
   * **Validates: Requirements 3.2, 5.1, 5.2, 5.4**
   * 
   * *For any* dashboard data, the baseline section SHALL include all 4 clinical
   * assessment scores (GAD-7, PHQ-9, ISI, PSS-10) with their interpretations and trend indicators.
   */
  it('Property 8: Dashboard includes baseline assessments when available', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 验证基线数据结构存在
          expect(dashboard.baselineData).toBeDefined();
          expect(dashboard.baselineData.assessments).toBeDefined();
          expect(dashboard.baselineData.vitals).toBeDefined();
          
          // 如果有基线数据，应该包含 4 个评估
          if (userData.baseline) {
            expect(dashboard.baselineData.assessments.length).toBe(4);
            
            // 验证每个评估都有必要字段
            dashboard.baselineData.assessments.forEach(assessment => {
              expect(assessment).toHaveProperty('name');
              expect(assessment).toHaveProperty('value');
              expect(assessment).toHaveProperty('interpretation');
            });
          }
          
          // 验证生物指标
          expect(dashboard.baselineData.vitals.length).toBeGreaterThan(0);
          dashboard.baselineData.vitals.forEach(vital => {
            expect(vital).toHaveProperty('name');
            expect(vital).toHaveProperty('value');
            expect(vital).toHaveProperty('trend');
          });
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 10: Summary Statistics Presence**
   * **Validates: Requirements 6.2, 6.4**
   * 
   * *For any* dashboard data, the summary statistics SHALL include:
   * Overall Improvement percentage, Days to First Result, and Consistency Score.
   */
  it('Property 10: Dashboard includes all summary statistics', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 验证汇总统计存在
          expect(dashboard.summaryStats).toBeDefined();
          
          // 验证所有必要字段
          expect(dashboard.summaryStats).toHaveProperty('overallImprovement');
          expect(dashboard.summaryStats).toHaveProperty('daysToFirstResult');
          expect(dashboard.summaryStats).toHaveProperty('consistencyScore');
          
          // 验证字段类型
          expect(typeof dashboard.summaryStats.overallImprovement).toBe('string');
          expect(typeof dashboard.summaryStats.daysToFirstResult).toBe('number');
          expect(typeof dashboard.summaryStats.consistencyScore).toBe('string');
          
          // 验证值的合理性
          expect(dashboard.summaryStats.daysToFirstResult).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 11: Participant Metadata Completeness**
   * **Validates: Requirements 7.3, 8.1, 8.2, 8.3**
   * 
   * *For any* dashboard data, the participant section SHALL include initials
   * (derived from name), and optionally age, gender, and primary diagnosis when available.
   */
  it('Property 11: Dashboard includes participant metadata', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 验证参与者信息存在
          expect(dashboard.participant).toBeDefined();
          
          // 验证必要字段
          expect(dashboard.participant).toHaveProperty('initials');
          expect(dashboard.participant).toHaveProperty('diagnosis');
          expect(dashboard.participant).toHaveProperty('registrationDate');
          
          // 验证首字母不为空
          expect(dashboard.participant.initials.length).toBeGreaterThan(0);
          
          // 验证注册日期格式
          expect(new Date(dashboard.participant.registrationDate).toString()).not.toBe('Invalid Date');
        }
      )
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 12: Medical History Privacy**
   * **Validates: Requirements 8.4**
   * 
   * *For any* dashboard data output, sensitive medical history SHALL NOT be included
   * unless the user has explicitly granted consent (consent flag is true).
   */
  it('Property 12: Sensitive data is filtered without consent', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 测试无授权情况
          const filteredDashboard = filterSensitiveData(dashboard, false);
          
          // 验证敏感数据被过滤
          if (filteredDashboard.baselineData.assessments.length > 0) {
            filteredDashboard.baselineData.assessments.forEach(assessment => {
              expect(assessment.value).toBe('已记录');
              expect(assessment.interpretation).toBe('详情需授权查看');
            });
          }
          
          // 测试有授权情况
          const unfiltered = filterSensitiveData(dashboard, true);
          
          // 验证数据未被过滤
          expect(unfiltered).toEqual(dashboard);
        }
      )
    );
  });

  /**
   * 验证仪表盘数据验证函数
   */
  it('validateDashboardData correctly validates dashboard', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 生成的仪表盘应该通过验证
          expect(validateDashboardData(dashboard)).toBe(true);
        }
      )
    );
  });

  /**
   * 验证预测表格包含 6 个指标
   */
  it('Prediction table contains exactly 6 metrics', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          expect(dashboard.predictionTable.metrics.length).toBe(6);
          
          // 验证每个指标都有必要字段
          dashboard.predictionTable.metrics.forEach(metric => {
            expect(metric).toHaveProperty('name');
            expect(metric).toHaveProperty('baseline');
            expect(metric).toHaveProperty('predictions');
            expect(typeof metric.name).toBe('string');
            expect(typeof metric.baseline).toBe('number');
          });
        }
      )
    );
  });

  /**
   * 验证时间线包含 6 个里程碑
   */
  it('Timeline contains exactly 6 milestones', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          expect(dashboard.timeline.length).toBe(6);
          
          // 验证里程碑周数
          const weeks = dashboard.timeline.map(m => m.week);
          expect(weeks).toEqual([0, 3, 6, 9, 12, 15]);
        }
      )
    );
  });

  /**
   * 验证图表数据存在
   */
  it('Chart data arrays are present', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          expect(Array.isArray(dashboard.charts.anxietyTrend)).toBe(true);
          expect(Array.isArray(dashboard.charts.sleepTrend)).toBe(true);
          expect(Array.isArray(dashboard.charts.hrvTrend)).toBe(true);
          expect(Array.isArray(dashboard.charts.energyTrend)).toBe(true);
        }
      )
    );
  });

  /**
   * 验证时间戳格式
   */
  it('Timestamps are valid ISO strings', () => {
    fc.assert(
      fc.property(
        llmAnalysisResultArb,
        aggregatedUserDataArb,
        (analysis, userData) => {
          const dashboard = generateDashboardData(analysis, userData);
          
          // 验证 lastAnalyzed
          expect(new Date(dashboard.lastAnalyzed).toString()).not.toBe('Invalid Date');
          
          // 验证 nextAnalysisScheduled
          expect(new Date(dashboard.nextAnalysisScheduled).toString()).not.toBe('Invalid Date');
        }
      )
    );
  });
});
