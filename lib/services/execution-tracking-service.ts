/**
 * Execution Tracking Service
 * 执行追踪服务 - 追踪每个行动项的执行情况
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ExecutionRecord,
  ExecutionStatus,
  ActionItem,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const CONSECUTIVE_FAILURE_THRESHOLD = 3;

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
 * Record an execution status for an action item
 * 
 * Requirements: 2.1, 2.2
 * - WHEN tracking execution THEN present each Action_Item individually
 * - Ask user to select: completed, partially completed, skipped, or needs replacement
 */
export async function recordExecution(
  record: Omit<ExecutionRecord, 'id' | 'created_at'>
): Promise<ExecutionRecord> {
  const supabase = getSupabaseClient();
  
  const executionData = {
    action_item_id: record.action_item_id,
    user_id: record.user_id,
    execution_date: record.date,
    status: record.status,
    needs_replacement: record.needs_replacement,
    user_notes: record.user_notes || null,
    replacement_reason: record.replacement_reason || null,
  };
  
  // Use upsert to handle duplicate entries for same day
  const { data, error } = await supabase
    .from('execution_tracking')
    .upsert(executionData, {
      onConflict: 'action_item_id,execution_date',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to record execution:', error);
    throw new Error(`Failed to record execution: ${error.message}`);
  }
  
  return mapDbToExecutionRecord(data);
}

/**
 * Get execution history for an action item
 * 
 * Requirements: 2.4
 */
export async function getExecutionHistory(
  actionItemId: string,
  days: number = 30
): Promise<ExecutionRecord[]> {
  const supabase = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('execution_tracking')
    .select('*')
    .eq('action_item_id', actionItemId)
    .gte('execution_date', startDate.toISOString().split('T')[0])
    .order('execution_date', { ascending: false });
  
  if (error) {
    console.error('Failed to get execution history:', error);
    throw new Error(`Failed to get execution history: ${error.message}`);
  }
  
  return (data || []).map(mapDbToExecutionRecord);
}


/**
 * Calculate execution rate for a plan
 * 
 * Requirements: 2.4
 * - WHEN tracking is complete THEN calculate and display an execution rate
 * - Formula: (completed + 0.5 * partial) / total_records
 */
export async function calculateExecutionRate(planId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  // Get all action items for the plan
  const { data: actionItems, error: itemsError } = await supabase
    .from('plan_action_items')
    .select('id')
    .eq('plan_id', planId);
  
  if (itemsError) {
    console.error('Failed to get action items:', itemsError);
    throw new Error(`Failed to get action items: ${itemsError.message}`);
  }
  
  if (!actionItems || actionItems.length === 0) {
    return 0;
  }
  
  const actionItemIds = actionItems.map((item: { id: string }) => item.id);
  
  // Get all execution records for these action items
  const { data: records, error: recordsError } = await supabase
    .from('execution_tracking')
    .select('status')
    .in('action_item_id', actionItemIds);
  
  if (recordsError) {
    console.error('Failed to get execution records:', recordsError);
    throw new Error(`Failed to get execution records: ${recordsError.message}`);
  }
  
  if (!records || records.length === 0) {
    return 0;
  }
  
  return calculateExecutionRateFromRecords(records.map((r: { status: string }) => r.status as ExecutionStatus));
}

/**
 * Pure function to calculate execution rate from status array
 * Used for both database queries and property testing
 */
export function calculateExecutionRateFromRecords(statuses: ExecutionStatus[]): number {
  if (statuses.length === 0) return 0;
  
  const completed = statuses.filter(s => s === 'completed').length;
  const partial = statuses.filter(s => s === 'partial').length;
  
  const rate = (completed + 0.5 * partial) / statuses.length;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Flag an action item for replacement
 * 
 * Requirements: 2.3
 * - WHEN a user selects "needs replacement" for an Action_Item
 * - THEN ask follow-up questions about why the action doesn't fit
 */
export async function flagForReplacement(
  actionItemId: string,
  reason: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Update the latest execution record to mark needs_replacement
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('execution_tracking')
    .update({
      needs_replacement: true,
      replacement_reason: reason,
    })
    .eq('action_item_id', actionItemId)
    .eq('execution_date', today);
  
  if (error) {
    console.error('Failed to flag for replacement:', error);
    throw new Error(`Failed to flag for replacement: ${error.message}`);
  }
}

/**
 * Get action items that need replacement
 * 
 * Requirements: 2.5
 * - WHEN an Action_Item is marked as skipped or needs replacement for 3 consecutive days
 * - THEN flag the item for automatic replacement suggestion
 */
export async function getItemsNeedingReplacement(planId: string): Promise<ActionItem[]> {
  const supabase = getSupabaseClient();
  
  // Get all action items for the plan
  const { data: actionItems, error: itemsError } = await supabase
    .from('plan_action_items')
    .select('*')
    .eq('plan_id', planId);
  
  if (itemsError) {
    console.error('Failed to get action items:', itemsError);
    throw new Error(`Failed to get action items: ${itemsError.message}`);
  }
  
  if (!actionItems || actionItems.length === 0) {
    return [];
  }
  
  const itemsNeedingReplacement: ActionItem[] = [];
  
  for (const item of actionItems) {
    const needsReplacement = await checkConsecutiveFailures(item.id);
    if (needsReplacement) {
      itemsNeedingReplacement.push(mapDbToActionItem(item));
    }
  }
  
  return itemsNeedingReplacement;
}

/**
 * Check if an action item has consecutive failures
 * 
 * Requirements: 2.5
 * - 3 consecutive days of 'skipped' or 'needs_replacement' status
 */
export async function checkConsecutiveFailures(actionItemId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Get the last 3 execution records
  const { data: records, error } = await supabase
    .from('execution_tracking')
    .select('status, needs_replacement')
    .eq('action_item_id', actionItemId)
    .order('execution_date', { ascending: false })
    .limit(CONSECUTIVE_FAILURE_THRESHOLD);
  
  if (error) {
    console.error('Failed to check consecutive failures:', error);
    return false;
  }
  
  if (!records || records.length < CONSECUTIVE_FAILURE_THRESHOLD) {
    return false;
  }
  
  return checkConsecutiveFailuresFromRecords(
    records.map((r: { status: string; needs_replacement: boolean }) => ({ status: r.status as ExecutionStatus, needs_replacement: r.needs_replacement }))
  );
}

/**
 * Pure function to check consecutive failures from records
 * Used for both database queries and property testing
 */
export function checkConsecutiveFailuresFromRecords(
  records: { status: ExecutionStatus; needs_replacement: boolean }[]
): boolean {
  if (records.length < CONSECUTIVE_FAILURE_THRESHOLD) {
    return false;
  }
  
  // Check if all recent records are failures
  const recentRecords = records.slice(0, CONSECUTIVE_FAILURE_THRESHOLD);
  return recentRecords.every(
    r => r.status === 'skipped' || r.status === 'replaced' || r.needs_replacement
  );
}

/**
 * Get execution summary for a user
 */
export async function getExecutionSummary(
  userId: string,
  days: number = 7
): Promise<{
  totalRecords: number;
  completed: number;
  partial: number;
  skipped: number;
  replaced: number;
  executionRate: number;
}> {
  const supabase = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: records, error } = await supabase
    .from('execution_tracking')
    .select('status')
    .eq('user_id', userId)
    .gte('execution_date', startDate.toISOString().split('T')[0]);
  
  if (error) {
    console.error('Failed to get execution summary:', error);
    throw new Error(`Failed to get execution summary: ${error.message}`);
  }
  
  const statuses = (records || []).map((r: { status: string }) => r.status as ExecutionStatus);
  
  return {
    totalRecords: statuses.length,
    completed: statuses.filter((s: ExecutionStatus) => s === 'completed').length,
    partial: statuses.filter((s: ExecutionStatus) => s === 'partial').length,
    skipped: statuses.filter((s: ExecutionStatus) => s === 'skipped').length,
    replaced: statuses.filter((s: ExecutionStatus) => s === 'replaced').length,
    executionRate: calculateExecutionRateFromRecords(statuses),
  };
}


// ============================================
// Database Mapping
// ============================================

interface DbExecutionRecord {
  id: string;
  action_item_id: string;
  user_id: string;
  execution_date: string;
  status: string;
  needs_replacement: boolean;
  user_notes: string | null;
  replacement_reason: string | null;
  created_at: string;
}

interface DbActionItem {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  timing: string | null;
  duration: string | null;
  steps: string[];
  expected_outcome: string | null;
  scientific_rationale: Record<string, unknown> | null;
  item_order: number;
  is_established: boolean;
  replacement_count: number;
  created_at: string;
  updated_at: string;
}

function mapDbToExecutionRecord(db: DbExecutionRecord): ExecutionRecord {
  return {
    id: db.id,
    action_item_id: db.action_item_id,
    user_id: db.user_id,
    date: db.execution_date,
    status: db.status as ExecutionStatus,
    needs_replacement: db.needs_replacement,
    user_notes: db.user_notes || undefined,
    replacement_reason: db.replacement_reason || undefined,
    created_at: db.created_at,
  };
}

function mapDbToActionItem(db: DbActionItem): ActionItem {
  return {
    id: db.id,
    plan_id: db.plan_id,
    title: db.title,
    description: db.description,
    timing: db.timing || '',
    duration: db.duration || '',
    steps: db.steps || [],
    expected_outcome: db.expected_outcome || '',
    scientific_rationale: (db.scientific_rationale || {
      physiology: '',
      neurology: '',
      psychology: '',
      behavioral_science: '',
      summary: '',
    }) as unknown as ActionItem['scientific_rationale'],
    order: db.item_order,
    is_established: db.is_established,
    replacement_count: db.replacement_count,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Mark an action item as established (7 consecutive days completed)
 * 
 * Requirements: 5.2
 */
export async function checkAndMarkEstablished(actionItemId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Get the last 7 execution records
  const { data: records, error: recordsError } = await supabase
    .from('execution_tracking')
    .select('status')
    .eq('action_item_id', actionItemId)
    .order('execution_date', { ascending: false })
    .limit(7);
  
  if (recordsError) {
    console.error('Failed to check established status:', recordsError);
    return false;
  }
  
  if (!records || records.length < 7) {
    return false;
  }
  
  // Check if all 7 records are completed
  const allCompleted = records.every((r: { status: string }) => r.status === 'completed');
  
  if (allCompleted) {
    // Mark the action item as established
    const { error: updateError } = await supabase
      .from('plan_action_items')
      .update({ is_established: true })
      .eq('id', actionItemId);
    
    if (updateError) {
      console.error('Failed to mark as established:', updateError);
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Check if action item should be marked as established
 * Pure function for property testing
 */
export function shouldMarkAsEstablished(statuses: ExecutionStatus[]): boolean {
  if (statuses.length < 7) return false;
  
  // Check the most recent 7 records
  const recent7 = statuses.slice(0, 7);
  return recent7.every(s => s === 'completed');
}
