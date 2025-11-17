import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DB_TABLES, RELEVANCE_THRESHOLD } from '@/lib/config/constants';
import { parseApiError } from '@/lib/apiUtils';

export const runtime = 'nodejs';

/**
 * 个性化信息流 API
 * 根据用户画像进行 RAG 搜索，返回高度相关的内容（相关性 > 4.5/5）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sourceType = searchParams.get('source_type'); // 可选：过滤来源类型

    // 获取用户画像向量
    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('user_persona_embedding, primary_focus_topics')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '用户资料不存在' },
        { status: 404 }
      );
    }

    // 如果没有用户画像向量，返回空结果
    if (!profile.user_persona_embedding) {
      return NextResponse.json({
        items: [],
        message: '用户画像向量未生成，请先完成个人资料设置',
      });
    }

    // 执行向量相似度搜索
    let query = supabase
      .from(DB_TABLES.CONTENT_FEED_VECTORS)
      .select('id, source_url, source_type, content_text, published_at, relevance_score')
      .not('embedding', 'is', null);

    // 如果指定了来源类型，添加过滤
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    // 使用 pgvector 的相似度搜索
    // 注意：Supabase 的向量搜索需要使用 RPC 函数
    const { data: similarContent, error: searchError } = await supabase.rpc(
      'match_content_feed_vectors',
      {
        query_embedding: profile.user_persona_embedding,
        match_threshold: RELEVANCE_THRESHOLD / 5.0, // 转换为 0-1 范围（4.5/5 = 0.9）
        match_count: limit,
        source_type_filter: sourceType || null,
      }
    );

    if (searchError) {
      // 如果 RPC 函数不存在，使用备用方案：计算相关性分数
      console.warn('RPC 函数不存在，使用备用搜索方案');
      return await fallbackSearch(supabase, profile.user_persona_embedding, limit, sourceType);
    }

    // 过滤相关性分数 >= 4.5/5 的内容
    const filteredContent = (similarContent || []).filter(
      (item: any) => (item.relevance_score || 0) >= RELEVANCE_THRESHOLD
    );

    return NextResponse.json({
      items: filteredContent.slice(0, limit),
      count: filteredContent.length,
    });
  } catch (error) {
    console.error('个性化信息流 API 错误:', error);
    const errorInfo = parseApiError(error);
    return NextResponse.json(
      {
        error: errorInfo.message || '服务器错误，请稍后重试',
        code: errorInfo.code,
      },
      { status: 500 }
    );
  }
}

/**
 * 备用搜索方案（如果 RPC 函数不存在）
 */
async function fallbackSearch(
  supabase: any,
  userEmbedding: number[],
  limit: number,
  sourceType: string | null
) {
  // 获取所有内容
  let query = supabase
    .from(DB_TABLES.CONTENT_FEED_VECTORS)
    .select('id, source_url, source_type, content_text, published_at, embedding')
    .not('embedding', 'is', null)
    .limit(100); // 限制查询数量以提高性能

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data: allContent, error } = await query;

  if (error || !allContent) {
    return NextResponse.json({ items: [], count: 0 });
  }

  // 计算余弦相似度
  const scoredContent = allContent
    .map((item: any) => {
      if (!item.embedding || !Array.isArray(item.embedding)) {
        return null;
      }

      // 计算余弦相似度
      const similarity = cosineSimilarity(userEmbedding, item.embedding);
      const relevanceScore = similarity * 5; // 转换为 0-5 范围

      return {
        ...item,
        relevance_score: relevanceScore,
        embedding: undefined, // 移除嵌入向量以减小响应大小
      };
    })
    .filter((item: any) => item && item.relevance_score >= RELEVANCE_THRESHOLD)
    .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

  return NextResponse.json({
    items: scoredContent,
    count: scoredContent.length,
  });
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}


