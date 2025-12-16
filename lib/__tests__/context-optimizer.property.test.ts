/**
 * Property-Based Tests for ContextInjectionOptimizer
 * **Feature: ai-conversation-memory, Property 1: Health Context Non-Repetition**
 * **Feature: ai-conversation-memory, Property 5: Citation Deduplication**
 * **Validates: Requirements 1.1, 4.1, 4.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  optimizeContextInjection,
  decideHealthContextInjection,
  decidePaperInjection,
  buildFullHealthContext,
  buildHealthReminder,
  shouldExcludePaper,
} from '../context-optimizer';
import { createInitialState, type ConversationState } from '../conversation-state';

// Arbitrary generators
const userProfileArb = fc.record({
  current_focus: fc.option(fc.stringMatching(/^[\u4e00-\u9fa5]{2,10}$/), { nil: undefined }),
  full_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  age: fc.option(fc.integer({ min: 18, max: 80 }), { nil: undefined }),
  primary_goal: fc.option(fc.constantFrom('lose_weight', 'improve_sleep', 'boost_energy'), { nil: undefined }),
});

const paperArb = fc.record({
  title: fc.stringMatching(/^[A-Za-z\s]{5,50}$/),
  citationCount: fc.integer({ min: 0, max: 10000 }),
  year: fc.integer({ min: 2000, max: 2024 }),
});

const conversationStateArb = fc.record({
  turnCount: fc.integer({ min: 0, max: 20 }),
  mentionedHealthContext: fc.boolean(),
  citedPaperIds: fc.array(fc.stringMatching(/^[a-z\s]{5,30}$/), { maxLength: 10 }),
  usedFormats: fc.array(fc.string(), { maxLength: 10 }),
  usedEndearments: fc.array(fc.string(), { maxLength: 7 }),
  lastResponseStructure: fc.constant(null),
  establishedContext: fc.array(fc.string(), { maxLength: 5 }),
  userSharedDetails: fc.array(fc.string(), { maxLength: 5 }),
});

describe('ContextInjectionOptimizer Property Tests', () => {
  /**
   * **Feature: ai-conversation-memory, Property 1: Health Context Non-Repetition**
   * **Validates: Requirements 1.1**
   * 
   * For any conversation with N turns (N > 1) where health context exists,
   * the full health condition statement SHALL appear at most once.
   */
  it('Property 1: full health context should only be included on first turn', () => {
    fc.assert(
      fc.property(
        conversationStateArb,
        fc.string({ minLength: 2, maxLength: 20 }),
        (state, healthFocus) => {
          const decision = decideHealthContextInjection(state, healthFocus);
          
          // Full context only on first turn and not mentioned before
          if (state.turnCount <= 1 && !state.mentionedHealthContext) {
            expect(decision.includeFull).toBe(true);
          } else {
            expect(decision.includeFull).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: health reminder should be used after first mention', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (turnCount, healthFocus) => {
          const state = {
            ...createInitialState(),
            turnCount,
            mentionedHealthContext: true,
          };
          
          const decision = decideHealthContextInjection(state, healthFocus);
          
          // Should use reminder, not full context
          expect(decision.includeFull).toBe(false);
          expect(decision.includeReminder).toBe(true);
          expect(decision.text).toContain('不要再次以');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ai-conversation-memory, Property 5: Citation Deduplication**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any conversation where scientific papers are cited,
   * the same paper SHALL NOT be cited with full reference more than once.
   */
  it('Property 5: cited papers should be excluded from new citations', () => {
    fc.assert(
      fc.property(
        fc.array(paperArb, { minLength: 1, maxLength: 10 }),
        fc.array(fc.stringMatching(/^[a-z\s]{5,30}$/), { minLength: 0, maxLength: 5 }),
        (papers, citedIds) => {
          const state = {
            ...createInitialState(),
            citedPaperIds: citedIds,
          };
          
          const decision = decidePaperInjection(state, papers);
          
          // Filtered papers should not contain any cited papers
          for (const paper of decision.filteredPapers) {
            const titleLower = paper.title.toLowerCase();
            for (const citedId of citedIds) {
              expect(titleLower).not.toBe(citedId.toLowerCase());
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5: exclude list should contain previously cited papers', () => {
    fc.assert(
      fc.property(
        fc.array(paperArb, { minLength: 1, maxLength: 5 }),
        (papers) => {
          // Create unique papers first
          const uniquePapers = papers.filter((p, i, arr) => 
            arr.findIndex(x => x.title.toLowerCase() === p.title.toLowerCase()) === i
          );
          
          if (uniquePapers.length < 2) return true; // Skip if not enough unique papers
          
          // Create state with some papers already cited
          const citedIds = uniquePapers.slice(0, 2).map(p => p.title.toLowerCase());
          const state = {
            ...createInitialState(),
            citedPaperIds: citedIds,
          };
          
          const decision = decidePaperInjection(state, uniquePapers);
          
          // Filtered papers should not contain cited papers
          for (const paper of decision.filteredPapers) {
            expect(citedIds).not.toContain(paper.title.toLowerCase());
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('full health context should contain the health focus', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[\u4e00-\u9fa5]{2,10}$/),
        (healthFocus) => {
          const context = buildFullHealthContext(healthFocus);
          expect(context).toContain(healthFocus);
          expect(context).toContain('CRITICAL HEALTH CONTEXT');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('health reminder should warn against repetition', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[\u4e00-\u9fa5]{2,10}$/),
        (healthFocus) => {
          const reminder = buildHealthReminder(healthFocus);
          expect(reminder).toContain(healthFocus);
          expect(reminder).toContain('不要再次');
          expect(reminder).toContain('HEALTH REMINDER');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shouldExcludePaper should correctly identify excluded papers', () => {
    fc.assert(
      fc.property(
        paperArb,
        fc.array(fc.stringMatching(/^[a-z\s]{5,30}$/), { minLength: 1, maxLength: 5 }),
        (paper, excludeIds) => {
          const titleLower = paper.title.toLowerCase();
          const shouldExclude = shouldExcludePaper(paper, excludeIds);
          
          // If title matches any exclude ID, should be excluded
          const matchesAny = excludeIds.some(id => 
            titleLower.includes(id) || id.includes(titleLower)
          );
          
          expect(shouldExclude).toBe(matchesAny);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('optimizeContextInjection should produce valid decision', () => {
    fc.assert(
      fc.property(
        conversationStateArb,
        userProfileArb,
        fc.array(paperArb, { maxLength: 10 }),
        (state, profile, papers) => {
          const decision = optimizeContextInjection(state, profile, papers);
          
          // Decision should have all required fields
          expect(typeof decision.includeFullHealthContext).toBe('boolean');
          expect(typeof decision.includeHealthReminder).toBe('boolean');
          expect(typeof decision.healthContextText).toBe('string');
          expect(Array.isArray(decision.excludePaperIds)).toBe(true);
          expect(Array.isArray(decision.filteredPapers)).toBe(true);
          expect(typeof decision.contextSummary).toBe('string');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
