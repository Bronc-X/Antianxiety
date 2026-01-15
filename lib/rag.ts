import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 初始化专门用于 Embedding 的 OpenAI 客户端
const embeddingClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://aicanapi.com/v1',
});

/**
 * Generate embedding vector using OpenAI API (via AicanAPI proxy)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || !text.trim()) {
    return [];
  }

  try {
    const response = await embeddingClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    return [];
  }
}

/**
 * Hybrid search using pgvector similarity
 */
export async function hybridSearch(
  queryEmbedding: number[],
  matchThreshold = 0.5,
  limit = 5
): Promise<unknown[]> {
  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.warn('⚠️ Empty embedding, falling back to recent memories');
    return getRecentMemories(limit);
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('hybrid_search', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: limit,
    });

    if (error) {
      console.error('Hybrid search RPC error:', error);
      return getRecentMemories(limit);
    }

    return data || [];
  } catch (error) {
    console.error('Hybrid search error:', error);
    return getRecentMemories(limit);
  }
}

/**
 * Fallback: get recent memories without vector search
 */
async function getRecentMemories(limit: number): Promise<unknown[]> {
  const { data, error } = await supabaseAdmin
    .from('user_memories')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get recent memories error:', error);
    return [];
  }

  return data || [];
}

/**
 * Save memory with embedding to user_memories table
 */
export async function saveMemory(
  userId: string,
  content: string,
  role: 'user' | 'assistant',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!content || !content.trim()) return;

  try {
    const embedding = await generateEmbedding(content);

    const { error } = await supabaseAdmin
      .from('user_memories')
      .insert({
        user_id: userId,
        content,
        embedding: embedding.length > 0 ? embedding : null,
        metadata: {
          ...metadata,
          role,
          created_at: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Save memory error:', error);
    }
  } catch (error) {
    console.error('Save memory failed:', error);
  }
}

/**
 * Search memories by semantic similarity for a specific user
 */
export async function searchMemories(
  userId: string,
  query: string,
  limit = 5
): Promise<unknown[]> {
  const embedding = await generateEmbedding(query);
  
  if (embedding.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('search_user_memories', {
      p_user_id: userId,
      query_embedding: embedding,
      match_count: limit,
    });

    if (error) {
      console.error('Search memories error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Search memories failed:', error);
    return [];
  }
}


/**
 * Submit user feedback for a conversation
 */
export async function submitFeedback(
  conversationId: number,
  feedback: 'helpful' | 'not_helpful',
  comment?: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('chat_feedback')
      .insert({
        conversation_id: conversationId,
        feedback,
        comment: comment || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, just log and continue
      console.warn('Submit feedback warning:', error.message);
    }
  } catch (error) {
    console.error('Submit feedback failed:', error);
  }
}
