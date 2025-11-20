import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DB_TABLES } from '@/lib/config/constants';
import { parseApiError } from '@/lib/apiUtils';

export const runtime = 'nodejs';

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

    const sourceType = request.nextUrl.searchParams.get('source_type');

    const { count: totalCount } = await supabase
      .from(DB_TABLES.CONTENT_FEED_VECTORS)
      .select('*', { head: true, count: 'exact' });

    let latestQuery = supabase
      .from(DB_TABLES.CONTENT_FEED_VECTORS)
      .select('id, source_type, source_url, content_text, relevance_score, published_at, crawled_at, created_at')
      .order('crawled_at', { ascending: false })
      .limit(25);

    if (sourceType) {
      latestQuery = latestQuery.eq('source_type', sourceType);
    }

    const { data: latestItems, error: latestError } = await latestQuery;

    if (latestError) {
      throw latestError;
    }

    const summary = (latestItems || []).reduce<
      Record<
        string,
        {
          count: number;
          lastCrawledAt: string | null;
          sampleUrl: string | null;
        }
      >
    >((acc, item) => {
      const key = item.source_type || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          lastCrawledAt: item.crawled_at || item.published_at || null,
          sampleUrl: item.source_url || null,
        };
      }
      acc[key].count += 1;
      if (item.crawled_at && (!acc[key].lastCrawledAt || item.crawled_at > (acc[key].lastCrawledAt ?? ''))) {
        acc[key].lastCrawledAt = item.crawled_at;
      }
      return acc;
    }, {});

    return NextResponse.json({
      totalCount: totalCount ?? 0,
      distinctSources: Object.keys(summary),
      summaryBySource: summary,
      latestItems: latestItems || [],
    });
  } catch (error) {
    console.error('Feed status API 错误:', error);
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

