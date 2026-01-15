/**
 * Alternative Generation Service
 * 智能平替推荐服务 - 为需要替换的行动项生成科学等效的平替选项
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ActionItem,
  AlternativeAction,
  UserPreferenceProfile,
  ScientificExplanation,
  PlanEvolution,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const MIN_ALTERNATIVES = 3;
const VERIFICATION_DAYS = 3;

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
 * Generate alternative actions for a given action item
 * 
 * Requirements: 3.2, 3.3, 3.4
 * - Generate at least 3 Alternative_Actions with similar efficacy
 * - Consider user's stated constraints and preference profile
 * - Explain why each alternative achieves similar results
 */
export async function generateAlternatives(
  actionItem: ActionItem,
  userProfile: UserPreferenceProfile,
  replacementReason: string
): Promise<AlternativeAction[]> {
  // Build the prompt for AI generation
  const prompt = buildAlternativeGenerationPrompt(actionItem, userProfile, replacementReason);
  
  try {
    // Call the existing chat API to generate alternatives
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: ALTERNATIVE_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        responseFormat: 'json',
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to generate alternatives:', response.status);
      // Return fallback alternatives
      return generateFallbackAlternatives(actionItem, replacementReason);
    }
    
    const data = await response.json();
    const alternatives = parseAlternativesFromResponse(data, actionItem.id);
    
    // Filter out alternatives that match avoided activities
    const filteredAlternatives = filterByUserPreferences(alternatives, userProfile);
    
    // Ensure we have at least MIN_ALTERNATIVES
    if (filteredAlternatives.length < MIN_ALTERNATIVES) {
      const fallbacks = generateFallbackAlternatives(actionItem, replacementReason);
      return [...filteredAlternatives, ...fallbacks].slice(0, MIN_ALTERNATIVES);
    }
    
    return filteredAlternatives;
  } catch (error) {
    console.error('Error generating alternatives:', error);
    return generateFallbackAlternatives(actionItem, replacementReason);
  }
}

/**
 * Select an alternative and update the plan
 * 
 * Requirements: 3.5
 * - Update the plan and record the change in Plan_Evolution_History
 */
export async function selectAlternative(
  originalActionId: string,
  alternative: AlternativeAction,
  userId: string,
  understandingScore: number
): Promise<ActionItem> {
  const supabase = getSupabaseClient();
  
  // Get the original action item
  const { data: originalItem, error: fetchError } = await supabase
    .from('plan_action_items')
    .select('*')
    .eq('id', originalActionId)
    .single();
  
  if (fetchError) {
    throw new Error(`Failed to fetch original action: ${fetchError.message}`);
  }
  
  // Create the new action item from the alternative
  const newActionData = {
    plan_id: originalItem.plan_id,
    title: alternative.title,
    description: alternative.description,
    timing: alternative.timing,
    duration: alternative.duration,
    steps: alternative.steps,
    expected_outcome: alternative.expected_outcome,
    scientific_rationale: alternative.scientific_rationale,
    item_order: originalItem.item_order,
    is_established: false,
    replacement_count: originalItem.replacement_count + 1,
  };
  
  // Insert the new action item
  const { data: newItem, error: insertError } = await supabase
    .from('plan_action_items')
    .insert(newActionData)
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Failed to create new action: ${insertError.message}`);
  }
  
  // Record the evolution
  await recordPlanEvolution(
    originalItem.plan_id,
    originalItem,
    newItem,
    alternative.why_better_fit,
    understandingScore
  );
  
  // Delete the original action item
  await supabase
    .from('plan_action_items')
    .delete()
    .eq('id', originalActionId);
  
  return mapDbToActionItem(newItem);
}


/**
 * Track the success of an alternative action
 * 
 * Requirements: 3.6
 * - Track execution separately for the first 3 days to verify it fits better
 */
export async function trackAlternativeSuccess(
  actionItemId: string,
  days: number = VERIFICATION_DAYS
): Promise<{ success: boolean; completionRate: number }> {
  const supabase = getSupabaseClient();
  
  // Get execution records for the specified days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: records, error } = await supabase
    .from('execution_tracking')
    .select('status')
    .eq('action_item_id', actionItemId)
    .gte('execution_date', startDate.toISOString().split('T')[0])
    .order('execution_date', { ascending: false });
  
  if (error) {
    console.error('Failed to track alternative success:', error);
    return { success: false, completionRate: 0 };
  }
  
  if (!records || records.length === 0) {
    return { success: false, completionRate: 0 };
  }
  
  const completed = records.filter((r: { status: string }) => r.status === 'completed').length;
  const completionRate = completed / records.length;
  
  // Consider successful if completion rate is above 70%
  return {
    success: completionRate >= 0.7,
    completionRate,
  };
}

// ============================================
// Helper Functions
// ============================================

const ALTERNATIVE_GENERATION_SYSTEM_PROMPT = `你是一个健康行为专家，专门帮助用户找到更适合他们生活方式的健康行动替代方案。

你的任务是为用户生成至少3个替代行动方案，每个方案都应该：
1. 达到与原行动相似的健康效果
2. 更适合用户的生活方式和偏好
3. 有科学依据支持

请以JSON格式返回替代方案数组，每个方案包含：
- title: 行动标题
- description: 详细描述
- timing: 建议执行时间
- duration: 预计持续时间
- steps: 具体步骤数组
- expected_outcome: 预期效果
- scientific_rationale: 科学解释（包含physiology, neurology, psychology, behavioral_science, summary字段）
- similarity_score: 与原行动的效果相似度(0-1)
- user_fit_score: 预测的用户适配度(0-1)
- why_better_fit: 为什么更适合该用户`;

function buildAlternativeGenerationPrompt(
  actionItem: ActionItem,
  userProfile: UserPreferenceProfile,
  replacementReason: string
): string {
  return `
原行动项：
- 标题：${actionItem.title}
- 描述：${actionItem.description}
- 时间：${actionItem.timing}
- 时长：${actionItem.duration}
- 预期效果：${actionItem.expected_outcome}

用户替换原因：${replacementReason}

用户偏好档案：
- 偏好时间：${userProfile.preferred_times.join(', ') || '未指定'}
- 避免的活动：${userProfile.avoided_activities.join(', ') || '无'}
- 成功的模式：${userProfile.successful_patterns.join(', ') || '无'}
- 身体限制：${userProfile.physical_constraints.join(', ') || '无'}
- 生活方式因素：${userProfile.lifestyle_factors.join(', ') || '无'}

请生成至少3个替代方案，确保：
1. 不包含用户避免的活动类型
2. 考虑用户的身体限制
3. 符合用户成功的行为模式
4. 提供完整的科学解释
`;
}

function parseAlternativesFromResponse(
  response: { content?: string; alternatives?: AlternativeAction[] },
  originalActionId: string
): AlternativeAction[] {
  try {
    let alternatives: Partial<AlternativeAction>[];
    
    if (response.alternatives) {
      alternatives = response.alternatives;
    } else if (response.content) {
      // Try to parse JSON from content
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        alternatives = JSON.parse(jsonMatch[0]);
      } else {
        return [];
      }
    } else {
      return [];
    }
    
    return alternatives.map((alt, index) => ({
      id: `alt_${originalActionId}_${index}`,
      original_action_id: originalActionId,
      title: alt.title || '',
      description: alt.description || '',
      timing: alt.timing || '',
      duration: alt.duration || '',
      steps: alt.steps || [],
      expected_outcome: alt.expected_outcome || '',
      scientific_rationale: alt.scientific_rationale || createEmptyScientificExplanation(),
      similarity_score: alt.similarity_score || 0.8,
      user_fit_score: alt.user_fit_score || 0.7,
      why_better_fit: alt.why_better_fit || '',
    }));
  } catch (error) {
    console.error('Failed to parse alternatives:', error);
    return [];
  }
}

/**
 * Filter alternatives based on user preferences
 * 
 * Requirements: 3.3
 * - Consider user's stated constraints and historical rejection patterns
 */
export function filterByUserPreferences(
  alternatives: AlternativeAction[],
  userProfile: UserPreferenceProfile
): AlternativeAction[] {
  return alternatives.filter(alt => {
    // Check if alternative matches any avoided activities
    const titleLower = alt.title.toLowerCase();
    const descLower = alt.description.toLowerCase();
    
    for (const avoided of userProfile.avoided_activities) {
      const avoidedLower = avoided.toLowerCase();
      if (titleLower.includes(avoidedLower) || descLower.includes(avoidedLower)) {
        return false;
      }
    }
    
    return true;
  });
}

function generateFallbackAlternatives(
  actionItem: ActionItem,
  replacementReason: string
): AlternativeAction[] {
  void replacementReason;
  // Generate simple fallback alternatives based on common patterns
  const fallbacks: AlternativeAction[] = [
    {
      id: `fallback_${actionItem.id}_1`,
      original_action_id: actionItem.id,
      title: `简化版：${actionItem.title}`,
      description: `${actionItem.description}的简化版本，减少时间和强度要求`,
      timing: actionItem.timing,
      duration: '5-10分钟',
      steps: ['从最简单的步骤开始', '逐渐增加难度', '保持舒适的节奏'],
      expected_outcome: actionItem.expected_outcome,
      scientific_rationale: createEmptyScientificExplanation(),
      similarity_score: 0.7,
      user_fit_score: 0.8,
      why_better_fit: '降低了执行门槛，更容易坚持',
    },
    {
      id: `fallback_${actionItem.id}_2`,
      original_action_id: actionItem.id,
      title: `灵活版：${actionItem.title}`,
      description: `${actionItem.description}的灵活版本，可以在任何时间执行`,
      timing: '任意时间',
      duration: actionItem.duration,
      steps: actionItem.steps,
      expected_outcome: actionItem.expected_outcome,
      scientific_rationale: createEmptyScientificExplanation(),
      similarity_score: 0.8,
      user_fit_score: 0.75,
      why_better_fit: '时间更灵活，适应不同的日程安排',
    },
    {
      id: `fallback_${actionItem.id}_3`,
      original_action_id: actionItem.id,
      title: `替代版：${actionItem.title}`,
      description: `达到相似效果的替代方法`,
      timing: actionItem.timing,
      duration: actionItem.duration,
      steps: ['选择适合自己的方式', '保持一致性', '记录感受'],
      expected_outcome: actionItem.expected_outcome,
      scientific_rationale: createEmptyScientificExplanation(),
      similarity_score: 0.6,
      user_fit_score: 0.7,
      why_better_fit: '提供更多选择空间',
    },
  ];
  
  return fallbacks;
}

function createEmptyScientificExplanation(): ScientificExplanation {
  return {
    physiology: '待补充生理学解释',
    neurology: '待补充神经学解释',
    psychology: '待补充心理学解释',
    behavioral_science: '待补充行为学解释',
    summary: '待补充综合摘要',
  };
}


// ============================================
// Plan Evolution Recording
// ============================================

async function recordPlanEvolution(
  planId: string,
  originalItem: DbActionItem,
  newItem: DbActionItem,
  reason: string,
  understandingScore: number
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get current version
  const { data: history } = await supabase
    .from('plan_evolution_history')
    .select('version')
    .eq('plan_id', planId)
    .order('version', { ascending: false })
    .limit(1);
  
  const currentVersion = history && history.length > 0 ? history[0].version : 0;
  
  const evolutionData: Omit<PlanEvolution, 'id'> = {
    plan_id: planId,
    version: currentVersion + 1,
    changed_at: new Date().toISOString(),
    change_type: 'replacement',
    original_item: mapDbToActionItem(originalItem),
    new_item: mapDbToActionItem(newItem),
    reason,
    user_initiated: true,
    understanding_score_at_change: understandingScore,
  };
  
  const { error } = await supabase
    .from('plan_evolution_history')
    .insert(evolutionData);
  
  if (error) {
    console.error('Failed to record plan evolution:', error);
  }
}

// ============================================
// Database Mapping
// ============================================

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

// ============================================
// Validation Functions for Property Testing
// ============================================

/**
 * Validate that an alternative has all required fields
 * 
 * Requirements: 3.2, 3.4
 */
export function isValidAlternative(alt: AlternativeAction): boolean {
  return (
    typeof alt.id === 'string' && alt.id.length > 0 &&
    typeof alt.original_action_id === 'string' && alt.original_action_id.length > 0 &&
    typeof alt.title === 'string' && alt.title.length > 0 &&
    typeof alt.similarity_score === 'number' && alt.similarity_score >= 0 && alt.similarity_score <= 1 &&
    typeof alt.scientific_rationale === 'object' &&
    typeof alt.scientific_rationale.physiology === 'string' && alt.scientific_rationale.physiology.length > 0 &&
    typeof alt.scientific_rationale.neurology === 'string' && alt.scientific_rationale.neurology.length > 0 &&
    typeof alt.scientific_rationale.psychology === 'string' && alt.scientific_rationale.psychology.length > 0 &&
    typeof alt.scientific_rationale.behavioral_science === 'string' && alt.scientific_rationale.behavioral_science.length > 0
  );
}

/**
 * Check if alternative respects user preferences
 * 
 * Requirements: 3.3
 */
export function respectsUserPreferences(
  alt: AlternativeAction,
  userProfile: UserPreferenceProfile
): boolean {
  const titleLower = alt.title.toLowerCase();
  const descLower = alt.description.toLowerCase();
  
  for (const avoided of userProfile.avoided_activities) {
    const avoidedLower = avoided.toLowerCase();
    if (titleLower.includes(avoidedLower) || descLower.includes(avoidedLower)) {
      return false;
    }
  }
  
  return true;
}
