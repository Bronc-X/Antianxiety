/**
 * Cron Job: 定时爬取科学文章
 * 
 * 配置在 vercel.json 中：
 * - 每天早上 6:00 UTC (北京时间 14:00) 执行
 * 
 * 手动触发：
 * curl -X GET "https://your-domain/api/cron/crawl-content" \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { quickCrawl, crawlAndStoreArticles } from '@/lib/content-crawler';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟超时

/**
 * 验证 Cron 请求
 * Vercel Cron 会自动添加 Authorization header
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Vercel Cron 自动验证
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  
  // 检查 Vercel 的 cron 签名
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  // 验证请求来源
  if (!verifyCronRequest(request)) {
    console.warn('🚫 Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('⏰ Cron job started: crawl-content');
  const startTime = Date.now();

  try {
    // 工作日用 quick 模式，周末用 full 模式
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    
    let result;
    if (isWeekend) {
      // 周末：完整爬取（更多文章）
      console.log('📚 Weekend mode: full crawl');
      result = await crawlAndStoreArticles(15);
      
      return NextResponse.json({
        success: result.success,
        mode: 'full',
        message: `周末完整爬取：PubMed ${result.pubmedCount} 篇，Semantic Scholar ${result.semanticCount} 篇，Reddit ${result.redditCount} 条，X ${result.xCount} 条`,
        pubmedCount: result.pubmedCount,
        semanticCount: result.semanticCount,
        redditCount: result.redditCount,
        xCount: result.xCount,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        errors: result.errors.length,
      });
    } else {
      // 工作日：快速爬取
      console.log('⚡ Weekday mode: quick crawl');
      result = await quickCrawl();
      
      return NextResponse.json({
        success: result.success,
        mode: 'quick',
        message: `工作日快速爬取：${result.count} 条内容（Reddit ${result.redditCount}，X ${result.xCount}）`,
        count: result.count,
        redditCount: result.redditCount,
        xCount: result.xCount,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        errors: result.errors.length,
      });
    }
  } catch (error) {
    console.error('❌ Cron crawl error:', error);
    return NextResponse.json(
      { 
        error: 'Crawl failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      },
      { status: 500 }
    );
  }
}
