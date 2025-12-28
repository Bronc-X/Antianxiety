/**
 * Digital Twin Privacy Property Tests
 * 
 * 隐私控制的属性测试
 * 
 * @module __tests__/properties/digital-twin-privacy.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DashboardData } from '@/types/digital-twin';
import { filterSensitiveData } from '@/lib/digital-twin/dashboard-generator';

// 配置 fast-check 运行 100 次迭代
fc.configureGlobal({ numRuns: 100 });

// ============================================
// 生成器
// ============================================

/** 生成有效的基线评估 */
const baselineAssessmentArb = fc.record({
  name: fc.constantFrom('GAD-7 焦虑量表', 'PHQ-9 抑郁量表', 'ISI 失眠量表', 'PSS-10 压力量表'),
  value: fc.string({ minLength: 1 }),
  interpretation: fc.string({ minLength: 1 }),
});

/** 生成有效的仪表盘数据（带敏感信息） */
const dashboardDataWithSensitiveArb: fc.Arbitrary<DashboardData> = fc.record({
  participant: fc.record({
    initials: fc.string({ minLength: 1, maxLength: 3 }),
    age: fc.option(fc.integer({ min: 18, max: 100 }), { nil: undefined }),
    gender: fc.option(fc.constantFrom('male', 'female', 'other'), { nil: undefined }),
    diagnosis: fc.string(),
    registrationDate: fc.integer({ min: 0, max: 365 }).map(d => {
      const date = new Date();
      date.setDate(date.getDate() - d);
      return date.toISOString();
    }),
  }),
  predictionTable: fc.record({
    metrics: fc.array(fc.record({
      name: fc.string(),
      baseline: fc.float({ min: 0, max: 10, noNaN: true }),
      predictions: fc.constant({ week0: '5.0 ± 1.0' }),
    }), { minLength: 6, maxLength: 6 }),
  }),
  timeline: fc.array(fc.record({
    week: fc.integer({ min: 0, max: 15 }),
    event: fc.string(),
    status: fc.constantFrom('completed', 'current', 'upcoming'),
    detail: fc.string(),
    actualScore: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: undefined }),
  }), { minLength: 6, maxLength: 6 }),
  baselineData: fc.record({
    // 确保有敏感的评估数据
    assessments: fc.array(baselineAssessmentArb, { minLength: 1, maxLength: 4 }),
    vitals: fc.array(fc.record({
      name: fc.string(),
      value: fc.string(),
      trend: fc.constantFrom('above_target', 'at_target', 'below_target', 'normal'),
    }), { minLength: 1, maxLength: 5 }),
  }),
  charts: fc.record({
    anxietyTrend: fc.array(fc.float({ min: 0, max: 10, noNaN: true }), { minLength: 1, maxLength: 14 }),
    sleepTrend: fc.array(fc.float({ min: 0, max: 10, noNaN: true }), { minLength: 1, maxLength: 14 }),
    hrvTrend: fc.array(fc.float({ min: 0, max: 10, noNaN: true }), { minLength: 1, maxLength: 14 }),
    energyTrend: fc.array(fc.float({ min: 0, max: 10, noNaN: true }), { minLength: 1, maxLength: 14 }),
  }),
  summaryStats: fc.record({
    overallImprovement: fc.string(),
    daysToFirstResult: fc.integer({ min: 0, max: 30 }),
    consistencyScore: fc.constantFrom('优秀', '良好', '一般', '需改进'),
  }),
  lastAnalyzed: fc.integer({ min: 0, max: 30 }).map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString();
  }),
  nextAnalysisScheduled: fc.integer({ min: 1, max: 7 }).map(d => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    return date.toISOString();
  }),
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin Privacy Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 12: Medical History Privacy**
   * **Validates: Requirements 8.4**
   * 
   * *For any* dashboard data output, sensitive medical history SHALL NOT be included
   * unless the user has explicitly granted consent (consent flag is true).
   */
  it('Property 12: Sensitive medical data is hidden without consent', () => {
    fc.assert(
      fc.property(dashboardDataWithSensitiveArb, (dashboardData) => {
        // 无授权时过滤
        const filtered = filterSensitiveData(dashboardData, false);
        
        // 验证所有评估数据都被隐藏
        expect(filtered.baselineData.assessments.length).toBe(dashboardData.baselineData.assessments.length);
        
        filtered.baselineData.assessments.forEach((assessment, index) => {
          // 名称保留
          expect(assessment.name).toBe(dashboardData.baselineData.assessments[index].name);
          // 值被隐藏
          expect(assessment.value).toBe('已记录');
          // 解读被隐藏
          expect(assessment.interpretation).toBe('详情需授权查看');
        });
      })
    );
  });

  /**
   * 验证有授权时数据完整保留
   */
  it('Sensitive medical data is preserved with consent', () => {
    fc.assert(
      fc.property(dashboardDataWithSensitiveArb, (dashboardData) => {
        // 有授权时不过滤
        const unfiltered = filterSensitiveData(dashboardData, true);
        
        // 验证数据完全相同
        expect(unfiltered.baselineData.assessments).toEqual(dashboardData.baselineData.assessments);
        
        // 验证原始值保留
        unfiltered.baselineData.assessments.forEach((assessment, index) => {
          expect(assessment.value).toBe(dashboardData.baselineData.assessments[index].value);
          expect(assessment.interpretation).toBe(dashboardData.baselineData.assessments[index].interpretation);
        });
      })
    );
  });

  /**
   * 验证非敏感数据不受影响
   */
  it('Non-sensitive data is not affected by privacy filter', () => {
    fc.assert(
      fc.property(dashboardDataWithSensitiveArb, (dashboardData) => {
        const filtered = filterSensitiveData(dashboardData, false);
        
        // 参与者信息不变
        expect(filtered.participant).toEqual(dashboardData.participant);
        
        // 预测表格不变
        expect(filtered.predictionTable).toEqual(dashboardData.predictionTable);
        
        // 时间线不变
        expect(filtered.timeline).toEqual(dashboardData.timeline);
        
        // 图表数据不变
        expect(filtered.charts).toEqual(dashboardData.charts);
        
        // 汇总统计不变
        expect(filtered.summaryStats).toEqual(dashboardData.summaryStats);
        
        // 生物指标不变
        expect(filtered.baselineData.vitals).toEqual(dashboardData.baselineData.vitals);
      })
    );
  });

  /**
   * 验证过滤是幂等的
   */
  it('Privacy filter is idempotent', () => {
    fc.assert(
      fc.property(dashboardDataWithSensitiveArb, (dashboardData) => {
        // 多次过滤应该得到相同结果
        const filtered1 = filterSensitiveData(dashboardData, false);
        const filtered2 = filterSensitiveData(filtered1, false);
        
        expect(filtered2).toEqual(filtered1);
      })
    );
  });

  /**
   * 验证授权后再取消授权的行为
   */
  it('Consent can be revoked', () => {
    fc.assert(
      fc.property(dashboardDataWithSensitiveArb, (dashboardData) => {
        // 先有授权
        const withConsent = filterSensitiveData(dashboardData, true);
        expect(withConsent).toEqual(dashboardData);
        
        // 然后取消授权
        const withoutConsent = filterSensitiveData(dashboardData, false);
        
        // 敏感数据应该被隐藏
        withoutConsent.baselineData.assessments.forEach(assessment => {
          expect(assessment.value).toBe('已记录');
          expect(assessment.interpretation).toBe('详情需授权查看');
        });
      })
    );
  });
});
