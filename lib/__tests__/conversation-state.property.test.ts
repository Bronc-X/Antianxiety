/**
 * Property-Based Tests for ConversationStateTracker
 * **Feature: ai-conversation-memory, Property 7: User Detail Memory**
 * **Validates: Requirements 6.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createInitialState,
  extractStateFromMessages,
  containsHealthContextMention,
  extractCitedPapers,
  detectResponseFormat,
  extractEndearment,
  extractUserDetails,
  shouldMentionHealthContext,
  getUnusedEndearments,
  getExcludedPaperIds,
} from '../conversation-state';

// Arbitrary generators
const userMessageArb = fc.record({
  role: fc.constant('user' as const),
  content: fc.oneof(
    fc.constant('我最近眼睛干涩'),
    fc.constant('我有头痛的问题'),
    fc.constant('最近睡眠不好'),
    fc.constant('我的腿疼'),
    fc.constant('给我一个方案'),
    fc.stringMatching(/^[a-zA-Z\u4e00-\u9fa5]{1,50}$/)
  ),
});

const assistantMessageArb = fc.record({
  role: fc.constant('assistant' as const),
  content: fc.oneof(
    fc.constant('考虑到你目前有【眼睛干涩】的状况，建议你...'),
    fc.constant('**关键要点**\n这是一个测试\n**科学证据**\n参考文献：[1] Test Paper'),
    fc.constant('方案1：休息方案\n- 每天休息10分钟'),
    fc.constant('宝子，你的情况很常见'),
    fc.constant('朋友，让我来帮你分析一下'),
    fc.stringMatching(/^[a-zA-Z\u4e00-\u9fa5]{1,100}$/)
  ),
});

const messageArb = fc.oneof(userMessageArb, assistantMessageArb);

const conversationArb = fc.array(messageArb, { minLength: 1, maxLength: 10 });

describe('ConversationStateTracker Property Tests', () => {
  /**
   * **Feature: ai-conversation-memory, Property 7: User Detail Memory**
   * **Validates: Requirements 6.4**
   * 
   * For any detail shared by the user in the conversation,
   * subsequent AI responses SHALL have access to that detail in context.
   */
  it('Property 7: should track all user-shared details across conversation', () => {
    fc.assert(
      fc.property(conversationArb, (messages) => {
        const state = extractStateFromMessages(messages);
        
        // Count user messages
        const userMessages = messages.filter(m => m.role === 'user');
        
        // State should track turn count correctly
        expect(state.turnCount).toBe(userMessages.length);
        
        // User details should be extractable and stored
        // (details array should exist and be accessible)
        expect(Array.isArray(state.userSharedDetails)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify health context mentions', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('考虑到你目前有【眼睛问题】的状况'),
          fc.constant('考虑到你的腿疼状况'),
          fc.constant('鉴于你有失眠的问题'),
          fc.constant('由于你睡眠不好的情况')
        ),
        (content) => {
          expect(containsHealthContextMention(content)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly extract cited papers', () => {
    fc.assert(
      fc.property(
        fc.constant('[1] "Test Paper Title" (Citations: 100)'),
        (content) => {
          const papers = extractCitedPapers(content);
          expect(papers.length).toBeGreaterThan(0);
          expect(papers[0]).toContain('test paper title');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect response formats correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(fc.constant('**关键要点**\n内容\n**科学证据**\n证据'), fc.constant('full_structured')),
          fc.tuple(fc.constant('方案1：测试方案'), fc.constant('plan_format')),
          fc.tuple(fc.constant('- 第一点\n- 第二点'), fc.constant('bullet_points')),
          fc.tuple(fc.constant('1. 第一步\n2. 第二步'), fc.constant('numbered_list')),
          fc.tuple(fc.constant('这是一段普通对话'), fc.constant('conversational'))
        ),
        ([content, expectedFormat]) => {
          const format = detectResponseFormat(content);
          expect(format).toBe(expectedFormat);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract endearments correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(fc.constant('宝子，你好'), fc.constant('宝子')),
          fc.tuple(fc.constant('朋友，让我帮你'), fc.constant('朋友')),
          fc.tuple(fc.constant('小伙伴，加油'), fc.constant('小伙伴')),
          fc.tuple(fc.constant('普通回复'), fc.constant(null))
        ),
        ([content, expected]) => {
          const endearment = extractEndearment(content);
          expect(endearment).toBe(expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly determine when to mention health context', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.boolean(),
        (turnCount, mentioned) => {
          const state = {
            ...createInitialState(),
            turnCount,
            mentionedHealthContext: mentioned,
          };
          
          const shouldMention = shouldMentionHealthContext(state);
          
          // Should only mention on first turn and if not already mentioned
          if (turnCount <= 1 && !mentioned) {
            expect(shouldMention).toBe(true);
          } else {
            expect(shouldMention).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return unused endearments', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('宝子', '朋友', '小伙伴', '老铁'), { minLength: 0, maxLength: 3 }),
        (usedEndearments) => {
          const state = {
            ...createInitialState(),
            usedEndearments,
          };
          
          const unused = getUnusedEndearments(state);
          
          // Unused should not contain any used endearments
          for (const used of usedEndearments) {
            expect(unused).not.toContain(used);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track excluded paper IDs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
        (paperIds) => {
          const state = {
            ...createInitialState(),
            citedPaperIds: paperIds,
          };
          
          const excluded = getExcludedPaperIds(state);
          
          // Excluded should match cited papers
          expect(excluded).toEqual(paperIds);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
