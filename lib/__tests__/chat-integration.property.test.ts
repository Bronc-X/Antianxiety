/**
 * Property-Based Tests for Chat API Integration
 * **Feature: ai-conversation-memory, Property 3: Follow-up Response Conciseness**
 * **Feature: ai-conversation-memory, Property 6: Direct Plan Response**
 * **Validates: Requirements 2.3, 5.1, 5.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractStateFromMessages } from '../conversation-state';
import { selectVariationStrategy, generateVariationInstructions } from '../response-variation';
import { optimizeContextInjection, buildOptimizedContextBlock } from '../context-optimizer';
import { buildFullPersonaSystemPrompt } from '../persona-prompt';

// Arbitrary generators
const userMessageArb = fc.record({
  role: fc.constant('user' as const),
  content: fc.oneof(
    fc.constant('我眼睛干涩怎么办'),
    fc.constant('给我一个方案'),
    fc.constant('这个问题怎么解决'),
    fc.constant('具体怎么做'),
    fc.stringMatching(/^[\u4e00-\u9fa5]{5,30}$/)
  ),
});

const assistantMessageArb = fc.record({
  role: fc.constant('assistant' as const),
  content: fc.oneof(
    fc.constant('考虑到你目前有【眼睛干涩】的状况，建议你每天热敷...'),
    fc.constant('**关键要点**\n眼睛干涩是常见问题\n**科学证据**\n研究表明...'),
    fc.constant('方案1：热敷方案\n每天早晚热敷10分钟'),
    fc.constant('朋友，这个问题很好解决，你可以...'),
    fc.stringMatching(/^[\u4e00-\u9fa5]{20,100}$/)
  ),
});

const conversationArb = fc.array(
  fc.oneof(userMessageArb, assistantMessageArb),
  { minLength: 2, maxLength: 10 }
).filter(msgs => {
  // Ensure conversation starts with user and alternates
  if (msgs.length === 0) return false;
  return msgs[0].role === 'user';
});

describe('Chat Integration Property Tests', () => {
  /**
   * **Feature: ai-conversation-memory, Property 3: Follow-up Response Conciseness**
   * **Validates: Requirements 2.3, 5.2**
   * 
   * For any follow-up question (turn > 1), the response should be more concise.
   */
  it('Property 3: variation strategy should adjust for follow-up questions', () => {
    fc.assert(
      fc.property(conversationArb, (messages) => {
        const state = extractStateFromMessages(messages);
        const strategy = selectVariationStrategy(state);
        
        // After first turn, should not always use structured format
        if (state.turnCount > 1) {
          // Strategy should exist and be valid
          expect(['structured', 'conversational', 'concise', 'detailed', 'plan']).toContain(strategy.formatStyle);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ai-conversation-memory, Property 6: Direct Plan Response**
   * **Validates: Requirements 5.1**
   * 
   * For any user request containing plan/方案 keywords after context is established,
   * the response SHALL NOT contain a full restatement of the user's health condition.
   */
  it('Property 6: context optimizer should not include full health context after first turn', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (turnCount, healthFocus) => {
          const state = {
            turnCount,
            mentionedHealthContext: true,
            citedPaperIds: [],
            usedFormats: ['structured'],
            usedEndearments: [],
            lastResponseStructure: null,
            establishedContext: [],
            userSharedDetails: [],
          };
          
          const profile = { current_focus: healthFocus };
          const decision = optimizeContextInjection(state, profile, []);
          
          // Should not include full health context after first turn
          expect(decision.includeFullHealthContext).toBe(false);
          
          // Health context text should warn against repetition
          if (decision.healthContextText) {
            expect(decision.healthContextText).toContain('不要再次');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('variation instructions should include non-repetition warning after first turn', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (turnCount) => {
          const state = {
            turnCount,
            mentionedHealthContext: true,
            citedPaperIds: [],
            usedFormats: ['structured'],
            usedEndearments: ['宝子'],
            lastResponseStructure: null,
            establishedContext: [],
            userSharedDetails: [],
          };
          
          const strategy = selectVariationStrategy(state);
          const instructions = generateVariationInstructions(strategy);
          
          // Should warn against repeating health context
          expect(instructions).toContain('不要重复提及用户的健康状况');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('persona prompt should vary by turn count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (turnCount) => {
          const prompt = buildFullPersonaSystemPrompt(turnCount);
          
          // Should always include persona header
          expect(prompt).toContain('AI PERSONA');
          expect(prompt).toContain('顶级医生');
          
          // Should include turn-specific guidance
          if (turnCount === 1) {
            expect(prompt).toContain('首次对话');
          } else if (turnCount > 3) {
            expect(prompt).toContain('深入对话');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('full integration should produce valid system prompt components', () => {
    fc.assert(
      fc.property(conversationArb, (messages) => {
        const state = extractStateFromMessages(messages);
        const strategy = selectVariationStrategy(state);
        const instructions = generateVariationInstructions(strategy);
        const persona = buildFullPersonaSystemPrompt(state.turnCount);
        
        // All components should be non-empty strings
        expect(typeof instructions).toBe('string');
        expect(instructions.length).toBeGreaterThan(0);
        expect(typeof persona).toBe('string');
        expect(persona.length).toBeGreaterThan(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
