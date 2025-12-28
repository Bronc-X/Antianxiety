/**
 * Feed Enricher - 使用 LLM 为文章生成个性化解释
 * 
 * 匹配度权重设计：
 * - 向量相似度 (40%): 用户画像与文章内容的语义相似度
 * - 主题匹配 (30%): 文章主题与用户关注点的匹配程度
 * - 时效性 (15%): 文章发布时间的新鲜度
 * - 来源权威性 (15%): 期刊/平台的学术权威度
 */

import { generateText } from 'ai';
import { aiClient, logModelCall } from '@/lib/ai/model-config';

// ============================================
// Types
// ============================================

export interface EnrichedFeedItem {
  id: string | number;
  source_url: string;
  source_type: string;
  title: string;
  summary: string;
  content_text: string;
  published_at: string | null;
  relevance_score: number;
  why_recommended: string;
  actionable_insight: string;
  tags: string[];
  match_percentage: number;
  // 权重明细（调试用）
  weight_breakdown?: {
    similarity: number;
    topic_match: number;
    freshness: number;
    authority: number;
  };
}

export interface UserContext {
  primaryConcern?: string;
  currentFocus?: string;
  stressLevel?: number;
  sleepHours?: number;
  recentMood?: string;
  focusTopics?: string[];
}

// ============================================
// 权重配置
// ============================================

const WEIGHTS = {
  SIMILARITY: 0.40,    // 向量相似度权重
  TOPIC_MATCH: 0.30,   // 主题匹配权重
  FRESHNESS: 0.15,     // 时效性权重
  AUTHORITY: 0.15,     // 来源权威性权重
};

// 来源权威性评分 (0-1)
const SOURCE_AUTHORITY: Record<string, number> = {
  pubmed: 0.95,           // PubMed - 顶级医学数据库
  semantic_scholar: 0.85, // Semantic Scholar - 学术搜索
  nature: 1.0,            // Nature - 顶级期刊
  science: 1.0,           // Science - 顶级期刊
  lancet: 0.98,           // The Lancet - 顶级医学期刊
  cell: 0.98,             // Cell - 顶级生物期刊
  default: 0.60,          // 其他来源
};

// ============================================
// 权重计算函数
// ============================================

/**
 * 计算时效性分数 (0-1)
 * 越新的文章分数越高
 */
function calculateFreshnessScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.5; // 无日期默认中等分数
  
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // 7天内: 1.0, 30天内: 0.8, 90天内: 0.6, 1年内: 0.4, 更早: 0.2
  if (daysDiff <= 7) return 1.0;
  if (daysDiff <= 30) return 0.8;
  if (daysDiff <= 90) return 0.6;
  if (daysDiff <= 365) return 0.4;
  return 0.2;
}

/**
 * 计算来源权威性分数 (0-1)
 */
function calculateAuthorityScore(sourceType: string): number {
  return SOURCE_AUTHORITY[sourceType] || SOURCE_AUTHORITY.default;
}

/**
 * 计算主题匹配分数 (0-1)
 * 基于用户关注点与文章内容的关键词匹配
 */
function calculateTopicMatchScore(
  contentText: string,
  userContext: UserContext
): number {
  const content = contentText.toLowerCase();
  let matchCount = 0;
  let totalTopics = 0;
  
  // 检查用户关注的主题
  const userTopics: string[] = [];
  
  if (userContext.primaryConcern) {
    userTopics.push(...userContext.primaryConcern.toLowerCase().split(/[,，\s]+/));
  }
  if (userContext.currentFocus) {
    userTopics.push(...userContext.currentFocus.toLowerCase().split(/[,，\s]+/));
  }
  if (userContext.focusTopics) {
    userTopics.push(...userContext.focusTopics.map(t => t.toLowerCase()));
  }
  
  // 添加焦虑相关的通用关键词
  const anxietyKeywords = [
    'anxiety', 'stress', 'sleep', 'mood', 'depression', 'mindfulness',
    'meditation', 'breathing', 'relaxation', 'cortisol', 'nervous',
    '焦虑', '压力', '睡眠', '情绪', '抑郁', '正念', '冥想', '呼吸', '放松'
  ];
  
  const allTopics = [...new Set([...userTopics, ...anxietyKeywords])].filter(t => t.length > 1);
  totalTopics = allTopics.length;
  
  if (totalTopics === 0) return 0.5; // 无主题默认中等分数
  
  for (const topic of allTopics) {
    if (content.includes(topic)) {
      matchCount++;
    }
  }
  
  return Math.min(1, matchCount / Math.min(totalTopics, 10)); // 最多匹配10个主题
}

/**
 * 计算综合匹配度百分比
 */
function calculateMatchPercentage(
  similarityScore: number,
  topicMatchScore: number,
  freshnessScore: number,
  authorityScore: number
): number {
  const weightedScore = 
    similarityScore * WEIGHTS.SIMILARITY +
    topicMatchScore * WEIGHTS.TOPIC_MATCH +
    freshnessScore * WEIGHTS.FRESHNESS +
    authorityScore * WEIGHTS.AUTHORITY;
  
  // 转换为百分比 (60-99 范围，避免显示 100%)
  return Math.round(Math.max(60, Math.min(99, weightedScore * 40 + 60)));
}

// ============================================
// LLM 丰富函数
// ============================================

/**
 * 使用 LLM 为单篇文章生成个性化解释
 * 同时生成：标题、摘要、推荐理由、行动建议、标签
 */
async function enrichSingleArticle(
  article: { content_text: string; source_type: string },
  userContext: UserContext,
  language: string
): Promise<{
  title: string;
  summary: string;
  why_recommended: string;
  actionable_insight: string;
  tags: string[];
}> {
  // 尝试多个模型，按优先级
  const modelsToTry = [
    process.env.FEED_ENRICHMENT_MODEL,
    'deepseek-v3.2-exp',
    'claude-sonnet-4-20250514',
  ].filter(Boolean) as string[];

  for (const modelName of modelsToTry) {
    try {
      logModelCall(modelName, 'feed-enrichment');
      
      const userContextStr = [
        userContext.primaryConcern && `主要关注: ${userContext.primaryConcern}`,
        userContext.currentFocus && `当前症状: ${userContext.currentFocus}`,
        userContext.stressLevel && `压力水平: ${userContext.stressLevel}/10`,
        userContext.sleepHours && `睡眠时长: ${userContext.sleepHours}小时`,
        userContext.recentMood && `近期情绪: ${userContext.recentMood}`,
      ].filter(Boolean).join(', ');

      const prompt = language === 'en' 
        ? `Analyze this research article for a user focused on: ${userContextStr || 'anxiety and stress management'}

Article content:
${article.content_text.slice(0, 2000)}

Respond in JSON format only (no markdown):
{
  "title": "Clear, engaging title (max 80 chars)",
  "summary": "2-3 sentence summary of key findings",
  "why_recommended": "1-2 sentences explaining why this is relevant to the user",
  "actionable_insight": "1 specific action the user can take based on this research",
  "tags": ["tag1", "tag2", "tag3"]
}`
        : `分析这篇研究文章，为以下用户提供个性化解读：${userContextStr || '焦虑与压力管理'}

文章内容：
${article.content_text.slice(0, 2000)}

请只用 JSON 格式回复（不要 markdown）：
{
  "title": "清晰吸引人的标题（最多40字）",
  "summary": "2-3句话总结核心发现",
  "why_recommended": "1-2句话解释为什么这篇文章与用户相关",
  "actionable_insight": "1个用户可以立即采取的具体行动建议",
  "tags": ["标签1", "标签2", "标签3"]
}`;

      const { text } = await generateText({
        model: aiClient(modelName),
        prompt,
        maxTokens: 600,
      });

      // 解析 JSON 响应
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || extractFallbackTitle(article.content_text),
          summary: parsed.summary || extractFallbackSummary(article.content_text),
          why_recommended: parsed.why_recommended || '',
          actionable_insight: parsed.actionable_insight || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        };
      }
      
      // JSON 解析失败，继续尝试下一个模型
      console.warn(`Model ${modelName} returned invalid JSON, trying next...`);
      
    } catch (error) {
      console.error(`Model ${modelName} failed:`, error instanceof Error ? error.message : error);
      // 继续尝试下一个模型
    }
  }

  // 所有模型都失败，使用 fallback
  console.error('All models failed, using fallback');
  return {
    title: extractFallbackTitle(article.content_text),
    summary: extractFallbackSummary(article.content_text),
    why_recommended: language === 'en' ? 'Matches your interests' : '符合你的兴趣',
    actionable_insight: language === 'en' ? 'Explore the research findings' : '探索研究发现',
    tags: [],
  };
}

/**
 * Fallback: 从文章内容中提取标题
 */
function extractFallbackTitle(contentText: string): string {
  const lines = contentText.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    return lines[0].slice(0, 100);
  }
  return contentText.slice(0, 80);
}

/**
 * Fallback: 从文章内容中提取摘要
 */
function extractFallbackSummary(contentText: string): string {
  const lines = contentText.split('\n').filter(l => l.trim());
  if (lines.length > 1) {
    return lines.slice(1, 4).join(' ').slice(0, 250);
  }
  return contentText.slice(0, 200);
}

// ============================================
// 主函数
// ============================================

/**
 * 批量丰富文章内容
 */
export async function enrichFeedItems(
  items: Array<{
    id: string | number;
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
    relevance_score?: number | null;
  }>,
  userContext: UserContext,
  language: string
): Promise<EnrichedFeedItem[]> {
  const enrichedItems: EnrichedFeedItem[] = [];

  // 并行处理，限制并发数为 2（减少 API 压力）
  const batchSize = 2;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const enrichedBatch = await Promise.all(
      batch.map(async (item) => {
        // 计算各项权重分数
        const similarityScore = Number(item.relevance_score ?? 0);
        const topicMatchScore = calculateTopicMatchScore(item.content_text, userContext);
        const freshnessScore = calculateFreshnessScore(item.published_at);
        const authorityScore = calculateAuthorityScore(item.source_type);
        
        // 计算综合匹配度
        const matchPercentage = calculateMatchPercentage(
          similarityScore,
          topicMatchScore,
          freshnessScore,
          authorityScore
        );
        
        // LLM 丰富内容
        const enrichment = await enrichSingleArticle(
          { content_text: item.content_text, source_type: item.source_type },
          userContext,
          language
        );

        return {
          id: item.id,
          source_url: item.source_url,
          source_type: item.source_type,
          title: enrichment.title,
          summary: enrichment.summary,
          content_text: item.content_text,
          published_at: item.published_at,
          relevance_score: similarityScore,
          why_recommended: enrichment.why_recommended,
          actionable_insight: enrichment.actionable_insight,
          tags: enrichment.tags,
          match_percentage: matchPercentage,
          weight_breakdown: {
            similarity: Math.round(similarityScore * 100),
            topic_match: Math.round(topicMatchScore * 100),
            freshness: Math.round(freshnessScore * 100),
            authority: Math.round(authorityScore * 100),
          },
        };
      })
    );

    enrichedItems.push(...enrichedBatch);
  }

  // 按匹配度排序（从高到低）
  return enrichedItems.sort((a, b) => b.match_percentage - a.match_percentage);
}
