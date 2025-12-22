/**
 * YouTube RSS Service
 * 
 * Fetches content from curated YouTube channels via RSS feeds.
 * Bypasses API quotas by using the public RSS endpoint.
 * 
 * Curated channels focus on:
 * - Research-based health content
 * - Stress/anxiety management
 * - Metabolic health and longevity
 */

// ============ Types ============

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    channelName: string;
    channelId: string;
    publishedAt: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration?: string;
}

export interface CuratedChannel {
    id: string;
    name: string;
    rssUrl: string;
    topics: string[];      // Related topics for tag matching
    language: 'en' | 'zh' | 'bilingual';
    tier: 'premium' | 'standard';  // Content quality tier
}

// ============ Curated Channels ============

/**
 * Hand-picked channels known for research-backed health content
 * Aligned with "用真相打破焦虑" philosophy
 */
export const CURATED_CHANNELS: CuratedChannel[] = [
    // Tier 1: Premium Research-Based Channels
    {
        id: 'UC2D2CMWXMOVWx7giW1n3LIg',
        name: 'Huberman Lab',
        rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC2D2CMWXMOVWx7giW1n3LIg',
        topics: ['neuroscience', 'sleep', 'stress', 'hormones', 'cortisol', 'dopamine', 'anxiety'],
        language: 'en',
        tier: 'premium',
    },
    {
        id: 'UCZlVvMC8ohEYhJJypH7v7Bw',
        name: 'Peter Attia MD',
        rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZlVvMC8ohEYhJJypH7v7Bw',
        topics: ['longevity', 'metabolism', 'exercise', 'sleep', 'nutrition', 'cardiovascular'],
        language: 'en',
        tier: 'premium',
    },
    {
        id: 'UCWf2ZlNsCGDS89VBF_awNvA',
        name: 'FoundMyFitness (Dr. Rhonda Patrick)',
        rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCWf2ZlNsCGDS89VBF_awNvA',
        topics: ['nutrition', 'genetics', 'aging', 'sauna', 'fasting', 'micronutrients'],
        language: 'en',
        tier: 'premium',
    },
    {
        id: 'UCIaH-gZIVC432YRjNVvnyCA',
        name: 'Thomas DeLauer',
        rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIaH-gZIVC432YRjNVvnyCA',
        topics: ['fasting', 'keto', 'metabolism', 'weight loss', 'cortisol', 'inflammation'],
        language: 'en',
        tier: 'standard',
    },
    {
        id: 'UCAxWw7lkxbTy_4XbgP5k70g',
        name: 'Therapy in a Nutshell',
        rssUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCAxWw7lkxbTy_4XbgP5k70g',
        topics: ['anxiety', 'depression', 'CBT', 'stress', 'mental health', 'emotions'],
        language: 'en',
        tier: 'premium',
    },
    // Chinese Language Channels (if available)
    // Add more as curated
];

// Channel ID to Name mapping for quick lookup
export const CHANNEL_NAMES: Record<string, string> = Object.fromEntries(
    CURATED_CHANNELS.map(c => [c.id, c.name])
);

// ============ RSS Parsing ============

/**
 * Parse YouTube RSS feed XML into video objects
 */
function parseRSSFeed(xml: string, channelId: string): YouTubeVideo[] {
    const videos: YouTubeVideo[] = [];
    const channelName = CHANNEL_NAMES[channelId] || 'Unknown Channel';

    // Simple XML parsing using regex (works in Edge runtime)
    // Pattern for each entry
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];

        // Extract fields
        const videoId = extractField(entry, /<yt:videoId>(.*?)<\/yt:videoId>/);
        const title = extractField(entry, /<title>(.*?)<\/title>/);
        const published = extractField(entry, /<published>(.*?)<\/published>/);

        // Media group for description and thumbnail
        const description = extractField(entry, /<media:description>([\s\S]*?)<\/media:description>/) || '';
        const thumbnailMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';

        if (videoId && title) {
            videos.push({
                id: videoId,
                title: decodeXMLEntities(title),
                description: decodeXMLEntities(description).slice(0, 500), // Truncate
                channelName,
                channelId,
                publishedAt: published,
                thumbnailUrl: thumbnail,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            });
        }
    }

    return videos;
}

/**
 * Extract field from XML using regex
 */
function extractField(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
}

/**
 * Decode XML entities
 */
function decodeXMLEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

// ============ Fetch Functions ============

/**
 * Fetch videos from a single YouTube channel via RSS
 */
export async function fetchChannelVideos(
    channel: CuratedChannel,
    limit: number = 5
): Promise<YouTubeVideo[]> {
    try {
        const response = await fetch(channel.rssUrl, {
            headers: {
                'Accept': 'application/xml, text/xml',
            },
            // 10 second timeout
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            console.warn(`Failed to fetch RSS for ${channel.name}: ${response.status}`);
            return [];
        }

        const xml = await response.text();
        const videos = parseRSSFeed(xml, channel.id);

        // Return most recent videos up to limit
        return videos.slice(0, limit);
    } catch (error) {
        console.error(`Error fetching ${channel.name} RSS:`, error);
        return [];
    }
}

/**
 * Fetch videos from all curated channels
 */
export async function fetchAllCuratedVideos(
    limitPerChannel: number = 3
): Promise<YouTubeVideo[]> {
    const results = await Promise.allSettled(
        CURATED_CHANNELS.map(channel => fetchChannelVideos(channel, limitPerChannel))
    );

    const allVideos: YouTubeVideo[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allVideos.push(...result.value);
        }
    }

    // Sort by publish date, most recent first
    allVideos.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return allVideos;
}

/**
 * Fetch videos matching specific user tags
 */
export async function fetchVideosByTags(
    userTags: string[],
    limit: number = 10
): Promise<YouTubeVideo[]> {
    // Map user tags to topics
    const relevantTopics = mapUserTagsToTopics(userTags);

    // Filter channels that cover relevant topics
    const relevantChannels = CURATED_CHANNELS.filter(channel =>
        channel.topics.some(topic => relevantTopics.includes(topic))
    );

    // Prioritize premium channels
    const sortedChannels = [...relevantChannels].sort((a, b) => {
        if (a.tier === 'premium' && b.tier !== 'premium') return -1;
        if (b.tier === 'premium' && a.tier !== 'premium') return 1;
        return 0;
    });

    // Fetch from top channels
    const channelsToFetch = sortedChannels.slice(0, 5);
    const results = await Promise.allSettled(
        channelsToFetch.map(channel => fetchChannelVideos(channel, 3))
    );

    const videos: YouTubeVideo[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            videos.push(...result.value);
        }
    }

    // Score and rank videos by relevance
    const scoredVideos = videos.map(video => ({
        video,
        score: calculateVideoRelevance(video, userTags, relevantTopics),
    }));

    scoredVideos.sort((a, b) => b.score - a.score);

    return scoredVideos.slice(0, limit).map(sv => sv.video);
}

// ============ Relevance Scoring ============

/**
 * Map user health tags to content topics
 */
function mapUserTagsToTopics(tags: string[]): string[] {
    const tagToTopics: Record<string, string[]> = {
        '高皮质醇风险': ['cortisol', 'stress', 'anxiety', 'HPA axis', 'sleep'],
        '重度焦虑': ['anxiety', 'stress', 'CBT', 'mental health', 'relaxation'],
        '中心性肥胖': ['metabolism', 'weight loss', 'insulin', 'fasting', 'exercise'],
        '代谢低谷期': ['metabolism', 'energy', 'mitochondria', 'hormones', 'aging'],
        '亚健康状态': ['fatigue', 'sleep', 'nutrition', 'recovery', 'inflammation'],
        '慢性疲劳': ['fatigue', 'energy', 'mitochondria', 'sleep', 'recovery'],
        '免疫力差': ['immunity', 'inflammation', 'nutrition', 'micronutrients', 'gut health'],
        '压力型肥胖': ['cortisol', 'stress', 'weight loss', 'adrenal', 'sleep'],
        '激素衰退型': ['hormones', 'testosterone', 'aging', 'strength', 'longevity'],
        '睡眠障碍': ['sleep', 'circadian', 'melatonin', 'insomnia', 'light exposure'],
        '情绪困扰': ['emotions', 'mental health', 'depression', 'anxiety', 'therapy'],
    };

    const topics = new Set<string>();
    for (const tag of tags) {
        const relatedTopics = tagToTopics[tag] || [];
        for (const topic of relatedTopics) {
            topics.add(topic);
        }
    }

    return Array.from(topics);
}

/**
 * Calculate relevance score for a video
 */
function calculateVideoRelevance(
    video: YouTubeVideo,
    userTags: string[],
    relevantTopics: string[]
): number {
    let score = 0;
    const text = `${video.title} ${video.description}`.toLowerCase();

    // Channel tier bonus
    const channel = CURATED_CHANNELS.find(c => c.id === video.channelId);
    if (channel?.tier === 'premium') {
        score += 0.3;
    }

    // Topic keyword matches
    for (const topic of relevantTopics) {
        if (text.includes(topic.toLowerCase())) {
            score += 0.15;
        }
    }

    // Recency bonus (videos from last 7 days)
    const publishedDate = new Date(video.publishedAt);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 7) {
        score += 0.2;
    } else if (daysSincePublished <= 30) {
        score += 0.1;
    }

    // Cap at 1.0
    return Math.min(score, 1.0);
}

// ============ Utility Functions ============

/**
 * Get channel info by ID
 */
export function getChannelInfo(channelId: string): CuratedChannel | undefined {
    return CURATED_CHANNELS.find(c => c.id === channelId);
}

/**
 * Get all premium channels
 */
export function getPremiumChannels(): CuratedChannel[] {
    return CURATED_CHANNELS.filter(c => c.tier === 'premium');
}
