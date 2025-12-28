import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { DB_TABLES } from '@/lib/config/constants';
import { parseApiError } from '@/lib/apiUtils';
import { enrichFeedItems } from '@/lib/feed-enricher';

export const runtime = 'nodejs';

// Admin client for reading content (bypasses RLS)
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface ProfileData {
  user_persona_embedding: number[] | null;
  primary_focus_topics?: string[];
  primary_concern?: string;
  current_focus?: string;
  stress_level?: number;
  sleep_hours?: number;
}

interface ContentFeedVector {
  id: number | string;
  source_url: string;
  source_type: string;
  content_text: string;
  published_at: string | null;
  relevance_score?: number | null;
  embedding?: number[] | null;
}

/**
 * 个性化信息流 API
 * 返回丰富的文章内容，包括 LLM 生成的个性化解释
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = getAdminSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);
    const enrich = searchParams.get('enrich') !== 'false'; // 默认开启丰富
    const language = searchParams.get('lang') || 'zh';

    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('user_persona_embedding, primary_focus_topics, primary_concern, current_focus, stress_level, sleep_hours')
      .eq('id', user.id)
      .single<ProfileData>();

    if (profileError || !profile) {
      return NextResponse.json({ error: '用户资料不存在' }, { status: 404 });
    }

    // 获取文章
    let items: ContentFeedVector[] = [];
    
    if (!adminSupabase) {
      return NextResponse.json({ 
        items: [], 
        message: '内容服务暂不可用' 
      });
    }

    // 如果用户有 embedding，尝试相似度搜索
    if (profile.user_persona_embedding) {
      const { data: allContent } = await adminSupabase
        .from(DB_TABLES.CONTENT_FEED_VECTORS)
        .select('id, source_url, source_type, content_text, published_at, embedding')
        .not('embedding', 'is', null)
        .order('crawled_at', { ascending: false })
        .limit(100);

      if (allContent && allContent.length > 0) {
        // 计算相似度并排序
        const scored = allContent
          .map((item: ContentFeedVector) => {
            if (!item.embedding || !Array.isArray(item.embedding)) {
              return { ...item, relevance_score: 0 };
            }
            const similarity = cosineSimilarity(profile.user_persona_embedding!, item.embedding);
            return { ...item, relevance_score: similarity };
          })
          .filter(item => item.relevance_score >= 0.3) // 最低 30% 相似度
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, limit);

        items = scored;
      }
    }

    // 如果没有匹配结果，获取最新文章
    if (items.length === 0) {
      const { data: latestContent } = await adminSupabase
        .from(DB_TABLES.CONTENT_FEED_VECTORS)
        .select('id, source_url, source_type, content_text, published_at')
        .order('crawled_at', { ascending: false })
        .limit(limit);

      if (latestContent) {
        items = latestContent.map(item => ({ ...item, relevance_score: 0.8 }));
      }
    }

    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        message: '暂无内容',
      });
    }

    // 如果需要丰富内容
    if (enrich) {
      const userContext = {
        primaryConcern: profile.primary_concern,
        currentFocus: profile.current_focus,
        stressLevel: profile.stress_level,
        sleepHours: profile.sleep_hours,
        focusTopics: profile.primary_focus_topics,
      };

      const enrichedItems = await enrichFeedItems(items, userContext, language);
      
      return NextResponse.json({
        items: enrichedItems,
        count: enrichedItems.length,
        enriched: true,
      });
    }

    // 不丰富，直接返回基础数据
    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        source_url: item.source_url,
        source_type: item.source_type,
        content_text: item.content_text,
        published_at: item.published_at,
        relevance_score: item.relevance_score,
      })),
      count: items.length,
      enriched: false,
    });

  } catch (error) {
    console.error('个性化信息流 API 错误:', error);
    const errorInfo = parseApiError(error);
    return NextResponse.json(
      { error: errorInfo.message || '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
