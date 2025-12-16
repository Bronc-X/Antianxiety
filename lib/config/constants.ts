// Constants (ASCII only)
export const USER_ROLES = { ADMIN: 'admin', USER: 'user' } as const;

export const AI_ROLES = { USER: 'user', ASSISTANT: 'assistant', SYSTEM: 'system' } as const;

export const HABIT_CONSTANTS = {
  BELIEF_SCORE_MIN: 1,
  BELIEF_SCORE_MAX: 10,
  BELIEF_SCORE_DEFAULT: 5,
  MIN_RESISTANCE_LEVEL_MIN: 1,
  MIN_RESISTANCE_LEVEL_MAX: 5,
} as const;

export const HEALTH_METRICS = {
  STRESS_LEVEL_MIN: 1,
  STRESS_LEVEL_MAX: 10,
  ENERGY_LEVEL_MIN: 1,
  ENERGY_LEVEL_MAX: 10,
  BODY_FUNCTION_SCORE_MIN: 0,
  BODY_FUNCTION_SCORE_MAX: 100,
  BODY_FUNCTION_SCORE_DEFAULT: 0,
  IMPORTANCE_MIN: 1,
  IMPORTANCE_MAX: 10,
  IMPORTANCE_DEFAULT: 5,
} as const;

export const LANGUAGES = { EN: 'en', ZH: 'zh' } as const;

export const API_CONSTANTS = {
  CLAUDE_API_BASE_URL: process.env.ANTHROPIC_API_BASE || 'https://api.anthropic.com/v1/messages',
  CLAUDE_MODEL: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
  CLAUDE_MODEL_FALLBACK: process.env.AI_MODEL_FALLBACK || 'claude-3-5-haiku-20241022',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  CLAUDE_TEMPERATURE: 0.7,
  CLAUDE_MAX_TOKENS: 2000,
  CONVERSATION_HISTORY_LIMIT: 10,
} as const;

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

export const REMINDER_TYPES = {
  HABIT_PROMPT: 'habit_prompt',
  STRESS_CHECK: 'stress_check',
  EXERCISE_REMINDER: 'exercise_reminder',
} as const;

export const MEMORY_TYPES = {
  PREFERENCE: 'preference',
  PATTERN: 'pattern',
  INSIGHT: 'insight',
} as const;

export const RELEVANCE_THRESHOLD = 4.5;

export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm',
} as const;
