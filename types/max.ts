/**
 * Max Logic Engine Types
 * Bio-Operating System Co-pilot type definitions
 */

// ============================================
// AI Settings Types
// ============================================

export type MaxMode = 'MAX' | 'Zen Master' | 'Dr. House';

export interface AISettings {
  honesty_level: number;  // 60-100
  humor_level: number;    // 0-100
  mode: MaxMode;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: AISettings;
}

// ============================================
// Bayesian Engine Types
// ============================================

export interface Paper {
  id: string;
  title: string;
  relevance_score: number;
  url: string;
}

export interface HRVData {
  rmssd?: number;
  sdnn?: number;
  lf_hf_ratio?: number;
  timestamp: string;
}

export interface BeliefInput {
  prior: number;           // 0-100, user's initial belief
  hrv_data?: HRVData;      // Optional physiological data
  paper_ids?: string[];    // Semantic Scholar paper IDs
}

export interface CalculationStep {
  step: number;
  description: string;
  value: number;
}

export interface BeliefOutput {
  prior: number;
  likelihood: number;
  evidence: number;
  posterior: number;
  papers_used: Paper[];
  calculation_steps: CalculationStep[];
}

export interface BeliefSession {
  id: string;
  user_id: string;
  prior_value: number;
  posterior_value: number;
  likelihood: number;
  evidence_weight: number;
  papers_used: Paper[];
  hrv_data?: HRVData;
  belief_text?: string;
  created_at: string;
}

// ============================================
// Response Generator Types
// ============================================

export type EventType = 'slider_change' | 'belief_set' | 'ritual_complete' | 'general';
export type ResponseTone = 'neutral' | 'humorous' | 'serious';

export interface ResponseContext {
  settings: AISettings;
  event_type: EventType;
  data?: Record<string, unknown>;
}

export interface MaxResponse {
  text: string;
  tone: ResponseTone;
}

export interface PhraseValidation {
  valid: boolean;
  violations: string[];
}

// ============================================
// Constants
// ============================================

export const DEFAULT_AI_SETTINGS: AISettings = {
  honesty_level: 90,
  humor_level: 65,
  mode: 'Zen Master'
};

export const HONESTY_RANGE = { min: 60, max: 100 } as const;
export const HUMOR_RANGE = { min: 0, max: 100 } as const;
export const EVIDENCE_WEIGHT_RANGE = { min: 0.1, max: 0.9 } as const;

export const VALID_MODES: MaxMode[] = ['MAX', 'Zen Master', 'Dr. House'];

// Mode derivation thresholds
export const MODE_THRESHOLDS = {
  DR_HOUSE: { min: 0, max: 33 },
  ZEN_MASTER: { min: 33, max: 66 },
  MAX: { min: 66, max: 100 }
} as const;

// Derive mode from humor level
export function deriveMode(humorLevel: number): MaxMode {
  if (humorLevel < 33) return 'Dr. House';
  if (humorLevel < 66) return 'Zen Master';
  return 'MAX';
}

export const FORBIDDEN_PHRASES = [
  'I feel',
  'I am sorry',
  'As an AI'
] as const;

export const APPROVED_PHRASE_PATTERNS = [
  'System detects',
  'Data suggests',
  'Bio-metrics indicate',
  'Processing',
  'Recalibrating'
] as const;
