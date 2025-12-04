/**
 * Unit Tests for ConversationStateTracker
 */
import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  extractStateFromMessages,
  containsHealthContextMention,
  extractCitedPapers,
  detectResponseFormat,
  extractEndearment,
  analyzeResponseStructure,
  extractUserDetails,
  shouldMentionHealthContext,
  getUnusedEndearments,
} from '../conversation-state';

describe('ConversationStateTracker Unit Tests', () => {
  describe('createInitialState', () => {
    it('should create empty initial state', () => {
      const state = createInitialState();
      expect(state.turnCount).toBe(0);
      expect(state.mentionedHealthContext).toBe(false);
      expect(state.citedPaperIds).toEqual([]);
      expect(state.usedFormats).toEqual([]);
      expect(state.usedEndearments).toEqual([]);
      expect(state.lastResponseStructure).toBeNull();
    });
  });

  describe('extractStateFromMessages', () => {
    it('should count user turns correctly', () => {
      const messages = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！' },
        { role: 'user', content: '我有问题' },
        { role: 'assistant', content: '请说' },
      ];
      const state = extractStateFromMessages(messages);
      expect(state.turnCount).toBe(2);
    });

    it('should detect health context mention', () => {
      const messages = [
        { role: 'user', content: '我眼睛干' },
        { role: 'assistant', content: '考虑到你目前有【眼睛干涩】的状况，建议...' },
      ];
      const state = extractStateFromMessages(messages);
      expect(state.mentionedHealthContext).toBe(true);
    });

    it('should track used formats', () => {
      const messages = [
        { role: 'user', content: '问题' },
        { role: 'assistant', content: '**关键要点**\n内容\n**科学证据**\n证据' },
      ];
      const state = extractStateFromMessages(messages);
      expect(state.usedFormats).toContain('full_structured');
    });
  });

  describe('containsHealthContextMention', () => {
    it('should detect 考虑到你目前有【】 pattern', () => {
      expect(containsHealthContextMention('考虑到你目前有【眼睛问题】的状况')).toBe(true);
    });

    it('should detect 考虑到你的...状况 pattern', () => {
      expect(containsHealthContextMention('考虑到你的腿疼状况，建议休息')).toBe(true);
    });

    it('should return false for normal text', () => {
      expect(containsHealthContextMention('这是普通回复')).toBe(false);
    });
  });

  describe('extractCitedPapers', () => {
    it('should extract paper titles from [n] "Title" format', () => {
      const content = '[1] "Sleep and Health Study" (Citations: 100)';
      const papers = extractCitedPapers(content);
      expect(papers).toContain('sleep and health study');
    });

    it('should extract from 参考文献 format', () => {
      const content = '参考文献：[1] Lemp MA et al. Study on eyes。';
      const papers = extractCitedPapers(content);
      expect(papers.length).toBeGreaterThan(0);
    });

    it('should deduplicate papers', () => {
      const content = '[1] "Same Paper" and [2] "Same Paper"';
      const papers = extractCitedPapers(content);
      expect(papers.length).toBe(1);
    });
  });

  describe('detectResponseFormat', () => {
    it('should detect full_structured format', () => {
      expect(detectResponseFormat('**关键要点**\n内容\n**科学证据**\n证据')).toBe('full_structured');
    });

    it('should detect plan_format', () => {
      expect(detectResponseFormat('方案1：休息方案\n详细内容')).toBe('plan_format');
    });

    it('should detect bullet_points', () => {
      expect(detectResponseFormat('- 第一点\n- 第二点')).toBe('bullet_points');
    });

    it('should detect numbered_list', () => {
      expect(detectResponseFormat('1. 第一步\n2. 第二步')).toBe('numbered_list');
    });

    it('should default to conversational', () => {
      expect(detectResponseFormat('这是普通对话')).toBe('conversational');
    });
  });

  describe('extractEndearment', () => {
    it('should extract 宝子', () => {
      expect(extractEndearment('宝子，你好啊')).toBe('宝子');
    });

    it('should extract 朋友', () => {
      expect(extractEndearment('朋友，让我帮你')).toBe('朋友');
    });

    it('should return null for no endearment', () => {
      expect(extractEndearment('普通回复')).toBeNull();
    });
  });

  describe('analyzeResponseStructure', () => {
    it('should detect all structure elements', () => {
      const content = '**关键要点**\n内容\n**科学证据**\n证据\n**行动建议**\n- 建议1';
      const structure = analyzeResponseStructure(content);
      expect(structure.hasKeyTakeaway).toBe(true);
      expect(structure.hasEvidence).toBe(true);
      expect(structure.hasActionAdvice).toBe(true);
      expect(structure.hasBulletPoints).toBe(true);
    });
  });

  describe('extractUserDetails', () => {
    it('should extract symptom descriptions', () => {
      const details = extractUserDetails('我有头痛的问题，最近睡眠不好');
      expect(details.length).toBeGreaterThan(0);
    });
  });

  describe('shouldMentionHealthContext', () => {
    it('should return true for first turn without mention', () => {
      const state = { ...createInitialState(), turnCount: 1, mentionedHealthContext: false };
      expect(shouldMentionHealthContext(state)).toBe(true);
    });

    it('should return false after first turn', () => {
      const state = { ...createInitialState(), turnCount: 2, mentionedHealthContext: false };
      expect(shouldMentionHealthContext(state)).toBe(false);
    });

    it('should return false if already mentioned', () => {
      const state = { ...createInitialState(), turnCount: 1, mentionedHealthContext: true };
      expect(shouldMentionHealthContext(state)).toBe(false);
    });
  });

  describe('getUnusedEndearments', () => {
    it('should exclude used endearments', () => {
      const state = { ...createInitialState(), usedEndearments: ['朋友', '小伙伴'] };
      const unused = getUnusedEndearments(state);
      expect(unused).not.toContain('朋友');
      expect(unused).not.toContain('小伙伴');
    });
  });
});
