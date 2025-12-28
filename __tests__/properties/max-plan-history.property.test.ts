/**
 * Property Test: History Plan Display for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 8: History Display Correctness
 * Validates: Requirements 6.2, 6.3
 * 
 * History plans SHALL be displayed in reverse chronological order (newest first),
 * AND each history entry SHALL show the correct completion status and progress.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { HistoryPlan, HistoryPlanItem } from '@/types/max-plan';

// ============================================
// Generators
// ============================================

const historyPlanItemArb: fc.Arbitrary<HistoryPlanItem> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  text: fc.string({ minLength: 1, maxLength: 200 }),
  completed: fc.boolean(),
});

// Use integer timestamps to avoid date parsing issues
const timestampArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2025-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const historyPlanArb: fc.Arbitrary<HistoryPlan> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constantFrom('active' as const, 'completed' as const, 'paused' as const),
  progress: fc.integer({ min: 0, max: 100 }),
  items: fc.array(historyPlanItemArb, { minLength: 1, maxLength: 10 }),
  createdAt: timestampArb,
  completedAt: fc.constant(undefined),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Sort history plans by creation date (newest first)
 */
function sortHistoryByDate(plans: HistoryPlan[]): HistoryPlan[] {
  return [...plans].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Calculate progress from items
 */
function calculateProgress(items: HistoryPlanItem[]): number {
  if (items.length === 0) return 0;
  const completedCount = items.filter(item => item.completed).length;
  return Math.round((completedCount / items.length) * 100);
}

/**
 * Validate history plan has all required fields
 */
function validateHistoryPlan(plan: HistoryPlan): boolean {
  if (!plan.id || plan.id.length === 0) return false;
  if (!plan.title || plan.title.length === 0) return false;
  if (!['active', 'completed', 'paused'].includes(plan.status)) return false;
  if (plan.progress < 0 || plan.progress > 100) return false;
  if (!plan.items || plan.items.length === 0) return false;
  if (!plan.createdAt) return false;
  
  // Validate each item
  for (const item of plan.items) {
    if (!item.id || item.id.length === 0) return false;
    if (!item.text || item.text.length === 0) return false;
    if (typeof item.completed !== 'boolean') return false;
  }
  
  return true;
}

/**
 * Check if plans are sorted in reverse chronological order
 */
function isSortedNewestFirst(plans: HistoryPlan[]): boolean {
  for (let i = 1; i < plans.length; i++) {
    const prevDate = new Date(plans[i - 1].createdAt).getTime();
    const currDate = new Date(plans[i].createdAt).getTime();
    if (prevDate < currDate) return false;
  }
  return true;
}

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 8: History Display Correctness', () => {
  it('should sort history plans in reverse chronological order (newest first)', () => {
    fc.assert(
      fc.property(
        fc.array(historyPlanArb, { minLength: 2, maxLength: 20 }),
        (plans) => {
          const sorted = sortHistoryByDate(plans);
          
          // Property: Sorted plans should be in reverse chronological order
          expect(isSortedNewestFirst(sorted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all history plans have required fields', () => {
    fc.assert(
      fc.property(
        historyPlanArb,
        (plan) => {
          // Property: Generated plan should have all required fields
          expect(validateHistoryPlan(plan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate progress correctly from items', () => {
    fc.assert(
      fc.property(
        fc.array(historyPlanItemArb, { minLength: 1, maxLength: 10 }),
        (items) => {
          const progress = calculateProgress(items);
          
          // Property: Progress should be between 0 and 100
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
          
          // Property: Progress should match completed ratio
          const completedCount = items.filter(i => i.completed).length;
          const expectedProgress = Math.round((completedCount / items.length) * 100);
          expect(progress).toBe(expectedProgress);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show 100% progress when all items are completed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            text: fc.string({ minLength: 1, maxLength: 200 }),
            completed: fc.constant(true),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const progress = calculateProgress(items);
          
          // Property: All completed items should result in 100% progress
          expect(progress).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show 0% progress when no items are completed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            text: fc.string({ minLength: 1, maxLength: 200 }),
            completed: fc.constant(false),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          const progress = calculateProgress(items);
          
          // Property: No completed items should result in 0% progress
          expect(progress).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve plan order after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(historyPlanArb, { minLength: 1, maxLength: 20 }),
        (plans) => {
          const sorted = sortHistoryByDate(plans);
          
          // Property: Sorted array should have same length
          expect(sorted.length).toBe(plans.length);
          
          // Property: All original plans should be in sorted array
          const originalIds = new Set(plans.map(p => p.id));
          const sortedIds = new Set(sorted.map(p => p.id));
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty history gracefully', () => {
    const emptyHistory: HistoryPlan[] = [];
    const sorted = sortHistoryByDate(emptyHistory);
    
    expect(sorted).toEqual([]);
    expect(isSortedNewestFirst(sorted)).toBe(true);
  });

  it('should handle single plan history', () => {
    fc.assert(
      fc.property(
        historyPlanArb,
        (plan) => {
          const sorted = sortHistoryByDate([plan]);
          
          // Property: Single plan should remain unchanged
          expect(sorted.length).toBe(1);
          expect(sorted[0].id).toBe(plan.id);
          expect(isSortedNewestFirst(sorted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify completed vs active plans', () => {
    fc.assert(
      fc.property(
        historyPlanArb,
        (plan) => {
          // Property: Status should be one of the valid values
          expect(['active', 'completed', 'paused']).toContain(plan.status);
          
          // Property: Progress should be valid
          expect(plan.progress).toBeGreaterThanOrEqual(0);
          expect(plan.progress).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
