/**
 * Unit Tests for ResponseVariationEngine
 */
import { describe, it, expect } from 'vitest';
import {
  selectVariationStrategy,
  selectFormatStyle,
  selectEndearment,
  selectCitationStyle,
  generateVariationInstructions,
  validateResponseVariation,
} from '../response-variation';
import { createInitialState } from '../conversation-state';

describe('ResponseVariationEngine Unit Tests', () => {
  describe('selectVariationStrategy', () => {
    it('should return structured format for first turn', () => {
      const state = { ...createInitialState(), turnCount: 1 };
      const strategy = selectVariationStrategy(state);
      expect(strategy.formatStyle).toBe('structured');
    });

    it('should allow health context mention on first turn', () => {
      const state = { ...createInitialState(), turnCount: 1, mentionedHealthContext: false };
      const strategy = selectVariationStrategy(state);
      expect(strategy.shouldMentionHealthContext).toBe(true);
    });

    it('should not allow health context mention after first turn', () => {
      const state = { ...createInitialState(), turnCount: 2, mentionedHealthContext: false };
      const strategy = selectVariationStrategy(state);
      expect(strategy.shouldMentionHealthContext).toBe(false);
    });

    it('should not allow health context mention if already mentioned', () => {
      const state = { ...createInitialState(), turnCount: 1, mentionedHealthContext: true };
      const strategy = selectVariationStrategy(state);
      expect(strategy.shouldMentionHealthContext).toBe(false);
    });
  });

  describe('selectFormatStyle', () => {
    it('should return structured for turn 1', () => {
      expect(selectFormatStyle(1, [])).toBe('structured');
    });

    it('should avoid repeating last format', () => {
      const format = selectFormatStyle(3, ['structured', 'conversational']);
      expect(format).not.toBe('conversational');
    });

    it('should return conversational for turn > 1 with no history', () => {
      expect(selectFormatStyle(2, [])).toBe('conversational');
    });
  });

  describe('selectEndearment', () => {
    it('should return endearment on turn 1', () => {
      const endearment = selectEndearment(1, []);
      expect(endearment).not.toBeNull();
    });

    it('should return null on turn 2', () => {
      const endearment = selectEndearment(2, []);
      expect(endearment).toBeNull();
    });

    it('should return endearment on turn 4', () => {
      const endearment = selectEndearment(4, []);
      expect(endearment).not.toBeNull();
    });

    it('should avoid used endearments', () => {
      const used = ['朋友', '小伙伴', '老铁'];
      const endearment = selectEndearment(1, used);
      if (endearment) {
        expect(used).not.toContain(endearment);
      }
    });
  });

  describe('selectCitationStyle', () => {
    it('should return formal for first turn', () => {
      expect(selectCitationStyle(1, 0)).toBe('formal');
    });

    it('should return minimal when many papers cited', () => {
      expect(selectCitationStyle(3, 5)).toBe('minimal');
    });

    it('should return casual for middle turns with few citations', () => {
      expect(selectCitationStyle(3, 1)).toBe('casual');
    });
  });

  describe('generateVariationInstructions', () => {
    it('should include variation header', () => {
      const strategy = selectVariationStrategy(createInitialState());
      const instructions = generateVariationInstructions(strategy);
      expect(instructions).toContain('RESPONSE VARIATION INSTRUCTIONS');
    });

    it('should include endearment instruction when provided', () => {
      const strategy = {
        formatStyle: 'conversational' as const,
        endearment: '朋友',
        citationStyle: 'casual' as const,
        shouldMentionHealthContext: true,
        responseTemplate: '',
      };
      const instructions = generateVariationInstructions(strategy);
      expect(instructions).toContain('朋友');
    });

    it('should include health context warning when not allowed', () => {
      const strategy = {
        formatStyle: 'conversational' as const,
        endearment: null,
        citationStyle: 'casual' as const,
        shouldMentionHealthContext: false,
        responseTemplate: '',
      };
      const instructions = generateVariationInstructions(strategy);
      expect(instructions).toContain('不要重复提及用户的健康状况');
    });
  });

  describe('validateResponseVariation', () => {
    it('should detect health context repetition', () => {
      const response = '考虑到你目前有【眼睛问题】的状况，建议休息';
      const strategy = {
        formatStyle: 'conversational' as const,
        endearment: null,
        citationStyle: 'casual' as const,
        shouldMentionHealthContext: false,
        responseTemplate: '',
      };
      const result = validateResponseVariation(response, [], strategy);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('重复提及了健康上下文');
    });

    it('should allow health context on first mention', () => {
      const response = '考虑到你目前有【眼睛问题】的状况，建议休息';
      const strategy = {
        formatStyle: 'structured' as const,
        endearment: null,
        citationStyle: 'formal' as const,
        shouldMentionHealthContext: true,
        responseTemplate: '',
      };
      const result = validateResponseVariation(response, [], strategy);
      expect(result.issues).not.toContain('重复提及了健康上下文');
    });

    it('should detect consecutive structured format', () => {
      const response = '**关键要点**\n内容\n**科学证据**\n证据';
      const previous = ['**关键要点**\n其他内容\n**科学证据**\n其他证据'];
      const strategy = {
        formatStyle: 'structured' as const,
        endearment: null,
        citationStyle: 'formal' as const,
        shouldMentionHealthContext: true,
        responseTemplate: '',
      };
      const result = validateResponseVariation(response, previous, strategy);
      expect(result.issues).toContain('连续使用了相同的结构化格式');
    });
  });
});
