/**
 * Content Aggregator
 * 
 * Aggregates and ranks content from multiple sources:
 * - PubMed (scientific papers)
 * - Semantic Scholar (academic research)
 * - YouTube (curated health channels via RSS)
 * 
 * Design Principle: "降噪" - Remove noise, keep only what's relevant
 */

import type { PhaseGoal, GoalType } from '@/types/adaptive-interaction';
import { fetchVideosByTags, type YouTubeVideo } from './services/youtube-rss';

// ============ Types ============

export type ContentSource = 'pubmed' | 'semantic_scholar' | 'youtube';

export interface AggregatedContent {
    id: string;
    source: ContentSource;
    type: 'paper' | 'video' | 'article';
    title: string;
    summary: string;
    url: string;
    thumbnail?: string;
    author?: string;
    publishedAt: string;
    relevanceScore: number;
    matchedTags: string[];
    metadata?: Record<string, unknown>;
}

export interface ContentAggregationResult {
    contents: AggregatedContent[];
    sources: {
        source: ContentSource;
        count: number;
        success: boolean;
        error?: string;
    }[];
    totalFetched: number;
    totalAfterDedup: number;
    executionTimeMs: number;
}

// ============ Source Fetchers ============

/**
 * Fetch relevant papers from PubMed
 * Uses existing scientific search infrastructure
 */
async function fetchPubMedContent(
    userTags: string[],
    limit: number = 5
): Promise<AggregatedContent[]> {
    try {
        // Build search query from tags
        const query = buildSearchQueryFromTags(userTags);

        // Use existing PubMed search (in lib/services/scientific-search.ts)
        // Use exported function from scientific-search.ts
        const { searchPubMed } = await import('./services/scientific-search');
        const papers = await searchPubMed(query, limit);

        return papers.map(paper => ({
            id: paper.id, // scientific-search already prefixes with pubmed_
            source: 'pubmed' as ContentSource,
            type: 'paper' as const,
            title: paper.title,
            summary: paper.abstract?.slice(0, 300) || '',
            url: paper.url,
            author: 'Unknown', // ScientificPaper doesn't expose authors list currently
            publishedAt: paper.year ? `${paper.year}-01-01` : new Date().toISOString(),
            relevanceScore: 0.8,
            matchedTags: userTags.filter(tag =>
                (paper.title + paper.abstract).toLowerCase().includes(tagToKeyword(tag))
            ),
        }));
    } catch (error) {
        console.error('PubMed fetch error:', error);
        return [];
    }
}

/**
 * Fetch relevant papers from Semantic Scholar
 */
async function fetchSemanticScholarContent(
    userTags: string[],
    limit: number = 5
): Promise<AggregatedContent[]> {
    try {
        const query = buildSearchQueryFromTags(userTags);

        // Use exported function from scientific-search.ts
        const { searchSemanticScholar } = await import('./services/scientific-search');
        const papers = await searchSemanticScholar(query, limit);

        return papers.map(paper => ({
            id: `semantic_${paper.id}`,
            source: 'semantic_scholar' as ContentSource,
            type: 'paper' as const,
            title: paper.title,
            summary: paper.abstract?.slice(0, 300) || '',
            url: paper.url,
            author: 'Unknown',
            publishedAt: paper.year ? `${paper.year}-01-01` : new Date().toISOString(),
            relevanceScore: paper.citationCount ? Math.min(0.5 + (paper.citationCount / 1000), 0.95) : 0.7,
            matchedTags: userTags.filter(tag =>
                (paper.title + (paper.abstract || '')).toLowerCase().includes(tagToKeyword(tag))
            ),
        }));
    } catch (error) {
        console.error('Semantic Scholar fetch error:', error);
        return [];
    }
}

/**
 * Fetch relevant videos from YouTube RSS
 */
async function fetchYouTubeContent(
    userTags: string[],
    limit: number = 5
): Promise<AggregatedContent[]> {
    try {
        const videos = await fetchVideosByTags(userTags, limit);

        return videos.map(video => ({
            id: `youtube_${video.id}`,
            source: 'youtube' as ContentSource,
            type: 'video' as const,
            title: video.title,
            summary: video.description.slice(0, 300),
            url: video.videoUrl,
            thumbnail: video.thumbnailUrl,
            author: video.channelName,
            publishedAt: video.publishedAt,
            relevanceScore: 0.75, // Videos have slightly lower base relevance than papers
            matchedTags: userTags, // Already filtered by tags
        }));
    } catch (error) {
        console.error('YouTube fetch error:', error);
        return [];
    }
}

// ============ Main Aggregation Function ============

/**
 * Aggregate content from all sources based on user tags
 */
export async function aggregateContent(
    userTags: string[],
    phaseGoals: PhaseGoal[] = [],
    options: {
        limitPerSource?: number;
        totalLimit?: number;
        includeSources?: ContentSource[];
    } = {}
): Promise<ContentAggregationResult> {
    const startTime = Date.now();
    const {
        limitPerSource = 5,
        totalLimit = 15,
        includeSources = ['pubmed', 'semantic_scholar', 'youtube'],
    } = options;

    const sourceResults: ContentAggregationResult['sources'] = [];
    const allContents: AggregatedContent[] = [];

    // Fetch from each source in parallel
    const fetchPromises: Promise<{ source: ContentSource; contents: AggregatedContent[] }>[] = [];

    if (includeSources.includes('pubmed')) {
        fetchPromises.push(
            fetchPubMedContent(userTags, limitPerSource)
                .then(contents => ({ source: 'pubmed' as ContentSource, contents }))
                .catch(error => ({ source: 'pubmed' as ContentSource, contents: [], error }))
        );
    }

    if (includeSources.includes('semantic_scholar')) {
        fetchPromises.push(
            fetchSemanticScholarContent(userTags, limitPerSource)
                .then(contents => ({ source: 'semantic_scholar' as ContentSource, contents }))
                .catch(error => ({ source: 'semantic_scholar' as ContentSource, contents: [], error }))
        );
    }

    if (includeSources.includes('youtube')) {
        fetchPromises.push(
            fetchYouTubeContent(userTags, limitPerSource)
                .then(contents => ({ source: 'youtube' as ContentSource, contents }))
                .catch(error => ({ source: 'youtube' as ContentSource, contents: [], error }))
        );
    }

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const { source, contents } = result.value;
            sourceResults.push({
                source,
                count: contents.length,
                success: true,
            });
            allContents.push(...contents);
        } else {
            // Handle rejection (shouldn't happen with our error handling)
            console.error('Fetch promise rejected:', result.reason);
        }
    }

    // Deduplicate by title similarity
    const dedupedContents = deduplicateContent(allContents);

    // Boost relevance based on phase goals
    const boostedContents = boostByPhaseGoals(dedupedContents, phaseGoals);

    // Sort by relevance and limit
    const rankedContents = boostedContents
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, totalLimit);

    return {
        contents: rankedContents,
        sources: sourceResults,
        totalFetched: allContents.length,
        totalAfterDedup: dedupedContents.length,
        executionTimeMs: Date.now() - startTime,
    };
}

// ============ Utility Functions ============

/**
 * Build search query from user tags
 */
function buildSearchQueryFromTags(tags: string[]): string {
    const keywords: string[] = [];

    for (const tag of tags) {
        keywords.push(tagToKeyword(tag));
    }

    // Join with OR for broader results
    return keywords.join(' OR ');
}

/**
 * Convert Chinese tag to English keyword for search
 */
function tagToKeyword(tag: string): string {
    const tagMap: Record<string, string> = {
        '高皮质醇风险': 'cortisol stress',
        '重度焦虑': 'severe anxiety',
        '中心性肥胖': 'central obesity visceral fat',
        '代谢低谷期': 'metabolic decline',
        '亚健康状态': 'sub-health fatigue',
        '慢性疲劳': 'chronic fatigue',
        '免疫力差': 'immune deficiency',
        '压力型肥胖': 'stress belly cortisol obesity',
        '激素衰退型': 'hormone decline testosterone',
        '睡眠障碍': 'sleep disorder insomnia',
        '情绪困扰': 'emotional distress depression',
    };

    return tagMap[tag] || tag;
}

/**
 * Deduplicate content by title similarity
 */
function deduplicateContent(contents: AggregatedContent[]): AggregatedContent[] {
    const seen = new Set<string>();
    const result: AggregatedContent[] = [];

    for (const content of contents) {
        // Normalize title for comparison
        const normalizedTitle = content.title.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check for similar titles (simple prefix matching)
        const prefix = normalizedTitle.slice(0, 30);

        if (!seen.has(prefix)) {
            seen.add(prefix);
            result.push(content);
        }
    }

    return result;
}

/**
 * Boost relevance scores based on user's phase goals
 */
function boostByPhaseGoals(
    contents: AggregatedContent[],
    phaseGoals: PhaseGoal[]
): AggregatedContent[] {
    if (phaseGoals.length === 0) return contents;

    const goalKeywords: Record<GoalType, string[]> = {
        sleep: ['sleep', 'insomnia', 'circadian', 'rest'],
        energy: ['energy', 'fatigue', 'mitochondria', 'metabolism'],
        stress: ['stress', 'cortisol', 'anxiety', 'relaxation'],
        weight: ['weight', 'obesity', 'diet', 'fat'],
        fitness: ['exercise', 'fitness', 'muscle', 'strength'],
    };

    return contents.map(content => {
        let boost = 0;
        const text = (content.title + ' ' + content.summary).toLowerCase();

        for (const goal of phaseGoals) {
            const keywords = goalKeywords[goal.goal_type] || [];
            const matchCount = keywords.filter(kw => text.includes(kw)).length;

            // Higher boost for primary goal (priority 1)
            const goalWeight = goal.priority === 1 ? 0.15 : 0.08;
            boost += matchCount * goalWeight;
        }

        return {
            ...content,
            relevanceScore: Math.min(content.relevanceScore + boost, 1.0),
        };
    });
}

/**
 * Filter content by minimum relevance threshold
 */
export function filterByRelevance(
    contents: AggregatedContent[],
    minScore: number = 0.5
): AggregatedContent[] {
    return contents.filter(c => c.relevanceScore >= minScore);
}

/**
 * Get content summary for display
 */
export function getContentSummary(result: ContentAggregationResult): string {
    const bySource = result.sources
        .filter(s => s.success)
        .map(s => `${s.source}: ${s.count}`)
        .join(', ');

    return `Found ${result.totalAfterDedup} items (${bySource}) in ${result.executionTimeMs}ms`;
}
