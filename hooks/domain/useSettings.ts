'use client';

/**
 * useSettings Domain Hook (The Bridge)
 * 
 * Manages settings state and calls Server Actions.
 * Shared between Desktop and Mobile presentational components.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { updateSettings } from '@/app/actions/settings';
import { createClientSupabaseClient } from '@/lib/supabase-client';

// ============================================
// Types
// ============================================

export interface SettingsData {
    // Body Metrics
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;

    // AI Tuning
    primary_goal?: string;
    ai_personality?: string;
    current_focus?: string;

    // MAX Settings
    max_honesty?: number;
    max_humor?: number;

    // Account
    full_name?: string;
    avatar_url?: string;
}

export interface UseSettingsReturn {
    // Data
    settings: SettingsData;

    // States
    isLoading: boolean;
    isSaving: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    update: (data: Partial<SettingsData>) => Promise<boolean>;
    refresh: () => Promise<void>;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY = 'settings-data';

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

interface UseSettingsOptions {
    initialData?: SettingsData;
    userId?: string;
}

export function useSettings(options?: UseSettingsOptions): UseSettingsReturn {
    const { isOnline } = useNetwork();

    const [settings, setSettings] = useState<SettingsData>(() =>
        options?.initialData || getCachedData(CACHE_KEY) || {}
    );
    const [userId, setUserId] = useState<string | null>(options?.userId || null);
    const [isLoading, setIsLoading] = useState(!options?.userId);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user ID if not provided
    useEffect(() => {
        if (options?.userId) {
            setUserId(options.userId);
            setIsLoading(false);
            return;
        }

        const fetchUserId = async () => {
            try {
                const supabase = createClientSupabaseClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);

                    // Also fetch current settings from profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('height, weight, age, gender, primary_goal, ai_personality, current_focus, full_name, avatar_url')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        const settingsData: SettingsData = {
                            height: profile.height,
                            weight: profile.weight,
                            age: profile.age,
                            gender: profile.gender,
                            primary_goal: profile.primary_goal,
                            ai_personality: profile.ai_personality,
                            current_focus: profile.current_focus,
                            full_name: profile.full_name,
                            avatar_url: profile.avatar_url,
                        };
                        setSettings(settingsData);
                        setCachedData(CACHE_KEY, settingsData);
                    }
                } else {
                    setError('请先登录');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get user');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserId();
    }, [options?.userId]);

    // Cache initial data
    useEffect(() => {
        if (options?.initialData) {
            setCachedData(CACHE_KEY, options.initialData);
        }
    }, [options?.initialData]);

    // Update settings
    const update = useCallback(async (data: Partial<SettingsData>): Promise<boolean> => {
        if (!userId) {
            setError('用户未登录');
            return false;
        }

        setIsSaving(true);
        setError(null);

        // Optimistic update
        const previousSettings = settings;
        setSettings(prev => ({ ...prev, ...data }));

        try {
            const result = await updateSettings(userId, data);

            if (result.success) {
                // Update cache
                const newSettings = { ...settings, ...data };
                setCachedData(CACHE_KEY, newSettings);
                return true;
            } else {
                // Rollback
                setSettings(previousSettings);
                setError(result.error || 'Failed to save settings');
                return false;
            }
        } catch (err) {
            setSettings(previousSettings);
            setError(err instanceof Error ? err.message : 'Failed to save settings');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [userId, settings]);

    // Refresh - fetch from database
    const refresh = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const supabase = createClientSupabaseClient();
            const { data: profile } = await supabase
                .from('profiles')
                .select('height, weight, age, gender, primary_goal, ai_personality, current_focus, full_name, avatar_url')
                .eq('id', userId)
                .single();

            if (profile) {
                const settingsData: SettingsData = {
                    height: profile.height,
                    weight: profile.weight,
                    age: profile.age,
                    gender: profile.gender,
                    primary_goal: profile.primary_goal,
                    ai_personality: profile.ai_personality,
                    current_focus: profile.current_focus,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                };
                setSettings(settingsData);
                setCachedData(CACHE_KEY, settingsData);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    return {
        settings,
        isLoading,
        isSaving,
        isOffline: !isOnline,
        error,
        update,
        refresh,
    };
}
