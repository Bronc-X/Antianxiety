/**
 * AI Model Configuration
 * 统一管理 AI 模型配置，支持优先级和 fallback
 *
 * 中转站 (aicanapi.com) 可用模型:
 * - claude-sonnet-4-5-20250929
 * - claude-sonnet-4-5-20250929-thinking
 * - deepseek-v3.1-thinking
 * - gemini-3-pro-preview-11-2025-thinking
 * - deepseek-v3.2-exp
 *
 * @module lib/ai/model-config
 */

import { createOpenAI } from '@ai-sdk/openai';

// ============================================
// Model Definitions
// ============================================

export const AI_MODELS = {
  // Claude 系列
  CLAUDE_SONNET: 'claude-sonnet-4-20250514', // 🔑 非 thinking 版本，速度快
  CLAUDE_SONNET_THINKING: 'claude-sonnet-4-5-20250929-thinking',

  // Gemini 系列
  GEMINI_FLASH: 'gemini-3-flash-preview', // 🚀 最快的模型
  GEMINI_PRO_THINKING: 'gemini-3-pro-preview-11-2025-thinking',

  // DeepSeek 系列
  DEEPSEEK_V3_THINKING: 'deepseek-v3.1-thinking',
  DEEPSEEK_V3_EXP: 'deepseek-v3.2-exp',

  // Embedding 专用
  EMBEDDING: 'text-embedding-3-small',
} as const;

export type AIModelName = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// ============================================
// Model Priority Lists
// ============================================

/**
 * 聊天/对话模型优先级（平行选择，都可用）
 */
export const CHAT_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.DEEPSEEK_V3_EXP, // 🚀 首选稳定 (Substitute for Gemini)
  AI_MODELS.GEMINI_FLASH,
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.GEMINI_PRO_THINKING,
  AI_MODELS.DEEPSEEK_V3_THINKING,
];

/**
 * 复杂推理模型优先级
 * 🔑 症状评估等场景：优先用 deepseek，速度快
 */
export const REASONING_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.GEMINI_FLASH, // 暂用 Flash 保证稳定性，若需深度推理可切回
  AI_MODELS.DEEPSEEK_V3_EXP,
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.DEEPSEEK_V3_THINKING,
  AI_MODELS.CLAUDE_SONNET_THINKING,
];

/**
 * 快速响应模型优先级
 */
export const FAST_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.DEEPSEEK_V3_EXP, // 暂时统一为稳定可用模型
];

/**
 * 🆕 思考模式模型优先级 (深度推理)
 */
export const THINK_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.DEEPSEEK_V3_EXP, // 暂时统一为稳定可用模型
];

/**
 * 🆕 聊天模式类型
 */
export type ChatMode = 'fast' | 'think';

// ============================================
// OpenAI Compatible Client
// ============================================

/**
 * 创建 OpenAI 兼容客户端（中转站）
 */
const RAW_API_BASE =
  process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1';
// 确保 baseURL 不包含 /chat/completions
const NORMALIZED_API_BASE = RAW_API_BASE.replace(
  /\/chat\/completions$/,
  ''
).replace(/\/$/, '');

export function createAIClient() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: NORMALIZED_API_BASE,
  });
}

// 导出预配置的客户端
export const aiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: NORMALIZED_API_BASE,
});

// ============================================
// Model Selection Helpers
// ============================================

export type ModelUseCase = 'chat' | 'reasoning' | 'fast' | 'embedding';

/**
 * 根据用途获取推荐模型
 */
export function getModelForUseCase(useCase: ModelUseCase): AIModelName {
  switch (useCase) {
    case 'chat':
      return CHAT_MODEL_PRIORITY[0];
    case 'reasoning':
      return REASONING_MODEL_PRIORITY[0];
    case 'fast':
      return FAST_MODEL_PRIORITY[0];
    case 'embedding':
      return AI_MODELS.EMBEDDING;
    default:
      return CHAT_MODEL_PRIORITY[0];
  }
}

/**
 * 获取模型优先级列表
 */
export function getModelPriority(useCase: ModelUseCase): AIModelName[] {
  switch (useCase) {
    case 'chat':
      return CHAT_MODEL_PRIORITY;
    case 'reasoning':
      return REASONING_MODEL_PRIORITY;
    case 'fast':
      return FAST_MODEL_PRIORITY;
    case 'embedding':
      return [AI_MODELS.EMBEDDING];
    default:
      return CHAT_MODEL_PRIORITY;
  }
}

/**
 * 获取默认聊天模型
 */
export function getDefaultChatModel(): AIModelName {
  return getModelForUseCase('chat');
}

/**
 * 获取默认推理模型
 */
export function getDefaultReasoningModel(): AIModelName {
  return getModelForUseCase('reasoning');
}

/**
 * 获取默认快速模型
 */
export function getDefaultFastModel(): AIModelName {
  return getModelForUseCase('fast');
}

/**
 * 🆕 根据聊天模式获取模型
 * @param mode 'fast' | 'think'
 */
export function getModelForChatMode(mode: ChatMode): AIModelName {
  if (mode === 'think') {
    return THINK_MODEL_PRIORITY[0];
  }
  return FAST_MODEL_PRIORITY[0];
}

/**
 * 🆕 获取聊天模式的模型优先级列表
 */
export function getChatModePriority(mode: ChatMode): AIModelName[] {
  if (mode === 'think') {
    return THINK_MODEL_PRIORITY;
  }
  return FAST_MODEL_PRIORITY;
}

// ============================================
// Logging Helpers
// ============================================

/**
 * 打印模型调用日志
 */
export function logModelCall(model: string, useCase: string) {
  console.log(`🤖 AI 调用: ${model} (${useCase})`);
  console.log(`📍 API Base: ${NORMALIZED_API_BASE}`);
}
