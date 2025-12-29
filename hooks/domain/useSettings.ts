'use client';

/**
 * useSettings Domain Hook (The Bridge)
 * 
 * Manages settings state and calls Server Actions.
 * Shared between Desktop and Mobile presentational components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { updateSettings } from '@/app/actions/settings';

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
    userId: string;
}

export function useSettings({ initialData, userId }: UseSettingsOptions): UseSettingsReturn {
    const { isOnline } = useNetwork();

    const [settings, setSettings] = useState<SettingsData>(() =>
        initialData || getCachedData(CACHE_KEY) || {}
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache initial data
    useEffect(() => {
        if (initialData) {
            setCachedData(CACHE_KEY, initialData);
        }
    }, [initialData]);

    // Update settings
    const update = useCallback(async (data: Partial<SettingsData>): Promise<boolean> => {
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

    // Refresh (for Settings, this just resets from cache)
    const refresh = useCallback(async () => {
        const cached = getCachedData<SettingsData>(CACHE_KEY);
        if (cached) {
            setSettings(cached);
        }
        setError(null);
    }, []);

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

export type { SettingsData };
