/**
 * User Preference Profile Service
 * 用户偏好档案服务 - 管理用户偏好和学习历史
 * 
 * Requirements: 3.3, 5.1
 */

import { createClient } from '@supabase/supabase-js';
import type {
  UserPreferenceProfile,
  LearningEntry,
  LearningSource,
  ExecutionRecord,
  FollowUpResponse,
} from '@/types/adaptive-plan';

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
 * Get or create user preference profile
 */
export async function getPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_preference_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  let profile = data;
  
  if (error && error.code === 'PGRST116') {
    // Create new profile if not exists
    const { data: newProfile, error: insertError } = await supabase
      .from('user_preference_profiles')
      .insert({
        user_id: userId,
        preferred_times: [],
        avoided_activities: [],
        successful_patterns: [],
        physical_constraints: [],
        lifestyle_factors: [],
        learning_history: [],
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create preference profile: ${insertError.message}`);
    }
    
    profile = newProfile;
  } else if (error) {
    throw new Error(`Failed to get preference profile: ${error.message}`);
  }
  
  return mapDbToProfile(profile);
}

/**
 * Update preferences from execution and feedback data
 * 
 * Requirements: 5.1
 * - Adjust future recommendations to avoid similar patterns when user has consistent difficulty
 */
export async function updatePreferences(
  userId: string,
  updates: Partial<UserPreferenceProfile>
): Promise<UserPreferenceProfile> {
  const supabase = getSupabaseClient();
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.preferred_times) {
    updateData.preferred_times = updates.preferred_times;
  }
  if (updates.avoided_activities) {
    updateData.avoided_activities = updates.avoided_activities;
  }
  if (updates.successful_patterns) {
    updateData.successful_patterns = updates.successful_patterns;
  }
  if (updates.physical_constraints) {
    updateData.physical_constraints = updates.physical_constraints;
  }
  if (updates.lifestyle_factors) {
    updateData.lifestyle_factors = updates.lifestyle_factors;
  }
  
  const { data, error } = await supabase
    .from('user_preference_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
  
  return mapDbToProfile(data);
}

/**
 * Get avoided activities for alternative filtering
 * 
 * Requirements: 3.3
 */
export async function getAvoidedActivities(userId: string): Promise<string[]> {
  const profile = await getPreferenceProfile(userId);
  return profile.avoided_activities;
}

/**
 * Get successful patterns for recommendation optimization
 */
export async function getSuccessfulPatterns(userId: string): Promise<string[]> {
  const profile = await getPreferenceProfile(userId);
  return profile.successful_patterns;
}

/**
 * Add an avoided activity
 */
export async function addAvoidedActivity(
  userId: string,
  activity: string,
  source: LearningSource
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const profile = await getPreferenceProfile(userId);
  
  if (!profile.avoided_activities.includes(activity)) {
    const updatedActivities = [...profile.avoided_activities, activity];
    
    await supabase
      .from('user_preference_profiles')
      .update({
        avoided_activities: updatedActivities,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    // Add to learning history
    await addLearningEntry(userId, `用户避免: ${activity}`, 0.8, source);
  }
}

/**
 * Add a successful pattern
 */
export async function addSuccessfulPattern(
  userId: string,
  pattern: string,
  source: LearningSource
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const profile = await getPreferenceProfile(userId);
  
  if (!profile.successful_patterns.includes(pattern)) {
    const updatedPatterns = [...profile.successful_patterns, pattern];
    
    await supabase
      .from('user_preference_profiles')
      .update({
        successful_patterns: updatedPatterns,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    await addLearningEntry(userId, `成功模式: ${pattern}`, 0.9, source);
  }
}

/**
 * Add a learning entry to history
 */
export async function addLearningEntry(
  userId: string,
  insight: string,
  confidence: number,
  source: LearningSource
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const profile = await getPreferenceProfile(userId);
  
  const newEntry: LearningEntry = {
    date: new Date().toISOString(),
    insight,
    confidence: Math.max(0, Math.min(1, confidence)),
    source,
  };
  
  const updatedHistory = [...profile.learning_history, newEntry].slice(-100); // Keep last 100 entries
  
  await supabase
    .from('user_preference_profiles')
    .update({
      learning_history: updatedHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Learn from execution record
 */
export async function learnFromExecution(
  userId: string,
  record: ExecutionRecord,
  actionTitle: string
): Promise<void> {
  if (record.status === 'skipped' || record.needs_replacement) {
    // User had difficulty with this action
    await addAvoidedActivity(userId, actionTitle, 'execution');
  } else if (record.status === 'completed') {
    // User successfully completed this action
    await addSuccessfulPattern(userId, actionTitle, 'execution');
  }
}

/**
 * Learn from feedback response
 */
export async function learnFromFeedback(
  userId: string,
  feedback: FollowUpResponse
): Promise<void> {
  // Extract insights from feedback
  const insight = `反馈: ${feedback.ai_interpretation}`;
  await addLearningEntry(userId, insight, 0.7, 'feedback');
}

// ============================================
// Database Mapping
// ============================================

interface DbPreferenceProfile {
  id: string;
  user_id: string;
  preferred_times: string[];
  avoided_activities: string[];
  successful_patterns: string[];
  physical_constraints: string[];
  lifestyle_factors: string[];
  learning_history: LearningEntry[];
  updated_at: string;
}

function mapDbToProfile(db: DbPreferenceProfile): UserPreferenceProfile {
  return {
    id: db.id,
    user_id: db.user_id,
    preferred_times: db.preferred_times || [],
    avoided_activities: db.avoided_activities || [],
    successful_patterns: db.successful_patterns || [],
    physical_constraints: db.physical_constraints || [],
    lifestyle_factors: db.lifestyle_factors || [],
    learning_history: db.learning_history || [],
    updated_at: db.updated_at,
  };
}
