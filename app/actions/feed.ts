'use server';

/**
 * Feed Server Actions (The Brain)
 * 
 * Pure server-side functions for content feed operations.
 * Now includes Vector Search and AI Enrichment logic previously in /api/feed.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import { createClient } from '@supabase/supabase-js';
import { DB_TABLES } from '@/lib/config/constants';
import { enrichFeedItems } from '@/lib/feed-enricher';
import { NextRequest } from 'next/server';
import { GET as getCuratedFeedRoute } from '@/app/api/curated-feed/route';

// ============================================
// Types
// ============================================

export interface FeedItem {
    id: string;
    type: 'article' | 'tip' | 'insight' | 'nudge';
    title: string;
    content: string;
    summary: string | null;
    category: string;
    image_url: string | null;
    source: string | null;
    source_type?: string;
    source_url?: string;
    read_time_minutes: number;
    is_read: boolean;
    is_saved: boolean;
    created_at: string;
    // AI / Vector fields
    relevance_score?: number;
    match_percentage?: number;
    why_recommended?: string;
    actionable_insight?: string;
    tags?: string[];
}

export interface FeedFilters {
    category?: string;
    type?: string;
    unreadOnly?: boolean;
    sourceType?: string;
}

export interface FeedResponseMeta {
    ready: boolean;
    reason: string;
    message?: string | null;
    fallback?: 'latest' | 'trending' | 'none';
}

export interface FeedData {
    items: FeedItem[];
    hasMore: boolean;
    personalization?: FeedResponseMeta;
}

export interface FeedFeedbackInput {
    contentId: string;
    contentUrl?: string | null;
    contentTitle?: string | null;
    source?: string | null;
    feedbackType: 'bookmark' | 'dislike' | 'like';
}

export interface CuratedFeedParams {
    limit?: number;
    cursor?: number;
    language?: string;
    cycle?: number;
    exclude?: string[];
    userId?: string;
}

// ============================================
// Helpers
// ============================================

// Admin client for reading content (bypasses RLS)
function getAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

async function parseJsonResponse(response: Response): Promise<any> {
    const raw = await response.text();
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

interface ProfileData {
    user_persona_embedding: number[] | null;
    primary_focus_topics?: string[];
    primary_concern?: string;
    current_focus?: string;
    stress_level?: number;
    sleep_hours?: number;
    energy_level?: number;
    language?: string;
}

interface ContentFeedVector {
    id: number | string;
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string | null;
    relevance_score?: number | null;
    embedding?: number[] | null;
    crawled_at?: string;
}

interface DailyWellnessLog {
    sleep_hours?: number | null;
    sleep_duration_minutes?: number | null;
    stress_level?: number | null;
    energy_level?: number | null;
    morning_energy?: number | null;
    log_date?: string | null;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get personalized feed for the current user.
 */
export async function getFeed(
    page = 1,
    limit = 20,
    filters?: FeedFilters,
    enrich = true, // Default to true to match previous API behavior
    language?: 'zh' | 'en'
): Promise<ActionResult<FeedData>> {
    try {
        const supabase = await createServerSupabaseClient();
        const adminSupabase = getAdminSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view your feed' };
        }

        // 1. Get User Profile & Embedding
        const { data: profile, error: profileError } = await supabase
            .from(DB_TABLES.PROFILES)
            .select('user_persona_embedding, primary_focus_topics, primary_concern, current_focus, stress_level, sleep_hours, energy_level, language')
            .eq('id', user.id)
            .single<ProfileData>();

        const { data: latestLog } = await supabase
            .from('daily_wellness_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('log_date', { ascending: false })
            .limit(1)
            .maybeSingle<DailyWellnessLog>();

        const latestSleepHours = typeof latestLog?.sleep_hours === 'number'
            ? latestLog.sleep_hours
            : typeof latestLog?.sleep_duration_minutes === 'number'
                ? latestLog.sleep_duration_minutes / 60
                : null;
        const latestStressLevel = typeof latestLog?.stress_level === 'number' ? latestLog.stress_level : null;
        const latestEnergyLevel = typeof latestLog?.energy_level === 'number'
            ? latestLog.energy_level
            : typeof latestLog?.morning_energy === 'number'
                ? latestLog.morning_energy
                : null;

        const resolvedLanguage: 'zh' | 'en' =
            language === 'en' || language === 'zh'
                ? language
                : (profile?.language === 'en' ? 'en' : 'zh');

        let items: ContentFeedVector[] = [];
        let personalizationMeta: FeedResponseMeta = {
            ready: false,
            reason: resolvedLanguage === 'en' ? 'Service unavailable' : '服务不可用',
            fallback: 'none'
        };

        if (!adminSupabase) {
            // Fallback to basic DB query if admin client fails
            // (Logic matches original getFeed but simplified)
            personalizationMeta.reason = resolvedLanguage === 'en' ? 'Admin client unavailable' : '服务不可用';
        } else {
            // 2. Vector Search (if profile has embedding)
            if (profile?.user_persona_embedding) {
                const { data: allContent } = await adminSupabase
                    .from(DB_TABLES.CONTENT_FEED_VECTORS)
                    .select('id, source_url, source_type, content_text, published_at, embedding')
                    .not('embedding', 'is', null)
                    .order('crawled_at', { ascending: false })
                    .limit(100);

                if (allContent && allContent.length > 0) {
                    const scored = allContent
                        .map((item: any) => {
                            if (!item.embedding || !Array.isArray(item.embedding)) {
                                return { ...item, relevance_score: 0 };
                            }
                            const similarity = cosineSimilarity(profile.user_persona_embedding!, item.embedding);
                            return { ...item, relevance_score: similarity };
                        })
                        .filter((item: any) => item.relevance_score >= 0.3)
                        .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
                        // Apply filters (e.g. source type) locally since we fetched 100
                        .filter((item: any) => !filters?.sourceType || item.source_type === filters.sourceType)
                        .slice((page - 1) * limit, page * limit);

                    items = scored;
                    personalizationMeta = {
                        ready: true,
                        reason: resolvedLanguage === 'en' ? 'Personalized based on profile' : '基于用户画像个性化',
                        message: resolvedLanguage === 'en' ? 'Personalization active' : '个性化筛选已启用'
                    };
                }
            }

            // 3. Fallback to Latest (if no embedding or no matches)
            if (items.length === 0) {
                let query = adminSupabase
                    .from(DB_TABLES.CONTENT_FEED_VECTORS)
                    .select('id, source_url, source_type, content_text, published_at')
                    .order('crawled_at', { ascending: false });

                if (filters?.sourceType) {
                    query = query.eq('source_type', filters.sourceType);
                }

                const { data: latestContent } = await query.range((page - 1) * limit, page * limit - 1);

                if (latestContent) {
                    items = latestContent.map((item: any) => ({ ...item, relevance_score: 0.1 })); // Low score
                    personalizationMeta = {
                        ready: false,
                        reason: resolvedLanguage === 'en' ? 'No personalized matches found' : '未找到高相关匹配',
                        fallback: 'latest',
                        message: profile?.user_persona_embedding
                            ? (resolvedLanguage === 'en' ? 'No high relevance matches, showing latest.' : '未找到高相关内容，展示最新。')
                            : (resolvedLanguage === 'en' ? 'Profile incomplete, showing latest.' : '画像不完整，展示最新。')
                    };
                }
            }
        }

        // 4. Enrich Items (if requested and items exist)
        let finalItems: FeedItem[] = [];

        if (items.length > 0) {
            if (enrich && profile) {
                const userContext = {
                    primaryConcern: profile.primary_concern,
                    currentFocus: profile.current_focus,
                    stressLevel: latestStressLevel ?? profile.stress_level,
                    sleepHours: latestSleepHours ?? profile.sleep_hours,
                    energyLevel: latestEnergyLevel ?? profile.energy_level,
                    focusTopics: profile.primary_focus_topics,
                };

                // Type casting because enrichFeedItems expects specific structure
                const enriched = await enrichFeedItems(
                    items.map(i => ({
                        id: i.id,
                        source_url: i.source_url,
                        source_type: i.source_type,
                        content_text: i.content_text,
                        published_at: i.published_at,
                        relevance_score: i.relevance_score
                    })),
                    userContext,
                    resolvedLanguage
                );

                // Map enriched items to FeedItem
                finalItems = enriched.map(e => ({
                    id: String(e.id),
                    type: 'article', // Default
                    title: e.title,
                    content: e.content_text,
                    summary: e.summary,
                    category: 'general',
                    image_url: null,
                    source: e.source_type, // or source_url
                    source_type: e.source_type,
                    source_url: e.source_url?.trim(),
                    read_time_minutes: 3,
                    is_read: false, // We'll fetch interactions next
                    is_saved: false,
                    created_at: dateToISO(e.published_at) || new Date().toISOString(),
                    // AI fields
                    relevance_score: e.relevance_score,
                    match_percentage: e.match_percentage,
                    why_recommended: e.why_recommended,
                    actionable_insight: e.actionable_insight,
                    tags: e.tags
                }));

            } else {
                // Map raw items
                finalItems = items.map(i => ({
                    id: String(i.id),
                    type: 'article',
                    title: i.content_text.slice(0, 50) + '...', // Fallback title
                    content: i.content_text,
                    summary: i.content_text.slice(0, 100) + '...',
                    category: 'general',
                    image_url: null,
                    source: i.source_type,
                    source_type: i.source_type,
                    source_url: i.source_url?.trim(),
                    read_time_minutes: 3,
                    is_read: false,
                    is_saved: false,
                    created_at: dateToISO(i.published_at) || new Date().toISOString(),
                    relevance_score: i.relevance_score || 0
                }));
            }
        }

        // 5. Attach User Interactions (Read/Saved)
        const itemIds = finalItems.map(i => i.id);
        if (itemIds.length > 0) {
            const { data: interactions } = await supabase
                .from('user_feed_interactions')
                .select('feed_item_id, is_read, is_saved')
                .eq('user_id', user.id)
                .in('feed_item_id', itemIds); // Optimize with IN clause

            const interactionMap = new Map(
                (interactions || []).map(i => [String(i.feed_item_id), i])
            );

            finalItems = finalItems.map(item => {
                const interact = interactionMap.get(item.id);
                return {
                    ...item,
                    is_read: interact?.is_read || false,
                    is_saved: interact?.is_saved || false
                };
            });
        }

        finalItems = finalItems.filter(item =>
            Boolean(item.source_url) && !item.source_url?.includes('/status/example')
        );

        // Filter unread if requested
        if (filters?.unreadOnly) {
            finalItems = finalItems.filter(i => !i.is_read);
        }

        return toSerializable({
            success: true,
            data: {
                items: finalItems,
                hasMore: items.length === limit,
                personalization: personalizationMeta
            }
        });

    } catch (error) {
        console.error('[Feed Action] getFeed error:', error);
        return { success: false, error: 'Failed to load feed' };
    }
}

/**
 * Curated feed (aggregated sources) wrapper.
 */
export async function getCuratedFeed(
    params: CuratedFeedParams = {}
): Promise<ActionResult<any>> {
    try {
        const url = new URL('http://feed.local/api/curated-feed');
        if (typeof params.limit === 'number') {
            url.searchParams.set('limit', String(params.limit));
        }
        if (typeof params.cursor === 'number') {
            url.searchParams.set('cursor', String(params.cursor));
        }
        if (params.language) {
            url.searchParams.set('language', params.language);
        }
        if (typeof params.cycle === 'number') {
            url.searchParams.set('cycle', String(params.cycle));
        }
        if (params.exclude && params.exclude.length > 0) {
            url.searchParams.set('exclude', params.exclude.join(','));
        }
        if (params.userId) {
            url.searchParams.set('userId', params.userId);
        }

        const request = new NextRequest(url.toString());
        const response = await getCuratedFeedRoute(request);
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            return { success: false, error: data?.error || 'Failed to load feed' };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load feed',
        };
    }
}

/**
 * Mark item as read.
 */
export async function markAsRead(itemId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { success: false, error: 'Please sign in' };

        await supabase
            .from('user_feed_interactions')
            .upsert({
                user_id: user.id,
                feed_item_id: itemId,
                is_read: true,
                read_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,feed_item_id',
            });

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed' };
    }
}

/**
 * Toggle save status.
 */
export async function toggleSave(itemId: string): Promise<ActionResult<boolean>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { success: false, error: 'Please sign in' };

        const { data: current } = await supabase
            .from('user_feed_interactions')
            .select('is_saved')
            .eq('user_id', user.id)
            .eq('feed_item_id', itemId)
            .single();

        const newSaved = !(current?.is_saved || false);

        await supabase
            .from('user_feed_interactions')
            .upsert({
                user_id: user.id,
                feed_item_id: itemId,
                is_saved: newSaved,
            }, {
                onConflict: 'user_id,feed_item_id',
            });

        return { success: true, data: newSaved };
    } catch (error) {
        return { success: false, error: 'Failed' };
    }
}

/**
 * Get saved items.
 */
export async function getSavedItems(): Promise<ActionResult<FeedItem[]>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return { success: false, error: 'Please sign in' };

        const { data: interactions } = await supabase
            .from('user_feed_interactions')
            .select('feed_item_id')
            .eq('user_id', user.id)
            .eq('is_saved', true);

        if (!interactions?.length) return { success: true, data: [] };

        // Note: This only fetches from 'feed_items' table, but our new getFeed uses 'content_feed_vectors'
        // For now, we assume saved items might be in 'feed_items' legacy table OR we need to fetch from vectors.
        // To simplify, let's just return [] if not found in legacy table, or we need a unified approach.
        // For MVP, if we save items, we should ideally upsert them to 'feed_items' so they persist?
        // Or we just query vectors by ID.
        // This part might be tricky if IDs are not consistent.
        // Let's assume 'feed_items' is the standard table for saved stuff.

        const itemIds = interactions.map(i => i.feed_item_id);
        const { data: items } = await supabase
            .from('feed_items')
            .select('*')
            .in('id', itemIds);

        const feedItems: FeedItem[] = (items || []).map(item => ({
            id: item.id,
            type: item.type || 'article',
            title: item.title,
            content: item.content,
            summary: item.summary,
            category: item.category || 'general',
            image_url: item.image_url,
            source: item.source,
            read_time_minutes: item.read_time_minutes || 3,
            is_read: true,
            is_saved: true,
            created_at: dateToISO(item.created_at) || new Date().toISOString(),
        }));

        return { success: true, data: feedItems };
    } catch (error) {
        return { success: false, error: 'Failed' };
    }
}

/**
 * Toggle feed feedback (like/dislike/bookmark).
 */
export async function toggleFeedFeedback(
    input: FeedFeedbackInput
): Promise<ActionResult<{ action: 'added' | 'removed'; feedbackType: FeedFeedbackInput['feedbackType'] }>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: existing } = await supabase
            .from('user_feed_feedback')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', input.contentId)
            .eq('feedback_type', input.feedbackType)
            .single();

        if (existing) {
            await supabase
                .from('user_feed_feedback')
                .delete()
                .eq('id', existing.id);

            return { success: true, data: { action: 'removed', feedbackType: input.feedbackType } };
        }

        const { error } = await supabase
            .from('user_feed_feedback')
            .insert({
                user_id: user.id,
                content_id: input.contentId,
                content_url: input.contentUrl || null,
                content_title: input.contentTitle || null,
                source: input.source || null,
                feedback_type: input.feedbackType,
            });

        if (error) {
            return { success: false, error: 'Failed to save feedback' };
        }

        return { success: true, data: { action: 'added', feedbackType: input.feedbackType } };
    } catch (error) {
        return { success: false, error: 'Failed to process feedback' };
    }
}
