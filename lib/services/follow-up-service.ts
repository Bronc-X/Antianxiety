/**
 * Follow-up Session Service
 * 问询会话服务 - 管理每日两次的主动问询会话
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

import { createClient } from '@supabase/supabase-js';
import type {
  FollowUpSession,
  FollowUpResponse,
  SessionType,
  SessionStatus,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const DEFAULT_MORNING_WINDOW = { start: 9, end: 10 }; // 9:00-10:00
const DEFAULT_EVENING_WINDOW = { start: 20, end: 21 }; // 20:00-21:00

// ============================================
// Service Interface
// ============================================

export interface FollowUpServiceConfig {
  morningWindow?: { start: number; end: number };
  eveningWindow?: { start: number; end: number };
}

export interface ScheduleSessionParams {
  userId: string;
  planId: string;
  type: SessionType;
  scheduledAt?: Date;
}

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

/**
 * Generate a random time within a window
 */
function getRandomTimeInWindow(
  date: Date,
  window: { start: number; end: number }
): Date {
  const result = new Date(date);
  const hour = window.start + Math.random() * (window.end - window.start);
  const minutes = Math.floor((hour % 1) * 60);
  result.setHours(Math.floor(hour), minutes, 0, 0);
  return result;
}

/**
 * Check if current time is within a check-in window
 */
export function isWithinCheckInWindow(
  currentTime: Date,
  sessionType: SessionType,
  config?: FollowUpServiceConfig
): boolean {
  const hour = currentTime.getHours();
  const window = sessionType === 'morning'
    ? (config?.morningWindow || DEFAULT_MORNING_WINDOW)
    : (config?.eveningWindow || DEFAULT_EVENING_WINDOW);
  
  return hour >= window.start && hour < window.end;
}


// ============================================
// Core Service Functions
// ============================================

/**
 * Schedule a new follow-up session
 * 
 * Requirements: 1.1, 1.2
 * - WHEN a user has an active plan AND the current time reaches a configured check-in window
 * - THEN the system SHALL initiate a Follow_Up_Session
 */
export async function scheduleSession(
  params: ScheduleSessionParams,
  config?: FollowUpServiceConfig
): Promise<FollowUpSession> {
  const supabase = getSupabaseClient();
  
  const { userId, planId, type, scheduledAt } = params;
  
  // Calculate scheduled time if not provided
  let scheduleTime: Date;
  if (scheduledAt) {
    scheduleTime = scheduledAt;
  } else {
    const now = new Date();
    const window = type === 'morning'
      ? (config?.morningWindow || DEFAULT_MORNING_WINDOW)
      : (config?.eveningWindow || DEFAULT_EVENING_WINDOW);
    scheduleTime = getRandomTimeInWindow(now, window);
  }
  
  const sessionData = {
    user_id: userId,
    plan_id: planId,
    session_type: type,
    scheduled_at: scheduleTime.toISOString(),
    status: 'pending' as SessionStatus,
    responses: [],
    sentiment_score: null,
    summary: null,
  };
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to schedule session:', error);
    throw new Error(`Failed to schedule session: ${error.message}`);
  }
  
  return mapDbToSession(data);
}

/**
 * Start a follow-up session
 * 
 * Requirements: 1.3
 * - WHEN a Follow_Up_Session is initiated
 * - THEN the system SHALL use conversational AI to collect user feedback
 */
export async function startSession(sessionId: string): Promise<FollowUpSession> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to start session:', error);
    throw new Error(`Failed to start session: ${error.message}`);
  }
  
  return mapDbToSession(data);
}

/**
 * Record a response in a follow-up session
 * 
 * Requirements: 1.4
 * - WHEN a user responds to a Follow_Up_Session
 * - THEN the system SHALL store the response with timestamp and sentiment analysis
 */
export async function recordResponse(
  sessionId: string,
  response: FollowUpResponse
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // First, get the current session to append to responses
  const { data: session, error: fetchError } = await supabase
    .from('follow_up_sessions')
    .select('responses')
    .eq('id', sessionId)
    .single();
  
  if (fetchError) {
    console.error('Failed to fetch session:', fetchError);
    throw new Error(`Failed to fetch session: ${fetchError.message}`);
  }
  
  const currentResponses = session.responses || [];
  const updatedResponses = [...currentResponses, response];
  
  const { error: updateError } = await supabase
    .from('follow_up_sessions')
    .update({ responses: updatedResponses })
    .eq('id', sessionId);
  
  if (updateError) {
    console.error('Failed to record response:', updateError);
    throw new Error(`Failed to record response: ${updateError.message}`);
  }
}

/**
 * Complete a follow-up session
 * 
 * Requirements: 1.4
 * - Store final sentiment score and summary
 */
export async function completeSession(
  sessionId: string,
  sentimentScore: number,
  summary?: string
): Promise<FollowUpSession> {
  const supabase = getSupabaseClient();
  
  // Validate sentiment score is in range [-1, 1]
  const clampedScore = Math.max(-1, Math.min(1, sentimentScore));
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      sentiment_score: clampedScore,
      summary: summary || null,
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to complete session:', error);
    throw new Error(`Failed to complete session: ${error.message}`);
  }
  
  return mapDbToSession(data);
}

/**
 * Get missed sessions for a user
 * 
 * Requirements: 1.5
 * - WHEN a user misses a Follow_Up_Session
 * - THEN the system SHALL record the missed session
 */
export async function getMissedSessions(userId: string): Promise<FollowUpSession[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'missed')
    .order('scheduled_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get missed sessions:', error);
    throw new Error(`Failed to get missed sessions: ${error.message}`);
  }
  
  return (data || []).map(mapDbToSession);
}

/**
 * Mark overdue pending sessions as missed
 * 
 * Requirements: 1.5
 * - Sessions that are still pending after their window has passed should be marked as missed
 */
export async function markOverdueSessions(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  const now = new Date();
  
  // Find pending sessions that are past their scheduled time by more than 2 hours
  const cutoffTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .update({ status: 'missed' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('scheduled_at', cutoffTime.toISOString())
    .select();
  
  if (error) {
    console.error('Failed to mark overdue sessions:', error);
    throw new Error(`Failed to mark overdue sessions: ${error.message}`);
  }
  
  return data?.length || 0;
}

/**
 * Get pending sessions for a user
 */
export async function getPendingSessions(userId: string): Promise<FollowUpSession[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true });
  
  if (error) {
    console.error('Failed to get pending sessions:', error);
    throw new Error(`Failed to get pending sessions: ${error.message}`);
  }
  
  return (data || []).map(mapDbToSession);
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<FollowUpSession | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('follow_up_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Failed to get session:', error);
    throw new Error(`Failed to get session: ${error.message}`);
  }
  
  return mapDbToSession(data);
}

/**
 * Get the next scheduled check-in time based on missed sessions
 * 
 * Requirements: 1.5
 * - Adjust the next check-in timing based on missed sessions
 */
export function getAdjustedNextCheckIn(
  missedCount: number,
  baseTime: Date,
  sessionType: SessionType,
  config?: FollowUpServiceConfig
): Date {
  const window = sessionType === 'morning'
    ? (config?.morningWindow || DEFAULT_MORNING_WINDOW)
    : (config?.eveningWindow || DEFAULT_EVENING_WINDOW);
  
  // If user has missed sessions, schedule earlier in the window
  // to increase chance of catching them
  const adjustedStart = window.start;
  const adjustedEnd = missedCount > 0
    ? window.start + (window.end - window.start) * 0.5 // First half of window
    : window.end;
  
  return getRandomTimeInWindow(baseTime, { start: adjustedStart, end: adjustedEnd });
}


// ============================================
// Database Mapping
// ============================================

interface DbFollowUpSession {
  id: string;
  user_id: string;
  plan_id: string;
  session_type: string;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  responses: FollowUpResponse[];
  sentiment_score: number | null;
  summary: string | null;
  created_at: string;
}

function mapDbToSession(db: DbFollowUpSession): FollowUpSession {
  return {
    id: db.id,
    user_id: db.user_id,
    plan_id: db.plan_id,
    session_type: db.session_type as SessionType,
    scheduled_at: db.scheduled_at,
    started_at: db.started_at || undefined,
    completed_at: db.completed_at || undefined,
    status: db.status as SessionStatus,
    responses: db.responses || [],
    sentiment_score: db.sentiment_score ?? 0,
    summary: db.summary || undefined,
    created_at: db.created_at,
  };
}

// ============================================
// Utility Functions for Testing
// ============================================

/**
 * Calculate sentiment score from responses
 * Simple implementation - can be enhanced with AI
 */
export function calculateSentimentScore(responses: FollowUpResponse[]): number {
  if (!responses.length) return 0;
  
  // Simple keyword-based sentiment analysis
  const positiveKeywords = ['好', '不错', '很好', '开心', '精神', 'good', 'great', 'happy', 'energetic'];
  const negativeKeywords = ['累', '疲惫', '不好', '焦虑', '压力', 'tired', 'bad', 'anxious', 'stressed'];
  
  let score = 0;
  let count = 0;
  
  for (const response of responses) {
    const text = response.user_response.toLowerCase();
    let responseScore = 0;
    
    for (const keyword of positiveKeywords) {
      if (text.includes(keyword)) responseScore += 0.2;
    }
    for (const keyword of negativeKeywords) {
      if (text.includes(keyword)) responseScore -= 0.2;
    }
    
    score += Math.max(-1, Math.min(1, responseScore));
    count++;
  }
  
  return count > 0 ? score / count : 0;
}

/**
 * Generate a greeting message for follow-up session
 */
export function generateFollowUpGreeting(sessionType: SessionType): string {
  if (sessionType === 'morning') {
    const greetings = [
      '早上好！今天感觉怎么样？',
      '新的一天开始了，你现在的状态如何？',
      '早安！让我们聊聊你今天的感受。',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else {
    const greetings = [
      '晚上好！今天过得怎么样？',
      '一天快结束了，来聊聊今天的感受吧。',
      '晚安时间到了，今天的能量状态如何？',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

/**
 * Check if a session should include execution tracking
 * 
 * Requirements: 2.1
 * - WHEN a plan has been active for more than 24 hours
 * - THEN include execution tracking questions
 */
export function shouldIncludeExecutionTracking(planCreatedAt: Date): boolean {
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - planCreatedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation > 24;
}
