/**
 * Unit Tests for ContextInjectionOptimizer
 */
import { describe, it, expect } from 'vitest';
import {
  optimizeContextInjection,
  decideHealthContextInjection,
  decidePaperInjection,
  buildFullHealthContext,
  buildHealthReminder,
  generateContextSummary,
  buildOptimizedContextBlock,
  shouldExcludePaper,
} from '../context-optimizer';
import { createInitialState } from '../conversation-state';

describe('ContextInjectionOptimizer Unit Tests', () => {
  describe('decideHealthContextInjection', () => {
    it('should include full context on first turn', () => {
      const state = { ...createInitialState(), turnCount: 1, mentionedHealthContext: false };
      const decision = decideHealthContextInjection(state, '眼睛干涩');
      expect(decision.includeFull).toBe(true);
      expect(decision.includeReminder).toBe(false);
    });

    it('should use reminder after first mention', () => {
      const state = { ...createInitialState(), turnCount: 2, mentionedHealthContext: true };
      const decision = decideHealthContextInjection(state, '眼睛干涩');
      expect(decision.includeFull).toBe(false);
      expect(decision.includeReminder).toBe(true);
    });

    it('should use reminder on later turns even if not mentioned', () => {
      const state = { ...createInitialState(), turnCount: 3, mentionedHealthContext: false };
      const decision = decideHealthContextInjection(state, '眼睛干涩');
      expect(decision.includeFull).toBe(false);
      expect(decision.includeReminder).toBe(true);
    });
  });

  describe('buildFullHealthContext', () => {
    it('should contain health focus', () => {
      const context = buildFullHealthContext('腿疼');
      expect(context).toContain('腿疼');
    });

    it('should contain critical header', () => {
      const context = buildFullHealthContext('腿疼');
      expect(context).toContain('CRITICAL HEALTH CONTEXT');
    });

    it('should allow first mention', () => {
      const context = buildFullHealthContext('腿疼');
      expect(context).toContain('这是第一次提及');
    });
  });

  describe('buildHealthReminder', () => {
    it('should contain health focus', () => {
      const reminder = buildHealthReminder('腿疼');
      expect(reminder).toContain('腿疼');
    });

    it('should warn against repetition', () => {
      const reminder = buildHealthReminder('腿疼');
      expect(reminder).toContain('不要再次');
    });

    it('should be marked as internal reference', () => {
      const reminder = buildHealthReminder('腿疼');
      expect(reminder).toContain('内部参考');
    });
  });

  describe('decidePaperInjection', () => {
    it('should filter out cited papers', () => {
      const state = {
        ...createInitialState(),
        citedPaperIds: ['sleep study', 'health research'],
      };
      const papers = [
        { title: 'Sleep Study', year: 2020 },
        { title: 'New Research', year: 2023 },
        { title: 'Health Research', year: 2021 },
      ];
      
      const decision = decidePaperInjection(state, papers);
      
      expect(decision.filteredPapers.length).toBe(1);
      expect(decision.filteredPapers[0].title).toBe('New Research');
    });

    it('should return all papers if none cited', () => {
      const state = createInitialState();
      const papers = [
        { title: 'Paper 1', year: 2020 },
        { title: 'Paper 2', year: 2021 },
      ];
      
      const decision = decidePaperInjection(state, papers);
      
      expect(decision.filteredPapers.length).toBe(2);
      expect(decision.excludeIds.length).toBe(0);
    });

    it('should track excluded paper IDs', () => {
      const state = {
        ...createInitialState(),
        citedPaperIds: ['test paper'],
      };
      const papers = [
        { title: 'Test Paper', year: 2020 },
        { title: 'Other Paper', year: 2021 },
      ];
      
      const decision = decidePaperInjection(state, papers);
      
      expect(decision.excludeIds).toContain('test paper');
    });
  });

  describe('generateContextSummary', () => {
    it('should include turn count', () => {
      const state = { ...createInitialState(), turnCount: 3 };
      const summary = generateContextSummary(state, null);
      expect(summary).toContain('对话轮次: 3');
    });

    it('should include cited paper count', () => {
      const state = { ...createInitialState(), citedPaperIds: ['a', 'b'] };
      const summary = generateContextSummary(state, null);
      expect(summary).toContain('已引用论文: 2篇');
    });

    it('should include user goal', () => {
      const state = createInitialState();
      const profile = { primary_goal: 'improve_sleep' };
      const summary = generateContextSummary(state, profile);
      expect(summary).toContain('用户目标: improve_sleep');
    });
  });

  describe('buildOptimizedContextBlock', () => {
    it('should include health context when provided', () => {
      const decision = {
        includeFullHealthContext: true,
        includeHealthReminder: false,
        healthContextText: '[HEALTH] 测试健康上下文',
        excludePaperIds: [],
        filteredPapers: [],
        contextSummary: '',
      };
      
      const block = buildOptimizedContextBlock(decision);
      expect(block).toContain('测试健康上下文');
    });

    it('should include filtered papers', () => {
      const decision = {
        includeFullHealthContext: false,
        includeHealthReminder: false,
        healthContextText: '',
        excludePaperIds: [],
        filteredPapers: [
          { title: 'Test Paper', year: 2023 },
        ],
        contextSummary: '',
      };
      
      const block = buildOptimizedContextBlock(decision);
      expect(block).toContain('Test Paper');
      expect(block).toContain('SCIENTIFIC CONTEXT');
    });

    it('should warn about excluded papers', () => {
      const decision = {
        includeFullHealthContext: false,
        includeHealthReminder: false,
        healthContextText: '',
        excludePaperIds: ['old paper'],
        filteredPapers: [{ title: 'New Paper', year: 2023 }],
        contextSummary: '',
      };
      
      const block = buildOptimizedContextBlock(decision);
      expect(block).toContain('已在之前引用过');
    });
  });

  describe('shouldExcludePaper', () => {
    it('should return true for exact match', () => {
      const paper = { title: 'Test Paper' };
      expect(shouldExcludePaper(paper, ['test paper'])).toBe(true);
    });

    it('should return true for partial match', () => {
      const paper = { title: 'Test Paper on Sleep' };
      expect(shouldExcludePaper(paper, ['test paper'])).toBe(true);
    });

    it('should return false for no match', () => {
      const paper = { title: 'Completely Different' };
      expect(shouldExcludePaper(paper, ['test paper'])).toBe(false);
    });
  });

  describe('optimizeContextInjection', () => {
    it('should produce complete decision', () => {
      const state = createInitialState();
      const profile = { current_focus: '眼睛干涩' };
      const papers = [{ title: 'Eye Health Study', year: 2023 }];
      
      const decision = optimizeContextInjection(state, profile, papers);
      
      expect(decision).toHaveProperty('includeFullHealthContext');
      expect(decision).toHaveProperty('includeHealthReminder');
      expect(decision).toHaveProperty('healthContextText');
      expect(decision).toHaveProperty('excludePaperIds');
      expect(decision).toHaveProperty('filteredPapers');
      expect(decision).toHaveProperty('contextSummary');
    });

    it('should handle null profile', () => {
      const state = createInitialState();
      const decision = optimizeContextInjection(state, null, []);
      
      expect(decision.healthContextText).toBe('');
      expect(decision.includeFullHealthContext).toBe(false);
    });
  });
});
