/**
 * Property-Based Tests for Max Settings Validator
 * 
 * @module lib/max/__tests__/settings-validator.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateAISettings, isValidMode, getDefaultSettings } from '../settings-validator';
import { HONESTY_RANGE, HUMOR_RANGE, VALID_MODES } from '@/types/max';

// Configure fast-check for 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('Settings Validator Property Tests', () => {
  /**
   * **Feature: max-logic-engine, Property 1: Settings Value Validation**
   * **Validates: Requirements 1.3, 1.4**
   * 
   * For any input to the AI settings validator, honesty_level values outside 60-100
   * SHALL be rejected or clamped, and humor_level values outside 0-100 SHALL be
   * rejected or clamped.
   */
  describe('Property 1: Settings Value Validation', () => {
    it('should clamp honesty_level to 60-100 range for any integer input', () => {
      fc.assert(
        fc.property(fc.integer(), (value) => {
          const result = validateAISettings({ honesty_level: value });
          const sanitized = result.sanitized.honesty_level;
          
          // Sanitized value must always be within valid range
          expect(sanitized).toBeGreaterThanOrEqual(HONESTY_RANGE.min);
          expect(sanitized).toBeLessThanOrEqual(HONESTY_RANGE.max);
          
          // If input was out of range, there should be an error
          if (value < HONESTY_RANGE.min || value > HONESTY_RANGE.max) {
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        })
      );
    });

    it('should clamp humor_level to 0-100 range for any integer input', () => {
      fc.assert(
        fc.property(fc.integer(), (value) => {
          const result = validateAISettings({ humor_level: value });
          const sanitized = result.sanitized.humor_level;
          
          // Sanitized value must always be within valid range
          expect(sanitized).toBeGreaterThanOrEqual(HUMOR_RANGE.min);
          expect(sanitized).toBeLessThanOrEqual(HUMOR_RANGE.max);
          
          // If input was out of range, there should be an error
          if (value < HUMOR_RANGE.min || value > HUMOR_RANGE.max) {
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        })
      );
    });

    it('should accept valid honesty_level values without errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: HONESTY_RANGE.min, max: HONESTY_RANGE.max }),
          (value) => {
            const result = validateAISettings({ honesty_level: value });
            
            expect(result.sanitized.honesty_level).toBe(value);
            // No honesty-related errors
            const honestyErrors = result.errors.filter(e => e.includes('honesty'));
            expect(honestyErrors.length).toBe(0);
          }
        )
      );
    });

    it('should accept valid humor_level values without errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: HUMOR_RANGE.min, max: HUMOR_RANGE.max }),
          (value) => {
            const result = validateAISettings({ humor_level: value });
            
            expect(result.sanitized.humor_level).toBe(value);
            // No humor-related errors
            const humorErrors = result.errors.filter(e => e.includes('humor'));
            expect(humorErrors.length).toBe(0);
          }
        )
      );
    });

    it('should handle combined settings validation', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(),
          (honesty, humor) => {
            const result = validateAISettings({ 
              honesty_level: honesty, 
              humor_level: humor 
            });
            
            // Both sanitized values must be in valid ranges
            expect(result.sanitized.honesty_level).toBeGreaterThanOrEqual(HONESTY_RANGE.min);
            expect(result.sanitized.honesty_level).toBeLessThanOrEqual(HONESTY_RANGE.max);
            expect(result.sanitized.humor_level).toBeGreaterThanOrEqual(HUMOR_RANGE.min);
            expect(result.sanitized.humor_level).toBeLessThanOrEqual(HUMOR_RANGE.max);
          }
        )
      );
    });
  });

  /**
   * **Feature: max-logic-engine, Property 3: Mode Enum Validation**
   * **Validates: Requirements 1.5**
   * 
   * For any string input to the mode field, only "TARS", "Zen Master", or "Dr. House"
   * SHALL be accepted; all other values SHALL be rejected.
   */
  describe('Property 3: Mode Enum Validation', () => {
    it('should accept only valid mode strings', () => {
      fc.assert(
        fc.property(fc.string(), (modeInput) => {
          const result = validateAISettings({ mode: modeInput as any });
          
          if (VALID_MODES.includes(modeInput as any)) {
            // Valid mode should be accepted
            expect(result.sanitized.mode).toBe(modeInput);
            const modeErrors = result.errors.filter(e => e.includes('mode'));
            expect(modeErrors.length).toBe(0);
          } else {
            // Invalid mode should be rejected with error
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('mode'))).toBe(true);
            // Sanitized should fall back to default
            expect(VALID_MODES).toContain(result.sanitized.mode);
          }
        })
      );
    });

    it('should always return a valid mode in sanitized output', () => {
      fc.assert(
        fc.property(fc.anything(), (input) => {
          const result = validateAISettings({ mode: input as any });
          expect(VALID_MODES).toContain(result.sanitized.mode);
        })
      );
    });

    it('isValidMode should correctly identify valid modes', () => {
      // Test all valid modes
      VALID_MODES.forEach(mode => {
        expect(isValidMode(mode)).toBe(true);
      });
      
      // Property test for invalid modes
      fc.assert(
        fc.property(
          fc.string().filter(s => !VALID_MODES.includes(s as any)),
          (invalidMode) => {
            expect(isValidMode(invalidMode)).toBe(false);
          }
        )
      );
    });
  });

  describe('Default Settings', () => {
    it('should return valid default settings', () => {
      const defaults = getDefaultSettings();
      const result = validateAISettings(defaults);
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
