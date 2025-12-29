'use server';

/**
 * Feed Server Actions (The Brain)
 * 
 * Pure server-side functions for content feed operations.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

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
    read_time_minutes: number;
    is_read: boolean;
    is_saved: boolean;
    created_at: string;
}

export interface FeedFilters {
    category?: string;
    type?: string;
    unreadOnly?: boolean;
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
    filters?: FeedFilters
): Promise<ActionResult<{ items: FeedItem[]; hasMore: boolean }>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view your feed' };
        }

        // Build query
        let query = supabase
            .from('feed_items')
            .select('*')
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        const { data, error } = await query;

        if (error) {
            // Table might not exist, return empty feed
            console.warn('[Feed Action] getFeed error:', error);
            return { success: true, data: { items: [], hasMore: false } };
        }

        // Get user's read/saved status
        const { data: userFeedData } = await supabase
            .from('user_feed_interactions')
            .select('feed_item_id, is_read, is_saved')
            .eq('user_id', user.id);

        const interactions = new Map(
            (userFeedData || []).map(d => [d.feed_item_id, d])
        );

        const items: FeedItem[] = (data || []).map(item => {
            const interaction = interactions.get(item.id);
            return {
                id: item.id,
                type: item.type || 'article',
                title: item.title,
                content: item.content,
                summary: item.summary,
                category: item.category || 'general',
                image_url: item.image_url,
                source: item.source,
                read_time_minutes: item.read_time_minutes || 3,
                is_read: interaction?.is_read || false,
                is_saved: interaction?.is_saved || false,
                created_at: dateToISO(item.created_at) || new Date().toISOString(),
            };
        });

        // Filter unread if requested
        const filteredItems = filters?.unreadOnly
            ? items.filter(i => !i.is_read)
            : items;

        return toSerializable({
            success: true,
            data: {
                items: filteredItems,
                hasMore: data?.length === limit
            }
        });

    } catch (error) {
        console.error('[Feed Action] getFeed error:', error);
        return { success: false, error: 'Failed to load feed' };
    }
}

/**
 * Mark item as read.
 */
export async function markAsRead(itemId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

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
        console.error('[Feed Action] markAsRead error:', error);
        return { success: false, error: 'Failed to mark as read' };
    }
}

/**
 * Toggle save status.
 */
export async function toggleSave(itemId: string): Promise<ActionResult<boolean>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Get current state
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
        console.error('[Feed Action] toggleSave error:', error);
        return { success: false, error: 'Failed to save item' };
    }
}

/**
 * Get saved items.
 */
export async function getSavedItems(): Promise<ActionResult<FeedItem[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: interactions } = await supabase
            .from('user_feed_interactions')
            .select('feed_item_id')
            .eq('user_id', user.id)
            .eq('is_saved', true);

        if (!interactions?.length) {
            return { success: true, data: [] };
        }

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

        return toSerializable({ success: true, data: feedItems });

    } catch (error) {
        console.error('[Feed Action] getSavedItems error:', error);
        return { success: false, error: 'Failed to load saved items' };
    }
}
