import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { aggregateContent, type AggregatedContent } from '@/lib/content-aggregator';
import { trendingTopics } from '@/data/trendingTopics';
import { calculateTagRelevanceBoost } from '@/lib/feed-curation';

export const runtime = 'nodejs';

type CuratedSource = 'pubmed' | 'semantic_scholar' | 'youtube' | 'x' | 'reddit';

interface CuratedFeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: CuratedSource;
  sourceLabel: string;
  matchScore: number;
  publishedAt?: string | null;
  author?: string | null;
  thumbnail?: string | null;
  language: 'zh' | 'en';
  matchedTags: string[];
  benefit: string;
}

const TAG_KEYWORD_MAP: Record<string, string[]> = {
  '高皮质醇风险': ['cortisol', 'stress response', 'anxiety disorder'],
  '重度焦虑': ['severe anxiety', 'GAD treatment', 'anxiolytic therapy'],
  '亚健康状态': ['sub-health', 'fatigue syndrome', 'wellness intervention'],
  '慢性疲劳': ['chronic fatigue', 'mitochondrial function', 'energy metabolism'],
  '情绪困扰': ['mood disorder', 'emotional regulation', 'depression treatment'],
  '免疫力差': ['immune function', 'inflammation markers', 'immunomodulation'],
  '睡眠问题': ['sleep quality', 'insomnia treatment', 'circadian rhythm'],
  '失眠': ['insomnia', 'sleep disorder', 'melatonin'],
  default: ['mental health', 'stress management', 'HRV biofeedback', 'mindfulness'],
};

function isChinese(text: string): boolean {
  const matches = text.match(/[\u4e00-\u9fff]/g);
  if (!matches) return false;
  return matches.length / Math.max(text.length, 1) > 0.08;
}

function detectLanguage(text: string): 'zh' | 'en' {
  return isChinese(text) ? 'zh' : 'en';
}

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function expandKeywords(tags: string[]): string[] {
  const keywords: string[] = [];
  for (const tag of tags) {
    keywords.push(...(TAG_KEYWORD_MAP[tag] || []));
  }
  if (keywords.length === 0) {
    keywords.push(...TAG_KEYWORD_MAP.default);
  }
  return [...new Set(keywords)];
}

function calculateKeywordMatchScore(title: string, summary: string, keywords: string[]): number {
  const text = `${title} ${summary}`.toLowerCase();
  let hits = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      hits += 1;
    }
  }
  const hitRate = keywords.length > 0 ? hits / keywords.length : 0;
  return Math.min(100, Math.round(70 + hitRate * 30));
}

function clampScore(value: number) {
  return Math.max(60, Math.min(100, Math.round(value)));
}

function getSourceLabel(source: CuratedSource): string {
  const map: Record<CuratedSource, string> = {
    pubmed: 'PubMed',
    semantic_scholar: 'Semantic Scholar',
    youtube: 'YouTube',
    x: 'X',
    reddit: 'Reddit',
  };
  return map[source] || source;
}

function pickThemeTag(tags: string[], text: string): string {
  const combined = `${tags.join(' ')} ${text}`.toLowerCase();
  if (/(sleep|insomnia|circadian|睡眠|失眠|褪黑)/i.test(combined)) return 'sleep';
  if (/(stress|cortisol|anxiety|压力|皮质醇|焦虑)/i.test(combined)) return 'stress';
  if (/(energy|fatigue|metabolism|能量|疲劳|代谢)/i.test(combined)) return 'energy';
  if (/(nutrition|diet|营养|饮食)/i.test(combined)) return 'nutrition';
  if (/(exercise|fitness|运动|健身|训练)/i.test(combined)) return 'movement';
  if (/(habit|习惯|行为)/i.test(combined)) return 'habit';
  return 'general';
}

/**
 * 使用 AI 生成真正个性化的推荐理由
 * 完全基于用户实际填写的数据，不使用任何虚假的"关注"声明
 */
async function generateAIBenefit(params: {
  title: string;
  summary: string;
  matchedTags: string[];
  userContext: {
    tags: string[];
    focusTopics: string[];
    sleepHours?: number | null;
    stressLevel?: number | null;
    energyLevel?: number | null;
    gadScore?: number | null;
    phqScore?: number | null;
    isiScore?: number | null;
    inquiryInsights?: Record<string, string>;
  };
  isZh: boolean;
}): Promise<string> {
  const { title, summary, userContext, isZh } = params;

  // 构建用户真实数据描述
  const userDataPoints: string[] = [];
  const contentRelevance: string[] = [];

  // 1. 问卷评估结果 - 这是用户真正填写的
  if (userContext.gadScore !== null && userContext.gadScore !== undefined && userContext.gadScore >= 5) {
    const severity = userContext.gadScore >= 15 ? (isZh ? '重度' : 'severe')
      : userContext.gadScore >= 10 ? (isZh ? '中度' : 'moderate')
        : (isZh ? '轻度' : 'mild');
    userDataPoints.push(isZh ? `你的焦虑评估显示${severity}症状` : `your anxiety assessment shows ${severity} symptoms`);
  }

  if (userContext.phqScore !== null && userContext.phqScore !== undefined && userContext.phqScore >= 10) {
    userDataPoints.push(isZh ? '你的情绪评估显示需要关注' : 'your mood assessment needs attention');
  }

  if (userContext.isiScore !== null && userContext.isiScore !== undefined && userContext.isiScore >= 15) {
    userDataPoints.push(isZh ? '你的睡眠评估显示存在障碍' : 'your sleep assessment shows issues');
  }

  // 2. 每日校准数据 - 这是用户实际记录的
  if (typeof userContext.sleepHours === 'number' && userContext.sleepHours < 6.5 && userContext.sleepHours > 0) {
    userDataPoints.push(isZh ? `你记录的睡眠时长为${userContext.sleepHours.toFixed(1)}小时` : `you logged ${userContext.sleepHours.toFixed(1)}h of sleep`);
  }

  if (typeof userContext.stressLevel === 'number' && userContext.stressLevel >= 7) {
    userDataPoints.push(isZh ? `你记录的压力为${userContext.stressLevel}/10` : `you logged stress at ${userContext.stressLevel}/10`);
  }

  if (typeof userContext.energyLevel === 'number' && userContext.energyLevel <= 4 && userContext.energyLevel > 0) {
    userDataPoints.push(isZh ? `你记录的能量为${userContext.energyLevel}/10` : `you logged energy at ${userContext.energyLevel}/10`);
  }

  // 3. 主动问询回答 - 这是用户亲自回复的
  if (userContext.inquiryInsights) {
    const insights = userContext.inquiryInsights;
    if (insights.recentSleepPattern === 'poor') {
      userDataPoints.push(isZh ? '你在问询中反馈睡眠质量差' : 'you reported poor sleep quality');
    }
    if (insights.recentStressLevel === 'high') {
      userDataPoints.push(isZh ? '你在问询中反馈压力较大' : 'you reported high stress');
    }
    if (insights.recentMood === 'bad') {
      userDataPoints.push(isZh ? '你在问询中反馈情绪不佳' : 'you reported low mood');
    }
  }

  // 如果没有任何用户数据，诚实说明
  if (userDataPoints.length === 0) {
    return isZh
      ? `这是一篇关于健康科学的内容。完成临床评估和每日记录后，我们会根据你的实际数据推荐更相关的内容。`
      : `This is general health science content. Complete clinical assessments and daily logs for personalized recommendations.`;
  }

  // 根据文章内容和用户数据的匹配生成理由
  const articleText = (title + ' ' + summary).toLowerCase();

  // 睡眠相关匹配
  if (/sleep|睡眠|insomnia|失眠|circadian|昼夜|melatonin|褪黑/i.test(articleText)) {
    if (userContext.sleepHours && userContext.sleepHours < 7) {
      contentRelevance.push(isZh
        ? '这篇关于睡眠的研究可能帮助你改善目前的睡眠状况'
        : 'this sleep research may help improve your current sleep');
    } else if (userContext.isiScore && userContext.isiScore >= 10) {
      contentRelevance.push(isZh
        ? '基于你的睡眠评估结果，这篇内容可能对你有帮助'
        : 'based on your sleep assessment, this content may help');
    }
  }

  // 压力/焦虑相关匹配
  if (/stress|压力|cortisol|皮质醇|anxiety|焦虑|calm|放松/i.test(articleText)) {
    if (userContext.stressLevel && userContext.stressLevel >= 7) {
      contentRelevance.push(isZh
        ? '考虑到你目前的压力水平，这篇内容可能提供有用的策略'
        : 'given your stress level, this may provide useful strategies');
    } else if (userContext.gadScore && userContext.gadScore >= 5) {
      contentRelevance.push(isZh
        ? '基于你的焦虑评估结果，这篇关于压力管理的内容与你相关'
        : 'based on your anxiety assessment, this stress content is relevant');
    }
  }

  // 能量/疲劳相关匹配
  if (/energy|能量|fatigue|疲劳|metabolism|代谢|mitochondria|线粒体/i.test(articleText)) {
    if (userContext.energyLevel && userContext.energyLevel <= 4) {
      contentRelevance.push(isZh
        ? '针对你记录的能量状态，这篇研究可能帮助你提升活力'
        : 'based on your energy level, this may help boost vitality');
    }
  }

  // 组合最终理由
  if (isZh) {
    const dataContext = userDataPoints.length > 0 ? `根据${userDataPoints.slice(0, 2).join('、')}，` : '';
    const relevance = contentRelevance.length > 0 ? contentRelevance[0] : '这篇内容与你的健康状况相关';
    return `${dataContext}${relevance}。`;
  } else {
    const dataContext = userDataPoints.length > 0 ? `Based on ${userDataPoints.slice(0, 2).join(' and ')}, ` : '';
    const relevance = contentRelevance.length > 0 ? contentRelevance[0] : 'this content relates to your health';
    return `${dataContext}${relevance}.`;
  }
}

function mapAggregatedContent(item: AggregatedContent): Omit<CuratedFeedItem, 'matchScore' | 'benefit'> {
  const summary = item.summary?.trim() || '';
  const text = `${item.title} ${summary}`;
  return {
    id: item.id,
    title: item.title,
    summary,
    url: item.url,
    source: item.source,
    sourceLabel: getSourceLabel(item.source),
    publishedAt: item.publishedAt,
    author: item.author || null,
    thumbnail: item.thumbnail || null,
    language: detectLanguage(text),
    matchedTags: item.matchedTags || [],
  };
}

function mapTrendingContent(item: (typeof trendingTopics)[number]): Omit<CuratedFeedItem, 'matchScore' | 'benefit'> {
  const text = `${item.title} ${item.summary}`;
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    url: item.url,
    source: item.source === 'X' ? 'x' : 'reddit',
    sourceLabel: item.source,
    publishedAt: null,
    author: item.author || item.community || null,
    thumbnail: null,
    language: detectLanguage(text),
    matchedTags: item.tags || [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 5), 20);
    const cursor = Math.max(parseInt(searchParams.get('cursor') || '0', 10), 0);
    const cycle = Math.max(parseInt(searchParams.get('cycle') || '0', 10), 0);
    const language = searchParams.get('language') || 'en';
    const isZh = language.startsWith('zh');
    const excludeParam = searchParams.get('exclude');
    const excludeIds = new Set((excludeParam || '').split(',').map((id) => id.trim()).filter(Boolean));

    let userTags: string[] = [];
    let focusTopics: string[] = [];
    let userSignals: { sleepHours?: number | null; stressLevel?: number | null; energyLevel?: number | null } = {};

    if (userId) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('inferred_scale_scores, metabolic_profile, primary_focus_topics, sleep_hours, stress_level, energy_level')
        .eq('id', userId)
        .single();

      if (profile) {
        const scores = profile.inferred_scale_scores as any;
        if (scores?.GAD7?.score >= 10) userTags.push('高皮质醇风险');
        if (scores?.GAD7?.score >= 15) userTags.push('重度焦虑');
        if (scores?.ISI?.score >= 15) userTags.push('失眠');

        const metabolic = profile.metabolic_profile as any;
        if (Array.isArray(metabolic?.tags)) {
          userTags.push(...metabolic.tags);
        }

        if (Array.isArray(profile.primary_focus_topics)) {
          focusTopics = profile.primary_focus_topics;
        }

        userSignals = {
          sleepHours: typeof profile.sleep_hours === 'number' ? profile.sleep_hours : null,
          stressLevel: typeof profile.stress_level === 'number' ? profile.stress_level : null,
          energyLevel: typeof profile.energy_level === 'number' ? profile.energy_level : null,
        };
      }

      // 🆕 获取 Inquiry 上下文并调整推荐策略
      try {
        const { getInquiryContext } = await import('@/lib/inquiry-context');
        const inquiryContext = await getInquiryContext(userId);
        const { insights, suggestedTopics } = inquiryContext;

        // 根据 inquiry insights 调整标签和关键词
        if (insights.recentSleepPattern === 'poor') {
          userTags.push('睡眠问题');
          focusTopics.push('sleep_optimization', 'circadian_rhythm');
          console.log('📋 Inquiry: 检测到睡眠不足，优先推荐睡眠相关内容');
        }

        if (insights.recentStressLevel === 'high') {
          userTags.push('高皮质醇风险');
          focusTopics.push('stress_management', 'cortisol_regulation');
          console.log('📋 Inquiry: 检测到高压力，优先推荐压力管理内容');
        }

        if (insights.recentExercise === 'none') {
          focusTopics.push('exercise_benefits', 'zone2_cardio');
          console.log('📋 Inquiry: 检测到缺乏运动，推荐运动相关内容');
        }

        if (insights.recentMood === 'bad') {
          userTags.push('情绪困扰');
          focusTopics.push('mental_health', 'neurotransmitters');
          console.log('📋 Inquiry: 检测到情绪不佳，推荐心理健康内容');
        }

        // 添加 inquiry 建议的主题
        if (suggestedTopics.length > 0) {
          focusTopics.push(...suggestedTopics);
          console.log('📋 Inquiry 建议主题:', suggestedTopics.join(', '));
        }
      } catch (error) {
        console.warn('⚠️ 获取 Inquiry 上下文失败:', error);
      }
    }

    // 📊 日志：用户数据摘要
    console.log('\n========================================');
    console.log('🔍 [CuratedFeed] 开始个性化内容抓取');
    console.log('========================================');
    console.log(`👤 用户ID: ${userId || '匿名用户'}`);
    console.log(`📝 用户数据摘要:`);
    console.log(`   - 睡眠时长: ${userSignals.sleepHours ?? '未记录'}`);
    console.log(`   - 压力等级: ${userSignals.stressLevel ?? '未记录'}`);
    console.log(`   - 能量水平: ${userSignals.energyLevel ?? '未记录'}`);

    if (userTags.length === 0) {
      console.log('⚠️  用户无特定标签，使用默认关键词');
      userTags = TAG_KEYWORD_MAP.default;
    } else {
      console.log(`🏷️  基于用户数据生成的标签: [${userTags.join(', ')}]`);
    }

    const keywords = expandKeywords(userTags);
    console.log(`🔑 展开后的搜索关键词: [${keywords.join(', ')}]`);

    const poolSize = Math.max(40, limit * 6);
    console.log(`📡 开始从 PubMed/Semantic Scholar/YouTube 抓取内容...`);

    const aggregation = await aggregateContent(userTags, [], {
      limitPerSource: Math.max(5, Math.ceil(poolSize / 6)),
      totalLimit: poolSize,
      includeSources: ['pubmed', 'semantic_scholar', 'youtube'],
    });

    console.log(`✅ 抓取完成：共 ${aggregation.totalFetched} 条，去重后 ${aggregation.totalAfterDedup} 条`);
    console.log(`⏱️  抓取耗时: ${aggregation.executionTimeMs}ms`);

    const aggregatedItems = aggregation.contents.map(mapAggregatedContent);
    const relevanceMap = new Map(
      aggregation.contents.map((item) => [item.id, item.relevanceScore])
    );
    const socialItems = trendingTopics.map(mapTrendingContent);
    const socialScoreMap = new Map(trendingTopics.map((topic) => [topic.id, topic.baseScore]));

    let combined = [...aggregatedItems, ...socialItems];

    if (!isZh) {
      const filtered = combined.filter((item) => item.language === 'en');
      if (filtered.length > 0) {
        combined = filtered;
      }
    }

    // 构建完整的用户上下文用于 AI 推荐
    let gadScore: number | null = null;
    let phqScore: number | null = null;
    let isiScore: number | null = null;
    let inquiryInsights: Record<string, string> = {};

    if (userId) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('inferred_scale_scores')
        .eq('id', userId)
        .single();

      if (profile?.inferred_scale_scores) {
        const scores = profile.inferred_scale_scores as any;
        gadScore = scores?.GAD7?.score ?? null;
        phqScore = scores?.PHQ9?.score ?? null;
        isiScore = scores?.ISI?.score ?? null;
      }

      // 获取 inquiry 上下文
      try {
        const { getInquiryContext } = await import('@/lib/inquiry-context');
        const ctx = await getInquiryContext(userId);
        inquiryInsights = ctx.insights as unknown as Record<string, string>;
      } catch { }
    }

    const userContext = {
      tags: userTags,
      focusTopics,
      sleepHours: userSignals.sleepHours,
      stressLevel: userSignals.stressLevel,
      energyLevel: userSignals.energyLevel,
      gadScore,
      phqScore,
      isiScore,
      inquiryInsights,
    };

    // 先计算分数过滤
    const filteredItems = combined
      .filter((item) => !excludeIds.has(item.id))
      .map((item) => {
        const keywordScore = calculateKeywordMatchScore(item.title, item.summary, keywords);
        const tagBoost = calculateTagRelevanceBoost({ title: item.title, summary: item.summary }, userTags) * 10;
        const baseScore =
          item.source === 'x' || item.source === 'reddit'
            ? (Number(socialScoreMap.get(item.id) || 4.2) / 5) * 100
            : 70 + (relevanceMap.get(item.id) || 0.7) * 30;
        const matchScore = clampScore((baseScore + keywordScore) / 2 + tagBoost);
        return { ...item, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    // 只对前 N 个高分内容生成 AI 推荐理由（避免过多 API 调用）
    const topItems = filteredItems.slice(0, Math.max(limit * 3, 30));

    // 生成个性化推荐理由
    const scored: CuratedFeedItem[] = await Promise.all(
      topItems.map(async (item) => {
        const benefit = await generateAIBenefit({
          title: item.title,
          summary: item.summary,
          matchedTags: item.matchedTags,
          userContext,
          isZh,
        });
        return { ...item, benefit };
      })
    );

    const dailySeed = `${userId || 'anon'}-${new Date().toISOString().slice(0, 10)}-${cycle}`;
    const topPool = scored.slice(0, Math.max(limit * 12, 80));
    const shuffled = seededShuffle(topPool, dailySeed);
    const windowed = shuffled.slice(0, Math.max(limit * 8, 60));
    const ordered = windowed.sort((a, b) => b.matchScore - a.matchScore);

    const pageItems = ordered.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < ordered.length ? cursor + limit : null;

    return NextResponse.json({
      items: pageItems,
      nextCursor,
      total: ordered.length,
      keywords: keywords.slice(0, 6),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CuratedFeed] Error:', error);
    return NextResponse.json({ error: 'Failed to load curated feed' }, { status: 500 });
  }
}
