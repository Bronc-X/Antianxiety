/**
 * 常量配置文件
 * 统一管理所有魔术字符串和数字，避免硬编码
 */

/**
 * 用户角色常量
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

/**
 * AI 对话角色常量
 */
export const AI_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

/**
 * 习惯相关常量
 */
export const HABIT_CONSTANTS = {
  // 信念分数范围
  BELIEF_SCORE_MIN: 1,
  BELIEF_SCORE_MAX: 10,
  BELIEF_SCORE_DEFAULT: 5,
  
  // 最小阻力等级范围
  MIN_RESISTANCE_LEVEL_MIN: 1,
  MIN_RESISTANCE_LEVEL_MAX: 5,
} as const;

/**
 * 健康指标常量
 */
export const HEALTH_METRICS = {
  // 压力水平范围
  STRESS_LEVEL_MIN: 1,
  STRESS_LEVEL_MAX: 10,
  
  // 精力水平范围
  ENERGY_LEVEL_MIN: 1,
  ENERGY_LEVEL_MAX: 10,
  
  // 身体机能分数范围
  BODY_FUNCTION_SCORE_MIN: 0,
  BODY_FUNCTION_SCORE_MAX: 100,
  BODY_FUNCTION_SCORE_DEFAULT: 0,
  
  // 重要性评分范围（用于 AI 记忆）
  IMPORTANCE_MIN: 1,
  IMPORTANCE_MAX: 10,
  IMPORTANCE_DEFAULT: 5,
} as const;

/**
 * 语言常量
 */
export const LANGUAGES = {
  EN: 'en',
  ZH: 'zh',
} as const;

/**
 * API 相关常量
 */
export const API_CONSTANTS = {
  // AI API配置
  CLAUDE_API_BASE_URL: 'https://api.anthropic.com/v1',
  CLAUDE_MODEL: 'claude-sonnet-4-5-20250929', // 使用中转站的Claude Sonnet 4.5
  CLAUDE_TEMPERATURE: 0.7,
  CLAUDE_MAX_TOKENS: 2000,
  
  // 对话历史保留数量
  CONVERSATION_HISTORY_LIMIT: 10,
} as const;

/**
 * 数据库表名常量
 */
export const DB_TABLES = {
  PROFILES: 'profiles',
  USER_HABITS: 'user_habits',
  HABIT_LOG: 'habit_log',
  HABIT_COMPLETIONS: 'habit_completions',
  USER_METRICS: 'user_metrics',
  AI_MEMORY: 'ai_memory',
  AI_MEMORIES: 'ai_memories',
  AI_CONVERSATIONS: 'ai_conversations',
  AI_REMINDERS: 'ai_reminders',
  CONTENT_FEED_VECTORS: 'content_feed_vectors',
  DAILY_WELLNESS_LOGS: 'daily_wellness_logs',
} as const;

/**
 * 提醒类型常量
 */
export const REMINDER_TYPES = {
  HABIT_PROMPT: 'habit_prompt',
  STRESS_CHECK: 'stress_check',
  EXERCISE_REMINDER: 'exercise_reminder',
} as const;

/**
 * 记忆类型常量
 */
export const MEMORY_TYPES = {
  PREFERENCE: 'preference',
  PATTERN: 'pattern',
  INSIGHT: 'insight',
} as const;

/**
 * 相关性评分阈值
 */
export const RELEVANCE_THRESHOLD = 4.5; // 4.5/5.0

/**
 * 日期时间格式常量
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm',
} as const;

