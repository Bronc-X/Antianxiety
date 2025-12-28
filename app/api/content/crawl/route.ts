/**
 * 科学文章爬虫 API
 * POST /api/content/crawl - 触发爬虫抓取文章
 * GET /api/content/crawl - 获取内容池状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { crawlAndStoreArticles, quickCrawl } from '@/lib/content-crawler';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟超时

/**
 * GET - 获取内容池状态
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 获取内容池统计
    const { count: totalCount } = await supabase
      .from('content_feed_vectors')
      .select('*', { count: 'exact', head: true });

    const { count: withEmbedding } = await supabase
      .from('content_feed_vectors')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    // 按来源统计
    const { data: bySource } = await supabase
      .from('content_feed_vectors')
      .select('source_type')
      .then(result => {
        if (!result.data) return { data: [] };
        const counts: Record<string, number> = {};
        result.data.forEach((item: { source_type: string }) => {
          counts[item.source_type] = (counts[item.source_type] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([type, count]) => ({ type, count })) };
      });

    return NextResponse.json({
      totalCount: totalCount || 0,
      withEmbedding: withEmbedding || 0,
      bySource: bySource || [],
    });
  } catch (error) {
    console.error('Content status error:', error);
    return NextResponse.json({ error: '获取状态失败' }, { status: 500 });
  }
}

/**
 * POST - 触发爬虫
 */
export async function POST(request: NextRequest) {
  try {
    // 允许无认证调用（用于初始化数据）
    // 生产环境应该添加 API key 验证
    
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'quick'; // 'quick' | 'full'

    console.log(`🚀 Starting content crawl (mode: ${mode})`);

    let result;
    if (mode === 'full') {
      result = await crawlAndStoreArticles(10);
      return NextResponse.json({
        success: result.success,
        message: `爬取完成：PubMed ${result.pubmedCount} 篇，Semantic Scholar ${result.semanticCount} 篇`,
        pubmedCount: result.pubmedCount,
        semanticCount: result.semanticCount,
        errors: result.errors.slice(0, 5), // 只返回前 5 个错误
      });
    } else {
      result = await quickCrawl();
      return NextResponse.json({
        success: result.success,
        message: `快速爬取完成：${result.count} 篇文章`,
        count: result.count,
        errors: result.errors.slice(0, 5),
      });
    }
  } catch (error) {
    console.error('Content crawl error:', error);
    return NextResponse.json(
      { error: '爬取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
