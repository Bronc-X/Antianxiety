/**
 * AI Model Configuration
 * 统一管理 AI 模型配置，支持优先级和 fallback
 * 
 * 中转站模型列表（按优先级）：
 * Gemini 现有可用模型（按优先级）：
 * 1. gemini-3-pro-preview-thinking
 * 2. gemini-3-pro-preview-11-2025-thinking
 * 3. gemini-3-pro-preview
 * 4. gemini-3-pro-preview-11-2025
 * 5. text-embedding-3-small - Embedding 专用
 * 
 * @module lib/ai/model-config
 */

import { createOpenAI } from '@ai-sdk/openai';

// ============================================
// Model Definitions
// ============================================

export const AI_MODELS = {
  // Gemini 系列（如可用）
  GEMINI_PRO_THINKING: 'gemini-3-pro-preview-thinking',
  GEMINI_PRO_THINKING_11_2025: 'gemini-3-pro-preview-11-2025-thinking',
  GEMINI_PRO: 'gemini-3-pro-preview',
  GEMINI_PRO_11_2025: 'gemini-3-pro-preview-11-2025',

  // Claude / GPT / 其他兼容模型（AICan 已知可用）
  CLAUDE_CODE: 'claude-code-4-5-20251022',
  CLAUDE_OPUS: 'claude-opus-4-5-20251101',
  CLAUDE_SONNET: 'claude-sonnet-4-20250514',
  GPT_MEDIUM: 'gpt-5.1-medium',
  DEEPSEEK: 'deepseek-v3.2-exp',
  GROK_FAST: 'grok-4.1-fast',

  // Embedding 专用
  EMBEDDING: 'text-embedding-3-small',
} as const;

export type AIModelName = typeof AI_MODELS[keyof typeof AI_MODELS];

// ============================================
// Model Priority Lists
// ============================================

/**
 * 聊天/对话模型优先级（Gemini 系列）
 */
export const CHAT_MODEL_PRIORITY: AIModelName[] = [
  // 尝试 Gemini
  AI_MODELS.GEMINI_PRO_THINKING,
  AI_MODELS.GEMINI_PRO_THINKING_11_2025,
  AI_MODELS.GEMINI_PRO,
  AI_MODELS.GEMINI_PRO_11_2025,
  // 回退到已验证可用的通道
  AI_MODELS.CLAUDE_CODE,
  AI_MODELS.CLAUDE_OPUS,
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.GPT_MEDIUM,
  AI_MODELS.DEEPSEEK,
  AI_MODELS.GROK_FAST,
];

/**
 * 复杂推理模型优先级（Gemini 系列）
 */
export const REASONING_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.GEMINI_PRO_THINKING,
  AI_MODELS.GEMINI_PRO_THINKING_11_2025,
  AI_MODELS.GEMINI_PRO,
  AI_MODELS.GEMINI_PRO_11_2025,
  AI_MODELS.CLAUDE_CODE,
  AI_MODELS.CLAUDE_OPUS,
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.GPT_MEDIUM,
  AI_MODELS.DEEPSEEK,
  AI_MODELS.GROK_FAST,
];

/**
 * 快速响应模型优先级（沿用相同优先级）
 */
export const FAST_MODEL_PRIORITY: AIModelName[] = [
  AI_MODELS.GEMINI_PRO,
  AI_MODELS.GEMINI_PRO_11_2025,
  AI_MODELS.GEMINI_PRO_THINKING,
  AI_MODELS.GEMINI_PRO_THINKING_11_2025,
  AI_MODELS.CLAUDE_CODE,
  AI_MODELS.GROK_FAST,
  AI_MODELS.DEEPSEEK,
  AI_MODELS.GPT_MEDIUM,
];

// ============================================
// OpenAI Compatible Client
// ============================================

/**
 * 创建 OpenAI 兼容客户端（中转站）
 */
const RAW_API_BASE = process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1/chat/completions';
const NORMALIZED_API_BASE = RAW_API_BASE.replace(/\/chat\/completions$/, '');

export function createAIClient() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: NORMALIZED_API_BASE,
    compatibility: 'strict',
  });
}

// 导出预配置的客户端
export const aiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: NORMALIZED_API_BASE,
  compatibility: 'strict',
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

// ============================================
// Logging Helpers
// ============================================

/**
 * 打印模型调用日志
 */
export function logModelCall(model: string, useCase: string) {
  console.log(`🤖 AI 调用: ${model} (${useCase})`);
  console.log(`📍 API Base: ${process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1'}`);
}
