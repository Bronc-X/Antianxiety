'use client';

/**
 * useFeed Domain Hook (The Bridge)
 * 
 * Manages content feed state with infinite scroll support.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getFeed,
    markAsRead,
    toggleSave,
    getSavedItems,
    type FeedItem,
    type FeedFilters
} from '@/app/actions/feed';

// ============================================
// Types
// ============================================

export interface UseFeedReturn {
    // Data
    items: FeedItem[];
    savedItems: FeedItem[];

    // States
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    isOffline: boolean;
    hasMore: boolean;
    error: string | null;

    // Actions
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    read: (itemId: string) => Promise<void>;
    save: (itemId: string) => Promise<boolean>;
    setFilters: (filters: FeedFilters) => void;
    loadSaved: () => Promise<void>;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY = 'feed-data';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCachedData<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    return entry.data;
}

function setCachedData<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// Hook Implementation
// ============================================

export function useFeed(): UseFeedReturn {
    const { isOnline } = useNetwork();

    const [items, setItems] = useState<FeedItem[]>(() => getCachedData(CACHE_KEY) || []);
    const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<FeedFilters>({});

    const pageRef = useRef(1);
    const fetchingRef = useRef(false);

    // Initial fetch
    useEffect(() => {
        const fetchInitial = async () => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;

            try {
                const result = await getFeed(1, 20, filters);

                if (result.success && result.data) {
                    setItems(result.data.items);
                    setHasMore(result.data.hasMore);
                    setCachedData(CACHE_KEY, result.data.items);
                    setError(null);
                } else {
                    setError(result.error || 'Failed to load feed');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setIsLoading(false);
                fetchingRef.current = false;
            }
        };

        fetchInitial();
    }, [filters]);

    // Load more (infinite scroll)
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || fetchingRef.current) return;

        setIsLoadingMore(true);
        fetchingRef.current = true;
        pageRef.current += 1;

        try {
            const result = await getFeed(pageRef.current, 20, filters);

            if (result.success && result.data) {
                setItems(prev => [...prev, ...result.data!.items]);
                setHasMore(result.data.hasMore);
            }
        } catch {
            // Revert page on error
            pageRef.current -= 1;
        } finally {
            setIsLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [isLoadingMore, hasMore, filters]);

    // Refresh (pull to refresh)
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        pageRef.current = 1;

        try {
            const result = await getFeed(1, 20, filters);

            if (result.success && result.data) {
                setItems(result.data.items);
                setHasMore(result.data.hasMore);
                setCachedData(CACHE_KEY, result.data.items);
                setError(null);
            }
        } catch {
            // Ignore
        } finally {
            setIsRefreshing(false);
        }
    }, [filters]);

    // Mark as read
    const read = useCallback(async (itemId: string) => {
        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, is_read: true } : item
        ));

        await markAsRead(itemId);
    }, []);

    // Toggle save
    const save = useCallback(async (itemId: string): Promise<boolean> => {
        // Optimistic update
        let newSavedState = false;
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                newSavedState = !item.is_saved;
                return { ...item, is_saved: newSavedState };
            }
            return item;
        }));

        const result = await toggleSave(itemId);

        if (!result.success) {
            // Rollback
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, is_saved: !newSavedState } : item
            ));
            return false;
        }

        return result.data || false;
    }, []);

    // Set filters
    const setFilters = useCallback((newFilters: FeedFilters) => {
        setFiltersState(newFilters);
        pageRef.current = 1;
        setIsLoading(true);
    }, []);

    // Load saved items
    const loadSaved = useCallback(async () => {
        try {
            const result = await getSavedItems();
            if (result.success && result.data) {
                setSavedItems(result.data);
            }
        } catch {
            // Ignore
        }
    }, []);

    return {
        items,
        savedItems,
        isLoading,
        isLoadingMore,
        isRefreshing,
        isOffline: !isOnline,
        hasMore,
        error,
        loadMore,
        refresh,
        read,
        save,
        setFilters,
        loadSaved,
    };
}

export type { FeedItem, FeedFilters };
