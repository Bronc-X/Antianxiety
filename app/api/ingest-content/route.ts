import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DB_TABLES } from '@/lib/config/constants';
import { generateEmbedding } from '@/lib/aiMemory';

export const runtime = 'nodejs'; // 使用 Node.js runtime 以支持更复杂的操作
export const maxDuration = 300; // 5 分钟超时（Vercel Pro 计划）

/**
 * 内容爬取和向量化 API
 * 由 pg_cron 定时触发或手动调用
 * 爬取 X、Reddit、期刊等内容，生成向量嵌入并存入 content_feed_vectors 表
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求（可以使用 API Key 或服务角色）
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.CONTENT_INGEST_API_KEY;
    
    if (!expectedApiKey || authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { sourceType, limit = 50 } = body; // 增加默认爬取数量

    // 支持的来源类型
    const supportedSources = ['x', 'reddit', 'journal', 'research_institution', 'university'];
    if (sourceType && !supportedSources.includes(sourceType)) {
      return NextResponse.json(
        { error: `不支持的内容来源类型: ${sourceType}` },
        { status: 400 }
      );
    }

    // 根据来源类型爬取内容
    const crawledContent = await crawlContent(sourceType || 'all', limit);

    // 批量处理：生成向量嵌入并存储
    const results = [];
    for (const item of crawledContent) {
      try {
        // 生成向量嵌入
        const embedding = await generateEmbedding(item.content_text);

        // 检查是否已存在（根据 source_url）
        const { data: existing } = await supabase
          .from(DB_TABLES.CONTENT_FEED_VECTORS)
          .select('id')
          .eq('source_url', item.source_url)
          .single();

        if (existing) {
          // 更新现有记录
          const { error: updateError } = await supabase
            .from(DB_TABLES.CONTENT_FEED_VECTORS)
            .update({
              content_text: item.content_text,
              embedding: embedding,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateError) {
            results.push({ status: 'updated', url: item.source_url });
          }
        } else {
          // 插入新记录
          const { error: insertError } = await supabase
            .from(DB_TABLES.CONTENT_FEED_VECTORS)
            .insert({
              source_url: item.source_url,
              source_type: item.source_type,
              content_text: item.content_text,
              embedding: embedding,
              published_at: item.published_at,
            });

          if (!insertError) {
            results.push({ status: 'inserted', url: item.source_url });
          }
        }
      } catch (error) {
        console.error(`处理内容失败: ${item.source_url}`, error);
        results.push({ status: 'error', url: item.source_url, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results,
    });
  } catch (error) {
    console.error('内容爬取 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 爬取内容（根据来源类型）
 */
async function crawlContent(
  sourceType: string,
  limit: number
): Promise<
  Array<{
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
  }>
> {
  const results: Array<{
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
  }> = [];

  if (sourceType === 'all' || sourceType === 'reddit') {
    // 爬取 Reddit 内容
    const redditContent = await crawlReddit(limit);
    results.push(...redditContent);
  }

  if (sourceType === 'all' || sourceType === 'x') {
    // 爬取 X (Twitter) 内容
    const xContent = await crawlX(limit);
    results.push(...xContent);
  }

  if (sourceType === 'all' || sourceType === 'journal') {
    // 爬取期刊内容（示例：使用 RSS 或 API）
    const journalContent = await crawlJournals(limit);
    results.push(...journalContent);
  }

  return results;
}

/**
 * 爬取 Reddit 内容
 * 注意：Reddit API 需要认证，这里使用公开 API
 */
async function crawlReddit(limit: number) {
  const results: Array<{
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
  }> = [];

  try {
    // Reddit 公开 API（无需认证，但有限制）
    // 爬取健康、焦虑、习惯养成相关的 subreddit
    const subreddits = [
      'r/Anxiety',
      'r/mentalhealth',
      'r/getdisciplined',
      'r/Habits',
      'r/productivity',
      'r/selfimprovement',
    ];

    for (const subreddit of subreddits.slice(0, Math.ceil(limit / subreddits.length))) {
      try {
        const response = await fetch(
          `https://www.reddit.com/${subreddit}/hot.json?limit=5`,
          {
            headers: {
              'User-Agent': 'NoMoreAnxious-Bot/1.0',
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        const posts = data.data?.children || [];

        for (const post of posts.slice(0, limit)) {
          const postData = post.data;
          if (!postData || postData.selftext.length < 50) continue; // 过滤太短的内容

          results.push({
            source_url: `https://www.reddit.com${postData.permalink}`,
            source_type: 'reddit',
            content_text: `${postData.title}\n\n${postData.selftext}`.substring(0, 2000), // 限制长度
            published_at: new Date(postData.created_utc * 1000).toISOString(),
          });
        }
      } catch (error) {
        console.error(`爬取 ${subreddit} 失败:`, error);
      }
    }
  } catch (error) {
    console.error('Reddit 爬取错误:', error);
  }

  return results;
}

/**
 * 爬取 X (Twitter) 内容
 * 注意：Twitter API 需要认证，这里使用公开 RSS 或第三方服务
 */
async function crawlX(limit: number) {
  const results: Array<{
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
  }> = [];

  try {
    // 使用 Twitter RSS（如果可用）或第三方 API
    // 这里使用示例数据，实际应该调用 Twitter API
    // 注意：Twitter API v2 需要 Bearer Token
    
    // 示例：爬取特定用户的推文（需要配置 Twitter API Key）
    const twitterApiKey = process.env.TWITTER_API_KEY;
    const twitterApiSecret = process.env.TWITTER_API_SECRET;
    
    if (twitterApiKey && twitterApiSecret) {
      // 使用 Twitter API v2
      // 这里简化处理，实际应该实现完整的 OAuth 流程
      // 暂时返回空数组，需要配置 Twitter API
    } else {
      // 如果没有配置 Twitter API，返回空数组
      console.warn(`Twitter API 未配置，跳过 X 内容爬取（计划抓取 ${limit} 条）`);
    }
  } catch (error) {
    console.error('X 爬取错误:', error);
  }

  return results;
}

/**
 * 爬取期刊内容
 * 使用 PubMed API 或其他学术资源
 */
async function crawlJournals(limit: number) {
  const results: Array<{
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
  }> = [];

  try {
    // 使用 PubMed API 搜索相关论文
    const query = 'anxiety OR stress OR habit formation OR behavioral change';
    const response = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`,
      {
        headers: {
          'User-Agent': 'NoMoreAnxious-Bot/1.0',
        },
      }
    );

    if (!response.ok) return results;

    const data = await response.json();
    const pmids = data.esearchresult?.idlist || [];

    // 获取论文摘要
    for (const pmid of pmids.slice(0, limit)) {
      try {
        const summaryResponse = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`
        );

        if (!summaryResponse.ok) continue;

        const summaryData = await summaryResponse.json();
        const article = summaryData.result?.[pmid];

        if (!article || !article.title) continue;

        results.push({
          source_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source_type: 'journal',
          content_text: `${article.title}\n\n${article.abstract || ''}`.substring(0, 2000),
          published_at: article.pubdate ? new Date(article.pubdate).toISOString() : null,
        });
      } catch (error) {
        console.error(`获取论文 ${pmid} 失败:`, error);
      }
    }
  } catch (error) {
    console.error('期刊爬取错误:', error);
  }

  return results;
}

// 注意：generateEmbedding 已从 @/lib/aiMemory 导入，遵循 DRY 原则


