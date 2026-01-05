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
  energyLevel?: number;
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
  journal: 0.75,
  research_institution: 0.7,
  university: 0.7,
  x: 0.45,
  reddit: 0.4,
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
// 个性化匹配辅助
// ============================================

type ArticleTheme = {
  key: string;
  labelEn: string;
  labelZh: string;
  actionEn: string;
  actionZh: string;
};

type UserSignalSet = {
  all: string[];
  metrics: string[];
};

const ARTICLE_THEMES: ArticleTheme[] = [
  {
    key: 'sleep',
    labelEn: 'sleep quality and circadian rhythm',
    labelZh: '睡眠质量与昼夜节律',
    actionEn: 'keep a consistent wake time and get 10-15 minutes of morning light',
    actionZh: '固定起床时间，并在早上晒 10-15 分钟自然光',
  },
  {
    key: 'stress',
    labelEn: 'stress regulation and cortisol',
    labelZh: '压力调节与皮质醇',
    actionEn: 'do 3-5 minutes of slow breathing (4-6 cadence)',
    actionZh: '做 3-5 分钟慢呼吸（4-6 节律）',
  },
  {
    key: 'exercise',
    labelEn: 'exercise and physical activity',
    labelZh: '运动与身体活动',
    actionEn: 'add a 10-minute brisk walk after lunch',
    actionZh: '午饭后安排 10 分钟快走',
  },
  {
    key: 'mindfulness',
    labelEn: 'mindfulness and attention',
    labelZh: '正念与注意力',
    actionEn: 'try a 5-minute body scan before bed',
    actionZh: '睡前做 5 分钟身体扫描',
  },
  {
    key: 'breathing',
    labelEn: 'breathing regulation',
    labelZh: '呼吸调节',
    actionEn: 'practice 4-7-8 breathing for 3 minutes',
    actionZh: '练习 4-7-8 呼吸 3 分钟',
  },
  {
    key: 'light',
    labelEn: 'light exposure and circadian cues',
    labelZh: '光照与昼夜节律线索',
    actionEn: 'get outdoor light within 30 minutes of waking',
    actionZh: '起床后 30 分钟内到户外晒光',
  },
  {
    key: 'nutrition',
    labelEn: 'nutrition and metabolic stability',
    labelZh: '营养与代谢稳定',
    actionEn: 'add protein and fiber at breakfast',
    actionZh: '早餐增加蛋白质与膳食纤维',
  },
  {
    key: 'hrv',
    labelEn: 'HRV and autonomic balance',
    labelZh: 'HRV 与自主神经平衡',
    actionEn: 'take a 2-minute paced-breathing break in the afternoon',
    actionZh: '下午做 2 分钟节律呼吸休息',
  },
  {
    key: 'general',
    labelEn: 'stress recovery and daily resilience',
    labelZh: '压力恢复与日常韧性',
    actionEn: 'start with one small, repeatable habit today',
    actionZh: '今天先做一个小而可重复的习惯',
  },
];

const THEME_PATTERNS: Array<{ key: ArticleTheme['key']; pattern: RegExp }> = [
  { key: 'sleep', pattern: /sleep|insomnia|circadian|melatonin|sleep quality|bedtime|失眠|睡眠|褪黑|昼夜|入睡|早醒/i },
  { key: 'stress', pattern: /stress|cortisol|anxiety|burnout|压力|皮质醇|焦虑|紧张/i },
  { key: 'exercise', pattern: /exercise|physical activity|aerobic|walking|运动|锻炼|散步|训练/i },
  { key: 'mindfulness', pattern: /mindfulness|meditation|正念|冥想|觉察/i },
  { key: 'breathing', pattern: /breath|breathing|respiration|呼吸|呼吸训练/i },
  { key: 'light', pattern: /light exposure|sunlight|outdoor|morning light|光照|日光|户外/i },
  { key: 'nutrition', pattern: /diet|nutrition|blood sugar|glucose|meal|饮食|营养|血糖|进食/i },
  { key: 'hrv', pattern: /hrv|heart rate variability|心率变异|自主神经/i },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant<T>(variants: T[], seed: string): T {
  if (variants.length === 0) {
    throw new Error('No variants available');
  }
  const index = hashString(seed) % variants.length;
  return variants[index];
}

function detectArticleTheme(contentText: string): ArticleTheme {
  for (const entry of THEME_PATTERNS) {
    if (entry.pattern.test(contentText)) {
      return ARTICLE_THEMES.find(theme => theme.key === entry.key) || ARTICLE_THEMES[ARTICLE_THEMES.length - 1];
    }
  }
  return ARTICLE_THEMES[ARTICLE_THEMES.length - 1];
}

function buildUserSignals(userContext: UserContext, language: string): UserSignalSet {
  const signals: string[] = [];
  const metricSignals: string[] = [];

  if (typeof userContext.sleepHours === 'number' && userContext.sleepHours > 0) {
    const hours = userContext.sleepHours >= 10 ? userContext.sleepHours.toFixed(0) : userContext.sleepHours.toFixed(1);
    const signal = language === 'en' ? `sleep ~${hours}h` : `睡眠≈${hours}小时`;
    signals.push(signal);
    metricSignals.push(signal);
  }

  if (typeof userContext.stressLevel === 'number' && userContext.stressLevel > 0) {
    const signal = language === 'en' ? `stress ${userContext.stressLevel}/10` : `压力${userContext.stressLevel}/10`;
    signals.push(signal);
    metricSignals.push(signal);
  }

  if (typeof userContext.energyLevel === 'number' && userContext.energyLevel > 0) {
    const signal = language === 'en' ? `energy ${userContext.energyLevel}/10` : `精力${userContext.energyLevel}/10`;
    signals.push(signal);
    metricSignals.push(signal);
  }

  if (userContext.currentFocus) {
    signals.push(language === 'en' ? `focus: ${userContext.currentFocus}` : `关注：${userContext.currentFocus}`);
  }

  if (userContext.primaryConcern) {
    signals.push(language === 'en' ? `primary concern: ${userContext.primaryConcern}` : `关注点：${userContext.primaryConcern}`);
  }

  if (userContext.focusTopics && userContext.focusTopics.length > 0) {
    const topics = userContext.focusTopics.slice(0, 2).join(language === 'en' ? ', ' : '、');
    signals.push(language === 'en' ? `topics: ${topics}` : `关注主题：${topics}`);
  }

  return { all: signals, metrics: metricSignals };
}

function applyTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function hasLatin(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

function sanitizeLanguageText(text: string | undefined, language: string, fallback: string): string {
  const trimmed = text?.trim();
  if (!trimmed) return fallback;
  if (language !== 'en' && !hasChinese(trimmed)) return fallback;
  if (language === 'en' && !hasLatin(trimmed)) return fallback;
  return trimmed;
}

function buildMatchNote(
  signalSet: UserSignalSet,
  theme: ArticleTheme,
  language: string,
  seed: string
): string {
  const themeLabel = language === 'en' ? theme.labelEn : theme.labelZh;
  const pool = signalSet.metrics.length > 0 ? signalSet.metrics : signalSet.all;

  if (pool.length === 0) {
    return language === 'en'
      ? `No recent metrics logged yet; this article focuses on ${themeLabel} as a starting point.`
      : `你暂未记录当日指标，这篇文章聚焦${themeLabel}，可先作为参考。`;
  }

  const signal = pickVariant(pool, `${seed}-signal`);
  const templates = language === 'en'
    ? [
      'Match: {signal}. This article focuses on {theme}.',
      'Why you: {signal}, and this study addresses {theme}.',
      'Relevance: {signal}; the paper digs into {theme}.',
    ]
    : [
      '匹配点：{signal}，文章聚焦{theme}。',
      '与你{signal}相关，这篇研究讨论{theme}。',
      '基于{signal}，该研究针对{theme}的证据很对标。',
    ];

  return applyTemplate(pickVariant(templates, `${seed}-${theme.key}`), {
    signal,
    theme: themeLabel,
  });
}

function buildActionNote(
  signalSet: UserSignalSet,
  theme: ArticleTheme,
  language: string,
  seed: string
): string {
  const action = language === 'en' ? theme.actionEn : theme.actionZh;
  if (!action) return '';

  const pool = signalSet.metrics.length > 0 ? signalSet.metrics : signalSet.all;
  const signal = pool.length > 0 ? pickVariant(pool, `${seed}-action`) : '';
  const templates = language === 'en'
    ? [
      signal ? 'Action: {action} (tailored to {signal}).' : 'Action: {action}.',
      signal ? 'Try: {action} given your {signal}.' : 'Try: {action} today.',
      signal ? 'Start with {action} to support your {signal}.' : 'Start with {action}.',
    ]
    : [
      signal ? '可执行：{action}（结合{signal}）。' : '可执行：{action}。',
      signal ? '建议你先做：{action}，以匹配{signal}。' : '建议你先做：{action}。',
      signal ? '从{action}开始，有助于改善{signal}。' : '从{action}开始，建立稳定节奏。',
    ];

  return applyTemplate(pickVariant(templates, `${seed}-${theme.key}-action`), {
    action,
    signal,
  });
}

function mergePersonalizedText(base: string | undefined, addon: string, language: string): string {
  let trimmedBase = base?.trim();
  const trimmedAddon = addon.trim();

  if (trimmedBase) {
    if (language !== 'en' && !hasChinese(trimmedBase)) {
      trimmedBase = '';
    }
    if (language === 'en' && !hasLatin(trimmedBase)) {
      trimmedBase = '';
    }
  }

  if (!trimmedBase) return trimmedAddon;
  if (!trimmedAddon) return trimmedBase;
  if (trimmedBase.includes(trimmedAddon)) return trimmedBase;

  const needsPunctuation = language === 'en'
    ? !/[.!?]$/.test(trimmedBase)
    : !/[。！？]$/.test(trimmedBase);

  const joiner = needsPunctuation ? (language === 'en' ? '. ' : '。') : (language === 'en' ? ' ' : '');
  return `${trimmedBase}${joiner}${trimmedAddon}`;
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
      
      const theme = detectArticleTheme(article.content_text);
      const signalSet = buildUserSignals(userContext, language);
      const signals = signalSet.all;
      const matchNote = buildMatchNote(signalSet, theme, language, article.content_text);
      const actionNote = buildActionNote(signalSet, theme, language, article.content_text);
      const themeLabel = language === 'en' ? theme.labelEn : theme.labelZh;
      const actionHint = language === 'en' ? theme.actionEn : theme.actionZh;

      const userContextStr = [
        userContext.primaryConcern && (language === 'en' ? `Primary concern: ${userContext.primaryConcern}` : `主要关注: ${userContext.primaryConcern}`),
        userContext.currentFocus && (language === 'en' ? `Current focus: ${userContext.currentFocus}` : `当前症状: ${userContext.currentFocus}`),
        userContext.stressLevel && (language === 'en' ? `Stress level: ${userContext.stressLevel}/10` : `压力水平: ${userContext.stressLevel}/10`),
        userContext.sleepHours && (language === 'en' ? `Sleep duration: ${userContext.sleepHours}h` : `睡眠时长: ${userContext.sleepHours}小时`),
        userContext.energyLevel && (language === 'en' ? `Energy level: ${userContext.energyLevel}/10` : `精力水平: ${userContext.energyLevel}/10`),
        userContext.recentMood && (language === 'en' ? `Recent mood: ${userContext.recentMood}` : `近期情绪: ${userContext.recentMood}`),
      ].filter(Boolean).join(language === 'en' ? ', ' : '，');

      const userSignalsStr = signals.join(language === 'en' ? ', ' : '、');

      const prompt = language === 'en' 
        ? `Analyze this research article for a user.

User metrics/signals: ${userSignalsStr || 'Not enough data, use the article focus and stated goals if any.'}
User profile: ${userContextStr || 'anxiety and stress management'}
Article focus: ${themeLabel}
Suggested action direction: ${actionHint}

Article content:
${article.content_text.slice(0, 2000)}

Requirements:
- Output in English only.
- "why_recommended" must mention at least ONE user metric/signal from the list above.
- "actionable_insight" must tie the article focus to ONE concrete action, adjusted to the user's metrics.
- Avoid generic templates; be specific to this article and this user.

Respond in JSON format only (no markdown):
{
  "title": "Clear, engaging title (max 80 chars)",
  "summary": "2-3 sentence summary of key findings",
  "why_recommended": "1-2 sentences explaining why this is relevant to the user",
  "actionable_insight": "1 specific action the user can take based on this research",
  "tags": ["tag1", "tag2", "tag3"]
}`
        : `分析这篇研究文章，为以下用户提供个性化解读：${userContextStr || '焦虑与压力管理'}

用户数据/指标：${userSignalsStr || '数据不足，优先结合文章主题与用户关注点'}
文章主题：${themeLabel}
行动建议方向：${actionHint}

文章内容：
${article.content_text.slice(0, 2000)}

要求：
- 只用中文输出。
- "why_recommended" 必须点名至少 1 个用户数据/指标。
- "actionable_insight" 必须结合文章主题 + 用户指标给出具体行动。
- 避免模板化措辞，必须针对此文和该用户。

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
        const fallbackTitle = language === 'en'
          ? extractFallbackTitle(article.content_text)
          : `${themeLabel}：研究要点`;
        const fallbackSummary = language === 'en'
          ? extractFallbackSummary(article.content_text)
          : `这篇研究围绕${themeLabel}展开，建议结合你的当前指标阅读核心结论。`;

        return {
          title: sanitizeLanguageText(parsed.title, language, fallbackTitle),
          summary: sanitizeLanguageText(parsed.summary, language, fallbackSummary),
          why_recommended: mergePersonalizedText(parsed.why_recommended, matchNote, language),
          actionable_insight: mergePersonalizedText(parsed.actionable_insight, actionNote, language),
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
  const fallbackTheme = detectArticleTheme(article.content_text);
  const fallbackSignalSet = buildUserSignals(userContext, language);
  const fallbackMatchNote = buildMatchNote(fallbackSignalSet, fallbackTheme, language, article.content_text);
  const fallbackActionNote = buildActionNote(fallbackSignalSet, fallbackTheme, language, article.content_text);
  const fallbackThemeLabel = language === 'en' ? fallbackTheme.labelEn : fallbackTheme.labelZh;
  return {
    title: language === 'en'
      ? extractFallbackTitle(article.content_text)
      : `${fallbackThemeLabel}：研究要点`,
    summary: language === 'en'
      ? extractFallbackSummary(article.content_text)
      : `这篇研究围绕${fallbackThemeLabel}展开，建议结合你的当前指标阅读核心结论。`,
    why_recommended: fallbackMatchNote,
    actionable_insight: fallbackActionNote || (language === 'en' ? 'Explore the research findings' : '探索研究发现'),
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
