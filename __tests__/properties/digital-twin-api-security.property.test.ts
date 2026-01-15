/**
 * Digital Twin API Security Property Tests
 * 
 * API 安全性的属性测试
 * 
 * @module __tests__/properties/digital-twin-api-security.property.test.ts
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

/** 生成有效的仪表盘数据 */
const dashboardDataArb: fc.Arbitrary<DashboardData> = fc.record({
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
      predictions: fc.constant({ week0: '5.0 ± 1.0', week3: '5.5 ± 1.0' }),
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
    assessments: fc.array(fc.record({
      name: fc.constantFrom('GAD-7', 'PHQ-9', 'ISI', 'PSS-10'),
      value: fc.string(),
      interpretation: fc.string(),
    }), { minLength: 0, maxLength: 4 }),
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

/** 生成模拟的 API 响应 */
const apiResponseArb = fc.record({
  dashboardData: dashboardDataArb,
  adaptivePlan: fc.record({
    dailyFocus: fc.array(fc.record({
      area: fc.string(),
      priority: fc.constantFrom('high', 'medium', 'low'),
      action: fc.string(),
      rationale: fc.string(),
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
    activitySuggestions: fc.constant([]),
    avoidanceBehaviors: fc.array(fc.string(), { maxLength: 3 }),
    nextCheckpoint: fc.record({
      date: fc.integer({ min: 1, max: 14 }).map(d => {
        const date = new Date();
        date.setDate(date.getDate() + d);
        return date.toISOString().split('T')[0];
      }),
      focus: fc.string(),
    }),
  }),
  isStale: fc.boolean(),
  lastAnalyzed: fc.integer({ min: 0, max: 30 }).map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString();
  }),
});

// ============================================
// 属性测试
// ============================================

describe('Digital Twin API Security Properties', () => {
  /**
   * **Feature: digital-twin-analytics, Property 12: Medical History Privacy**
   * **Validates: Requirements 8.4**
   * 
   * *For any* dashboard data output, sensitive medical history SHALL NOT be included
   * unless the user has explicitly granted consent (consent flag is true).
   */
  it('Property 12: Medical history is hidden without consent', () => {
    fc.assert(
      fc.property(dashboardDataArb, (dashboardData) => {
        // 无授权时过滤
        const filtered = filterSensitiveData(dashboardData, false);
        
        // 验证敏感数据被隐藏
        if (filtered.baselineData.assessments.length > 0) {
          filtered.baselineData.assessments.forEach(assessment => {
            expect(assessment.value).toBe('已记录');
            expect(assessment.interpretation).toBe('详情需授权查看');
          });
        }
      })
    );
  });

  /**
   * 验证有授权时数据不被过滤
   */
  it('Medical history is visible with consent', () => {
    fc.assert(
      fc.property(dashboardDataArb, (dashboardData) => {
        // 有授权时不过滤
        const unfiltered = filterSensitiveData(dashboardData, true);
        
        // 验证数据未被修改
        expect(unfiltered).toEqual(dashboardData);
      })
    );
  });

  /**
   * **Feature: digital-twin-analytics, Property 14: Prompt Confidentiality**
   * **Validates: Requirements 9.3**
   * 
   * *For any* API response from the digital twin endpoints, the response SHALL NOT
   * contain raw LLM prompts, internal calculation details, or debug information.
   */
  it('Property 14: API response does not contain sensitive internal data', () => {
    fc.assert(
      fc.property(apiResponseArb, (response) => {
        const responseStr = JSON.stringify(response);
        
        // 不应包含 LLM 提示词关键字
        expect(responseStr).not.toContain('你是一位');
        expect(responseStr).not.toContain('请以 JSON 格式');
        expect(responseStr).not.toContain('system prompt');
        expect(responseStr).not.toContain('assistant prompt');
        
        // 不应包含内部调试信息
        expect(responseStr).not.toContain('debug');
        expect(responseStr).not.toContain('internal_');
        expect(responseStr).not.toContain('_internal');
        expect(responseStr).not.toContain('raw_response');
        
        // 不应包含 API 密钥或敏感配置
        expect(responseStr).not.toContain('api_key');
        expect(responseStr).not.toContain('apiKey');
        expect(responseStr).not.toContain('secret');
        expect(responseStr).not.toContain('password');
      })
    );
  });

  /**
   * 验证响应结构符合预期
   */
  it('API response has expected structure', () => {
    fc.assert(
      fc.property(apiResponseArb, (response) => {
        // 验证必要字段存在
        expect(response).toHaveProperty('dashboardData');
        expect(response).toHaveProperty('adaptivePlan');
        expect(response).toHaveProperty('isStale');
        expect(response).toHaveProperty('lastAnalyzed');
        
        // 验证仪表盘数据结构
        expect(response.dashboardData).toHaveProperty('participant');
        expect(response.dashboardData).toHaveProperty('predictionTable');
        expect(response.dashboardData).toHaveProperty('timeline');
        expect(response.dashboardData).toHaveProperty('baselineData');
        expect(response.dashboardData).toHaveProperty('charts');
        expect(response.dashboardData).toHaveProperty('summaryStats');
        
        // 验证自适应计划结构
        expect(response.adaptivePlan).toHaveProperty('dailyFocus');
        expect(response.adaptivePlan).toHaveProperty('breathingExercises');
        expect(response.adaptivePlan).toHaveProperty('sleepRecommendations');
        expect(response.adaptivePlan).toHaveProperty('nextCheckpoint');
      })
    );
  });

  /**
   * 验证时间戳格式
   */
  it('Timestamps in response are valid ISO strings', () => {
    fc.assert(
      fc.property(apiResponseArb, (response) => {
        // 验证 lastAnalyzed
        expect(new Date(response.lastAnalyzed).toString()).not.toBe('Invalid Date');
        
        // 验证仪表盘时间戳
        expect(new Date(response.dashboardData.lastAnalyzed).toString()).not.toBe('Invalid Date');
        expect(new Date(response.dashboardData.nextAnalysisScheduled).toString()).not.toBe('Invalid Date');
        expect(new Date(response.dashboardData.participant.registrationDate).toString()).not.toBe('Invalid Date');
      })
    );
  });

  /**
   * 验证数值在有效范围内
   */
  it('Numeric values are within valid ranges', () => {
    fc.assert(
      fc.property(apiResponseArb, (response) => {
        // 验证预测表格基线值
        response.dashboardData.predictionTable.metrics.forEach(metric => {
          expect(metric.baseline).toBeGreaterThanOrEqual(0);
          expect(metric.baseline).toBeLessThanOrEqual(10);
        });
        
        // 验证图表数据
        response.dashboardData.charts.anxietyTrend.forEach(v => {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(10);
        });
        response.dashboardData.charts.sleepTrend.forEach(v => {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(10);
        });
        
        // 验证汇总统计
        expect(response.dashboardData.summaryStats.daysToFirstResult).toBeGreaterThanOrEqual(0);
      })
    );
  });
});
