/**
 * Unit Tests for PersonaPromptBuilder
 */
import { describe, it, expect } from 'vitest';
import {
  buildPersonaPrompt,
  getOpeningSuggestion,
  getToneAdjustment,
  buildFullPersonaSystemPrompt,
} from '../persona-prompt';

describe('PersonaPromptBuilder Unit Tests', () => {
  describe('buildPersonaPrompt', () => {
    it('should include persona header', () => {
      const prompt = buildPersonaPrompt();
      expect(prompt).toContain('AI PERSONA');
      expect(prompt).toContain('顶级医生');
    });

    it('should include Harvard/Mayo reference', () => {
      const prompt = buildPersonaPrompt();
      expect(prompt).toContain('哈佛医学院');
      expect(prompt).toContain('梅奥诊所');
    });

    it('should include memory emphasis', () => {
      const prompt = buildPersonaPrompt();
      expect(prompt).toContain('超强记忆力');
      expect(prompt).toContain('上下文');
    });

    it('should include communication style', () => {
      const prompt = buildPersonaPrompt();
      expect(prompt).toContain('沟通风格');
      expect(prompt).toContain('风趣幽默');
    });

    it('should adjust for first turn', () => {
      const prompt = buildPersonaPrompt(undefined, 1);
      expect(prompt).toContain('首次对话');
      expect(prompt).toContain('自我介绍');
    });

    it('should adjust for later turns', () => {
      const prompt = buildPersonaPrompt(undefined, 5);
      expect(prompt).toContain('深入对话');
      expect(prompt).toContain('老朋友');
    });

    it('should warn about not repeating on turn > 1', () => {
      const prompt = buildPersonaPrompt(undefined, 3);
      expect(prompt).toContain('不是第一轮对话');
    });
  });

  describe('getOpeningSuggestion', () => {
    it('should suggest warm opening for first turn', () => {
      const suggestion = getOpeningSuggestion(1);
      expect(suggestion).toContain('首次对话');
      expect(suggestion).toContain('温暖');
    });

    it('should suggest direct approach for second turn', () => {
      const suggestion = getOpeningSuggestion(2);
      expect(suggestion).toContain('第二轮');
      expect(suggestion).toContain('直接');
    });

    it('should suggest natural flow for later turns', () => {
      const suggestion = getOpeningSuggestion(5);
      expect(suggestion).toContain('老朋友');
    });
  });

  describe('getToneAdjustment', () => {
    it('should suggest relaxed tone for later turns', () => {
      const adjustment = getToneAdjustment(5);
      expect(adjustment).toContain('轻松');
    });

    it('should suggest comfort for anxious mood', () => {
      const adjustment = getToneAdjustment(1, 'anxious');
      expect(adjustment).toContain('安慰');
    });

    it('should suggest knowledge sharing for curious mood', () => {
      const adjustment = getToneAdjustment(1, 'curious');
      expect(adjustment).toContain('医学知识');
    });

    it('should return default for early turns without mood', () => {
      const adjustment = getToneAdjustment(1);
      expect(adjustment).toContain('专业友好');
    });
  });

  describe('buildFullPersonaSystemPrompt', () => {
    it('should include persona prompt', () => {
      const prompt = buildFullPersonaSystemPrompt(1);
      expect(prompt).toContain('AI PERSONA');
    });

    it('should include turn-specific suggestions', () => {
      const prompt = buildFullPersonaSystemPrompt(1);
      expect(prompt).toContain('本轮建议');
    });

    it('should include closing reminder', () => {
      const prompt = buildFullPersonaSystemPrompt(1);
      expect(prompt).toContain('顶级医生朋友');
    });

    it('should vary by turn count', () => {
      const prompt1 = buildFullPersonaSystemPrompt(1);
      const prompt5 = buildFullPersonaSystemPrompt(5);
      expect(prompt1).not.toBe(prompt5);
    });
  });
});
