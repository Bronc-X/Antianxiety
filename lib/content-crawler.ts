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
  errors: string[];
}> {
  const supabase = getAdminSupabase();
  const errors: string[] = [];
  let pubmedCount = 0;
  let semanticCount = 0;

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

    // 每个查询之间等待
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`✅ Crawl complete: ${pubmedCount} PubMed, ${semanticCount} Semantic Scholar`);

  return {
    success: errors.length === 0,
    pubmedCount,
    semanticCount,
    errors,
  };
}

/**
 * 快速爬取（用于测试，只爬取少量文章）
 */
export async function quickCrawl(): Promise<{
  success: boolean;
  count: number;
  errors: string[];
}> {
  const supabase = getAdminSupabase();
  const errors: string[] = [];
  let count = 0;

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

  console.log(`✅ Quick crawl complete: ${count} articles`);
  return { success: errors.length === 0, count, errors };
}
