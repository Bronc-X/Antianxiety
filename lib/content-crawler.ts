/**
 * 科学文章爬虫
 * 从 PubMed 和 Semantic Scholar 抓取焦虑/心理健康相关文章
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './aiMemory';

// ============================================
// Admin Supabase Client (绕过 RLS)
// ============================================

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for admin client');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================
// Types
// ============================================

interface PubMedArticle {
  uid: string;
  title: string;
  sortpubdate: string;
  source: string;
  authors?: { name: string }[];
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  url: string;
  year: number | null;
  authors?: { name: string }[];
  citationCount?: number;
}

interface OpenAlexWork {
  id: string;
  doi?: string | null;
  display_name?: string | null;
  title?: string | null;
  abstract_inverted_index?: Record<string, number[]>;
  publication_year?: number | null;
}

interface ContentFeedItem {
  source_url: string;
  source_type: string;
  content_text: string;
  published_at: string | null;
  embedding?: number[];
}

// ============================================
// PubMed API
// ============================================

const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_SUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const PUBMED_ABSTRACT_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

/**
 * 搜索 PubMed 文章
 */
async function searchPubMed(query: string, maxResults = 20): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: maxResults.toString(),
      retmode: 'json',
      sort: 'relevance',
    });

    const response = await fetch(`${PUBMED_SEARCH_URL}?${params}`);
    if (!response.ok) throw new Error(`PubMed search failed: ${response.status}`);

    const data = await response.json();
    return data.esearchresult?.idlist || [];
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

/**
 * 获取 PubMed 文章摘要
 */
async function getPubMedSummaries(ids: string[]): Promise<PubMedArticle[]> {
  if (ids.length === 0) return [];

  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      id: ids.join(','),
      retmode: 'json',
    });

    const response = await fetch(`${PUBMED_SUMMARY_URL}?${params}`);
    if (!response.ok) throw new Error(`PubMed summary failed: ${response.status}`);

    const data = await response.json();
    const result = data.result || {};
    
    return ids
      .filter(id => result[id])
      .map(id => result[id] as PubMedArticle);
  } catch (error) {
    console.error('PubMed summary error:', error);
    return [];
  }
}

/**
 * 获取 PubMed 文章摘要文本
 */
async function getPubMedAbstract(pmid: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      rettype: 'abstract',
      retmode: 'text',
    });

    const response = await fetch(`${PUBMED_ABSTRACT_URL}?${params}`);
    if (!response.ok) return null;

    const text = await response.text();
    // 提取摘要部分
    const abstractMatch = text.match(/Abstract\s*([\s\S]*?)(?:\n\n|$)/i);
    return abstractMatch ? abstractMatch[1].trim() : text.slice(0, 1000);
  } catch (error) {
    console.error('PubMed abstract error:', error);
    return null;
  }
}

// ============================================
// Semantic Scholar API
// ============================================

const SEMANTIC_SCHOLAR_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';

// ============================================
// OpenAlex API
// ============================================

const OPENALEX_API_BASE = 'https://api.openalex.org';
const OPENALEX_TIMEOUT_MS = 8000;
const OPENALEX_MAILTO = process.env.OPENALEX_MAILTO || process.env.OPENALEX_EMAIL;
const OPENALEX_ENABLED = process.env.OPENALEX_ENABLED !== 'false';

/**
 * 搜索 Semantic Scholar 文章
 */
async function searchSemanticScholar(query: string, maxResults = 20): Promise<SemanticScholarPaper[]> {
  try {
    const params = new URLSearchParams({
      query,
      limit: maxResults.toString(),
      fields: 'paperId,title,abstract,url,year,authors,citationCount',
    });

    const response = await fetch(`${SEMANTIC_SCHOLAR_URL}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Semantic Scholar rate limited, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return [];
      }
      throw new Error(`Semantic Scholar search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return [];
  }
}

// ============================================
// OpenAlex API
// ============================================

function normalizeOpenAlexDoi(doi?: string | null): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '').toLowerCase().trim();
}

function openAlexAbstractToText(abstractIndex?: Record<string, number[]>): string {
  if (!abstractIndex) return '';
  let maxPos = -1;
  for (const positions of Object.values(abstractIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      if (typeof pos === 'number' && pos > maxPos) maxPos = pos;
    }
  }
  if (maxPos < 0) return '';

  const words = new Array(maxPos + 1).fill('');
  for (const [word, positions] of Object.entries(abstractIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      if (typeof pos === 'number' && pos >= 0 && pos < words.length) {
        words[pos] = word;
      }
    }
  }

  return words.filter(Boolean).join(' ');
}

async function searchOpenAlex(query: string, maxResults = 20): Promise<OpenAlexWork[]> {
  if (!OPENALEX_ENABLED) return [];
  try {
    const params = new URLSearchParams({
      search: query,
      'per-page': maxResults.toString(),
      select: 'id,doi,display_name,title,abstract_inverted_index,publication_year',
    });

    if (OPENALEX_MAILTO) {
      params.set('mailto', OPENALEX_MAILTO);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENALEX_TIMEOUT_MS);

    const response = await fetch(`${OPENALEX_API_BASE}/works?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`OpenAlex search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data?.results || [];
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      console.error('OpenAlex timeout');
    } else {
      console.error('OpenAlex search error:', error);
    }
    return [];
  }
}

// ============================================
// Content Processing
// ============================================

/**
 * 将 PubMed 文章转换为内容项
 */
async function pubMedToContentItem(article: PubMedArticle): Promise<ContentFeedItem | null> {
  const abstract = await getPubMedAbstract(article.uid);
  if (!abstract || abstract.length < 100) return null;

  const contentText = `${article.title}\n\n${abstract}`;

  return {
    source_url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
    source_type: 'pubmed',
    content_text: contentText.slice(0, 2000),
    published_at: article.sortpubdate ? new Date(article.sortpubdate).toISOString() : null,
  };
}

/**
 * 将 Semantic Scholar 文章转换为内容项
 */
function semanticScholarToContentItem(paper: SemanticScholarPaper): ContentFeedItem | null {
  if (!paper.abstract || paper.abstract.length < 100) return null;

  const contentText = `${paper.title}\n\n${paper.abstract}`;
  
  return {
    source_url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    source_type: 'semantic_scholar',
    content_text: contentText.slice(0, 2000),
    published_at: paper.year ? `${paper.year}-01-01` : null,
  };
}

/**
 * 将 OpenAlex 论文转换为内容项
 */
function openAlexToContentItem(work: OpenAlexWork): ContentFeedItem | null {
  const abstract = openAlexAbstractToText(work.abstract_inverted_index);
  if (!abstract || abstract.length < 100) return null;

  const title = work.display_name || work.title || 'Untitled';
  const doi = normalizeOpenAlexDoi(work.doi);
  const sourceUrl = work.id || (doi ? `https://doi.org/${doi}` : '');
  if (!sourceUrl) return null;

  const contentText = `${title}\n\n${abstract}`;

  return {
    source_url: sourceUrl,
    source_type: 'openalex',
    content_text: contentText.slice(0, 2000),
    published_at: work.publication_year ? `${work.publication_year}-01-01` : null,
  };
}

// ============================================
// Social Sources (Reddit / X)
// ============================================

async function crawlRedditContent(limit: number): Promise<ContentFeedItem[]> {
  const results: ContentFeedItem[] = [];
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
            'User-Agent': 'Antianxiety-Bot/1.0',
          },
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const posts = data.data?.children || [];

      for (const post of posts.slice(0, limit)) {
        const postData = post.data;
        if (!postData || !postData.selftext || postData.selftext.length < 50) continue;

        results.push({
          source_url: `https://www.reddit.com${postData.permalink}`,
          source_type: 'reddit',
          content_text: `${postData.title}\n\n${postData.selftext}`.substring(0, 2000),
          published_at: postData.created_utc ? new Date(postData.created_utc * 1000).toISOString() : null,
        });
      }
    } catch (error) {
      console.error(`Reddit crawl failed for ${subreddit}:`, error);
    }
  }

  return results.slice(0, limit);
}

async function crawlXContent(limit: number): Promise<ContentFeedItem[]> {
  const results: ContentFeedItem[] = [];
  const twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!twitterBearerToken) {
    console.log('TWITTER_BEARER_TOKEN not configured, skipping X crawl');
    return results;
  }

  try {
    const searchQuery = encodeURIComponent(
      '(anxiety OR stress OR sleep OR mindfulness OR habit) -is:retweet lang:en'
    );

    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=${Math.min(limit, 20)}&tweet.fields=created_at`,
      {
        headers: {
          Authorization: `Bearer ${twitterBearerToken}`,
          'User-Agent': 'Antianxiety-Bot/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn('X search failed:', response.status);
      return results;
    }

    const data = await response.json();
    const tweets = data.data || [];

    results.push(
      ...tweets.map((tweet: { id: string; text: string; created_at?: string }) => ({
        source_url: `https://x.com/i/web/status/${tweet.id}`,
        source_type: 'x',
        content_text: tweet.text.substring(0, 2000),
        published_at: tweet.created_at || null,
      }))
    );
  } catch (error) {
    console.error('X crawl failed:', error);
  }

  return results.slice(0, limit);
}

// ============================================
// Main Crawler Functions
// ============================================

/** 焦虑/心理健康相关搜索词 */
const SEARCH_QUERIES = [
  'anxiety treatment cognitive behavioral therapy',
  'stress management mindfulness meditation',
  'sleep quality mental health',
  'heart rate variability anxiety',
  'breathing exercises stress reduction',
  'generalized anxiety disorder treatment',
  'panic disorder therapy',
  'social anxiety intervention',
  'relaxation techniques anxiety',
  'exercise mental health benefits',
];

/**
 * 爬取并存储科学文章
 */
export async function crawlAndStoreArticles(maxPerQuery = 10): Promise<{
  success: boolean;
  pubmedCount: number;
  semanticCount: number;
  openalexCount: number;
  redditCount: number;
  xCount: number;
  errors: string[];
}> {
  const supabase = getAdminSupabase();
  const errors: string[] = [];
  let pubmedCount = 0;
  let semanticCount = 0;
  let openalexCount = 0;
  let redditCount = 0;
  let xCount = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`🔍 Crawling: ${query}`);

    // 1. PubMed
    try {
      const pmids = await searchPubMed(query, maxPerQuery);
      const articles = await getPubMedSummaries(pmids);

      for (const article of articles) {
        const item = await pubMedToContentItem(article);
        if (!item) continue;

        // 检查是否已存在
        const { data: existing } = await supabase
          .from('content_feed_vectors')
          .select('id')
          .eq('source_url', item.source_url)
          .single();

        if (existing) continue;

        // 生成向量
        try {
          item.embedding = await generateEmbedding(item.content_text);
        } catch (e) {
          console.warn('Embedding generation failed, storing without embedding');
        }

        // 存储
        const { error } = await supabase
          .from('content_feed_vectors')
          .insert({
            source_url: item.source_url,
            source_type: item.source_type,
            content_text: item.content_text,
            published_at: item.published_at,
            embedding: item.embedding,
            crawled_at: new Date().toISOString(),
          });

        if (error) {
          errors.push(`PubMed insert error: ${error.message}`);
        } else {
          pubmedCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      errors.push(`PubMed crawl error for "${query}": ${e}`);
    }

    // 2. Semantic Scholar
    try {
      const papers = await searchSemanticScholar(query, maxPerQuery);

      for (const paper of papers) {
        const item = semanticScholarToContentItem(paper);
        if (!item) continue;

        // 检查是否已存在
        const { data: existing } = await supabase
          .from('content_feed_vectors')
          .select('id')
          .eq('source_url', item.source_url)
          .single();

        if (existing) continue;

        // 生成向量
        try {
          item.embedding = await generateEmbedding(item.content_text);
        } catch (e) {
          console.warn('Embedding generation failed, storing without embedding');
        }

        // 存储
        const { error } = await supabase
          .from('content_feed_vectors')
          .insert({
            source_url: item.source_url,
            source_type: item.source_type,
            content_text: item.content_text,
            published_at: item.published_at,
            embedding: item.embedding,
            crawled_at: new Date().toISOString(),
          });

        if (error) {
          errors.push(`Semantic Scholar insert error: ${error.message}`);
        } else {
          semanticCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      errors.push(`Semantic Scholar crawl error for "${query}": ${e}`);
    }

    // 3. OpenAlex
    try {
      const works = await searchOpenAlex(query, maxPerQuery);

      for (const work of works) {
        const item = openAlexToContentItem(work);
        if (!item) continue;

        const { data: existing } = await supabase
          .from('content_feed_vectors')
          .select('id')
          .eq('source_url', item.source_url)
          .single();

        if (existing) continue;

        try {
          item.embedding = await generateEmbedding(item.content_text);
        } catch (e) {
          console.warn('Embedding generation failed, storing without embedding');
        }

        const { error } = await supabase
          .from('content_feed_vectors')
          .insert({
            source_url: item.source_url,
            source_type: item.source_type,
            content_text: item.content_text,
            published_at: item.published_at,
            embedding: item.embedding,
            crawled_at: new Date().toISOString(),
          });

        if (error) {
          errors.push(`OpenAlex insert error: ${error.message}`);
        } else {
          openalexCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (e) {
      errors.push(`OpenAlex crawl error for "${query}": ${e}`);
    }

    // 每个查询之间等待
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 4. Social sources
  const socialLimit = Math.min(6, maxPerQuery);

  try {
    const redditItems = await crawlRedditContent(socialLimit);
    for (const item of redditItems) {
      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) continue;

      try {
        item.embedding = await generateEmbedding(item.content_text);
      } catch (e) {
        console.warn('Embedding generation failed for Reddit item');
      }

      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`Reddit insert error: ${error.message}`);
      } else {
        redditCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e) {
    errors.push(`Reddit crawl error: ${e}`);
  }

  try {
    const xItems = await crawlXContent(socialLimit);
    for (const item of xItems) {
      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) continue;

      try {
        item.embedding = await generateEmbedding(item.content_text);
      } catch (e) {
        console.warn('Embedding generation failed for X item');
      }

      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`X insert error: ${error.message}`);
      } else {
        xCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e) {
    errors.push(`X crawl error: ${e}`);
  }

  console.log(`✅ Crawl complete: ${pubmedCount} PubMed, ${semanticCount} Semantic Scholar, ${openalexCount} OpenAlex, ${redditCount} Reddit, ${xCount} X`);

  return {
    success: errors.length === 0,
    pubmedCount,
    semanticCount,
    openalexCount,
    redditCount,
    xCount,
    errors,
  };
}

/**
 * 快速爬取（用于测试，只爬取少量文章）
 */
export async function quickCrawl(): Promise<{
  success: boolean;
  count: number;
  openalexCount: number;
  redditCount: number;
  xCount: number;
  errors: string[];
}> {
  const supabase = getAdminSupabase();
  const errors: string[] = [];
  let count = 0;
  let openalexCount = 0;
  let redditCount = 0;
  let xCount = 0;

  // 只用一个查询，快速获取一些文章
  const query = 'anxiety treatment mindfulness';

  // PubMed (更稳定)
  try {
    console.log('🔍 Searching PubMed...');
    const pmids = await searchPubMed(query, 15);
    console.log(`📄 Found ${pmids.length} PubMed articles`);
    
    const articles = await getPubMedSummaries(pmids);

    for (const article of articles) {
      const item = await pubMedToContentItem(article);
      if (!item) continue;

      // 检查是否已存在
      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) {
        console.log(`⏭️ Skipping existing: ${article.uid}`);
        continue;
      }

      // 生成向量
      try {
        item.embedding = await generateEmbedding(item.content_text);
        console.log(`✅ Generated embedding for: ${article.uid}`);
      } catch (e) {
        console.warn('Embedding generation failed');
      }

      // 存储
      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(error.message);
        console.error(`❌ Insert error: ${error.message}`);
      } else {
        count++;
        console.log(`💾 Stored article: ${article.uid}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (e) {
    errors.push(`Quick crawl error: ${e}`);
    console.error('Quick crawl error:', e);
  }

  // OpenAlex (扩源)
  try {
    console.log('🔍 Searching OpenAlex...');
    const works = await searchOpenAlex(query, 8);
    console.log(`📄 Found ${works.length} OpenAlex works`);

    for (const work of works) {
      const item = openAlexToContentItem(work);
      if (!item) continue;

      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) continue;

      try {
        item.embedding = await generateEmbedding(item.content_text);
      } catch (e) {
        console.warn('Embedding generation failed');
      }

      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`OpenAlex insert error: ${error.message}`);
        console.error(`❌ Insert error: ${error.message}`);
      } else {
        count++;
        openalexCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 400));
    }
  } catch (e) {
    errors.push(`OpenAlex quick crawl error: ${e}`);
  }

  const socialLimit = 4;

  try {
    const redditItems = await crawlRedditContent(socialLimit);
    for (const item of redditItems) {
      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) continue;

      try {
        item.embedding = await generateEmbedding(item.content_text);
      } catch (e) {
        console.warn('Embedding generation failed for Reddit item');
      }

      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`Reddit insert error: ${error.message}`);
      } else {
        redditCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (e) {
    errors.push(`Reddit crawl error: ${e}`);
  }

  try {
    const xItems = await crawlXContent(socialLimit);
    for (const item of xItems) {
      const { data: existing } = await supabase
        .from('content_feed_vectors')
        .select('id')
        .eq('source_url', item.source_url)
        .single();

      if (existing) continue;

      try {
        item.embedding = await generateEmbedding(item.content_text);
      } catch (e) {
        console.warn('Embedding generation failed for X item');
      }

      const { error } = await supabase
        .from('content_feed_vectors')
        .insert({
          source_url: item.source_url,
          source_type: item.source_type,
          content_text: item.content_text,
          published_at: item.published_at,
          embedding: item.embedding,
          crawled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`X insert error: ${error.message}`);
      } else {
        xCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (e) {
    errors.push(`X crawl error: ${e}`);
  }

  const totalCount = count + redditCount + xCount;
  console.log(`✅ Quick crawl complete: ${totalCount} items (${count} scientific, ${openalexCount} OpenAlex, ${redditCount} Reddit, ${xCount} X)`);

  return { success: errors.length === 0, count: totalCount, openalexCount, redditCount, xCount, errors };
}
