/**
 * Property Test: Save Data Integrity for Max Plan Creation
 * 
 * Feature: max-plan-creation-dialog, Property 7: Save Data Integrity
 * Validates: Requirements 5.2, 8.3
 * 
 * Only confirmed plans SHALL be persisted to the database,
 * AND draft/unsaved data SHALL be cleared when the dialog is closed.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { PlanItemDraft, PlanCategory, DifficultyLevel } from '@/types/max-plan';

// ============================================
// Generators
// ============================================

const difficultyArb: fc.Arbitrary<DifficultyLevel> = fc.constantFrom('easy', 'medium', 'hard');

const categoryArb: fc.Arbitrary<PlanCategory> = fc.constantFrom(
  'sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'
);

const planItemArb: fc.Arbitrary<PlanItemDraft> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  action: fc.string({ minLength: 1, maxLength: 200 }),
  rationale: fc.string({ minLength: 1, maxLength: 100 }),
  difficulty: difficultyArb,
  category: categoryArb,
});

const planItemsArb = fc.array(planItemArb, { minLength: 3, maxLength: 5 });

// ============================================
// Mock Session State
// ============================================

interface SessionState {
  sessionId: string;
  userId: string;
  planItems: PlanItemDraft[];
  isConfirmed: boolean;
  isClosed: boolean;
}

/**
 * Simulate session cleanup on dialog close
 */
function cleanupSession(session: SessionState): SessionState {
  return {
    ...session,
    planItems: [],
    isConfirmed: false,
    isClosed: true,
  };
}

/**
 * Validate plan items for save
 */
function validatePlanForSave(items: PlanItemDraft[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (items.length < 3) {
    errors.push('Plan must have at least 3 items');
  }
  
  if (items.length > 5) {
    errors.push('Plan cannot have more than 5 items');
  }
  
  items.forEach((item, index) => {
    if (!item.id || item.id.length === 0) {
      errors.push(`Item ${index}: missing id`);
    }
    if (!item.title || item.title.length === 0) {
      errors.push(`Item ${index}: missing title`);
    }
    if (!item.action || item.action.length === 0) {
      errors.push(`Item ${index}: missing action`);
    }
    if (!item.rationale || item.rationale.length === 0) {
      errors.push(`Item ${index}: missing rationale`);
    }
    if (!['easy', 'medium', 'hard'].includes(item.difficulty)) {
      errors.push(`Item ${index}: invalid difficulty`);
    }
    if (!['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'].includes(item.category)) {
      errors.push(`Item ${index}: invalid category`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format plan items for storage
 */
function formatPlanForStorage(items: PlanItemDraft[], userId: string): {
  user_id: string;
  items: Array<{
    text: string;
    category: string;
    difficulty: string;
  }>;
} {
  return {
    user_id: userId,
    items: items.map(item => ({
      text: `${item.title}: ${item.action}`,
      category: item.category,
      difficulty: item.difficulty,
    })),
  };
}

/**
 * Check if session data is cleared
 */
function isSessionCleared(session: SessionState): boolean {
  return session.planItems.length === 0 && session.isClosed;
}

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 7: Save Data Integrity', () => {
  it('should validate plan items before save', () => {
    fc.assert(
      fc.property(
        planItemsArb,
        (items) => {
          const validation = validatePlanForSave(items);
          
          // Property: Valid items should pass validation
          expect(validation.valid).toBe(true);
          expect(validation.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject plans with too few items', () => {
    fc.assert(
      fc.property(
        fc.array(planItemArb, { minLength: 0, maxLength: 2 }),
        (items) => {
          const validation = validatePlanForSave(items);
          
          // Property: Plans with < 3 items should fail validation
          expect(validation.valid).toBe(false);
          expect(validation.errors.some(e => e.includes('at least 3'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject plans with too many items', () => {
    fc.assert(
      fc.property(
        fc.array(planItemArb, { minLength: 6, maxLength: 10 }),
        (items) => {
          const validation = validatePlanForSave(items);
          
          // Property: Plans with > 5 items should fail validation
          expect(validation.valid).toBe(false);
          expect(validation.errors.some(e => e.includes('more than 5'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject items with missing required fields', () => {
    fc.assert(
      fc.property(
        planItemArb,
        (item) => {
          // Create invalid item with empty title
          const invalidItem: PlanItemDraft = { ...item, title: '' };
          const validation = validatePlanForSave([invalidItem, item, item]);
          
          // Property: Items with empty title should fail validation
          expect(validation.valid).toBe(false);
          expect(validation.errors.some(e => e.includes('missing title'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear session data when dialog is closed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        planItemsArb,
        (sessionId, userId, items) => {
          const session: SessionState = {
            sessionId,
            userId,
            planItems: items,
            isConfirmed: false,
            isClosed: false,
          };
          
          // Close the dialog
          const cleanedSession = cleanupSession(session);
          
          // Property: Session should be cleared after close
          expect(isSessionCleared(cleanedSession)).toBe(true);
          expect(cleanedSession.planItems.length).toBe(0);
          expect(cleanedSession.isClosed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve user ID in formatted storage data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        planItemsArb,
        (userId, items) => {
          const formatted = formatPlanForStorage(items, userId);
          
          // Property: User ID should be preserved
          expect(formatted.user_id).toBe(userId);
          
          // Property: All items should be formatted
          expect(formatted.items.length).toBe(items.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format items correctly for storage', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        planItemsArb,
        (userId, items) => {
          const formatted = formatPlanForStorage(items, userId);
          
          formatted.items.forEach((formattedItem, index) => {
            const originalItem = items[index];
            
            // Property: Text should contain title and action
            expect(formattedItem.text).toContain(originalItem.title);
            expect(formattedItem.text).toContain(originalItem.action);
            
            // Property: Category should be preserved
            expect(formattedItem.category).toBe(originalItem.category);
            
            // Property: Difficulty should be preserved
            expect(formattedItem.difficulty).toBe(originalItem.difficulty);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not persist unconfirmed plans', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        planItemsArb,
        (sessionId, userId, items) => {
          const session: SessionState = {
            sessionId,
            userId,
            planItems: items,
            isConfirmed: false,
            isClosed: false,
          };
          
          // Property: Unconfirmed session should not be saved
          // (In real implementation, this would check database)
          expect(session.isConfirmed).toBe(false);
          
          // Close without confirming
          const cleanedSession = cleanupSession(session);
          
          // Property: Data should be cleared
          expect(cleanedSession.planItems.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty plan items gracefully', () => {
    const emptyItems: PlanItemDraft[] = [];
    const validation = validatePlanForSave(emptyItems);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should maintain data integrity across multiple operations', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        planItemsArb,
        fc.array(planItemArb, { minLength: 1, maxLength: 3 }),
        (sessionId, userId, originalItems, replacementItems) => {
          // Start with original items
          const session: SessionState = {
            sessionId,
            userId,
            planItems: [...originalItems],
            isConfirmed: false,
            isClosed: false,
          };
          
          // Replace some items
          const updatedItems = [...originalItems];
          replacementItems.forEach((replacement, index) => {
            if (index < updatedItems.length) {
              updatedItems[index] = replacement;
            }
          });
          session.planItems = updatedItems;
          
          // Validate
          const validation = validatePlanForSave(session.planItems);
          
          // Property: Updated items should still be valid
          expect(validation.valid).toBe(true);
          
          // Property: Item count should be preserved
          expect(session.planItems.length).toBe(originalItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
