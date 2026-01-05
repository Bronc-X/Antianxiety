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
    toggleFeedFeedback,
    type FeedItem,
    type FeedFilters,
    type FeedResponseMeta,
    type FeedFeedbackInput
} from '@/app/actions/feed';

// ============================================
// Types
// ============================================

export interface UseFeedReturn {
    // Data
    items: FeedItem[];
    savedItems: FeedItem[];
    personalization: FeedResponseMeta | null;

    // States
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    isOffline: boolean;
    hasMore: boolean;
    error: string | null;

    // Actions
    loadMore: () => Promise<void>;
    refresh: (force?: boolean) => Promise<void>;
    read: (itemId: string) => Promise<void>;
    save: (itemId: string) => Promise<boolean>;
    feedback: (input: FeedFeedbackInput) => Promise<'added' | 'removed' | null>;
    setFilters: (filters: FeedFilters) => void;
    loadSaved: () => Promise<void>;
}

export interface UseFeedOptions {
    language?: 'zh' | 'en';
    cacheDaily?: boolean;
    cacheNamespace?: string;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY_PREFIX = 'feed-data';
const STORAGE_KEY_PREFIX = 'nma_feed_cache';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface FeedCachePayload {
    items: FeedItem[];
    personalization: FeedResponseMeta | null;
    hasMore: boolean;
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

function normalizeLanguage(language?: string): 'zh' | 'en' {
    return language === 'en' ? 'en' : 'zh';
}

function serializeFilters(filters: FeedFilters): string {
    const entries = Object.entries(filters).filter(([, value]) =>
        value !== undefined && value !== null && value !== '' && value !== false
    );
    if (entries.length === 0) return 'all';
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries
        .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join('|') : String(value)}`)
        .join('|');
}

function buildCacheKey(prefix: string, language: string, filters: FeedFilters): string {
    return `${prefix}:${language}:${serializeFilters(filters)}`;
}

function getLocalDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readDailyCache(key: string): FeedCachePayload | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as FeedCachePayload & { date?: string };
        if (!parsed || !Array.isArray(parsed.items)) return null;
        if (parsed.date !== getLocalDateKey()) return null;
        return {
            items: parsed.items,
            personalization: parsed.personalization ?? null,
            hasMore: typeof parsed.hasMore === 'boolean' ? parsed.hasMore : true,
        };
    } catch {
        return null;
    }
}

function writeDailyCache(key: string, payload: FeedCachePayload): void {
    if (typeof window === 'undefined') return;
    const stored = {
        ...payload,
        date: getLocalDateKey(),
    };
    window.localStorage.setItem(key, JSON.stringify(stored));
}

function clearDailyCache(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
}

// ============================================
// Hook Implementation
// ============================================

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
    const { isOnline } = useNetwork();

    const [filters, setFiltersState] = useState<FeedFilters>({});
    const feedLanguage = normalizeLanguage(options.language);
    const cacheNamespace = options.cacheNamespace || CACHE_KEY_PREFIX;
    const cacheKey = buildCacheKey(cacheNamespace, feedLanguage, filters);
    const cacheDaily = options.cacheDaily ?? false;
    const storageKey = `${STORAGE_KEY_PREFIX}:${cacheKey}`;
    const initialCache = getCachedData<FeedCachePayload>(cacheKey) || (cacheDaily ? readDailyCache(storageKey) : null);

    const [items, setItems] = useState<FeedItem[]>(() => initialCache?.items || []);
    const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
    const [personalization, setPersonalization] = useState<FeedResponseMeta | null>(initialCache?.personalization ?? null);
    const [isLoading, setIsLoading] = useState(!initialCache);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? true);
    const [error, setError] = useState<string | null>(null);

    const pageRef = useRef(1);
    const fetchingRef = useRef(false);
    const personalizationRef = useRef<FeedResponseMeta | null>(initialCache?.personalization ?? null);

    useEffect(() => {
        personalizationRef.current = personalization;
    }, [personalization]);

    const persistCache = useCallback((payload: FeedCachePayload) => {
        setCachedData(cacheKey, payload);
        if (cacheDaily) {
            writeDailyCache(storageKey, payload);
        }
    }, [cacheDaily, cacheKey, storageKey]);

    // Initial fetch
    useEffect(() => {
        const fetchInitial = async () => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;
            pageRef.current = 1;

            try {
                const cached = getCachedData<FeedCachePayload>(cacheKey) || (cacheDaily ? readDailyCache(storageKey) : null);
                if (cached) {
                    setItems(cached.items);
                    setHasMore(cached.hasMore);
                    setPersonalization(cached.personalization ?? null);
                    setError(null);
                    setIsLoading(false);
                    fetchingRef.current = false;
                    return;
                }

                const result = await getFeed(1, 20, filters, true, feedLanguage);

                if (result.success && result.data) {
                    setItems(result.data.items);
                    setHasMore(result.data.hasMore);
                    const nextPersonalization = result.data.personalization ?? null;
                    if (nextPersonalization) {
                        setPersonalization(nextPersonalization);
                    } else {
                        setPersonalization(null);
                    }
                    persistCache({
                        items: result.data.items,
                        personalization: nextPersonalization,
                        hasMore: result.data.hasMore,
                    });
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
    }, [cacheDaily, cacheKey, feedLanguage, filters, persistCache, storageKey]);

    // Load more (infinite scroll)
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || fetchingRef.current) return;

        setIsLoadingMore(true);
        fetchingRef.current = true;
        pageRef.current += 1;

        try {
            const result = await getFeed(pageRef.current, 20, filters, true, feedLanguage);

            if (result.success && result.data) {
                setItems(prev => {
                    const merged = [...prev, ...result.data!.items];
                    persistCache({
                        items: merged,
                        personalization: personalizationRef.current,
                        hasMore: result.data!.hasMore,
                    });
                    return merged;
                });
                setHasMore(result.data.hasMore);
            }
        } catch {
            // Revert page on error
            pageRef.current -= 1;
        } finally {
            setIsLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [feedLanguage, filters, hasMore, isLoadingMore, persistCache]);

    // Refresh (pull to refresh)
    const refresh = useCallback(async (force = false) => {
        setIsRefreshing(true);
        pageRef.current = 1;

        try {
            if (force) {
                clearDailyCache(storageKey);
            }

            const result = await getFeed(1, 20, filters, true, feedLanguage);

            if (result.success && result.data) {
                setItems(result.data.items);
                setHasMore(result.data.hasMore);
                const nextPersonalization = result.data.personalization ?? null;
                if (nextPersonalization) {
                    setPersonalization(nextPersonalization);
                } else {
                    setPersonalization(null);
                }
                persistCache({
                    items: result.data.items,
                    personalization: nextPersonalization,
                    hasMore: result.data.hasMore,
                });
                setError(null);
            }
        } catch {
            // Ignore
        } finally {
            setIsRefreshing(false);
        }
    }, [feedLanguage, filters, persistCache, storageKey]);

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

    const feedback = useCallback(async (input: FeedFeedbackInput): Promise<'added' | 'removed' | null> => {
        try {
            const result = await toggleFeedFeedback(input);
            if (!result.success || !result.data) {
                setError(result.error || 'Failed to save feedback');
                return null;
            }
            return result.data.action;
        } catch {
            setError('Failed to save feedback');
            return null;
        }
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
        personalization,
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
        feedback,
        setFilters,
        loadSaved,
    };
}

export type { FeedItem, FeedFilters, FeedFeedbackInput };
