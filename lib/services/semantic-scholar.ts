/**
 * Semantic Scholar Service
 * 学术论文搜索服务 - 用于验证健康建议的科学依据
 * 
 * @module lib/services/semantic-scholar
 */

// ==================== 类型定义 ====================

export interface Paper {
  /** 论文 ID */
  paperId: string;
  /** 论文标题 */
  title: string;
  /** 论文摘要 */
  abstract: string;
  /** 引用数量 */
  citationCount: number;
  /** 论文 URL */
  url: string;
}

export interface SemanticScholarResponse {
  total: number;
  offset: number;
  next?: number;
  data: Array<{
    paperId: string;
    title: string;
    abstract: string | null;
    citationCount: number;
    url: string;
  }>;
}

// ==================== 配置 ====================

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1';
const MIN_CITATION_COUNT = 50;
const DEFAULT_LIMIT = 10;

// API Key（可选，有免费额度）
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

// ==================== 核心函数 ====================


/**
 * 从 Semantic Scholar API 搜索论文
 * 
 * @param query 搜索查询字符串
 * @param limit 返回结果数量限制
 * @returns 过滤后的论文数组（引用数 >= 50）
 */
export async function searchPapers(
  query: string,
  limit: number = DEFAULT_LIMIT
): Promise<Paper[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${SEMANTIC_SCHOLAR_API_BASE}/paper/search?query=${encodedQuery}&limit=${limit * 2}&fields=paperId,title,abstract,citationCount,url`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // 如果有 API Key，添加到请求头
    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`❌ Semantic Scholar API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: SemanticScholarResponse = await response.json();
    
    // 过滤引用数 < 50 的论文，并提取必要字段
    const filteredPapers = filterPapersByCitation(data.data, MIN_CITATION_COUNT);
    
    // 限制返回数量
    return filteredPapers.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Semantic Scholar API unavailable:', error);
    return [];
  }
}

/**
 * 过滤论文：只保留引用数 >= minCitations 的论文
 * 
 * @param papers 原始论文数组
 * @param minCitations 最小引用数阈值
 * @returns 过滤后的论文数组
 */
export function filterPapersByCitation(
  papers: Array<{
    paperId: string;
    title: string;
    abstract: string | null;
    citationCount: number;
    url: string;
  }>,
  minCitations: number = MIN_CITATION_COUNT
): Paper[] {
  return papers
    .filter(paper => paper.citationCount >= minCitations)
    .map(paper => ({
      paperId: paper.paperId,
      title: paper.title,
      abstract: paper.abstract || '',
      citationCount: paper.citationCount,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`
    }));
}


/**
 * Mock 摘要翻译函数
 * 将学术摘要转换为安慰性的健康洞察
 * 
 * 注意：这是一个占位符函数，未来将连接真正的 LLM 进行翻译
 * 
 * @param abstract 论文摘要
 * @returns 安慰性的健康洞察文本
 */
export function mockSummarize(abstract: string): string {
  if (!abstract || abstract.trim().length === 0) {
    return '这项研究为我们提供了有价值的健康见解。科学家们正在不断探索帮助我们更好生活的方法。';
  }
  
  // 提取摘要的前100个字符作为基础
  const preview = abstract.substring(0, 100);
  
  // 生成安慰性的健康洞察
  const insights = [
    `研究表明，${preview}... 这意味着我们可以通过科学的方法改善健康状况。`,
    `科学家发现，${preview}... 这为我们的健康管理提供了新的思路。`,
    `最新研究显示，${preview}... 这是一个令人鼓舞的发现，说明健康改善是可能的。`,
    `根据这项研究，${preview}... 我们可以更有信心地采取积极的健康措施。`
  ];
  
  // 随机选择一个洞察模板
  const randomIndex = Math.floor(Math.random() * insights.length);
  return insights[randomIndex];
}

/**
 * 搜索健康相关论文并生成洞察
 * 
 * @param healthTopic 健康话题
 * @returns 论文列表和生成的洞察
 */
export async function searchHealthPapers(healthTopic: string): Promise<{
  papers: Paper[];
  insights: string[];
}> {
  // 添加健康相关的搜索词
  const query = `${healthTopic} health wellness`;
  const papers = await searchPapers(query, 5);
  
  // 为每篇论文生成洞察
  const insights = papers.map(paper => mockSummarize(paper.abstract));
  
  return { papers, insights };
}

// ==================== 导出常量（用于测试） ====================

export const CONFIG = {
  MIN_CITATION_COUNT,
  DEFAULT_LIMIT,
  API_BASE: SEMANTIC_SCHOLAR_API_BASE
};
