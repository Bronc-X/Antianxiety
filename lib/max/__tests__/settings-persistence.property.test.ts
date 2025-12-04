/**
 * Property-Based Tests for Settings Persistence
 * 
 * Note: This tests the round-trip logic without actual database calls.
 * Integration tests with real database should be run separately.
 * 
 * @module lib/max/__tests__/settings-persistence.property.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateAISettings, getDefaultSettings, mergeWithDefaults } from '../settings-validator';
import { AISettings, VALID_MODES, HONESTY_RANGE, HUMOR_RANGE, MaxMode } from '@/types/max';

// Configure fast-check for 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Arbitrary for valid AISettings
const validSettingsArb = fc.record({
  honesty_level: fc.integer({ min: HONESTY_RANGE.min, max: HONESTY_RANGE.max }),
  humor_level: fc.integer({ min: HUMOR_RANGE.min, max: HUMOR_RANGE.max }),
  mode: fc.constantFrom(...VALID_MODES) as fc.Arbitrary<MaxMode>
});

describe('Settings Persistence Property Tests', () => {
  /**
   * **Feature: max-logic-engine, Property 2: Settings Persistence Round-Trip**
   * **Validates: Requirements 1.2**
   * 
   * For any valid AI settings update, reading the settings back from the database
   * SHALL return the exact values that were written.
   * 
   * This test simulates the round-trip by:
   * 1. Generating valid settings
   * 2. Validating and sanitizing (simulates write)
   * 3. Verifying the sanitized output matches input (simulates read)
   */
  describe('Property 2: Settings Persistence Round-Trip', () => {
    it('valid settings should round-trip without modification', () => {
      fc.assert(
        fc.property(validSettingsArb, (settings) => {
          // Simulate write: validate and sanitize
          const validation = validateAISettings(settings);
          
          // Valid settings should pass validation
          expect(validation.valid).toBe(true);
          
          // Simulate read: sanitized should match original
          expect(validation.sanitized.honesty_level).toBe(settings.honesty_level);
          expect(validation.sanitized.humor_level).toBe(settings.humor_level);
          expect(validation.sanitized.mode).toBe(settings.mode);
        })
      );
    });

    it('partial updates should merge correctly with defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            honesty_level: fc.option(
              fc.integer({ min: HONESTY_RANGE.min, max: HONESTY_RANGE.max }),
              { nil: undefined }
            ),
            humor_level: fc.option(
              fc.integer({ min: HUMOR_RANGE.min, max: HUMOR_RANGE.max }),
              { nil: undefined }
            ),
            mode: fc.option(
              fc.constantFrom(...VALID_MODES) as fc.Arbitrary<MaxMode>,
              { nil: undefined }
            )
          }),
          (partialSettings) => {
            const defaults = getDefaultSettings();
            const merged = mergeWithDefaults(partialSettings);
            
            // Each field should be either the provided value or the default
            if (partialSettings.honesty_level !== undefined) {
              expect(merged.honesty_level).toBe(partialSettings.honesty_level);
            } else {
              expect(merged.honesty_level).toBe(defaults.honesty_level);
            }
            
            if (partialSettings.humor_level !== undefined) {
              expect(merged.humor_level).toBe(partialSettings.humor_level);
            } else {
              expect(merged.humor_level).toBe(defaults.humor_level);
            }
            
            if (partialSettings.mode !== undefined) {
              expect(merged.mode).toBe(partialSettings.mode);
            } else {
              expect(merged.mode).toBe(defaults.mode);
            }
          }
        )
      );
    });

    it('settings should be idempotent through multiple validations', () => {
      fc.assert(
        fc.property(validSettingsArb, (settings) => {
          // First validation
          const first = validateAISettings(settings);
          // Second validation of the sanitized result
          const second = validateAISettings(first.sanitized);
          // Third validation
          const third = validateAISettings(second.sanitized);
          
          // All should produce identical results
          expect(first.sanitized).toEqual(second.sanitized);
          expect(second.sanitized).toEqual(third.sanitized);
          expect(first.valid).toBe(true);
          expect(second.valid).toBe(true);
          expect(third.valid).toBe(true);
        })
      );
    });

    it('JSON serialization should preserve settings', () => {
      fc.assert(
        fc.property(validSettingsArb, (settings) => {
          // Simulate database storage (JSON serialization)
          const json = JSON.stringify(settings);
          const parsed = JSON.parse(json) as AISettings;
          
          // Validate the parsed settings
          const validation = validateAISettings(parsed);
          
          expect(validation.valid).toBe(true);
          expect(validation.sanitized).toEqual(settings);
        })
      );
    });
  });
});
