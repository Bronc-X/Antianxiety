/**
 * Max Settings Validator
 * Validates and sanitizes AI personality settings
 * 
 * @module lib/max/settings-validator
 */

import {
  AISettings,
  ValidationResult,
  MaxMode,
  DEFAULT_AI_SETTINGS,
  HONESTY_RANGE,
  HUMOR_RANGE,
  VALID_MODES
} from '@/types/max';

/**
 * Clamps a number to a specified range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates if a mode string is a valid MaxMode
 */
export function isValidMode(mode: string): mode is MaxMode {
  return VALID_MODES.includes(mode as MaxMode);
}

/**
 * Validates and sanitizes AI settings input
 * Returns sanitized settings with any out-of-range values clamped
 */
export function validateAISettings(input: Partial<AISettings>): ValidationResult {
  const errors: string[] = [];
  
  // Validate honesty_level
  let honesty_level = DEFAULT_AI_SETTINGS.honesty_level;
  if (input.honesty_level !== undefined) {
    if (typeof input.honesty_level !== 'number' || isNaN(input.honesty_level)) {
      errors.push('honesty_level must be a number');
    } else {
      if (input.honesty_level < HONESTY_RANGE.min || input.honesty_level > HONESTY_RANGE.max) {
        errors.push(`honesty_level must be between ${HONESTY_RANGE.min} and ${HONESTY_RANGE.max}`);
      }
      honesty_level = clamp(Math.round(input.honesty_level), HONESTY_RANGE.min, HONESTY_RANGE.max);
    }
  }

  // Validate humor_level
  let humor_level = DEFAULT_AI_SETTINGS.humor_level;
  if (input.humor_level !== undefined) {
    if (typeof input.humor_level !== 'number' || isNaN(input.humor_level)) {
      errors.push('humor_level must be a number');
    } else {
      if (input.humor_level < HUMOR_RANGE.min || input.humor_level > HUMOR_RANGE.max) {
        errors.push(`humor_level must be between ${HUMOR_RANGE.min} and ${HUMOR_RANGE.max}`);
      }
      humor_level = clamp(Math.round(input.humor_level), HUMOR_RANGE.min, HUMOR_RANGE.max);
    }
  }

  // Validate mode
  let mode: MaxMode = DEFAULT_AI_SETTINGS.mode;
  if (input.mode !== undefined) {
    if (!isValidMode(input.mode)) {
      errors.push(`mode must be one of: ${VALID_MODES.join(', ')}`);
    } else {
      mode = input.mode;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: { honesty_level, humor_level, mode }
  };
}

/**
 * Returns the default AI settings
 */
export function getDefaultSettings(): AISettings {
  return { ...DEFAULT_AI_SETTINGS };
}

/**
 * Merges partial settings with defaults
 */
export function mergeWithDefaults(partial: Partial<AISettings>): AISettings {
  const result = validateAISettings(partial);
  return result.sanitized;
}
