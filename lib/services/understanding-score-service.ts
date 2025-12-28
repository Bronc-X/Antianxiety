/**
 * User Understanding Score Service
 * 用户理解度评分服务 - 计算和追踪用户理解度评分
 * 
 * Requirements: 5.6, 5.7, 5.8, 5.9
 */

import { createClient } from '@supabase/supabase-js';
import type {
  UserUnderstandingScore,
  ScoreBreakdown,
  ScoreHistoryEntry,
  ExecutionRecord,
  FollowUpResponse,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const DEEP_UNDERSTANDING_THRESHOLD = 95;
const COMPONENT_WEIGHT = 0.25; // 25% each for 4 components

// ============================================
// Helper Functions
// ============================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// Core Service Functions
// ============================================

/**
 * Calculate the current understanding score for a user
 * 
 * Requirements: 5.6, 5.9
 * - Calculate User_Understanding_Score (0-100) based on 4 weighted components (25% each)
 */
export async function calculateScore(userId: string): Promise<UserUnderstandingScore> {
  const supabase = getSupabaseClient();
  
  // Get or create the score record
  const { data, error } = await supabase
    .from('user_understanding_scores')
    .select('*')
    .eq('user_id', userId)
    .single();
  let scoreRecord = data;
  
  if (error && error.code === 'PGRST116') {
    // Create new record if not exists
    const { data: newRecord, error: insertError } = await supabase
      .from('user_understanding_scores')
      .insert({
        user_id: userId,
        current_score: 0,
        completion_prediction_accuracy: 0,
        replacement_acceptance_rate: 0,
        sentiment_prediction_accuracy: 0,
        preference_pattern_match: 0,
        is_deep_understanding: false,
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create score record: ${insertError.message}`);
    }
    
    scoreRecord = newRecord;
  } else if (error) {
    throw new Error(`Failed to get score record: ${error.message}`);
  }
  
  // Calculate the weighted score
  const breakdown: ScoreBreakdown = {
    completion_prediction_accuracy: scoreRecord.completion_prediction_accuracy || 0,
    replacement_acceptance_rate: scoreRecord.replacement_acceptance_rate || 0,
    sentiment_prediction_accuracy: scoreRecord.sentiment_prediction_accuracy || 0,
    preference_pattern_match: scoreRecord.preference_pattern_match || 0,
  };
  
  const currentScore = calculateWeightedScore(breakdown);
  const isDeepUnderstanding = currentScore >= DEEP_UNDERSTANDING_THRESHOLD;
  
  // Update the record if score changed
  if (currentScore !== scoreRecord.current_score || isDeepUnderstanding !== scoreRecord.is_deep_understanding) {
    await supabase
      .from('user_understanding_scores')
      .update({
        current_score: currentScore,
        is_deep_understanding: isDeepUnderstanding,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }
  
  return {
    user_id: userId,
    current_score: currentScore,
    score_breakdown: breakdown,
    is_deep_understanding: isDeepUnderstanding,
    last_updated: scoreRecord.updated_at || new Date().toISOString(),
    history: [],
  };
}

/**
 * Update score based on execution data
 * 
 * Requirements: 5.6
 */
export async function updateFromExecution(
  userId: string,
  record: ExecutionRecord,
  wasPredictedCorrectly: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get current accuracy
  const { data: scoreRecord, error } = await supabase
    .from('user_understanding_scores')
    .select('completion_prediction_accuracy')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Failed to get score record:', error);
    return;
  }
  
  // Update accuracy using exponential moving average
  const currentAccuracy = scoreRecord?.completion_prediction_accuracy || 50;
  const newAccuracy = updateMovingAverage(currentAccuracy, wasPredictedCorrectly ? 100 : 0);
  
  await supabase
    .from('user_understanding_scores')
    .update({
      completion_prediction_accuracy: newAccuracy,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  // Recalculate total score
  await calculateScore(userId);
}


/**
 * Update score based on feedback data
 * 
 * Requirements: 5.6
 */
export async function updateFromFeedback(
  userId: string,
  feedback: FollowUpResponse,
  wasSentimentPredictedCorrectly: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: scoreRecord, error } = await supabase
    .from('user_understanding_scores')
    .select('sentiment_prediction_accuracy')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Failed to get score record:', error);
    return;
  }
  
  const currentAccuracy = scoreRecord?.sentiment_prediction_accuracy || 50;
  const newAccuracy = updateMovingAverage(currentAccuracy, wasSentimentPredictedCorrectly ? 100 : 0);
  
  await supabase
    .from('user_understanding_scores')
    .update({
      sentiment_prediction_accuracy: newAccuracy,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  await calculateScore(userId);
}

/**
 * Update score based on replacement acceptance
 * 
 * Requirements: 5.6
 */
export async function updateFromReplacement(
  userId: string,
  wasAccepted: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: scoreRecord, error } = await supabase
    .from('user_understanding_scores')
    .select('replacement_acceptance_rate')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Failed to get score record:', error);
    return;
  }
  
  const currentRate = scoreRecord?.replacement_acceptance_rate || 50;
  const newRate = updateMovingAverage(currentRate, wasAccepted ? 100 : 0);
  
  await supabase
    .from('user_understanding_scores')
    .update({
      replacement_acceptance_rate: newRate,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  await calculateScore(userId);
}

/**
 * Get score history for a user
 */
export async function getScoreHistory(
  userId: string,
  days: number = 30
): Promise<ScoreHistoryEntry[]> {
  // Note: This would require a separate history table or audit log
  // For now, return empty array as history tracking is not implemented
  return [];
}

/**
 * Check if deep understanding is achieved
 * 
 * Requirements: 5.8
 * - WHEN the User_Understanding_Score reaches 95 or above
 * - THEN display a "Deep Understanding Achieved" indicator
 */
export async function isDeepUnderstandingAchieved(userId: string): Promise<boolean> {
  const score = await calculateScore(userId);
  return score.is_deep_understanding;
}

/**
 * Update preference pattern match score
 */
export async function updatePreferencePatternMatch(
  userId: string,
  matchScore: number
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const clampedScore = Math.max(0, Math.min(100, matchScore));
  
  await supabase
    .from('user_understanding_scores')
    .update({
      preference_pattern_match: clampedScore,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  await calculateScore(userId);
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate weighted score from breakdown
 * 
 * Requirements: 5.9
 * - Consider: action completion rate prediction accuracy, replacement suggestion acceptance rate,
 *   sentiment prediction accuracy, and preference pattern matching
 */
export function calculateWeightedScore(breakdown: ScoreBreakdown): number {
  const score = (
    breakdown.completion_prediction_accuracy * COMPONENT_WEIGHT +
    breakdown.replacement_acceptance_rate * COMPONENT_WEIGHT +
    breakdown.sentiment_prediction_accuracy * COMPONENT_WEIGHT +
    breakdown.preference_pattern_match * COMPONENT_WEIGHT
  );
  
  return Math.round(score * 100) / 100;
}

/**
 * Check if score meets deep understanding threshold
 * 
 * Requirements: 5.8
 */
export function meetsDeepUnderstandingThreshold(score: number): boolean {
  return score >= DEEP_UNDERSTANDING_THRESHOLD;
}

/**
 * Update a value using exponential moving average
 */
function updateMovingAverage(currentValue: number, newValue: number, alpha: number = 0.2): number {
  return currentValue * (1 - alpha) + newValue * alpha;
}

// ============================================
// Validation Functions for Property Testing
// ============================================

/**
 * Validate that all score components are in valid range
 */
export function isValidScoreBreakdown(breakdown: ScoreBreakdown): boolean {
  return (
    breakdown.completion_prediction_accuracy >= 0 && breakdown.completion_prediction_accuracy <= 100 &&
    breakdown.replacement_acceptance_rate >= 0 && breakdown.replacement_acceptance_rate <= 100 &&
    breakdown.sentiment_prediction_accuracy >= 0 && breakdown.sentiment_prediction_accuracy <= 100 &&
    breakdown.preference_pattern_match >= 0 && breakdown.preference_pattern_match <= 100
  );
}

/**
 * Get the deep understanding threshold
 */
export function getDeepUnderstandingThreshold(): number {
  return DEEP_UNDERSTANDING_THRESHOLD;
}

/**
 * Get the component weight
 */
export function getComponentWeight(): number {
  return COMPONENT_WEIGHT;
}
