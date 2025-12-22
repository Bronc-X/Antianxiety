type Source = 'semantic_scholar' | 'pubmed' | 'healthline';

export interface ScientificPaper {
  id: string;
  title: string;
  abstract: string;
  url: string;
  year?: number | null;
  citationCount: number;
  doi?: string | null;
  source: Source;
}

export interface RankedScientificPaper extends ScientificPaper {
  rank: number;
  authorityScore: number;
  recencyScore: number;
  sourceQualityScore: number;
  compositeScore: number;
}

export interface ScientificSearchResult {
  keywords: string[];
  papers: RankedScientificPaper[];
  consensus: ConsensusResult;
  /** 搜索是否成功（达到目标数量） */
  success: boolean;
  /** 如果失败，提示用户重试 */
  retryNeeded?: boolean;
}

export interface ConsensusResult {
  score: number; // 0-1
  level: 'high' | 'emerging' | 'mixed' | 'low';
  rationale: string;
}

// API Configuration
const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';
const SEMANTIC_SCHOLAR_FIELDS = 'paperId,title,abstract,year,citationCount,url,externalIds,authors';
const SEMANTIC_SCHOLAR_LIMIT = 15;
const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

const PUBMED_API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const PUBMED_LIMIT = 10;

// 关键词提取使用 OpenAI 兼容 API (环境变量在函数内读取，确保 dotenv 已加载)
// 默认使用 Claude Sonnet 模型进行关键词提取
const DEFAULT_KEYWORD_MODEL = 'claude-sonnet-4-5-20250929';
const DEFAULT_OPENAI_API_BASE = 'https://aicanapi.com/v1';

// Weighted Algorithm Configuration (Authority * 0.4 + Recency * 0.3 + Source Quality * 0.3)
const WEIGHT_AUTHORITY = 0.4;
const WEIGHT_RECENCY = 0.3;
const WEIGHT_SOURCE_QUALITY = 0.3;

// Source Quality Scores
const SOURCE_QUALITY: Record<Source, number> = {
  pubmed: 1.0,           // PubMed = highest quality (peer-reviewed medical)
  semantic_scholar: 0.8, // Semantic Scholar = good quality
  healthline: 0.7,       // Healthline = good quality (medically reviewed)
};

const KEYWORD_FALLBACK_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'in', 'with',
  'about', 'what', 'how', 'why', 'is', 'are', 'can',
]);

/**
 * System prompt for translating medical jargon into a user-facing structure.
 */
export const TRANSLATOR_SYSTEM_PROMPT = [
  'Translate medical jargon into plain language for a 30+ year old user.',
  'Structure the answer: Key Takeaway -> Evidence -> Actionable Advice.',
  'Attach citations as [1], [2] and provide the source metadata.',
].join(' ');

// 搜索配置
const SEARCH_TIMEOUT_MS = 20000; // 20秒总超时
const TARGET_PAPER_COUNT = 10;   // 目标论文数量
const MAX_RETRY_ROUNDS = 3;      // 最大重试轮数

/**
 * Orchestrated scientific search with dual-source (Semantic Scholar + PubMed)
 * 规则：20秒内抓取到10条就结束，否则提示重试
 */
export async function searchScientificTruth(userQuery: string): Promise<ScientificSearchResult> {
  const startTime = Date.now();
  const keywords = await extractKeywords(userQuery);
  const searchQuery = keywords.length ? keywords.join(' ') : userQuery;

  console.log('🔬 Scientific Search - Keywords:', keywords);

  let allPapers: ScientificPaper[] = [];
  let round = 0;

  // 循环抓取直到达到目标或超时
  while (allPapers.length < TARGET_PAPER_COUNT && round < MAX_RETRY_ROUNDS) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= SEARCH_TIMEOUT_MS) {
      console.log(`⏱️ 搜索超时 (${elapsed}ms)`);
      break;
    }

    round++;
    console.log(`🔄 搜索轮次 ${round}/${MAX_RETRY_ROUNDS}`);

    // 并行请求三个平台 (Semantic Scholar + PubMed + Healthline)
    const remainingTime = SEARCH_TIMEOUT_MS - elapsed;
    const [semanticPapers, pubmedPapers, healthlinePapers] = await Promise.race([
      Promise.all([
        searchSemanticScholar(searchQuery, SEMANTIC_SCHOLAR_LIMIT),
        searchPubMed(searchQuery, PUBMED_LIMIT),
        searchHealthline(searchQuery, 5), // Healthline 限制 5 篇
      ]),
      // 超时保护
      new Promise<[ScientificPaper[], ScientificPaper[], ScientificPaper[]]>((resolve) =>
        setTimeout(() => resolve([[], [], []]), remainingTime)
      ),
    ]);

    console.log(`📚 轮次 ${round}: Semantic Scholar ${semanticPapers.length}, PubMed ${pubmedPapers.length}, Healthline ${healthlinePapers.length}`);

    // 合并并去重 (三个来源)
    const newPapers = [...semanticPapers, ...pubmedPapers, ...healthlinePapers];
    allPapers = dedupePapers([...allPapers, ...newPapers]);

    console.log(`📊 累计论文: ${allPapers.length}/${TARGET_PAPER_COUNT}`);

    // 达到目标，提前结束
    if (allPapers.length >= TARGET_PAPER_COUNT) {
      console.log('✅ 达到目标数量，结束搜索');
      break;
    }

    // 如果还需要继续，等待一下避免限流
    if (round < MAX_RETRY_ROUNDS && allPapers.length < TARGET_PAPER_COUNT) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalTime = Date.now() - startTime;
  const success = allPapers.length >= TARGET_PAPER_COUNT;

  console.log(`🏁 搜索完成: ${allPapers.length} 篇, 耗时 ${totalTime}ms, 成功: ${success}`);

  // 排序和计算共识
  const ranked = rerankPapersWeighted(allPapers).slice(0, TARGET_PAPER_COUNT);
  const consensus = computeConsensus(ranked, keywords);

  return {
    keywords,
    papers: ranked,
    consensus,
    success,
    retryNeeded: !success,
  };
}

/**
 * Extract keywords using LLM or fallback tokenizer.
 */
async function extractKeywords(query: string): Promise<string[]> {
  if (!query || !query.trim()) return [];

  // 在函数内读取环境变量，确保 dotenv 已加载
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = (process.env.OPENAI_API_BASE || DEFAULT_OPENAI_API_BASE).replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || DEFAULT_KEYWORD_MODEL;

  if (!apiKey) {
    console.log('⚠️ OPENAI_API_KEY not set, using fallback keywords');
    return fallbackKeywords(query);
  }

  try {
    console.log(`🔑 Extracting keywords with Gemini: ${model}`);
    console.log(`📡 API Base: ${apiBase}`);

    // 使用 OpenAI 兼容 API 提取关键词
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 64,
        messages: [
          {
            role: 'system',
            content: `Extract 3-5 academic/medical English keywords from the user's health question for searching PubMed and Semantic Scholar.

Rules:
- Use medical/scientific terminology (e.g., "post-lunch dip" instead of "afternoon sleepy", "circadian rhythm" instead of "body clock")
- Avoid colloquial time expressions like "3pm", "morning", use "afternoon", "circadian" instead
- Focus on physiological terms, symptoms, and mechanisms
- Return a comma-separated list only, no explanations`
          },
          { role: 'user', content: query.slice(0, 500) },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Keyword LLM failed:', response.status, await response.text());
      return fallbackKeywords(query);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const extracted = text
      .split(/[,;\n]/)
      .map((kw: string) => kw.trim())
      .filter(Boolean)
      .map((kw: string) => kw.toLowerCase());
    return dedupeStrings(extracted).slice(0, 7);
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return fallbackKeywords(query);
  }
}

function fallbackKeywords(query: string): string[] {
  return dedupeStrings(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token && !KEYWORD_FALLBACK_STOPWORDS.has(token))
  ).slice(0, 6);
}

/**
 * Search Semantic Scholar API with retry logic for rate limiting
 */
export async function searchSemanticScholar(query: string, limit: number, retries = 2): Promise<ScientificPaper[]> {
  if (!query) return [];

  const encodedQuery = encodeURIComponent(query);
  const url = `${SEMANTIC_SCHOLAR_API_BASE}/paper/search?query=${encodedQuery}&limit=${limit}&fields=${SEMANTIC_SCHOLAR_FIELDS}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (SEMANTIC_SCHOLAR_API_KEY) {
        headers['x-api-key'] = SEMANTIC_SCHOLAR_API_KEY;
      }

      const response = await fetch(url, { headers });

      // Handle rate limiting (429)
      if (response.status === 429) {
        console.warn(`⚠️ Semantic Scholar rate limited (attempt ${attempt + 1}/${retries + 1})`);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('❌ Semantic Scholar rate limit exceeded, skipping');
        return [];
      }

      if (!response.ok) {
        console.error('Semantic Scholar search failed:', response.status);
        return [];
      }

      const data = await response.json();
      const results = Array.isArray(data?.data) ? data.data : [];

      return results.map((paper: any): ScientificPaper => {
        const doi = paper?.externalIds?.DOI || null;
        return {
          id: paper.paperId,
          title: paper.title || 'Untitled',
          abstract: paper.abstract || '',
          url: paper.url || (doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${paper.paperId}`),
          year: paper.year ?? null,
          citationCount: typeof paper.citationCount === 'number' ? paper.citationCount : 0,
          doi,
          source: 'semantic_scholar',
        };
      });
    } catch (error) {
      console.error('Semantic Scholar fetch error:', error);
      if (attempt < retries) continue;
      return [];
    }
  }
  return [];
}

/**
 * Search Healthline knowledge base (from Supabase)
 * Healthline 没有公开 API，我们通过预存的知识库查询
 */
async function searchHealthline(query: string, limit: number): Promise<ScientificPaper[]> {
  try {
    // 动态导入 Supabase 客户端（避免循环依赖）
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase not configured, skipping Healthline search');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 搜索 knowledge_base 表中的 Healthline 文章
    // 使用全文搜索或关键词匹配
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 5);

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('id, paper_id, title, summary_zh, abstract, url, year, citation_count, keywords')
      .or(`url.ilike.%healthline.com%,source.eq.healthline`)
      .limit(limit);

    if (error) {
      console.error('Healthline search error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📚 Healthline: 知识库中暂无数据');
      return [];
    }

    // 按关键词相关性过滤和排序
    const scored = data
      .map(article => {
        const titleLower = (article.title || '').toLowerCase();
        const summaryLower = (article.summary_zh || article.abstract || '').toLowerCase();
        const articleKeywords = (article.keywords || []).map((k: string) => k.toLowerCase());

        // 计算关键词匹配分数
        let matchScore = 0;
        for (const kw of keywords) {
          if (titleLower.includes(kw)) matchScore += 3;
          if (summaryLower.includes(kw)) matchScore += 1;
          if (articleKeywords.some((ak: string) => ak.includes(kw))) matchScore += 2;
        }

        return { article, matchScore };
      })
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    console.log(`✅ Healthline: 找到 ${scored.length} 篇相关文章`);

    return scored.map(({ article }): ScientificPaper => ({
      id: `healthline_${article.paper_id || article.id}`,
      title: article.title || 'Untitled',
      abstract: article.summary_zh || article.abstract || '',
      url: article.url || 'https://www.healthline.com/',
      year: article.year || new Date().getFullYear(),
      citationCount: article.citation_count || 0,
      doi: null,
      source: 'healthline',
    }));

  } catch (error) {
    console.error('Healthline search error:', error);
    return [];
  }
}

/**
 * Search PubMed API (NCBI E-utilities) with retry logic
 */
export async function searchPubMed(query: string, limit: number, retries = 2): Promise<ScientificPaper[]> {
  if (!query) return [];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Step 1: Search for PMIDs
      // 将关键词用 OR 连接，提高召回率
      const pubmedQuery = query.split(' ').filter(w => w.length > 2).slice(0, 5).join(' OR ');
      const searchUrl = `${PUBMED_API_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(pubmedQuery)}&retmax=${limit}&retmode=json&sort=relevance`;
      console.log(`🔍 PubMed query: ${pubmedQuery}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

      const searchResponse = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      // Handle rate limiting (429)
      if (searchResponse.status === 429) {
        console.warn(`⚠️ PubMed rate limited (attempt ${attempt + 1}/${retries + 1})`);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('❌ PubMed rate limit exceeded, skipping');
        return [];
      }

      if (!searchResponse.ok) {
        console.error('PubMed search failed:', searchResponse.status);
        if (attempt < retries) continue;
        return [];
      }

      const searchData = await searchResponse.json();
      const pmids: string[] = searchData?.esearchresult?.idlist || [];

      console.log(`📋 PubMed found ${pmids.length} PMIDs`);

      if (pmids.length === 0) return [];

      // Step 2: Fetch paper details
      const fetchUrl = `${PUBMED_API_BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;

      const fetchController = new AbortController();
      const fetchTimeoutId = setTimeout(() => fetchController.abort(), 8000);

      const fetchResponse = await fetch(fetchUrl, { signal: fetchController.signal });
      clearTimeout(fetchTimeoutId);

      if (fetchResponse.status === 429) {
        console.warn(`⚠️ PubMed summary rate limited (attempt ${attempt + 1}/${retries + 1})`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        return [];
      }

      if (!fetchResponse.ok) {
        console.error('PubMed fetch failed:', fetchResponse.status);
        if (attempt < retries) continue;
        return [];
      }

      const fetchData = await fetchResponse.json();
      const results = fetchData?.result || {};

      const papers = pmids
        .filter(pmid => results[pmid] && results[pmid].title)
        .map((pmid): ScientificPaper => {
          const paper = results[pmid];
          const doi = paper.elocationid?.replace('doi: ', '') || null;
          const year = paper.pubdate ? parseInt(paper.pubdate.split(' ')[0], 10) : null;

          return {
            id: `pubmed_${pmid}`,
            title: paper.title || 'Untitled',
            abstract: '', // PubMed summary doesn't include abstract, would need efetch
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            year: isNaN(year as number) ? null : year,
            citationCount: 0, // PubMed doesn't provide citation count in esummary
            doi,
            source: 'pubmed',
          };
        });

      console.log(`✅ PubMed returned ${papers.length} papers`);
      return papers;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ PubMed timeout (attempt ${attempt + 1}/${retries + 1})`);
      } else {
        console.error('PubMed fetch error:', error.message);
      }
      if (attempt < retries) continue;
      return [];
    }
  }
  return [];
}

/**
 * Deduplicate papers by DOI or normalized title
 */
function dedupePapers(papers: ScientificPaper[]): ScientificPaper[] {
  const seen = new Set<string>();
  const normalizedTitle = (title: string) => title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  return papers.filter((paper) => {
    const key = (paper.doi ? `doi:${paper.doi.toLowerCase()}` : null) || `title:${normalizedTitle(paper.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Weighted Correction Algorithm:
 * CompositeScore = (Authority_Log * 0.4) + (Recency_Decay * 0.3) + (Source_Quality * 0.3)
 */
function rerankPapersWeighted(papers: ScientificPaper[]): RankedScientificPaper[] {
  if (!papers.length) return [];

  const nowYear = new Date().getFullYear();
  const maxCitations = Math.max(...papers.map((p) => p.citationCount || 0), 1);

  const scored = papers.map((paper) => {
    // Authority Score: Log-scaled citation count (0-1)
    const authority = Math.log10((paper.citationCount || 0) + 1) / Math.log10(maxCitations + 1);

    // Recency Score: Decay over 20 years (0-1)
    const recency = typeof paper.year === 'number'
      ? Math.max(0, Math.min(1, 1 - (nowYear - paper.year) / 20))
      : 0.3; // neutral baseline when year missing

    // Source Quality Score (0-1)
    const sourceQuality = SOURCE_QUALITY[paper.source] || 0.5;

    // Weighted Composite Score
    const composite =
      (authority * WEIGHT_AUTHORITY) +
      (recency * WEIGHT_RECENCY) +
      (sourceQuality * WEIGHT_SOURCE_QUALITY);

    return {
      ...paper,
      authorityScore: Number(authority.toFixed(4)),
      recencyScore: Number(recency.toFixed(4)),
      sourceQualityScore: Number(sourceQuality.toFixed(4)),
      compositeScore: Number(composite.toFixed(4)),
    };
  });

  return scored
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((paper, index) => ({ ...paper, rank: index + 1 }));
}

/**
 * Compute consensus level based on paper coverage and lexical agreement
 */
function computeConsensus(papers: ScientificPaper[], keywords: string[]): ConsensusResult {
  if (papers.length < 2) {
    return {
      score: 0.3,
      level: 'low',
      rationale: 'Limited evidence retrieved; consensus cannot be strongly inferred.',
    };
  }

  const cleanedKeywords = keywords.map((k) => k.toLowerCase());
  const abstracts = papers
    .map((p) => p.abstract)
    .filter((a) => typeof a === 'string' && a.trim().length > 0)
    .map((a) => a.toLowerCase());

  // If no abstracts (e.g., PubMed only), use title-based analysis
  const textsToAnalyze = abstracts.length > 0
    ? abstracts
    : papers.map(p => p.title.toLowerCase());

  if (!textsToAnalyze.length) {
    return {
      score: 0.35,
      level: 'emerging',
      rationale: 'No abstracts available to compare; treating consensus as emerging.',
    };
  }

  // Keyword coverage
  const coverageScores = textsToAnalyze.map((text) => {
    if (!cleanedKeywords.length) return 0.5;
    const matchCount = cleanedKeywords.filter((k) => text.includes(k)).length;
    return matchCount / cleanedKeywords.length;
  });
  const coverage = coverageScores.reduce((sum, v) => sum + v, 0) / coverageScores.length;

  // Pairwise lexical overlap (Jaccard similarity)
  const tokenized = textsToAnalyze.map((text) => new Set(text.split(/[^a-z0-9]+/).filter(Boolean)));
  let totalSim = 0;
  let pairs = 0;
  for (let i = 0; i < tokenized.length; i++) {
    for (let j = i + 1; j < tokenized.length; j++) {
      const a = tokenized[i];
      const b = tokenized[j];
      const intersection = new Set([...a].filter((x) => b.has(x)));
      const union = new Set([...a, ...b]);
      const sim = union.size > 0 ? intersection.size / union.size : 0;
      totalSim += sim;
      pairs += 1;
    }
  }
  const lexicalConsensus = pairs > 0 ? totalSim / pairs : 0;

  // Source diversity bonus (having both PubMed and Semantic Scholar increases confidence)
  const sources = new Set(papers.map(p => p.source));
  const diversityBonus = sources.size > 1 ? 0.1 : 0;

  const score = Math.max(0, Math.min(1, coverage * 0.4 + lexicalConsensus * 0.4 + diversityBonus + 0.1));

  const level: ConsensusResult['level'] =
    score >= 0.7 ? 'high' : score >= 0.5 ? 'emerging' : score >= 0.3 ? 'mixed' : 'low';

  return {
    score: Number(score.toFixed(3)),
    level,
    rationale: `Coverage=${coverage.toFixed(2)}, lexical=${lexicalConsensus.toFixed(2)}, sources=${sources.size}`,
  };
}

function dedupeStrings(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
