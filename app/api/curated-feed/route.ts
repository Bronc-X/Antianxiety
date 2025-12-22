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

function buildActionableTip(theme: string, isZh: boolean): string {
  const tips: Record<string, { zh: string; en: string }> = {
    sleep: {
      zh: '今晚提前 60–90 分钟调暗光线，配合 5 分钟轻度拉伸作为入睡前仪式。',
      en: 'Dim lights 60–90 minutes before bed and add a 5‑minute wind‑down stretch.',
    },
    stress: {
      zh: '压力高时做 2 轮盒式呼吸（4-4-4-4），把生理唤醒拉回基线。',
      en: 'Use two rounds of box breathing (4‑4‑4‑4) when stress spikes to lower arousal.',
    },
    energy: {
      zh: '午后能量下滑时安排 10 分钟快走，替代咖啡因补偿。',
      en: 'Swap a quick 10‑minute walk for caffeine when afternoon energy dips.',
    },
    nutrition: {
      zh: '把蛋白质前置到早餐（25–30g），稳定上午血糖与专注度。',
      en: 'Front‑load 25–30g protein at breakfast to stabilize morning energy.',
    },
    movement: {
      zh: '把训练拆成 2–3 个 10 分钟小段，降低启动阻力。',
      en: 'Break training into 2–3 ten‑minute blocks to reduce friction.',
    },
    habit: {
      zh: '把行为拆成 2 分钟微习惯，先建立连续性再叠加强度。',
      en: 'Start with a 2‑minute micro‑habit to build consistency before intensity.',
    },
    general: {
      zh: '先选一个你最在意的指标（睡眠/压力/能量），本周只调整一个变量。',
      en: 'Pick one metric (sleep/stress/energy) and adjust a single variable this week.',
    },
  };
  return (tips[theme] || tips.general)[isZh ? 'zh' : 'en'];
}

function buildBenefitText(params: {
  title: string;
  summary: string;
  matchedTags: string[];
  focusTopics: string[];
  userSignals: { sleepHours?: number | null; stressLevel?: number | null; energyLevel?: number | null };
  isZh: boolean;
}) {
  const { title, summary, matchedTags, focusTopics, userSignals, isZh } = params;
  const signalNotes: string[] = [];

  if (typeof userSignals.sleepHours === 'number' && userSignals.sleepHours > 0 && userSignals.sleepHours < 6.5) {
    signalNotes.push(isZh ? '你最近睡眠偏少' : 'your recent sleep looks short');
  }
  if (typeof userSignals.stressLevel === 'number' && userSignals.stressLevel >= 7) {
    signalNotes.push(isZh ? '压力水平偏高' : 'your stress level is elevated');
  }
  if (typeof userSignals.energyLevel === 'number' && userSignals.energyLevel <= 4) {
    signalNotes.push(isZh ? '能量偏低' : 'your energy feels low');
  }

  const rawTagContext = matchedTags[0] || focusTopics[0] || '';
  const hasZhChars = /[\u4e00-\u9fff]/.test(rawTagContext);
  const isAsciiOnly = rawTagContext ? /^[\x00-\x7F]+$/.test(rawTagContext) : false;
  const tagContext = isZh
    ? (rawTagContext && isAsciiOnly ? '当前健康重点' : rawTagContext || '当前健康重点')
    : (rawTagContext && hasZhChars ? 'your current focus' : rawTagContext || 'your current focus');
  const signalText = signalNotes.length > 0 ? signalNotes.slice(0, 2).join(isZh ? '，' : ' and ') : '';
  const theme = pickThemeTag([...matchedTags, ...focusTopics], `${title} ${summary}`);
  const action = buildActionableTip(theme, isZh);

  if (isZh) {
    return `${tagContext}相关内容，${signalText ? `且${signalText}。` : ''}可直接用的做法：${action}`;
  }

  return `${tagContext} is the closest match${signalText ? `, especially since ${signalText}` : ''}. Action you can use: ${action}`;
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
    }

    if (userTags.length === 0) {
      userTags = TAG_KEYWORD_MAP.default;
    }

    const keywords = expandKeywords(userTags);

    const poolSize = Math.max(40, limit * 6);
    const aggregation = await aggregateContent(userTags, [], {
      limitPerSource: Math.max(5, Math.ceil(poolSize / 6)),
      totalLimit: poolSize,
      includeSources: ['pubmed', 'semantic_scholar', 'youtube'],
    });

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

    const scored: CuratedFeedItem[] = combined
      .filter((item) => !excludeIds.has(item.id))
      .map((item) => {
        const keywordScore = calculateKeywordMatchScore(item.title, item.summary, keywords);
        const tagBoost = calculateTagRelevanceBoost({ title: item.title, summary: item.summary }, userTags) * 10;
        const baseScore =
          item.source === 'x' || item.source === 'reddit'
            ? (Number(socialScoreMap.get(item.id) || 4.2) / 5) * 100
            : 70 + (relevanceMap.get(item.id) || 0.7) * 30;
        const matchScore = clampScore((baseScore + keywordScore) / 2 + tagBoost);
        const benefit = buildBenefitText({
          title: item.title,
          summary: item.summary,
          matchedTags: item.matchedTags,
          focusTopics,
          userSignals,
          isZh,
        });
        return {
          ...item,
          matchScore,
          benefit,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

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
