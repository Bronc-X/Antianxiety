import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DB_TABLES, RELEVANCE_THRESHOLD } from '@/lib/config/constants';
import { parseApiError } from '@/lib/apiUtils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { trendingTopics } from '@/data/trendingTopics';

export const runtime = 'nodejs';

interface ProfileEmbedding {
  user_persona_embedding: number[] | null;
  primary_focus_topics?: string[];
}

interface ContentFeedVector {
  id: number | string;
  source_url: string;
  source_type: string;
  content_text: string;
  published_at: string | null;
  relevance_score?: number | null;
}

interface ContentFeedVectorWithEmbedding extends ContentFeedVector {
  embedding: number[] | null;
}

interface PersonalizationMeta {
  ready: boolean;
  reason: string;
  message?: string;
  fallback?: 'latest' | 'trending' | 'none';
}

/**
 * 个性化信息流 API
 * 根据用户画像进行 RAG 搜索，返回高度相关的内容（相关性 ≥ 4.5/5）
 * 支持缺省降级：当个性化数据不足时回退到最新高质量内容
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const sourceType = searchParams.get('source_type');

    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('user_persona_embedding, primary_focus_topics')
      .eq('id', user.id)
      .single<ProfileEmbedding>();

    if (profileError || !profile) {
      return NextResponse.json({ error: '用户资料不存在' }, { status: 404 });
    }

    if (!profile.user_persona_embedding) {
      const fallbackItems = await getLatestHighQualityFeed(supabase, limit, sourceType);
      return NextResponse.json({
        items: fallbackItems,
        personalization: buildMeta({
          ready: false,
          reason: 'missing_embedding',
          message: '尚未生成个人画像向量，已为你展示最新高评分内容。',
          fallback: fallbackItems.length ? 'latest' : 'trending',
        }),
      });
    }

    const { data: similarContent, error: searchError } = await supabase.rpc(
      'match_content_feed_vectors',
      {
        query_embedding: profile.user_persona_embedding,
        match_threshold: RELEVANCE_THRESHOLD / 5.0,
        match_count: limit,
        source_type_filter: sourceType || null,
      }
    ) as { data: ContentFeedVector[] | null; error: Error | null };

    if (searchError) {
      console.warn('match_content_feed_vectors 不可用，使用备用搜索方案:', searchError.message);
      const scoredFallback = await fallbackSearch(
        supabase,
        profile.user_persona_embedding,
        limit,
        sourceType
      );

      if (scoredFallback.length > 0) {
        return NextResponse.json({
          items: scoredFallback.slice(0, limit),
          personalization: buildMeta({
            ready: true,
            reason: 'rpc_fallback',
            message: '向量搜索暂不可用，已改用备用算法提供内容。',
            fallback: 'latest',
          }),
        });
      }

      const latest = await getLatestHighQualityFeed(supabase, limit, sourceType);
      return NextResponse.json({
        items: latest,
        personalization: buildMeta({
          ready: true,
          reason: 'rpc_fallback',
          message: '向量搜索暂不可用，已改用最新内容池。',
          fallback: latest.length ? 'latest' : 'trending',
        }),
      });
    }

    const filteredContent = (similarContent || []).filter(
      (item: ContentFeedVector) => Number(item.relevance_score ?? 0) >= RELEVANCE_THRESHOLD
    );

    if (!Array.isArray(filteredContent) || filteredContent.length === 0) {
      const fallbackItems = await getLatestHighQualityFeed(supabase, limit, sourceType);
      return NextResponse.json({
        items: fallbackItems,
        personalization: buildMeta({
          ready: true,
          reason: 'no_high_match',
          message: '暂未匹配到 4.5 星以上的内容，已展示最新优质内容。',
          fallback: fallbackItems.length ? 'latest' : 'trending',
        }),
      });
    }

    return NextResponse.json({
      items: filteredContent.slice(0, limit),
      count: filteredContent.length,
      personalization: buildMeta({
        ready: true,
        reason: 'personalized',
        message: '已基于你的画像筛选出 4.5 星以上的讨论。',
        fallback: 'none',
      }),
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

function buildMeta(meta: PersonalizationMeta): PersonalizationMeta {
  return meta;
}

async function fallbackSearch(
  supabase: SupabaseClient,
  userEmbedding: number[],
  limit: number,
  sourceType: string | null
): Promise<ContentFeedVector[]> {
  let query = supabase
    .from(DB_TABLES.CONTENT_FEED_VECTORS)
    .select('id, source_url, source_type, content_text, published_at, embedding')
    .not('embedding', 'is', null)
    .limit(200);

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data: allContent, error } = await query.returns<ContentFeedVectorWithEmbedding[]>();

  if (error || !allContent) {
    console.error('备用相似度搜索失败:', error);
    return [];
  }

  const mapped: ContentFeedVector[] = [];
  
  for (const item of allContent) {
    if (!item.embedding || !Array.isArray(item.embedding)) {
      continue;
    }

    const similarity = cosineSimilarity(userEmbedding, item.embedding);
    const relevanceScore = similarity * 5;

    if (relevanceScore >= RELEVANCE_THRESHOLD) {
      mapped.push({
        id: item.id,
        source_url: item.source_url,
        source_type: item.source_type,
        content_text: item.content_text,
        published_at: item.published_at,
        relevance_score: relevanceScore,
      });
    }
  }
  
  return mapped
    .sort((a, b) => (Number(b.relevance_score ?? 0) - Number(a.relevance_score ?? 0)))
    .slice(0, limit);
}

async function getLatestHighQualityFeed(
  supabase: SupabaseClient,
  limit: number,
  sourceType: string | null
): Promise<ContentFeedVector[]> {
  let query = supabase
    .from(DB_TABLES.CONTENT_FEED_VECTORS)
    .select('id, source_url, source_type, content_text, published_at, relevance_score')
    .order('crawled_at', { ascending: false })
    .limit(limit);

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data, error } = await query;

  if (!error && data && data.length > 0) {
    return data;
  }

  return buildTrendingFallback(limit, sourceType);
}

function buildTrendingFallback(limit: number, sourceType: string | null): ContentFeedVector[] {
  const normalizedFilter = sourceType?.toLowerCase() ?? null;
  const normalizedTopics = trendingTopics
    .filter((topic) => {
      if (!normalizedFilter) return true;
      return topic.source.toLowerCase() === normalizedFilter;
    })
    .slice(0, limit)
    .map((topic, index) => ({
      id: `trending-${topic.id}-${index}`,
      source_url: topic.url,
      source_type: topic.source.toLowerCase() === 'x' ? 'x' : 'reddit',
      content_text: topic.summary,
      published_at: null,
      relevance_score: topic.baseScore ?? RELEVANCE_THRESHOLD,
    }));

  return normalizedTopics;
}

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
