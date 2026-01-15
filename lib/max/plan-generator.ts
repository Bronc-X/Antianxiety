/**
 * AI Plan Generator for Max Plan Creation
 * 
 * 使用 DeepSeek/Gemini 生成个性化健康计划
 * 集成 HRV 数据和用户画像
 * 
 * @module lib/max/plan-generator
 */

import type {
  PlanItemDraft,
  AggregatedPlanData,
  DifficultyLevel,
  PlanCategory,
  HrvData,
} from '@/types/max-plan';

// ============================================
// 常量定义
// ============================================

/** 计划项数量范围 */
export const MIN_PLAN_ITEMS = 4;
export const MAX_PLAN_ITEMS = 6;

/** 支持的 AI 模型 */
export type AIModel = 'deepseek' | 'gemini';

// AICanAPI 中转站配置
const AICANAPI_BASE = 'https://aicanapi.com/v1';
const DEEPSEEK_MODEL = 'deepseek-v3.2-exp';
const GEMINI_MODEL = 'gemini-3-flash-preview';

// ============================================
// Prompt 模板
// ============================================

const SYSTEM_PROMPT_ZH = `你是 Max，一位温暖、专业的健康顾问。你的任务是根据用户的健康数据生成个性化的训练计划。

## 核心原则
1. 使用温暖、鼓励的语调，像朋友一样交流
2. 避免医疗化语言，使用"生物电压调节"而非"治疗焦虑"
3. 确保建议可执行且循序渐进
4. 每个建议都要有科学依据
5. **重要**：根据用户的实际情况调整难度和强度
   - 如果用户压力大/睡眠差/精力低，给出更温和、易执行的建议
   - 如果用户状态良好，可以给出更有挑战性的建议
6. **重要**：针对用户的具体问题给出针对性建议
   - 睡眠问题 → 睡眠相关建议
   - 焦虑紧张 → 压力管理建议
   - 疲劳乏力 → 精力恢复建议
   - 情绪低落 → 心理调节建议

## 难度说明
- easy: 每天5-10分钟，无需特殊准备
- medium: 每天15-30分钟，需要一定坚持
- hard: 需要较大改变生活习惯，或需要专业指导

## 输出要求
生成 3-5 个行动项，每个包含：
- title: 简短标题（10字以内）
- action: 具体行动描述（50字以内），要具体到时间、频率、方法
- rationale: 科学依据（30字以内）
- difficulty: easy/medium/hard（根据用户状态调整）
- category: sleep/stress/fitness/nutrition/mental/habits

请以 JSON 数组格式输出，不要包含其他文字。`;

const SYSTEM_PROMPT_EN = `You are Max, a warm and professional health consultant. Your task is to generate personalized training plans based on user health data.

## Core Principles
1. Use warm, encouraging tone, like talking to a friend
2. Avoid clinical language, use "bio-voltage regulation" instead of "treating anxiety"
3. Ensure recommendations are actionable and progressive
4. Every suggestion should have scientific backing
5. **Important**: Adjust difficulty based on user's actual condition
   - If user has high stress/poor sleep/low energy, give gentler, easier suggestions
   - If user is in good condition, can give more challenging suggestions
6. **Important**: Give targeted suggestions for specific issues
   - Sleep issues → sleep-related suggestions
   - Anxiety → stress management suggestions
   - Fatigue → energy recovery suggestions
   - Low mood → mental health suggestions

## Difficulty Levels
- easy: 5-10 minutes daily, no special preparation needed
- medium: 15-30 minutes daily, requires some commitment
- hard: Requires significant lifestyle changes or professional guidance

## Output Requirements
Generate 3-5 action items, each containing:
- title: Short title (under 10 words)
- action: Specific action description (under 50 words), be specific about time, frequency, method
- rationale: Scientific basis (under 30 words)
- difficulty: easy/medium/hard (adjust based on user condition)
- category: sleep/stress/fitness/nutrition/mental/habits

Output as JSON array only, no other text.`;

// ============================================
// 核心函数
// ============================================

/**
 * 生成个性化计划 - 使用 AICanAPI 中转站
 */
export async function generatePlan(
  data: AggregatedPlanData,
  userResponses: Record<string, string>,
  language: 'zh' | 'en' = 'zh',
  model: AIModel = 'deepseek'
): Promise<PlanItemDraft[]> {
  // 检查 OPENAI_API_KEY（用于 AICanAPI 中转站）
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('[PlanGenerator] ========== AI Plan Generation Start ==========');
  console.log('[PlanGenerator] API Key configured:', !!apiKey);
  console.log('[PlanGenerator] User responses:', JSON.stringify(userResponses));
  
  if (!apiKey) {
    console.log('[PlanGenerator] ❌ No OPENAI_API_KEY, using fallback plan');
    return generateFallbackPlan(data, userResponses, language);
  }

  // 构建用户数据摘要
  const userDataSummary = buildUserDataSummary(data, userResponses, language);
  console.log('[PlanGenerator] User data summary:\n', userDataSummary);
  
  // 构建 prompt
  const systemPrompt = language === 'zh' ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;
  const userPrompt = buildUserPrompt(userDataSummary, language);

  // 优先尝试传入模型，然后回退到默认顺序
  const modelsToTry: AIModel[] = [model, 'deepseek', 'gemini'].filter(
    (value, index, self) => self.indexOf(value) === index
  );
  
  for (const currentModel of modelsToTry) {
    try {
      console.log(`[PlanGenerator] 🚀 Trying model: ${currentModel}`);
      
      const response = await callAICanAPI(systemPrompt, userPrompt, currentModel, apiKey);
      console.log('[PlanGenerator] ✅ AI response received, length:', response.length);
      console.log('[PlanGenerator] AI raw response:', response.substring(0, 500));
      
      // 解析响应
      const items = parseAIResponse(response);
      console.log('[PlanGenerator] Parsed items count:', items.length);
      
      // 验证并规范化
      const validatedItems = validateAndNormalize(items);
      
      // 如果 AI 返回的项目太少，用备用计划补充
      if (validatedItems.length < MIN_PLAN_ITEMS) {
        console.log('[PlanGenerator] AI returned too few items, supplementing with fallback');
        const fallbackItems = generateFallbackPlan(data, userResponses, language);
        const combined = [...validatedItems];
        for (const fb of fallbackItems) {
          if (combined.length >= MAX_PLAN_ITEMS) break;
          if (!combined.some(c => c.category === fb.category && c.title === fb.title)) {
            combined.push(fb);
          }
        }
        return combined.slice(0, MAX_PLAN_ITEMS);
      }
      
      // 如果 HRV 数据可用，确保至少一个项目引用 HRV
      if (data.hrv && data.hrv.avgHrv > 0) {
        ensureHrvIntegration(validatedItems, data.hrv, language);
      }
      
      console.log('[PlanGenerator] ========== AI Plan Generation Success ==========');
      return validatedItems;
      
    } catch (error) {
      console.error(`[PlanGenerator] ❌ ${currentModel} failed:`, error);
      // 继续尝试下一个模型
    }
  }
  
  // 所有模型都失败，使用备用计划
  console.log('[PlanGenerator] ❌ All AI models failed, using fallback plan');
  return generateFallbackPlan(data, userResponses, language);
}

/**
 * 调用 AICanAPI 中转站
 */
async function callAICanAPI(
  systemPrompt: string,
  userPrompt: string,
  model: AIModel,
  apiKey: string
): Promise<string> {
  const modelName = model === 'deepseek' ? DEEPSEEK_MODEL : GEMINI_MODEL;
  const endpoint = `${AICANAPI_BASE}/chat/completions`;
  
  console.log(`[PlanGenerator] Calling AICanAPI: ${endpoint}`);
  console.log(`[PlanGenerator] Model: ${modelName}`);
  
  const startTime = Date.now();
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log(`[PlanGenerator] API response time: ${elapsed}ms, status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[PlanGenerator] API error response:`, errorText);
    throw new Error(`AICanAPI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  console.log(`[PlanGenerator] API usage:`, data.usage);
  
  return content;
}

/**
 * 构建用户数据摘要
 */
function buildUserDataSummary(
  data: AggregatedPlanData,
  userResponses: Record<string, string>,
  language: 'zh' | 'en'
): string {
  const parts: string[] = [];

  // 用户画像
  if (data.profile) {
    if (data.profile.age) {
      parts.push(language === 'zh' ? `年龄: ${data.profile.age}岁` : `Age: ${data.profile.age}`);
    }
    if (data.profile.primaryConcern) {
      parts.push(language === 'zh' 
        ? `主要关注: ${data.profile.primaryConcern}` 
        : `Primary concern: ${data.profile.primaryConcern}`);
    }
    if (data.profile.healthGoals && data.profile.healthGoals.length > 0) {
      const goals = data.profile.healthGoals.map(g => g.goal_text).join(', ');
      parts.push(language === 'zh' ? `健康目标: ${goals}` : `Health goals: ${goals}`);
    }
  }

  // 校准数据
  if (data.calibration) {
    parts.push(language === 'zh'
      ? `睡眠: ${data.calibration.sleepHours}小时, 质量${data.calibration.sleepQuality}/10`
      : `Sleep: ${data.calibration.sleepHours}h, quality ${data.calibration.sleepQuality}/10`);
    parts.push(language === 'zh'
      ? `压力: ${data.calibration.stressLevel}/10, 精力: ${data.calibration.energyLevel}/10`
      : `Stress: ${data.calibration.stressLevel}/10, Energy: ${data.calibration.energyLevel}/10`);
  }

  // HRV 数据
  if (data.hrv && data.hrv.avgHrv > 0) {
    const trendLabel = {
      improving: language === 'zh' ? '上升' : 'improving',
      stable: language === 'zh' ? '稳定' : 'stable',
      declining: language === 'zh' ? '下降' : 'declining',
    }[data.hrv.hrvTrend];
    
    parts.push(language === 'zh'
      ? `HRV: ${data.hrv.avgHrv}ms (${trendLabel}), 静息心率: ${data.hrv.restingHr}bpm`
      : `HRV: ${data.hrv.avgHrv}ms (${trendLabel}), Resting HR: ${data.hrv.restingHr}bpm`);
  }

  // 用户回答 - 更详细的解析
  if (Object.keys(userResponses).length > 0) {
    parts.push(language === 'zh' ? '\n【用户问答反馈】' : '\n[User Q&A Feedback]');
    
    // 解析每个回答
    for (const [key, value] of Object.entries(userResponses)) {
      const label = getQuestionLabel(key, language);
      const valueLabel = getValueLabel(key, value, language);
      parts.push(`- ${label}: ${valueLabel}`);
    }
  }

  return parts.join('\n');
}

/**
 * 获取问题标签
 */
function getQuestionLabel(key: string, language: 'zh' | 'en'): string {
  const labels: Record<string, Record<'zh' | 'en', string>> = {
    concern: { zh: '主要困扰', en: 'Main concern' },
    sleep: { zh: '睡眠状况', en: 'Sleep quality' },
    stress: { zh: '压力水平', en: 'Stress level' },
    energy: { zh: '精力状态', en: 'Energy level' },
    mood: { zh: '情绪状态', en: 'Mood' },
    goal: { zh: '改善目标', en: 'Improvement goal' },
    lifestyle: { zh: '作息规律', en: 'Daily routine' },
    exercise: { zh: '运动习惯', en: 'Exercise habit' },
  };
  return labels[key]?.[language] || key;
}

/**
 * 获取回答值的可读标签
 */
function getValueLabel(key: string, value: string, language: 'zh' | 'en'): string {
  const valueLabels: Record<string, Record<string, Record<'zh' | 'en', string>>> = {
    concern: {
      sleep_issue: { zh: '睡眠问题', en: 'Sleep issues' },
      anxiety: { zh: '焦虑紧张', en: 'Anxiety' },
      fatigue: { zh: '疲劳乏力', en: 'Fatigue' },
      low_mood: { zh: '情绪低落', en: 'Low mood' },
      none: { zh: '暂时没有', en: 'None' },
    },
    sleep: {
      good: { zh: '睡得很好', en: 'Sleeping well' },
      okay: { zh: '还可以', en: 'Okay' },
      hard_to_fall_asleep: { zh: '难以入睡', en: 'Hard to fall asleep' },
      wake_up_often: { zh: '容易醒来', en: 'Wake up often' },
      not_enough: { zh: '睡眠不足', en: 'Not enough sleep' },
    },
    stress: {
      low: { zh: '很轻松', en: 'Very relaxed' },
      mild: { zh: '有一点', en: 'Mild' },
      moderate: { zh: '中等压力', en: 'Moderate' },
      high: { zh: '压力较大', en: 'High stress' },
      very_high: { zh: '压力很大', en: 'Very high stress' },
    },
    energy: {
      high: { zh: '精力充沛', en: 'Full of energy' },
      good: { zh: '还不错', en: 'Pretty good' },
      moderate: { zh: '一般', en: 'Moderate' },
      low: { zh: '有点累', en: 'A bit tired' },
      very_low: { zh: '很疲惫', en: 'Very tired' },
    },
    mood: {
      great: { zh: '很好', en: 'Great' },
      good: { zh: '不错', en: 'Good' },
      neutral: { zh: '一般', en: 'Neutral' },
      low: { zh: '有点低落', en: 'A bit down' },
      bad: { zh: '不太好', en: 'Not good' },
    },
    goal: {
      improve_sleep: { zh: '改善睡眠', en: 'Improve sleep' },
      reduce_stress: { zh: '减轻压力', en: 'Reduce stress' },
      boost_energy: { zh: '提升精力', en: 'Boost energy' },
      stabilize_mood: { zh: '稳定情绪', en: 'Stabilize mood' },
      build_habits: { zh: '建立习惯', en: 'Build habits' },
    },
    lifestyle: {
      regular: { zh: '规律作息', en: 'Regular schedule' },
      late_nights: { zh: '经常熬夜', en: 'Often stay up late' },
      irregular: { zh: '作息不规律', en: 'Irregular schedule' },
      early_bird: { zh: '早睡早起', en: 'Early bird' },
      night_owl: { zh: '夜猫子', en: 'Night owl' },
    },
    exercise: {
      daily: { zh: '每天运动', en: 'Daily exercise' },
      weekly: { zh: '每周几次', en: 'Few times a week' },
      occasional: { zh: '偶尔运动', en: 'Occasionally' },
      rarely: { zh: '很少运动', en: 'Rarely' },
      never: { zh: '几乎不运动', en: 'Almost never' },
    },
  };
  
  return valueLabels[key]?.[value]?.[language] || value;
}

/**
 * 构建用户 prompt
 */
function buildUserPrompt(userDataSummary: string, language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return `根据以下用户数据，生成个性化健康计划：

${userDataSummary}

请生成 3-5 个具体可执行的行动项，以 JSON 数组格式输出。`;
  }
  
  return `Based on the following user data, generate a personalized health plan:

${userDataSummary}

Please generate 3-5 specific actionable items in JSON array format.`;
}

// 注意：旧的 callAI、callDeepSeek、callGemini 函数已移除
// 现在统一使用 callAICanAPI 通过中转站调用 AI

/**
 * 解析 AI 响应
 */
function parseAIResponse(response: string): PlanItemDraft[] {
  // 尝试提取 JSON 数组
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error('Parsed result is not an array');
  }

  return parsed.map((item, index) => ({
    id: `plan_item_${Date.now()}_${index}`,
    title: item.title || '',
    action: item.action || '',
    rationale: item.rationale || '',
    difficulty: normalizeDifficulty(item.difficulty),
    category: normalizeCategory(item.category),
  }));
}

/**
 * 规范化难度
 */
function normalizeDifficulty(value: unknown): DifficultyLevel {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'easy' || lower === '简单') return 'easy';
    if (lower === 'hard' || lower === '困难') return 'hard';
  }
  return 'medium';
}

/**
 * 规范化类别
 */
function normalizeCategory(value: unknown): PlanCategory {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (['sleep', '睡眠'].includes(lower)) return 'sleep';
    if (['stress', '压力'].includes(lower)) return 'stress';
    if (['fitness', '运动', '健身'].includes(lower)) return 'fitness';
    if (['nutrition', '营养', '饮食'].includes(lower)) return 'nutrition';
    if (['mental', '心理', '情绪'].includes(lower)) return 'mental';
  }
  return 'habits';
}

/**
 * 验证并规范化计划项
 */
export function validateAndNormalize(items: PlanItemDraft[]): PlanItemDraft[] {
  // 过滤无效项
  const validItems = items.filter(item => 
    item.title && item.title.length > 0 &&
    item.action && item.action.length > 0 &&
    item.rationale && item.rationale.length > 0
  );

  // 确保数量在范围内
  if (validItems.length < MIN_PLAN_ITEMS) {
    // 如果项目太少，返回原始项目（后续会用备用计划补充）
    return validItems;
  }

  return validItems.slice(0, MAX_PLAN_ITEMS);
}

/**
 * 确保 HRV 数据集成
 */
function ensureHrvIntegration(
  items: PlanItemDraft[],
  hrv: HrvData,
  language: 'zh' | 'en'
): void {
  // 检查是否已有 HRV 相关内容
  const hrvKeywords = ['HRV', 'hrv', '心率变异', '自主神经', 'heart rate variability'];
  const hasHrvContent = items.some(item => 
    hrvKeywords.some(keyword => 
      item.rationale.includes(keyword) || item.action.includes(keyword)
    )
  );

  if (!hasHrvContent && items.length > 0) {
    // 在第一个项目的 rationale 中添加 HRV 参考
    const hrvNote = language === 'zh'
      ? `（基于您的 HRV ${hrv.avgHrv}ms 数据）`
      : `(Based on your HRV ${hrv.avgHrv}ms data)`;
    
    items[0].rationale = `${items[0].rationale} ${hrvNote}`;
  }
}

/**
 * 生成备用计划 - 根据用户回答生成针对性建议
 */
export function generateFallbackPlan(
  data: AggregatedPlanData,
  userResponses: Record<string, string>,
  language: 'zh' | 'en'
): PlanItemDraft[] {
  const items: PlanItemDraft[] = [];
  const timestamp = Date.now();

  // 分析用户状态
  const concern = userResponses.concern || '';
  const sleepStatus = userResponses.sleep || '';
  const stressLevel = userResponses.stress || '';
  const energyLevel = userResponses.energy || '';
  const goal = userResponses.goal || '';
  const lifestyle = userResponses.lifestyle || '';
  const exercise = userResponses.exercise || '';

  // 判断用户整体状态
  const isHighStress = ['high', 'very_high'].includes(stressLevel);
  const isLowEnergy = ['low', 'very_low'].includes(energyLevel);
  const hasSleepIssue = ['hard_to_fall_asleep', 'wake_up_often', 'not_enough'].includes(sleepStatus);
  const hasIrregularSchedule = ['late_nights', 'irregular'].includes(lifestyle);
  const isLowExercise = ['rarely', 'never'].includes(exercise);

  // 根据主要困扰添加针对性建议
  if (concern === 'sleep_issue' || hasSleepIssue || goal === 'improve_sleep') {
    items.push({
      id: `plan_item_${timestamp}_sleep`,
      title: language === 'zh' ? '睡眠优化' : 'Sleep Optimization',
      action: language === 'zh'
        ? '睡前1小时关闭电子设备，进行10分钟轻度拉伸，保持卧室温度18-20°C'
        : 'Turn off devices 1 hour before bed, do 10 min light stretching, keep bedroom at 18-20°C',
      rationale: language === 'zh'
        ? '减少蓝光干扰，促进褪黑素分泌，优化睡眠环境'
        : 'Reduces blue light, promotes melatonin, optimizes sleep environment',
      difficulty: 'medium',
      category: 'sleep',
    });
  }

  if (concern === 'anxiety' || isHighStress || goal === 'reduce_stress') {
    items.push({
      id: `plan_item_${timestamp}_stress`,
      title: language === 'zh' ? '压力释放' : 'Stress Release',
      action: language === 'zh'
        ? '每天进行2次5分钟箱式呼吸（吸4秒-屏4秒-呼4秒-屏4秒），早晚各一次'
        : 'Practice box breathing twice daily (inhale 4s-hold 4s-exhale 4s-hold 4s), morning and evening',
      rationale: language === 'zh'
        ? '激活迷走神经，快速降低皮质醇水平'
        : 'Activates vagus nerve, rapidly lowers cortisol',
      difficulty: isHighStress ? 'easy' : 'medium',
      category: 'stress',
    });
  }

  if (concern === 'fatigue' || isLowEnergy || goal === 'boost_energy') {
    items.push({
      id: `plan_item_${timestamp}_energy`,
      title: language === 'zh' ? '精力恢复' : 'Energy Recovery',
      action: language === 'zh'
        ? '每天午后进行20分钟户外散步，接触自然光，配合深呼吸'
        : 'Take a 20-minute outdoor walk in the afternoon, get natural light, with deep breathing',
      rationale: language === 'zh'
        ? '自然光调节昼夜节律，轻度运动提升线粒体功能'
        : 'Natural light regulates circadian rhythm, light exercise boosts mitochondria',
      difficulty: 'easy',
      category: 'fitness',
    });
  }

  if (concern === 'low_mood' || goal === 'stabilize_mood') {
    items.push({
      id: `plan_item_${timestamp}_mood`,
      title: language === 'zh' ? '情绪调节' : 'Mood Regulation',
      action: language === 'zh'
        ? '每晚睡前写3件今天感恩的事，并记录1个明天期待的小事'
        : 'Write 3 things you are grateful for before bed, and 1 small thing to look forward to tomorrow',
      rationale: language === 'zh'
        ? '感恩练习提升多巴胺和血清素，建立积极心理模式'
        : 'Gratitude boosts dopamine and serotonin, builds positive mindset',
      difficulty: 'easy',
      category: 'mental',
    });
  }

  // 根据生活方式添加建议
  if (hasIrregularSchedule) {
    items.push({
      id: `plan_item_${timestamp}_routine`,
      title: language === 'zh' ? '作息调整' : 'Routine Adjustment',
      action: language === 'zh'
        ? '设定固定起床时间（即使周末也保持），每天同一时间吃早餐'
        : 'Set a fixed wake-up time (even on weekends), eat breakfast at the same time daily',
      rationale: language === 'zh'
        ? '稳定的作息是调节生物钟的基础'
        : 'Consistent routine is the foundation for regulating circadian rhythm',
      difficulty: 'medium',
      category: 'habits',
    });
  }

  if (isLowExercise && !items.some(i => i.category === 'fitness')) {
    items.push({
      id: `plan_item_${timestamp}_exercise`,
      title: language === 'zh' ? '温和运动' : 'Gentle Exercise',
      action: language === 'zh'
        ? '每天进行10分钟简单拉伸或瑜伽，从最基础的动作开始'
        : 'Do 10 minutes of simple stretching or yoga daily, start with basic movements',
      rationale: language === 'zh'
        ? '低强度运动适合初学者，逐步建立运动习惯'
        : 'Low-intensity exercise suits beginners, gradually builds exercise habit',
      difficulty: 'easy',
      category: 'fitness',
    });
  }

  // 如果目标是建立习惯
  if (goal === 'build_habits') {
    items.push({
      id: `plan_item_${timestamp}_habit`,
      title: language === 'zh' ? '习惯堆叠' : 'Habit Stacking',
      action: language === 'zh'
        ? '选择一个现有习惯（如刷牙），在其后立即进行新习惯（如2分钟冥想）'
        : 'Choose an existing habit (like brushing teeth), immediately follow with new habit (like 2 min meditation)',
      rationale: language === 'zh'
        ? '利用已有神经通路，降低新习惯的启动阻力'
        : 'Uses existing neural pathways, reduces resistance to new habits',
      difficulty: 'easy',
      category: 'habits',
    });
  }

  // 确保至少有 MIN_PLAN_ITEMS 个项目
  while (items.length < MIN_PLAN_ITEMS) {
    // 添加基础呼吸练习
    if (!items.some(i => i.title.includes('呼吸') || i.title.includes('Breathing'))) {
      items.push({
        id: `plan_item_${timestamp}_breath`,
        title: language === 'zh' ? '晨间呼吸' : 'Morning Breathing',
        action: language === 'zh'
          ? '每天早起后进行5分钟腹式呼吸，专注于呼吸的感觉'
          : 'Practice 5 minutes of diaphragmatic breathing after waking up, focus on the sensation',
        rationale: language === 'zh'
          ? '激活副交感神经，为一天设定平静基调'
          : 'Activates parasympathetic system, sets a calm tone for the day',
        difficulty: 'easy',
        category: 'mental',
      });
      continue;
    }

    // 添加水分补充
    if (!items.some(i => i.title.includes('水分') || i.title.includes('Hydration'))) {
      items.push({
        id: `plan_item_${timestamp}_hydration`,
        title: language === 'zh' ? '水分补充' : 'Hydration',
        action: language === 'zh'
          ? '早起后立即喝一杯温水，全天保持8杯水的摄入'
          : 'Drink a glass of warm water immediately after waking, maintain 8 glasses throughout the day',
        rationale: language === 'zh'
          ? '充足水分支持代谢功能，提升精力和专注力'
          : 'Adequate hydration supports metabolism, boosts energy and focus',
        difficulty: 'easy',
        category: 'nutrition',
      });
      continue;
    }

    // 添加感恩练习
    if (!items.some(i => i.title.includes('感恩') || i.title.includes('Gratitude'))) {
      items.push({
        id: `plan_item_${timestamp}_gratitude`,
        title: language === 'zh' ? '感恩记录' : 'Gratitude Journal',
        action: language === 'zh'
          ? '每晚睡前写下3件今天感恩的事，培养积极心态'
          : 'Write down 3 things you are grateful for before bed, cultivate positive mindset',
        rationale: language === 'zh'
          ? '感恩练习提升多巴胺和血清素水平'
          : 'Gratitude practice boosts dopamine and serotonin',
        difficulty: 'easy',
        category: 'mental',
      });
      continue;
    }

    // 添加户外活动
    if (!items.some(i => i.category === 'fitness')) {
      items.push({
        id: `plan_item_${timestamp}_outdoor`,
        title: language === 'zh' ? '户外散步' : 'Outdoor Walk',
        action: language === 'zh'
          ? '每天进行15-20分钟户外散步，接触自然光'
          : 'Take a 15-20 minute outdoor walk daily, get natural light exposure',
        rationale: language === 'zh'
          ? '自然光调节昼夜节律，轻度运动提升心情'
          : 'Natural light regulates circadian rhythm, light exercise boosts mood',
        difficulty: 'easy',
        category: 'fitness',
      });
      continue;
    }

    // 添加数字排毒
    if (!items.some(i => i.title.includes('数字') || i.title.includes('Digital'))) {
      items.push({
        id: `plan_item_${timestamp}_digital`,
        title: language === 'zh' ? '数字排毒' : 'Digital Detox',
        action: language === 'zh'
          ? '睡前1小时关闭手机和电脑，用阅读或拉伸代替'
          : 'Turn off phone and computer 1 hour before bed, replace with reading or stretching',
        rationale: language === 'zh'
          ? '减少蓝光干扰，促进褪黑素自然分泌'
          : 'Reduces blue light interference, promotes natural melatonin production',
        difficulty: 'medium',
        category: 'habits',
      });
      continue;
    }

    // 如果还不够，添加一个通用的
    items.push({
      id: `plan_item_${timestamp}_general_${items.length}`,
      title: language === 'zh' ? '正念时刻' : 'Mindful Moment',
      action: language === 'zh'
        ? '每天找3个时刻暂停30秒，深呼吸并感受当下'
        : 'Find 3 moments daily to pause for 30 seconds, breathe deeply and feel the present',
      rationale: language === 'zh'
        ? '微正念练习可以打断压力循环，恢复注意力'
        : 'Micro-mindfulness breaks stress cycles, restores attention',
      difficulty: 'easy',
      category: 'mental',
    });
  }

  // 如果有 HRV 数据，添加 HRV 相关建议
  if (data.hrv && data.hrv.avgHrv > 0) {
    ensureHrvIntegration(items, data.hrv, language);
  }

  return items.slice(0, MAX_PLAN_ITEMS);
}

/**
 * 验证计划完整性
 */
export function validatePlanCompleteness(items: PlanItemDraft[]): boolean {
  // 检查数量
  if (items.length < MIN_PLAN_ITEMS || items.length > MAX_PLAN_ITEMS) {
    return false;
  }

  // 检查每个项目的完整性
  for (const item of items) {
    if (!item.id || item.id.length === 0) return false;
    if (!item.title || item.title.length === 0) return false;
    if (!item.action || item.action.length === 0) return false;
    if (!item.rationale || item.rationale.length === 0) return false;
    if (!['easy', 'medium', 'hard'].includes(item.difficulty)) return false;
    if (!['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'].includes(item.category)) return false;
  }

  return true;
}

/**
 * 检查是否包含 HRV 相关内容
 */
export function hasHrvContent(items: PlanItemDraft[]): boolean {
  const hrvKeywords = ['HRV', 'hrv', '心率变异', '自主神经', 'heart rate variability', 'ms'];
  
  return items.some(item =>
    hrvKeywords.some(keyword =>
      item.rationale.toLowerCase().includes(keyword.toLowerCase()) ||
      item.action.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}
