/**
 * Adaptive Plan Follow-up System Types
 * 动态计划适应系统类型定义
 */

// ============================================
// Scientific Explanation Types
// ============================================

export interface ScientificExplanation {
  physiology: string;      // 生理学角度
  neurology: string;       // 神经学角度
  psychology: string;      // 心理学角度
  behavioral_science: string; // 行为学角度
  summary: string;         // 综合摘要
  references?: string[];   // 科学文献引用
}

export interface ProblemAnalysis {
  problem_description: string;
  root_causes: {
    physiological: string[];
    neurological: string[];
    psychological: string[];
    behavioral: string[];
  };
  scientific_explanation: ScientificExplanation;
}

// ============================================
// Action Item Types
// ============================================

export interface ActionItem {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  timing: string;
  duration: string;
  steps: string[];
  expected_outcome: string;
  scientific_rationale: ScientificExplanation;
  order: number;
  is_established: boolean; // 连续7天完成后标记
  replacement_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AlternativeAction {
  id: string;
  original_action_id: string;
  title: string;
  description: string;
  timing: string;
  duration: string;
  steps: string[];
  expected_outcome: string;
  scientific_rationale: ScientificExplanation;
  similarity_score: number; // 与原行动的效果相似度 0-1
  user_fit_score: number; // 预测的用户适配度 0-1
  why_better_fit: string; // 为什么更适合该用户
}


// ============================================
// Follow-up Session Types
// ============================================

export type SessionType = 'morning' | 'evening';
export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type QuestionType = 'feeling' | 'energy' | 'execution' | 'replacement';

export interface FollowUpResponse {
  question_type: QuestionType;
  user_response: string;
  ai_interpretation: string;
  timestamp: string;
}

export interface FollowUpSession {
  id: string;
  user_id: string;
  plan_id: string;
  session_type: SessionType;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  status: SessionStatus;
  responses: FollowUpResponse[];
  sentiment_score: number; // -1 to 1
  summary?: string;
  created_at?: string;
}

// ============================================
// Execution Tracking Types
// ============================================

export type ExecutionStatus = 'completed' | 'partial' | 'skipped' | 'replaced';

export interface ExecutionRecord {
  id: string;
  action_item_id: string;
  user_id: string;
  date: string;
  status: ExecutionStatus;
  needs_replacement: boolean; // 用户勾选的替换标记
  user_notes?: string;
  replacement_reason?: string;
  created_at?: string;
}

// ============================================
// Plan Evolution Types
// ============================================

export type ChangeType = 'replacement' | 'addition' | 'removal' | 'modification';

export interface PlanEvolution {
  id: string;
  plan_id: string;
  version: number;
  changed_at: string;
  change_type: ChangeType;
  original_item?: ActionItem;
  new_item?: ActionItem;
  reason: string;
  user_initiated: boolean;
  understanding_score_at_change: number;
}

export type PlanStatus = 'active' | 'paused' | 'completed';

export interface AdaptivePlan {
  id: string;
  user_id: string;
  title: string;
  problem_analysis: ProblemAnalysis;
  action_items: ActionItem[];
  version: number;
  created_at: string;
  last_evolved_at: string;
  evolution_count: number;
  user_summary?: string; // 用户偏好总结（演化3次后生成）
  status: PlanStatus;
}

// ============================================
// User Understanding Score Types
// ============================================

export interface ScoreBreakdown {
  completion_prediction_accuracy: number; // 行动完成预测准确率
  replacement_acceptance_rate: number;    // 替换建议接受率
  sentiment_prediction_accuracy: number;  // 情绪预测准确率
  preference_pattern_match: number;       // 偏好模式匹配度
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  factors_changed: string[];
}

export interface UserUnderstandingScore {
  id?: string;
  user_id: string;
  current_score: number; // 0-100
  score_breakdown: ScoreBreakdown;
  is_deep_understanding: boolean; // score >= 95
  last_updated: string;
  history: ScoreHistoryEntry[];
}

// ============================================
// User Preference Profile Types
// ============================================

export type LearningSource = 'execution' | 'feedback' | 'replacement' | 'conversation';

export interface LearningEntry {
  date: string;
  insight: string;
  confidence: number;
  source: LearningSource;
}

export interface UserPreferenceProfile {
  id?: string;
  user_id: string;
  preferred_times: string[];
  avoided_activities: string[];
  successful_patterns: string[];
  physical_constraints: string[];
  lifestyle_factors: string[];
  learning_history: LearningEntry[];
  updated_at?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface FollowUpContextPayload {
  sessionId: string;
  sessionType: SessionType;
  planId: string;
  actionItemIds: string[];
}

export interface GenerateAlternativesRequest {
  actionItemId: string;
  replacementReason: string;
}

export interface GenerateAlternativesResponse {
  alternatives: AlternativeAction[];
}

export interface RecordExecutionRequest {
  actionItemId: string;
  status: ExecutionStatus;
  needsReplacement: boolean;
  userNotes?: string;
  replacementReason?: string;
}

// ============================================
// Serialization Helpers
// ============================================

/**
 * Serialize an AdaptivePlan to JSON string
 */
export function serializeAdaptivePlan(plan: AdaptivePlan): string {
  return JSON.stringify(plan);
}

/**
 * Deserialize JSON string to AdaptivePlan
 */
export function deserializeAdaptivePlan(json: string): AdaptivePlan {
  return JSON.parse(json) as AdaptivePlan;
}

/**
 * Validate that an object conforms to AdaptivePlan structure
 */
export function isValidAdaptivePlan(obj: unknown): obj is AdaptivePlan {
  if (!obj || typeof obj !== 'object') return false;
  
  const plan = obj as Record<string, unknown>;
  
  return (
    typeof plan.id === 'string' &&
    typeof plan.user_id === 'string' &&
    typeof plan.title === 'string' &&
    typeof plan.problem_analysis === 'object' &&
    Array.isArray(plan.action_items) &&
    typeof plan.version === 'number' &&
    typeof plan.created_at === 'string' &&
    typeof plan.last_evolved_at === 'string' &&
    typeof plan.evolution_count === 'number' &&
    ['active', 'paused', 'completed'].includes(plan.status as string)
  );
}

/**
 * Validate that an object conforms to ActionItem structure
 */
export function isValidActionItem(obj: unknown): obj is ActionItem {
  if (!obj || typeof obj !== 'object') return false;
  
  const item = obj as Record<string, unknown>;
  
  return (
    typeof item.id === 'string' &&
    typeof item.plan_id === 'string' &&
    typeof item.title === 'string' && item.title.length > 0 &&
    typeof item.description === 'string' && item.description.length > 0 &&
    typeof item.timing === 'string' && item.timing.length > 0 &&
    typeof item.duration === 'string' && item.duration.length > 0 &&
    Array.isArray(item.steps) && item.steps.length > 0 &&
    typeof item.expected_outcome === 'string' && item.expected_outcome.length > 0 &&
    typeof item.scientific_rationale === 'object' &&
    typeof item.order === 'number' &&
    typeof item.is_established === 'boolean' &&
    typeof item.replacement_count === 'number'
  );
}

/**
 * Validate that an object conforms to ScientificExplanation structure
 */
export function isValidScientificExplanation(obj: unknown): obj is ScientificExplanation {
  if (!obj || typeof obj !== 'object') return false;
  
  const exp = obj as Record<string, unknown>;
  
  return (
    typeof exp.physiology === 'string' && exp.physiology.length > 0 &&
    typeof exp.neurology === 'string' && exp.neurology.length > 0 &&
    typeof exp.psychology === 'string' && exp.psychology.length > 0 &&
    typeof exp.behavioral_science === 'string' && exp.behavioral_science.length > 0 &&
    typeof exp.summary === 'string'
  );
}
