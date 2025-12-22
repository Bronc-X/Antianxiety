/**
 * Plan Evolution Service
 * 计划演化服务 - 管理计划的动态演化和历史记录
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PlanEvolution,
  AdaptivePlan,
  ActionItem,
  ChangeType,
  ScientificExplanation,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const EVOLUTION_THRESHOLD_FOR_SUMMARY = 3;
const ESTABLISHED_HABIT_DAYS = 7;

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
 * Record a plan evolution
 * 
 * Requirements: 5.3
 * - Preserve the Plan_Evolution_History showing all changes and reasons
 */
export async function recordEvolution(
  evolution: Omit<PlanEvolution, 'id'>
): Promise<PlanEvolution> {
  const supabase = getSupabaseClient();
  
  const evolutionData = {
    plan_id: evolution.plan_id,
    version: evolution.version,
    changed_at: evolution.changed_at,
    change_type: evolution.change_type,
    original_item: evolution.original_item,
    new_item: evolution.new_item,
    reason: evolution.reason,
    user_initiated: evolution.user_initiated,
    understanding_score_at_change: evolution.understanding_score_at_change,
  };
  
  const { data, error } = await supabase
    .from('plan_evolution_history')
    .insert(evolutionData)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to record evolution:', error);
    throw new Error(`Failed to record evolution: ${error.message}`);
  }
  
  return mapDbToEvolution(data);
}

/**
 * Get evolution history for a plan
 * 
 * Requirements: 5.3, 5.5
 * - Show both the current version and highlight recent adaptations
 */
export async function getEvolutionHistory(planId: string): Promise<PlanEvolution[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('plan_evolution_history')
    .select('*')
    .eq('plan_id', planId)
    .order('version', { ascending: false });
  
  if (error) {
    console.error('Failed to get evolution history:', error);
    throw new Error(`Failed to get evolution history: ${error.message}`);
  }
  
  return (data || []).map(mapDbToEvolution);
}

/**
 * Generate a user summary after 3+ evolutions
 * 
 * Requirements: 5.4
 * - WHEN a plan has evolved more than 3 times
 * - THEN generate a summary of what works best for this specific user
 */
export async function generateUserSummary(planId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  // Get evolution history
  const history = await getEvolutionHistory(planId);
  
  if (history.length < EVOLUTION_THRESHOLD_FOR_SUMMARY) {
    return '';
  }
  
  // Analyze patterns from evolution history
  const summary = analyzeEvolutionPatterns(history);
  
  // Update the plan with the summary
  const { error } = await supabase
    .from('user_plans')
    .update({ user_summary: summary })
    .eq('id', planId);
  
  if (error) {
    console.error('Failed to update user summary:', error);
  }
  
  return summary;
}


/**
 * Get the current version of a plan with evolution highlights
 * 
 * Requirements: 5.5
 * - Show both the current version and highlight recent adaptations
 */
export async function getCurrentVersion(planId: string): Promise<AdaptivePlan | null> {
  const supabase = getSupabaseClient();
  
  // Get the plan
  const { data: plan, error: planError } = await supabase
    .from('user_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (planError) {
    if (planError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get plan: ${planError.message}`);
  }
  
  // Get action items
  const { data: actionItems, error: itemsError } = await supabase
    .from('plan_action_items')
    .select('*')
    .eq('plan_id', planId)
    .order('item_order', { ascending: true });
  
  if (itemsError) {
    throw new Error(`Failed to get action items: ${itemsError.message}`);
  }
  
  // Get evolution count
  const { count: evolutionCount } = await supabase
    .from('plan_evolution_history')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId);
  
  return {
    id: plan.id,
    user_id: plan.user_id,
    title: plan.title || '',
    problem_analysis: plan.problem_analysis || createEmptyProblemAnalysis(),
    action_items: (actionItems || []).map(mapDbToActionItem),
    version: evolutionCount || 0,
    created_at: plan.created_at,
    last_evolved_at: plan.updated_at || plan.created_at,
    evolution_count: evolutionCount || 0,
    user_summary: plan.user_summary,
    status: plan.status || 'active',
  };
}

/**
 * Get the latest version number for a plan
 */
export async function getLatestVersion(planId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('plan_evolution_history')
    .select('version')
    .eq('plan_id', planId)
    .order('version', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Failed to get latest version:', error);
    return 0;
  }
  
  return data && data.length > 0 ? data[0].version : 0;
}

// ============================================
// Analysis Functions
// ============================================

/**
 * Analyze evolution patterns to generate user summary
 */
function analyzeEvolutionPatterns(history: PlanEvolution[]): string {
  const replacementReasons: string[] = [];
  const successfulPatterns: string[] = [];
  const avoidedPatterns: string[] = [];
  
  for (const evolution of history) {
    if (evolution.change_type === 'replacement' && evolution.reason) {
      replacementReasons.push(evolution.reason);
    }
    
    if (evolution.original_item) {
      avoidedPatterns.push(evolution.original_item.title);
    }
    
    if (evolution.new_item) {
      successfulPatterns.push(evolution.new_item.title);
    }
  }
  
  // Generate summary
  const summaryParts: string[] = [];
  
  if (avoidedPatterns.length > 0) {
    summaryParts.push(`用户倾向于避免：${avoidedPatterns.slice(0, 3).join('、')}`);
  }
  
  if (successfulPatterns.length > 0) {
    summaryParts.push(`用户更喜欢：${successfulPatterns.slice(0, 3).join('、')}`);
  }
  
  if (replacementReasons.length > 0) {
    const commonReasons = findCommonPatterns(replacementReasons);
    if (commonReasons.length > 0) {
      summaryParts.push(`常见替换原因：${commonReasons.join('、')}`);
    }
  }
  
  return summaryParts.join('。') + '。';
}

/**
 * Find common patterns in an array of strings
 */
function findCommonPatterns(strings: string[]): string[] {
  const wordCounts: Record<string, number> = {};
  
  for (const str of strings) {
    const words = str.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
  }
  
  // Return words that appear more than once
  return Object.entries(wordCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

/**
 * Check if a plan should generate a user summary
 * 
 * Requirements: 5.4
 */
export function shouldGenerateSummary(evolutionCount: number): boolean {
  return evolutionCount >= EVOLUTION_THRESHOLD_FOR_SUMMARY;
}

/**
 * Check if an action item should be marked as established
 * 
 * Requirements: 5.2
 * - WHEN a user successfully maintains an action for 7 consecutive days
 * - THEN mark it as "established habit"
 */
export function shouldMarkAsEstablished(consecutiveCompletedDays: number): boolean {
  return consecutiveCompletedDays >= ESTABLISHED_HABIT_DAYS;
}

// ============================================
// Database Mapping
// ============================================

interface DbPlanEvolution {
  id: string;
  plan_id: string;
  version: number;
  changed_at: string;
  change_type: string;
  original_item: Record<string, unknown> | null;
  new_item: Record<string, unknown> | null;
  reason: string | null;
  user_initiated: boolean;
  understanding_score_at_change: number | null;
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

function mapDbToEvolution(db: DbPlanEvolution): PlanEvolution {
  return {
    id: db.id,
    plan_id: db.plan_id,
    version: db.version,
    changed_at: db.changed_at,
    change_type: db.change_type as ChangeType,
    original_item: db.original_item as ActionItem | undefined,
    new_item: db.new_item as ActionItem | undefined,
    reason: db.reason || '',
    user_initiated: db.user_initiated,
    understanding_score_at_change: db.understanding_score_at_change || 0,
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
    scientific_rationale: (db.scientific_rationale || createEmptyScientificExplanation()) as unknown as ScientificExplanation,
    order: db.item_order,
    is_established: db.is_established,
    replacement_count: db.replacement_count,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

function createEmptyScientificExplanation(): ScientificExplanation {
  return {
    physiology: '',
    neurology: '',
    psychology: '',
    behavioral_science: '',
    summary: '',
  };
}

function createEmptyProblemAnalysis() {
  return {
    problem_description: '',
    root_causes: {
      physiological: [],
      neurological: [],
      psychological: [],
      behavioral: [],
    },
    scientific_explanation: createEmptyScientificExplanation(),
  };
}
