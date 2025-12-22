/**
 * Detailed Plan Generator Service
 * 详细计划生成服务 - 生成包含至少5个行动项的详细计划
 * 
 * Requirements: 4.2, 4.3
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ActionItem,
  AdaptivePlan,
  ProblemAnalysis,
  ScientificExplanation,
} from '@/types/adaptive-plan';
import { generateProblemAnalysis, generateScientificExplanation } from './scientific-explanation-service';

// ============================================
// Configuration
// ============================================

const MIN_ACTION_ITEMS = 5;
const REQUIRED_ACTION_ITEM_FIELDS = [
  'title',
  'description',
  'timing',
  'duration',
  'steps',
  'expected_outcome',
  'scientific_rationale',
] as const;

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
 * Generate a detailed plan with minimum 5 action items
 * 
 * Requirements: 4.2
 * - Create a minimum of 5 Action_Items, each with detailed execution instructions
 */
export async function generateDetailedPlan(
  userId: string,
  problemDescription: string,
  userContext?: string
): Promise<AdaptivePlan> {
  // Generate problem analysis
  const problemAnalysis = await generateProblemAnalysis(problemDescription, userContext);
  
  // Generate action items
  const actionItems = await generateActionItems(problemDescription, problemAnalysis, userContext);
  
  // Ensure minimum action items
  const validatedItems = ensureMinimumActionItems(actionItems, problemDescription);
  
  // Create the plan in database
  const plan = await savePlanToDatabase(userId, problemDescription, problemAnalysis, validatedItems);
  
  return plan;
}

/**
 * Create a single action item with all required fields
 * 
 * Requirements: 4.3
 * - Include: specific timing, duration, step-by-step instructions, expected sensation/outcome, and scientific rationale
 */
export async function createActionItem(
  planId: string,
  title: string,
  description: string,
  options: {
    timing?: string;
    duration?: string;
    steps?: string[];
    expectedOutcome?: string;
    order?: number;
  } = {}
): Promise<ActionItem> {
  const supabase = getSupabaseClient();
  
  // Generate scientific rationale for the action
  const scientificRationale = await generateScientificExplanation(title, description);
  
  const actionItemData = {
    plan_id: planId,
    title,
    description,
    timing: options.timing || '每天',
    duration: options.duration || '10-15分钟',
    steps: options.steps || ['开始执行', '保持专注', '完成并记录'],
    expected_outcome: options.expectedOutcome || '改善整体健康状态',
    scientific_rationale: scientificRationale,
    item_order: options.order || 0,
    is_established: false,
    replacement_count: 0,
  };
  
  const { data, error } = await supabase
    .from('plan_action_items')
    .insert(actionItemData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create action item: ${error.message}`);
  }
  
  return mapDbToActionItem(data);
}

// ============================================
// Generation Functions
// ============================================

async function generateActionItems(
  problemDescription: string,
  problemAnalysis: ProblemAnalysis,
  userContext?: string
): Promise<Partial<ActionItem>[]> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: ACTION_ITEMS_SYSTEM_PROMPT },
          { role: 'user', content: buildActionItemsPrompt(problemDescription, problemAnalysis, userContext) },
        ],
        responseFormat: 'json',
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to generate action items:', response.status);
      return generateFallbackActionItems(problemDescription);
    }
    
    const data = await response.json();
    return parseActionItemsFromResponse(data);
  } catch (error) {
    console.error('Error generating action items:', error);
    return generateFallbackActionItems(problemDescription);
  }
}

function ensureMinimumActionItems(
  items: Partial<ActionItem>[],
  problemDescription: string
): Partial<ActionItem>[] {
  const validItems = items.filter(item => 
    item.title && item.title.length > 0 &&
    item.description && item.description.length > 0
  );
  
  if (validItems.length >= MIN_ACTION_ITEMS) {
    return validItems.slice(0, Math.max(MIN_ACTION_ITEMS, validItems.length));
  }
  
  // Add fallback items to reach minimum
  const fallbacks = generateFallbackActionItems(problemDescription);
  const combined = [...validItems, ...fallbacks];
  
  return combined.slice(0, Math.max(MIN_ACTION_ITEMS, combined.length));
}

async function savePlanToDatabase(
  userId: string,
  title: string,
  problemAnalysis: ProblemAnalysis,
  actionItems: Partial<ActionItem>[]
): Promise<AdaptivePlan> {
  const supabase = getSupabaseClient();
  
  // Create the plan
  const planData = {
    user_id: userId,
    title,
    problem_analysis: problemAnalysis,
    status: 'active',
  };
  
  const { data: plan, error: planError } = await supabase
    .from('user_plans')
    .insert(planData)
    .select()
    .single();
  
  if (planError) {
    throw new Error(`Failed to create plan: ${planError.message}`);
  }
  
  // Create action items
  const savedItems: ActionItem[] = [];
  for (let i = 0; i < actionItems.length; i++) {
    const item = actionItems[i];
    const savedItem = await createActionItem(
      plan.id,
      item.title || `行动项 ${i + 1}`,
      item.description || '',
      {
        timing: item.timing,
        duration: item.duration,
        steps: item.steps,
        expectedOutcome: item.expected_outcome,
        order: i,
      }
    );
    savedItems.push(savedItem);
  }
  
  return {
    id: plan.id,
    user_id: plan.user_id,
    title: plan.title,
    problem_analysis: problemAnalysis,
    action_items: savedItems,
    version: 0,
    created_at: plan.created_at,
    last_evolved_at: plan.created_at,
    evolution_count: 0,
    status: 'active',
  };
}


// ============================================
// System Prompts
// ============================================

const ACTION_ITEMS_SYSTEM_PROMPT = `你是一个健康行为专家，专门设计具体可执行的健康行动计划。

你的任务是为用户的健康问题生成至少5个详细的行动项。每个行动项必须包含：

1. **title**: 简洁的行动标题
2. **description**: 详细的行动描述
3. **timing**: 具体的执行时间（如"早上7:00-7:30"）
4. **duration**: 预计持续时间（如"15分钟"）
5. **steps**: 具体的执行步骤数组（至少3个步骤）
6. **expected_outcome**: 预期的效果和感受
7. **scientific_rationale**: 科学依据（包含physiology, neurology, psychology, behavioral_science, summary字段）

请以JSON数组格式返回行动项列表。确保每个行动项都是具体、可执行、有科学依据的。`;

function buildActionItemsPrompt(
  problemDescription: string,
  problemAnalysis: ProblemAnalysis,
  userContext?: string
): string {
  let prompt = `请为以下健康问题生成至少5个详细的行动项：

问题描述：${problemDescription}

问题分析：
- 生理原因：${problemAnalysis.root_causes.physiological.join('、')}
- 神经学原因：${problemAnalysis.root_causes.neurological.join('、')}
- 心理原因：${problemAnalysis.root_causes.psychological.join('、')}
- 行为原因：${problemAnalysis.root_causes.behavioral.join('、')}`;

  if (userContext) {
    prompt += `\n\n用户背景：${userContext}`;
  }

  prompt += '\n\n请确保每个行动项都有具体的时间、步骤和科学依据。';

  return prompt;
}

function parseActionItemsFromResponse(
  response: { content?: string; items?: Partial<ActionItem>[] }
): Partial<ActionItem>[] {
  try {
    if (response.items) {
      return response.items;
    }
    
    if (response.content) {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse action items:', error);
    return [];
  }
}

function generateFallbackActionItems(problemDescription: string): Partial<ActionItem>[] {
  return [
    {
      title: '晨间呼吸练习',
      description: '通过深呼吸激活副交感神经系统，降低皮质醇水平',
      timing: '早上起床后',
      duration: '5-10分钟',
      steps: ['找一个安静的地方坐下', '闭上眼睛，放松肩膀', '深吸气4秒，屏息4秒，呼气6秒', '重复10次'],
      expected_outcome: '感到更加平静和清醒',
    },
    {
      title: '户外散步',
      description: '轻度有氧运动结合自然光照，改善情绪和能量水平',
      timing: '上午或下午',
      duration: '15-20分钟',
      steps: ['穿上舒适的鞋子', '选择一条安全的路线', '保持中等步速', '注意周围的自然环境'],
      expected_outcome: '提升能量水平，改善心情',
    },
    {
      title: '正念冥想',
      description: '通过专注当下减少焦虑思维，增强情绪调节能力',
      timing: '午休或晚间',
      duration: '10分钟',
      steps: ['找一个安静的地方', '设置10分钟计时器', '专注于呼吸', '当思绪飘走时，温和地拉回注意力'],
      expected_outcome: '减少焦虑，提高专注力',
    },
    {
      title: '睡前放松仪式',
      description: '建立固定的睡前习惯，帮助身体准备进入睡眠状态',
      timing: '睡前30分钟',
      duration: '20-30分钟',
      steps: ['关闭电子设备', '调暗灯光', '进行轻度拉伸', '阅读或听轻音乐'],
      expected_outcome: '更容易入睡，睡眠质量提高',
    },
    {
      title: '感恩日记',
      description: '通过记录积极事物重塑思维模式，提升整体幸福感',
      timing: '每天晚上',
      duration: '5分钟',
      steps: ['准备一个笔记本', '写下今天3件值得感恩的事', '简单描述为什么感恩', '回顾并感受积极情绪'],
      expected_outcome: '培养积极心态，减少负面思维',
    },
  ];
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

function createEmptyScientificExplanation(): ScientificExplanation {
  return {
    physiology: '',
    neurology: '',
    psychology: '',
    behavioral_science: '',
    summary: '',
  };
}

// ============================================
// Validation Functions for Property Testing
// ============================================

/**
 * Validate that a plan has minimum required action items
 * 
 * Requirements: 4.2
 */
export function hasMinimumActionItems(actionItems: ActionItem[]): boolean {
  return actionItems.length >= MIN_ACTION_ITEMS;
}

/**
 * Validate that an action item has all required fields
 * 
 * Requirements: 4.3
 */
export function hasAllRequiredFields(item: ActionItem): boolean {
  return (
    typeof item.title === 'string' && item.title.length > 0 &&
    typeof item.description === 'string' && item.description.length > 0 &&
    typeof item.timing === 'string' && item.timing.length > 0 &&
    typeof item.duration === 'string' && item.duration.length > 0 &&
    Array.isArray(item.steps) && item.steps.length > 0 &&
    typeof item.expected_outcome === 'string' && item.expected_outcome.length > 0 &&
    typeof item.scientific_rationale === 'object'
  );
}

/**
 * Get the minimum required action items count
 */
export function getMinActionItemsCount(): number {
  return MIN_ACTION_ITEMS;
}

/**
 * Get the list of required action item fields
 */
export function getRequiredActionItemFields(): readonly string[] {
  return REQUIRED_ACTION_ITEM_FIELDS;
}
