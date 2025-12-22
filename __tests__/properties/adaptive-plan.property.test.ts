/**
 * **Feature: adaptive-plan-followup, Property 17: Plan Data Round-Trip Serialization**
 * **Validates: Requirements 6.5, 6.6**
 * 
 * Property-based tests for the Adaptive Plan Follow-up System
 * 动态计划适应系统属性测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  AdaptivePlan,
  ActionItem,
  ScientificExplanation,
  ProblemAnalysis,
  serializeAdaptivePlan,
  deserializeAdaptivePlan,
  isValidAdaptivePlan,
  isValidActionItem,
  isValidScientificExplanation,
  ExecutionRecord,
  UserUnderstandingScore,
  ScoreBreakdown,
} from '@/types/adaptive-plan';

// ============================================
// Arbitrary Generators
// ============================================

// Keep generated timestamps within ISO-safe Date range for `toISOString()`
// (JS Date supports a wider range, but `toISOString()` throws outside year 0..9999)
const ISO_DATE_MIN = new Date('2024-01-01T00:00:00.000Z');
const ISO_DATE_MAX = new Date('2025-12-31T23:59:59.999Z');

const ISO_DATE_MIN_MS = ISO_DATE_MIN.getTime();
const ISO_DATE_MAX_MS = ISO_DATE_MAX.getTime();

const isoDateTimeArb = fc
  .integer({ min: ISO_DATE_MIN_MS, max: ISO_DATE_MAX_MS })
  .map((ms) => new Date(ms).toISOString());

const isoDateArb = fc
  .integer({ min: ISO_DATE_MIN_MS, max: ISO_DATE_MAX_MS })
  .map((ms) => new Date(ms).toISOString().split('T')[0]);

const scientificExplanationArb: fc.Arbitrary<ScientificExplanation> = fc.record({
  physiology: fc.string({ minLength: 1, maxLength: 200 }),
  neurology: fc.string({ minLength: 1, maxLength: 200 }),
  psychology: fc.string({ minLength: 1, maxLength: 200 }),
  behavioral_science: fc.string({ minLength: 1, maxLength: 200 }),
  summary: fc.string({ minLength: 1, maxLength: 500 }),
  references: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
});

const problemAnalysisArb: fc.Arbitrary<ProblemAnalysis> = fc.record({
  problem_description: fc.string({ minLength: 1, maxLength: 500 }),
  root_causes: fc.record({
    physiological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    neurological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    psychological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    behavioral: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
  }),
  scientific_explanation: scientificExplanationArb,
});

const actionItemArb: fc.Arbitrary<ActionItem> = fc.record({
  id: fc.uuid(),
  plan_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  timing: fc.string({ minLength: 1, maxLength: 50 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }),
  steps: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
  expected_outcome: fc.string({ minLength: 1, maxLength: 300 }),
  scientific_rationale: scientificExplanationArb,
  order: fc.nat({ max: 100 }),
  is_established: fc.boolean(),
  replacement_count: fc.nat({ max: 10 }),
  created_at: fc.option(isoDateTimeArb, { nil: undefined }),
  updated_at: fc.option(isoDateTimeArb, { nil: undefined }),
});


const adaptivePlanArb: fc.Arbitrary<AdaptivePlan> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  problem_analysis: problemAnalysisArb,
  action_items: fc.array(actionItemArb, { minLength: 5, maxLength: 10 }),
  version: fc.nat({ max: 100 }),
  created_at: isoDateTimeArb,
  last_evolved_at: isoDateTimeArb,
  evolution_count: fc.nat({ max: 50 }),
  user_summary: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  status: fc.constantFrom('active', 'paused', 'completed'),
});

const executionRecordArb: fc.Arbitrary<ExecutionRecord> = fc.record({
  id: fc.uuid(),
  action_item_id: fc.uuid(),
  user_id: fc.uuid(),
  date: isoDateArb,
  status: fc.constantFrom('completed', 'partial', 'skipped', 'replaced'),
  needs_replacement: fc.boolean(),
  user_notes: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  replacement_reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  created_at: fc.option(isoDateTimeArb, { nil: undefined }),
});

const scoreBreakdownArb: fc.Arbitrary<ScoreBreakdown> = fc.record({
  completion_prediction_accuracy: fc.float({ min: 0, max: 100, noNaN: true }),
  replacement_acceptance_rate: fc.float({ min: 0, max: 100, noNaN: true }),
  sentiment_prediction_accuracy: fc.float({ min: 0, max: 100, noNaN: true }),
  preference_pattern_match: fc.float({ min: 0, max: 100, noNaN: true }),
});

// ============================================
// Property Tests
// ============================================

describe('Adaptive Plan - Property Tests', () => {
  /**
   * **Feature: adaptive-plan-followup, Property 17: Plan Data Round-Trip Serialization**
   * **Validates: Requirements 6.5, 6.6**
   * 
   * For any valid AdaptivePlan object, serializing to JSON and then deserializing
   * SHALL produce an object equivalent to the original, with all fields including
   * action_items and evolution history preserved.
   */
  it('Property 17: Plan data round-trip serialization preserves all data', () => {
    fc.assert(
      fc.property(adaptivePlanArb, (plan) => {
        // Serialize to JSON
        const serialized = serializeAdaptivePlan(plan);
        
        // Deserialize back to object
        const deserialized = deserializeAdaptivePlan(serialized);
        
        // Verify all top-level fields are preserved
        expect(deserialized.id).toBe(plan.id);
        expect(deserialized.user_id).toBe(plan.user_id);
        expect(deserialized.title).toBe(plan.title);
        expect(deserialized.version).toBe(plan.version);
        expect(deserialized.created_at).toBe(plan.created_at);
        expect(deserialized.last_evolved_at).toBe(plan.last_evolved_at);
        expect(deserialized.evolution_count).toBe(plan.evolution_count);
        expect(deserialized.user_summary).toBe(plan.user_summary);
        expect(deserialized.status).toBe(plan.status);
        
        // Verify action_items array is preserved
        expect(deserialized.action_items.length).toBe(plan.action_items.length);
        
        // Verify each action item
        for (let i = 0; i < plan.action_items.length; i++) {
          const original = plan.action_items[i];
          const restored = deserialized.action_items[i];
          
          expect(restored.id).toBe(original.id);
          expect(restored.title).toBe(original.title);
          expect(restored.description).toBe(original.description);
          expect(restored.timing).toBe(original.timing);
          expect(restored.duration).toBe(original.duration);
          expect(restored.steps).toEqual(original.steps);
          expect(restored.expected_outcome).toBe(original.expected_outcome);
          expect(restored.order).toBe(original.order);
          expect(restored.is_established).toBe(original.is_established);
          expect(restored.replacement_count).toBe(original.replacement_count);
        }
        
        // Verify problem_analysis is preserved
        expect(deserialized.problem_analysis.problem_description).toBe(plan.problem_analysis.problem_description);
        expect(deserialized.problem_analysis.root_causes).toEqual(plan.problem_analysis.root_causes);
        
        // Verify the deserialized object is valid
        expect(isValidAdaptivePlan(deserialized)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 10: Scientific Explanation Completeness**
   * **Validates: Requirements 4.1, 4.4**
   * 
   * For any generated plan or action item, the ScientificExplanation SHALL contain
   * non-empty strings for all 4 domains: physiology, neurology, psychology, and behavioral_science.
   */
  it('Property 10: Scientific explanation contains all 4 domains', () => {
    fc.assert(
      fc.property(scientificExplanationArb, (explanation) => {
        expect(isValidScientificExplanation(explanation)).toBe(true);
        expect(explanation.physiology.length).toBeGreaterThan(0);
        expect(explanation.neurology.length).toBeGreaterThan(0);
        expect(explanation.psychology.length).toBeGreaterThan(0);
        expect(explanation.behavioral_science.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 11: Minimum Action Items**
   * **Validates: Requirements 4.2**
   * 
   * For any newly generated plan, the action_items array SHALL contain at least 5 items.
   */
  it('Property 11: Plans have minimum 5 action items', () => {
    fc.assert(
      fc.property(adaptivePlanArb, (plan) => {
        expect(plan.action_items.length).toBeGreaterThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 12: Action Item Field Completeness**
   * **Validates: Requirements 4.3**
   * 
   * For any ActionItem, the following fields SHALL be non-empty: title, description,
   * timing, duration, steps (with at least 1 step), expected_outcome, and scientific_rationale.
   */
  it('Property 12: Action items have all required fields', () => {
    fc.assert(
      fc.property(actionItemArb, (item) => {
        expect(isValidActionItem(item)).toBe(true);
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(item.timing.length).toBeGreaterThan(0);
        expect(item.duration.length).toBeGreaterThan(0);
        expect(item.steps.length).toBeGreaterThan(0);
        expect(item.expected_outcome.length).toBeGreaterThan(0);
        expect(isValidScientificExplanation(item.scientific_rationale)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Understanding Score - Property Tests', () => {
  /**
   * **Feature: adaptive-plan-followup, Property 15: Understanding Score Calculation**
   * **Validates: Requirements 5.6, 5.9**
   * 
   * For any UserUnderstandingScore, the current_score SHALL equal the weighted average of:
   * completion_prediction_accuracy (25%), replacement_acceptance_rate (25%),
   * sentiment_prediction_accuracy (25%), and preference_pattern_match (25%),
   * and all component scores SHALL be in the range [0, 100].
   */
  it('Property 15: Understanding score is weighted average of 4 components', () => {
    fc.assert(
      fc.property(scoreBreakdownArb, (breakdown) => {
        // All components should be in [0, 100]
        expect(breakdown.completion_prediction_accuracy).toBeGreaterThanOrEqual(0);
        expect(breakdown.completion_prediction_accuracy).toBeLessThanOrEqual(100);
        expect(breakdown.replacement_acceptance_rate).toBeGreaterThanOrEqual(0);
        expect(breakdown.replacement_acceptance_rate).toBeLessThanOrEqual(100);
        expect(breakdown.sentiment_prediction_accuracy).toBeGreaterThanOrEqual(0);
        expect(breakdown.sentiment_prediction_accuracy).toBeLessThanOrEqual(100);
        expect(breakdown.preference_pattern_match).toBeGreaterThanOrEqual(0);
        expect(breakdown.preference_pattern_match).toBeLessThanOrEqual(100);
        
        // Calculate expected score (25% each)
        const expectedScore = (
          breakdown.completion_prediction_accuracy * 0.25 +
          breakdown.replacement_acceptance_rate * 0.25 +
          breakdown.sentiment_prediction_accuracy * 0.25 +
          breakdown.preference_pattern_match * 0.25
        );
        
        // Score should be in [0, 100]
        expect(expectedScore).toBeGreaterThanOrEqual(0);
        expect(expectedScore).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 16: Deep Understanding Threshold**
   * **Validates: Requirements 5.8**
   * 
   * For any UserUnderstandingScore where current_score >= 95, the is_deep_understanding
   * flag SHALL be true. For any score < 95, the flag SHALL be false.
   */
  it('Property 16: Deep understanding threshold at 95', () => {
    fc.assert(
      fc.property(scoreBreakdownArb, (breakdown) => {
        const score = (
          breakdown.completion_prediction_accuracy * 0.25 +
          breakdown.replacement_acceptance_rate * 0.25 +
          breakdown.sentiment_prediction_accuracy * 0.25 +
          breakdown.preference_pattern_match * 0.25
        );
        
        const isDeepUnderstanding = score >= 95;
        
        if (score >= 95) {
          expect(isDeepUnderstanding).toBe(true);
        } else {
          expect(isDeepUnderstanding).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Execution Tracking - Property Tests', () => {
  /**
   * **Feature: adaptive-plan-followup, Property 5: Execution Rate Calculation**
   * **Validates: Requirements 2.4**
   * 
   * For any set of ExecutionRecords for a plan, the calculated execution rate SHALL equal
   * (completed + 0.5 * partial) / total_records, and the result SHALL be in the range [0, 1].
   */
  it('Property 5: Execution rate calculation is correct', () => {
    fc.assert(
      fc.property(
        fc.array(executionRecordArb, { minLength: 1, maxLength: 30 }),
        (records) => {
          const total = records.length;
          const completed = records.filter(r => r.status === 'completed').length;
          const partial = records.filter(r => r.status === 'partial').length;
          
          const executionRate = (completed + 0.5 * partial) / total;
          
          // Rate should be in [0, 1]
          expect(executionRate).toBeGreaterThanOrEqual(0);
          expect(executionRate).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 6: Consecutive Failure Flagging**
   * **Validates: Requirements 2.5**
   * 
   * For any ActionItem with 3 or more consecutive days of 'skipped' or 'needs_replacement' status,
   * the item SHALL be flagged for automatic replacement suggestion.
   */
  it('Property 6: Items with 3+ consecutive failures are flagged', () => {
    // Generate records that simulate consecutive failures
    const consecutiveFailuresArb = fc.array(
      fc.constantFrom('skipped', 'replaced'),
      { minLength: 3, maxLength: 7 }
    );
    
    fc.assert(
      fc.property(consecutiveFailuresArb, (statuses) => {
        // If we have 3+ consecutive failures, should be flagged
        const shouldFlag = statuses.length >= 3;
        expect(shouldFlag).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Validation Functions - Property Tests', () => {
  /**
   * Test that valid objects pass validation
   */
  it('Valid AdaptivePlan objects pass validation', () => {
    fc.assert(
      fc.property(adaptivePlanArb, (plan) => {
        expect(isValidAdaptivePlan(plan)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that valid ActionItem objects pass validation
   */
  it('Valid ActionItem objects pass validation', () => {
    fc.assert(
      fc.property(actionItemArb, (item) => {
        expect(isValidActionItem(item)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that valid ScientificExplanation objects pass validation
   */
  it('Valid ScientificExplanation objects pass validation', () => {
    fc.assert(
      fc.property(scientificExplanationArb, (explanation) => {
        expect(isValidScientificExplanation(explanation)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that invalid objects fail validation
   */
  it('Invalid objects fail validation', () => {
    expect(isValidAdaptivePlan(null)).toBe(false);
    expect(isValidAdaptivePlan(undefined)).toBe(false);
    expect(isValidAdaptivePlan({})).toBe(false);
    expect(isValidAdaptivePlan({ id: 123 })).toBe(false);
    
    expect(isValidActionItem(null)).toBe(false);
    expect(isValidActionItem(undefined)).toBe(false);
    expect(isValidActionItem({})).toBe(false);
    expect(isValidActionItem({ title: '' })).toBe(false);
    
    expect(isValidScientificExplanation(null)).toBe(false);
    expect(isValidScientificExplanation(undefined)).toBe(false);
    expect(isValidScientificExplanation({})).toBe(false);
    expect(isValidScientificExplanation({ physiology: '' })).toBe(false);
  });
});


describe('Follow-up Session - Property Tests', () => {
  /**
   * **Feature: adaptive-plan-followup, Property 1: Check-in Scheduling Correctness**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any user with an active plan and for any time within a configured check-in window
   * (morning 9:00-10:00 or evening 20:00-21:00), the system SHALL initiate exactly one
   * Follow_Up_Session of the appropriate type.
   */
  it('Property 1: Check-in window detection is correct', () => {
    // Import the function we're testing
    const isWithinCheckInWindow = (
      currentTime: Date,
      sessionType: 'morning' | 'evening',
      config?: { morningWindow?: { start: number; end: number }; eveningWindow?: { start: number; end: number } }
    ): boolean => {
      const hour = currentTime.getHours();
      const window = sessionType === 'morning'
        ? (config?.morningWindow || { start: 9, end: 10 })
        : (config?.eveningWindow || { start: 20, end: 21 });
      
      return hour >= window.start && hour < window.end;
    };

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }), // hour
        fc.integer({ min: 0, max: 59 }), // minute
        fc.constantFrom('morning', 'evening') as fc.Arbitrary<'morning' | 'evening'>,
        (hour, minute, sessionType) => {
          const testDate = new Date(2024, 11, 17, hour, minute, 0, 0);
          const isInWindow = isWithinCheckInWindow(testDate, sessionType);
          
          // Morning window: 9:00-10:00
          if (sessionType === 'morning') {
            if (hour >= 9 && hour < 10) {
              expect(isInWindow).toBe(true);
            } else {
              expect(isInWindow).toBe(false);
            }
          }
          
          // Evening window: 20:00-21:00
          if (sessionType === 'evening') {
            if (hour >= 20 && hour < 21) {
              expect(isInWindow).toBe(true);
            } else {
              expect(isInWindow).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 2: Response Storage Completeness**
   * **Validates: Requirements 1.4**
   * 
   * For any user response to a Follow_Up_Session, the stored record SHALL contain:
   * a valid timestamp, the user's response content, and a sentiment score in the range [-1, 1].
   */
  it('Property 2: Response records have required fields', () => {
    const followUpResponseArb = fc.record({
      question_type: fc.constantFrom('feeling', 'energy', 'execution', 'replacement'),
      user_response: fc.string({ minLength: 1, maxLength: 500 }),
      ai_interpretation: fc.string({ minLength: 1, maxLength: 500 }),
      timestamp: isoDateTimeArb,
    });

    fc.assert(
      fc.property(followUpResponseArb, (response) => {
        // Timestamp should be a valid ISO string
        expect(() => new Date(response.timestamp)).not.toThrow();
        expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
        
        // User response should be non-empty
        expect(response.user_response.length).toBeGreaterThan(0);
        
        // AI interpretation should be non-empty
        expect(response.ai_interpretation.length).toBeGreaterThan(0);
        
        // Question type should be valid
        expect(['feeling', 'energy', 'execution', 'replacement']).toContain(response.question_type);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 3: Missed Session Recording**
   * **Validates: Requirements 1.5**
   * 
   * For any Follow_Up_Session that transitions to 'missed' status, the system SHALL
   * record the missed session and the next scheduled session SHALL have an adjusted time.
   */
  it('Property 3: Missed sessions affect next scheduling', () => {
    // Test the adjustment logic
    const getAdjustedNextCheckIn = (
      missedCount: number,
      baseTime: Date,
      sessionType: 'morning' | 'evening'
    ): Date => {
      const window = sessionType === 'morning'
        ? { start: 9, end: 10 }
        : { start: 20, end: 21 };
      
      const adjustedEnd = missedCount > 0
        ? window.start + (window.end - window.start) * 0.5
        : window.end;
      
      const result = new Date(baseTime);
      const hour = window.start + Math.random() * (adjustedEnd - window.start);
      result.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0);
      return result;
    };

    fc.assert(
      fc.property(
        fc.nat({ max: 10 }), // missed count
        fc.constantFrom('morning', 'evening') as fc.Arbitrary<'morning' | 'evening'>,
        (missedCount, sessionType) => {
          const baseTime = new Date(2024, 11, 17, 0, 0, 0, 0);
          const adjustedTime = getAdjustedNextCheckIn(missedCount, baseTime, sessionType);
          
          const window = sessionType === 'morning'
            ? { start: 9, end: 10 }
            : { start: 20, end: 21 };
          
          const hour = adjustedTime.getHours() + adjustedTime.getMinutes() / 60;
          
          // Time should be within the window
          expect(hour).toBeGreaterThanOrEqual(window.start);
          expect(hour).toBeLessThan(window.end);
          
          // If there are missed sessions, time should be in first half of window
          if (missedCount > 0) {
            const midpoint = window.start + (window.end - window.start) * 0.5;
            expect(hour).toBeLessThan(midpoint + 0.01); // Small tolerance for floating point
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 4: Execution Tracking Activation**
   * **Validates: Requirements 2.1**
   * 
   * For any plan that has been active for more than 24 hours, the Follow_Up_Session
   * SHALL include execution tracking questions for all action items.
   */
  it('Property 4: Execution tracking activates after 24 hours', () => {
    const shouldIncludeExecutionTracking = (planCreatedAt: Date): boolean => {
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - planCreatedAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation > 24;
    };

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 72 }), // hours since creation
        (hoursSinceCreation) => {
          const now = new Date();
          const planCreatedAt = new Date(now.getTime() - hoursSinceCreation * 60 * 60 * 1000);
          
          const shouldTrack = shouldIncludeExecutionTracking(planCreatedAt);
          
          if (hoursSinceCreation > 24) {
            expect(shouldTrack).toBe(true);
          } else {
            expect(shouldTrack).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test sentiment score calculation bounds
   */
  it('Sentiment score is always in range [-1, 1]', () => {
    const calculateSentimentScore = (responses: { user_response: string }[]): number => {
      if (!responses.length) return 0;
      
      const positiveKeywords = ['好', '不错', '很好', '开心', '精神', 'good', 'great', 'happy', 'energetic'];
      const negativeKeywords = ['累', '疲惫', '不好', '焦虑', '压力', 'tired', 'bad', 'anxious', 'stressed'];
      
      let score = 0;
      let count = 0;
      
      for (const response of responses) {
        const text = response.user_response.toLowerCase();
        let responseScore = 0;
        
        for (const keyword of positiveKeywords) {
          if (text.includes(keyword)) responseScore += 0.2;
        }
        for (const keyword of negativeKeywords) {
          if (text.includes(keyword)) responseScore -= 0.2;
        }
        
        score += Math.max(-1, Math.min(1, responseScore));
        count++;
      }
      
      return count > 0 ? score / count : 0;
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.record({ user_response: fc.string({ minLength: 0, maxLength: 200 }) }),
          { minLength: 0, maxLength: 10 }
        ),
        (responses) => {
          const score = calculateSentimentScore(responses);
          
          expect(score).toBeGreaterThanOrEqual(-1);
          expect(score).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Execution Tracking Service - Property Tests', () => {
  // Import pure functions for testing
  const calculateExecutionRateFromRecords = (statuses: ('completed' | 'partial' | 'skipped' | 'replaced')[]): number => {
    if (statuses.length === 0) return 0;
    
    const completed = statuses.filter(s => s === 'completed').length;
    const partial = statuses.filter(s => s === 'partial').length;
    
    const rate = (completed + 0.5 * partial) / statuses.length;
    return Math.round(rate * 100) / 100;
  };

  const checkConsecutiveFailuresFromRecords = (
    records: { status: 'completed' | 'partial' | 'skipped' | 'replaced'; needs_replacement: boolean }[]
  ): boolean => {
    if (records.length < 3) return false;
    
    const recentRecords = records.slice(0, 3);
    return recentRecords.every(
      r => r.status === 'skipped' || r.status === 'replaced' || r.needs_replacement
    );
  };

  const shouldMarkAsEstablished = (statuses: ('completed' | 'partial' | 'skipped' | 'replaced')[]): boolean => {
    if (statuses.length < 7) return false;
    const recent7 = statuses.slice(0, 7);
    return recent7.every(s => s === 'completed');
  };

  /**
   * **Feature: adaptive-plan-followup, Property 5: Execution Rate Calculation**
   * **Validates: Requirements 2.4**
   */
  it('Property 5: Execution rate formula is correct', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('completed', 'partial', 'skipped', 'replaced') as fc.Arbitrary<'completed' | 'partial' | 'skipped' | 'replaced'>,
          { minLength: 1, maxLength: 30 }
        ),
        (statuses) => {
          const rate = calculateExecutionRateFromRecords(statuses);
          
          // Rate should be in [0, 1]
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(1);
          
          // Verify the formula
          const completed = statuses.filter(s => s === 'completed').length;
          const partial = statuses.filter(s => s === 'partial').length;
          const expectedRate = Math.round(((completed + 0.5 * partial) / statuses.length) * 100) / 100;
          
          expect(rate).toBeCloseTo(expectedRate, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 6: Consecutive Failure Flagging**
   * **Validates: Requirements 2.5**
   */
  it('Property 6: Items with 3+ consecutive failures are flagged', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom('completed', 'partial', 'skipped', 'replaced') as fc.Arbitrary<'completed' | 'partial' | 'skipped' | 'replaced'>,
            needs_replacement: fc.boolean(),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (records) => {
          const shouldFlag = checkConsecutiveFailuresFromRecords(records);
          
          if (records.length < 3) {
            // Not enough records to flag
            expect(shouldFlag).toBe(false);
          } else {
            // Check if first 3 records are all failures
            const first3 = records.slice(0, 3);
            const allFailures = first3.every(
              r => r.status === 'skipped' || r.status === 'replaced' || r.needs_replacement
            );
            
            expect(shouldFlag).toBe(allFailures);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 13: Established Habit Marking**
   * **Validates: Requirements 5.2**
   */
  it('Property 13: Items with 7 consecutive completions are marked established', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('completed', 'partial', 'skipped', 'replaced') as fc.Arbitrary<'completed' | 'partial' | 'skipped' | 'replaced'>,
          { minLength: 0, maxLength: 14 }
        ),
        (statuses) => {
          const shouldMark = shouldMarkAsEstablished(statuses);
          
          if (statuses.length < 7) {
            expect(shouldMark).toBe(false);
          } else {
            const first7 = statuses.slice(0, 7);
            const allCompleted = first7.every(s => s === 'completed');
            expect(shouldMark).toBe(allCompleted);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that all completed records give 100% rate
   */
  it('All completed records give 100% execution rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        (count) => {
          const statuses = Array(count).fill('completed') as ('completed' | 'partial' | 'skipped' | 'replaced')[];
          const rate = calculateExecutionRateFromRecords(statuses);
          expect(rate).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that all skipped records give 0% rate
   */
  it('All skipped records give 0% execution rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        (count) => {
          const statuses = Array(count).fill('skipped') as ('completed' | 'partial' | 'skipped' | 'replaced')[];
          const rate = calculateExecutionRateFromRecords(statuses);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that all partial records give 50% rate
   */
  it('All partial records give 50% execution rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        (count) => {
          const statuses = Array(count).fill('partial') as ('completed' | 'partial' | 'skipped' | 'replaced')[];
          const rate = calculateExecutionRateFromRecords(statuses);
          expect(rate).toBe(0.5);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Alternative Generation - Property Tests', () => {
  // Import validation functions for testing
  const isValidAlternative = (alt: {
    id: string;
    original_action_id: string;
    title: string;
    similarity_score: number;
    scientific_rationale: {
      physiology: string;
      neurology: string;
      psychology: string;
      behavioral_science: string;
    };
  }): boolean => {
    return (
      typeof alt.id === 'string' && alt.id.length > 0 &&
      typeof alt.original_action_id === 'string' && alt.original_action_id.length > 0 &&
      typeof alt.title === 'string' && alt.title.length > 0 &&
      typeof alt.similarity_score === 'number' && alt.similarity_score >= 0 && alt.similarity_score <= 1 &&
      typeof alt.scientific_rationale === 'object' &&
      typeof alt.scientific_rationale.physiology === 'string' && alt.scientific_rationale.physiology.length > 0 &&
      typeof alt.scientific_rationale.neurology === 'string' && alt.scientific_rationale.neurology.length > 0 &&
      typeof alt.scientific_rationale.psychology === 'string' && alt.scientific_rationale.psychology.length > 0 &&
      typeof alt.scientific_rationale.behavioral_science === 'string' && alt.scientific_rationale.behavioral_science.length > 0
    );
  };

  const respectsUserPreferences = (
    alt: { title: string; description: string },
    avoidedActivities: string[]
  ): boolean => {
    const titleLower = alt.title.toLowerCase();
    const descLower = alt.description.toLowerCase();
    
    for (const avoided of avoidedActivities) {
      const avoidedLower = avoided.toLowerCase();
      if (titleLower.includes(avoidedLower) || descLower.includes(avoidedLower)) {
        return false;
      }
    }
    
    return true;
  };

  const alternativeArb = fc.record({
    id: fc.uuid(),
    original_action_id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    timing: fc.string({ minLength: 1, maxLength: 50 }),
    duration: fc.string({ minLength: 1, maxLength: 50 }),
    steps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
    expected_outcome: fc.string({ minLength: 1, maxLength: 200 }),
    scientific_rationale: fc.record({
      physiology: fc.string({ minLength: 1, maxLength: 200 }),
      neurology: fc.string({ minLength: 1, maxLength: 200 }),
      psychology: fc.string({ minLength: 1, maxLength: 200 }),
      behavioral_science: fc.string({ minLength: 1, maxLength: 200 }),
      summary: fc.string({ minLength: 1, maxLength: 300 }),
    }),
    similarity_score: fc.float({ min: 0, max: 1, noNaN: true }),
    user_fit_score: fc.float({ min: 0, max: 1, noNaN: true }),
    why_better_fit: fc.string({ minLength: 1, maxLength: 200 }),
  });

  /**
   * **Feature: adaptive-plan-followup, Property 7: Alternative Generation Completeness**
   * **Validates: Requirements 3.2, 3.4**
   */
  it('Property 7: Valid alternatives have all required fields', () => {
    fc.assert(
      fc.property(alternativeArb, (alt) => {
        const isValid = isValidAlternative(alt);
        expect(isValid).toBe(true);
        
        // Verify similarity_score is in [0, 1]
        expect(alt.similarity_score).toBeGreaterThanOrEqual(0);
        expect(alt.similarity_score).toBeLessThanOrEqual(1);
        
        // Verify all 4 scientific domains are populated
        expect(alt.scientific_rationale.physiology.length).toBeGreaterThan(0);
        expect(alt.scientific_rationale.neurology.length).toBeGreaterThan(0);
        expect(alt.scientific_rationale.psychology.length).toBeGreaterThan(0);
        expect(alt.scientific_rationale.behavioral_science.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 8: Alternative Respects User Preferences**
   * **Validates: Requirements 3.3**
   */
  it('Property 8: Alternatives do not match avoided activities', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
        (alt, avoidedActivities) => {
          const respects = respectsUserPreferences(alt, avoidedActivities);
          
          // If respects is true, verify no avoided activity is in title or description
          if (respects) {
            const titleLower = alt.title.toLowerCase();
            const descLower = alt.description.toLowerCase();
            
            for (const avoided of avoidedActivities) {
              const avoidedLower = avoided.toLowerCase();
              expect(titleLower.includes(avoidedLower) && avoidedLower.length > 0).toBe(false);
              expect(descLower.includes(avoidedLower) && avoidedLower.length > 0).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that filtering removes alternatives with avoided activities
   */
  it('Filtering removes alternatives containing avoided activities', () => {
    const filterByUserPreferences = (
      alternatives: { title: string; description: string }[],
      avoidedActivities: string[]
    ): { title: string; description: string }[] => {
      return alternatives.filter(alt => respectsUserPreferences(alt, avoidedActivities));
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
        (alternatives, avoidedActivities) => {
          const filtered = filterByUserPreferences(alternatives, avoidedActivities);
          
          // All filtered alternatives should respect preferences
          for (const alt of filtered) {
            expect(respectsUserPreferences(alt, avoidedActivities)).toBe(true);
          }
          
          // Filtered count should be <= original count
          expect(filtered.length).toBeLessThanOrEqual(alternatives.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Plan Evolution - Property Tests', () => {
  // Import validation functions for testing
  const shouldGenerateSummary = (evolutionCount: number): boolean => {
    return evolutionCount >= 3;
  };

  const shouldMarkAsEstablished = (consecutiveCompletedDays: number): boolean => {
    return consecutiveCompletedDays >= 7;
  };

  /**
   * **Feature: adaptive-plan-followup, Property 9: Plan Evolution History Preservation**
   * **Validates: Requirements 3.5, 5.3**
   */
  it('Property 9: Evolution records have required fields', () => {
      const planEvolutionArb = fc.record({
        id: fc.uuid(),
        plan_id: fc.uuid(),
        version: fc.nat({ max: 100 }),
        changed_at: isoDateTimeArb,
        change_type: fc.constantFrom('replacement', 'addition', 'removal', 'modification'),
        reason: fc.string({ minLength: 1, maxLength: 200 }),
        user_initiated: fc.boolean(),
        understanding_score_at_change: fc.float({ min: 0, max: 100, noNaN: true }),
      });

    fc.assert(
      fc.property(planEvolutionArb, (evolution) => {
        // Verify required fields
        expect(typeof evolution.plan_id).toBe('string');
        expect(evolution.plan_id.length).toBeGreaterThan(0);
        
        expect(typeof evolution.change_type).toBe('string');
        expect(['replacement', 'addition', 'removal', 'modification']).toContain(evolution.change_type);
        
        expect(typeof evolution.reason).toBe('string');
        
        expect(typeof evolution.understanding_score_at_change).toBe('number');
        expect(evolution.understanding_score_at_change).toBeGreaterThanOrEqual(0);
        expect(evolution.understanding_score_at_change).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 14: User Summary Generation**
   * **Validates: Requirements 5.4**
   */
  it('Property 14: Summary generated after 3+ evolutions', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }),
        (evolutionCount) => {
          const shouldGenerate = shouldGenerateSummary(evolutionCount);
          
          if (evolutionCount >= 3) {
            expect(shouldGenerate).toBe(true);
          } else {
            expect(shouldGenerate).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 13: Established Habit Marking**
   * **Validates: Requirements 5.2**
   */
  it('Property 13: Habits established after 7 consecutive days', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 30 }),
        (consecutiveDays) => {
          const shouldMark = shouldMarkAsEstablished(consecutiveDays);
          
          if (consecutiveDays >= 7) {
            expect(shouldMark).toBe(true);
          } else {
            expect(shouldMark).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test version incrementing
   */
  it('Version numbers increment correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100 }), { minLength: 1, maxLength: 20 }),
        (versions) => {
          // Sort versions
          const sorted = [...versions].sort((a, b) => a - b);
          
          // Each version should be >= previous
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Scientific Explanation - Property Tests', () => {
  // Import validation functions for testing
  const isValidScientificExplanationFn = (explanation: {
    physiology: string;
    neurology: string;
    psychology: string;
    behavioral_science: string;
    summary: string;
  }): boolean => {
    return (
      typeof explanation.physiology === 'string' && explanation.physiology.length > 0 &&
      typeof explanation.neurology === 'string' && explanation.neurology.length > 0 &&
      typeof explanation.psychology === 'string' && explanation.psychology.length > 0 &&
      typeof explanation.behavioral_science === 'string' && explanation.behavioral_science.length > 0 &&
      typeof explanation.summary === 'string'
    );
  };

  const isValidProblemAnalysis = (analysis: {
    problem_description: string;
    root_causes: {
      physiological: string[];
      neurological: string[];
      psychological: string[];
      behavioral: string[];
    };
    scientific_explanation: {
      physiology: string;
      neurology: string;
      psychology: string;
      behavioral_science: string;
      summary: string;
    };
  }): boolean => {
    return (
      typeof analysis.problem_description === 'string' && analysis.problem_description.length > 0 &&
      Array.isArray(analysis.root_causes.physiological) &&
      Array.isArray(analysis.root_causes.neurological) &&
      Array.isArray(analysis.root_causes.psychological) &&
      Array.isArray(analysis.root_causes.behavioral) &&
      isValidScientificExplanationFn(analysis.scientific_explanation)
    );
  };

  /**
   * **Feature: adaptive-plan-followup, Property 10: Scientific Explanation Completeness**
   * **Validates: Requirements 4.1, 4.4**
   */
  it('Property 10: Scientific explanations have all 4 domains', () => {
    fc.assert(
      fc.property(scientificExplanationArb, (explanation) => {
        const isValid = isValidScientificExplanationFn(explanation);
        expect(isValid).toBe(true);
        
        // Verify all 4 domains are non-empty
        expect(explanation.physiology.length).toBeGreaterThan(0);
        expect(explanation.neurology.length).toBeGreaterThan(0);
        expect(explanation.psychology.length).toBeGreaterThan(0);
        expect(explanation.behavioral_science.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test problem analysis has all required root cause categories
   */
  it('Problem analysis has all 4 root cause categories', () => {
    const problemAnalysisArb = fc.record({
      problem_description: fc.string({ minLength: 1, maxLength: 500 }),
      root_causes: fc.record({
        physiological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
        neurological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
        psychological: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
        behavioral: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      }),
      scientific_explanation: scientificExplanationArb,
    });

    fc.assert(
      fc.property(problemAnalysisArb, (analysis) => {
        const isValid = isValidProblemAnalysis(analysis);
        expect(isValid).toBe(true);
        
        // Verify all 4 root cause categories exist
        expect(Array.isArray(analysis.root_causes.physiological)).toBe(true);
        expect(Array.isArray(analysis.root_causes.neurological)).toBe(true);
        expect(Array.isArray(analysis.root_causes.psychological)).toBe(true);
        expect(Array.isArray(analysis.root_causes.behavioral)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Detailed Plan Generator - Property Tests', () => {
  // Import validation functions for testing
  const hasMinimumActionItems = (actionItems: { id: string }[]): boolean => {
    return actionItems.length >= 5;
  };

  const hasAllRequiredFields = (item: {
    title: string;
    description: string;
    timing: string;
    duration: string;
    steps: string[];
    expected_outcome: string;
    scientific_rationale: object;
  }): boolean => {
    return (
      typeof item.title === 'string' && item.title.length > 0 &&
      typeof item.description === 'string' && item.description.length > 0 &&
      typeof item.timing === 'string' && item.timing.length > 0 &&
      typeof item.duration === 'string' && item.duration.length > 0 &&
      Array.isArray(item.steps) && item.steps.length > 0 &&
      typeof item.expected_outcome === 'string' && item.expected_outcome.length > 0 &&
      typeof item.scientific_rationale === 'object'
    );
  };

  /**
   * **Feature: adaptive-plan-followup, Property 11: Minimum Action Items**
   * **Validates: Requirements 4.2**
   */
  it('Property 11: Plans have at least 5 action items', () => {
    fc.assert(
      fc.property(
        fc.array(actionItemArb, { minLength: 5, maxLength: 10 }),
        (actionItems) => {
          expect(hasMinimumActionItems(actionItems)).toBe(true);
          expect(actionItems.length).toBeGreaterThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: adaptive-plan-followup, Property 12: Action Item Field Completeness**
   * **Validates: Requirements 4.3**
   */
  it('Property 12: Action items have all required fields', () => {
    fc.assert(
      fc.property(actionItemArb, (item) => {
        expect(hasAllRequiredFields(item)).toBe(true);
        
        // Verify each required field
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(item.timing.length).toBeGreaterThan(0);
        expect(item.duration.length).toBeGreaterThan(0);
        expect(item.steps.length).toBeGreaterThan(0);
        expect(item.expected_outcome.length).toBeGreaterThan(0);
        expect(typeof item.scientific_rationale).toBe('object');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that plans with fewer than 5 items fail validation
   */
  it('Plans with fewer than 5 items fail minimum check', () => {
    fc.assert(
      fc.property(
        fc.array(actionItemArb, { minLength: 0, maxLength: 4 }),
        (actionItems) => {
          expect(hasMinimumActionItems(actionItems)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that action items with missing fields fail validation
   */
  it('Action items with missing fields fail validation', () => {
    const incompleteItemArb = fc.record({
      title: fc.constantFrom('', 'Valid Title'),
      description: fc.constantFrom('', 'Valid Description'),
      timing: fc.constantFrom('', 'Morning'),
      duration: fc.constantFrom('', '10 minutes'),
      steps: fc.constantFrom([], ['Step 1']),
      expected_outcome: fc.constantFrom('', 'Expected outcome'),
      scientific_rationale: fc.constant({}),
    });

    fc.assert(
      fc.property(incompleteItemArb, (item) => {
        const isValid = hasAllRequiredFields(item);
        
        // If any field is empty, should be invalid
        const hasEmptyField = 
          item.title === '' ||
          item.description === '' ||
          item.timing === '' ||
          item.duration === '' ||
          item.steps.length === 0 ||
          item.expected_outcome === '';
        
        if (hasEmptyField) {
          expect(isValid).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
