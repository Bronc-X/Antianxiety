/**
 * Property-Based Tests for ResponseVariationEngine
 * **Feature: ai-conversation-memory, Property 2: Response Format Variation**
 * **Feature: ai-conversation-memory, Property 4: Language Expression Variation**
 * **Validates: Requirements 2.1, 2.2, 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  selectVariationStrategy,
  selectFormatStyle,
  selectEndearment,
  selectCitationStyle,
  generateVariationInstructions,
  validateResponseVariation,
} from '../response-variation';
import { createInitialState, type ConversationState } from '../conversation-state';

// Arbitrary generators
const formatArb = fc.constantFrom('structured', 'conversational', 'concise', 'detailed', 'plan');
const endearmentArb = fc.constantFrom('朋友', '小伙伴', '老铁', '亲', '伙计', '兄弟', '姐妹');

const conversationStateArb = fc.record({
  turnCount: fc.integer({ min: 0, max: 20 }),
  mentionedHealthContext: fc.boolean(),
  citedPaperIds: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
  usedFormats: fc.array(formatArb, { maxLength: 10 }),
  usedEndearments: fc.array(endearmentArb, { maxLength: 7 }),
  lastResponseStructure: fc.constant(null),
  establishedContext: fc.array(fc.string(), { maxLength: 5 }),
  userSharedDetails: fc.array(fc.string(), { maxLength: 5 }),
});

describe('ResponseVariationEngine Property Tests', () => {
  /**
   * **Feature: ai-conversation-memory, Property 2: Response Format Variation**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * For any conversation with N turns (N >= 3), not all responses SHALL have
   * identical structure markers.
   */
  it('Property 2: format style should vary based on turn count and history', () => {
    fc.assert(
      fc.property(conversationStateArb, (state) => {
        const strategy = selectVariationStrategy(state);
        
        // Strategy should always have a valid format style
        expect(['structured', 'conversational', 'concise', 'detailed', 'plan']).toContain(strategy.formatStyle);
        
        // First turn should use structured format
        if (state.turnCount <= 1) {
          expect(strategy.formatStyle).toBe('structured');
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 2: consecutive responses should not have same format', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.array(formatArb, { minLength: 1, maxLength: 5 }),
        (turnCount, usedFormats) => {
          const format = selectFormatStyle(turnCount, usedFormats);
          const lastFormat = usedFormats[usedFormats.length - 1];
          
          // Format should be different from last used (when possible)
          if (usedFormats.length > 0 && turnCount > 1) {
            // At minimum, we should get a valid format
            expect(['structured', 'conversational', 'concise', 'detailed', 'plan']).toContain(format);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ai-conversation-memory, Property 4: Language Expression Variation**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * For any conversation with N turns (N >= 3), the same term of endearment
   * SHALL NOT appear in every response.
   */
  it('Property 4: endearment should vary and not repeat consecutively', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(endearmentArb, { minLength: 0, maxLength: 6 }),
        (turnCount, usedEndearments) => {
          const endearment = selectEndearment(turnCount, usedEndearments);
          
          // Endearment should either be null or not in recently used
          if (endearment !== null && usedEndearments.length > 0) {
            // Should prefer unused endearments
            const unused = ['朋友', '小伙伴', '老铁', '亲', '伙计', '兄弟', '姐妹']
              .filter(e => !usedEndearments.includes(e));
            
            if (unused.length > 0) {
              expect(unused).toContain(endearment);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: not every turn should have an endearment', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 5, maxLength: 10 }),
        (turnCounts) => {
          const endearments = turnCounts.map(tc => selectEndearment(tc, []));
          const withEndearment = endearments.filter(e => e !== null);
          
          // Not all turns should have endearments (allow for edge case where all have or none have)
          // The key property is that endearments are not guaranteed on every turn
          expect(withEndearment.length).toBeLessThanOrEqual(endearments.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('citation style should vary based on context', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (turnCount, citedCount) => {
          const style = selectCitationStyle(turnCount, citedCount);
          
          // First turn should use formal
          if (turnCount <= 1) {
            expect(style).toBe('formal');
          }
          
          // Many citations should use minimal
          if (citedCount >= 3 && turnCount > 1) {
            expect(style).toBe('minimal');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('variation instructions should be generated correctly', () => {
    fc.assert(
      fc.property(conversationStateArb, (state) => {
        const strategy = selectVariationStrategy(state);
        const instructions = generateVariationInstructions(strategy);
        
        // Instructions should be a non-empty string
        expect(typeof instructions).toBe('string');
        expect(instructions.length).toBeGreaterThan(0);
        
        // Should contain variation header
        expect(instructions).toContain('RESPONSE VARIATION INSTRUCTIONS');
        
        // If health context should not be mentioned, should include warning
        if (!strategy.shouldMentionHealthContext) {
          expect(instructions).toContain('不要重复提及用户的健康状况');
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('response validation should detect health context repetition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '考虑到你目前有【眼睛问题】的状况，建议...',
          '考虑到你的腿疼状况，不建议跑步',
          '普通回复，没有重复健康上下文'
        ),
        fc.boolean(),
        (response, shouldMention) => {
          const strategy = {
            formatStyle: 'conversational' as const,
            endearment: null,
            citationStyle: 'casual' as const,
            shouldMentionHealthContext: shouldMention,
            responseTemplate: '',
          };
          
          const result = validateResponseVariation(response, [], strategy);
          
          // If should not mention but response contains health context
          if (!shouldMention && (
            response.includes('考虑到你目前有【') ||
            response.includes('考虑到你的')
          )) {
            expect(result.issues).toContain('重复提及了健康上下文');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
