/**
 * AI 记忆系统工具函数
 * 用于向量搜索和记忆存储
 */

import { createServerSupabaseClient } from './supabase-server';

// 相似度阈值：只返回相似度大于此值的记忆
const SIMILARITY_THRESHOLD = 0.7;

// 最大检索记忆数量
const MAX_MEMORIES = 10;

type EmbeddingProvider = {
  name: string;
  apiKey: string;
  apiUrl: string;
  model: string;
};

/**
 * 生成文本的向量嵌入
 * 支持 DeepSeek / OpenAI，并且当首选服务失败时自动回退
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const providers: EmbeddingProvider[] = [];

  if (deepseekApiKey) {
    providers.push({
      name: 'DeepSeek',
      apiKey: deepseekApiKey,
      apiUrl:
        process.env.DEEPSEEK_EMBEDDING_API_URL ||
        process.env.EMBEDDING_API_URL ||
        'https://api.deepseek.com/v1/embeddings',
      model:
        process.env.DEEPSEEK_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL || 'deepseek-embedding',
    });
  }

  if (openaiApiKey) {
    const openAiBase = process.env.OPENAI_API_BASE?.replace(/\/$/, '');
    providers.push({
      name: 'OpenAI',
      apiKey: openaiApiKey,
      apiUrl:
        process.env.OPENAI_EMBEDDING_API_URL ||
        (openAiBase ? `${openAiBase}/embeddings` : undefined) ||
        process.env.EMBEDDING_API_URL ||
        'https://api.openai.com/v1/embeddings',
      model:
        process.env.OPENAI_EMBEDDING_MODEL ||
        process.env.EMBEDDING_MODEL ||
        'text-embedding-3-small',
    });
  }

  if (providers.length === 0) {
    console.warn('DEEPSEEK_API_KEY 或 OPENAI_API_KEY 未设置，无法生成向量嵌入');
    return [];
  }

  for (const provider of providers) {
    const embedding = await requestEmbedding(provider, text);
    if (embedding.length > 0) {
      if (provider.name === 'OpenAI' && deepseekApiKey) {
        console.warn('DeepSeek 向量接口不可用，已自动回退到 OpenAI。');
      }
      return embedding;
    }
  }

  console.error('所有可用的向量提供商都不可用，无法生成向量嵌入');
  return [];
}

async function requestEmbedding(provider: EmbeddingProvider, text: string): Promise<number[]> {
  try {
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        input: text.substring(0, 8000),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        `[${provider.name}] 生成向量嵌入失败:`,
        response.status,
        error.substring(0, 200)
      );
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data?.data) && data.data[0]?.embedding) {
      return data.data[0].embedding;
    }

    console.error(`[${provider.name}] 返回结果缺少 embedding 字段`);
    return [];
  } catch (error) {
    console.error(`[${provider.name}] 生成向量嵌入异常:`, error);
    return [];
  }
}

/**
 * 从 ai_memory 表中检索相关历史记忆
 * 使用向量相似度搜索
 */
export async function retrieveMemories(
  userId: string,
  queryEmbedding: number[],
  limit: number = MAX_MEMORIES
): Promise<Array<{ content_text: string; role: string; created_at: string }>> {
  try {
    const supabase = await createServerSupabaseClient();

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    // 使用 pgvector 的相似度搜索
    // 注意：Supabase JS 客户端可能不支持直接的向量搜索
    // 我们需要使用 RPC 函数或原始 SQL
    const { data, error } = await supabase.rpc('match_ai_memories', {
      query_embedding: queryEmbedding,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      // 如果 RPC 函数不存在，使用备用方法：获取最近的记忆
      console.warn('向量搜索失败，使用备用方法:', error);
      return await retrieveRecentMemories(userId, limit);
    }

    return data || [];
  } catch (error) {
    console.error('检索记忆失败:', error);
    return [];
  }
}

/**
 * 备用方法：获取用户最近的记忆（不使用向量搜索）
 */
async function retrieveRecentMemories(
  userId: string,
  limit: number
): Promise<Array<{ content_text: string; role: string; created_at: string }>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ai_memory')
      .select('content_text, role, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取最近记忆失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('获取最近记忆异常:', error);
    return [];
  }
}

/**
 * 存储新的记忆到 ai_memory 表
 */
export async function storeMemory(
  userId: string,
  contentText: string,
  role: 'user' | 'assistant' | 'system',
  embedding?: number[],
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // 如果没有提供 embedding，生成一个
    let finalEmbedding = embedding;
    if (!finalEmbedding || finalEmbedding.length === 0) {
      finalEmbedding = await generateEmbedding(contentText);
      if (finalEmbedding.length === 0) {
        console.warn('无法生成向量嵌入，将存储不带向量的记忆');
      }
    }

    const { error } = await supabase.from('ai_memory').insert({
      user_id: userId,
      content_text: contentText,
      role: role,
      embedding: finalEmbedding && finalEmbedding.length > 0 ? finalEmbedding : null,
      metadata: metadata || null,
    });

    if (error) {
      console.error('存储记忆失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('存储记忆异常:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 构建包含历史记忆的上下文
 */
export function buildContextWithMemories(
  memories: Array<{ content_text: string; role: string; created_at: string }>
): string {
  if (memories.length === 0) {
    return '';
  }

  let context = '\n**历史对话上下文：**\n';
  memories.forEach((memory, index) => {
    const roleLabel = memory.role === 'user' ? '用户' : 'AI助手';
    context += `${index + 1}. [${roleLabel}] ${memory.content_text}\n`;
  });

  return context;
}

