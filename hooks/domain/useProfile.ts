'use client';

/**
 * useProfile Domain Hook (The Bridge)
 * 
 * Manages user profile state.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    saveHealthProfile as saveHealthProfileAction,
    type UserProfile,
    type UpdateProfileInput,
    type SaveHealthProfileInput
} from '@/app/actions/profile';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface UseProfileReturn {
    // Data
    profile: UserProfile | null;

    // States
    isLoading: boolean;
    isSaving: boolean;
    isUploading: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    update: (input: UpdateProfileInput) => Promise<boolean>;
    uploadPhoto: (file: File) => Promise<string | null>;
    refresh: () => Promise<void>;
    remove: () => Promise<boolean>;
    saveHealthProfile: (input: SaveHealthProfileInput) => Promise<ActionResult<any>>;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY = 'profile-data';

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

export function useProfile(): UseProfileReturn {
    const { isOnline } = useNetwork();

    const [profile, setProfile] = useState<UserProfile | null>(() => getCachedData(CACHE_KEY));
    const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const result = await getProfile();
                if (result.success && result.data) {
                    setProfile(result.data);
                    setCachedData(CACHE_KEY, result.data);
                } else {
                    setError(result.error || 'Failed to load profile');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Update profile
    const update = useCallback(async (input: UpdateProfileInput): Promise<boolean> => {
        setIsSaving(true);
        setError(null);

        // Optimistic update
        const previousProfile = profile;
        if (profile) {
            setProfile({ ...profile, ...input } as UserProfile);
        }

        try {
            const result = await updateProfile(input);

            if (result.success && result.data) {
                setProfile(result.data);
                setCachedData(CACHE_KEY, result.data);
                return true;
            } else {
                // Rollback
                setProfile(previousProfile);
                setError(result.error || 'Failed to update');
                return false;
            }
        } catch (err) {
            setProfile(previousProfile);
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [profile]);

    // Upload photo
    const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const result = await uploadAvatar(formData);

            if (result.success && result.data) {
                // Update profile with new avatar
                if (profile) {
                    const updatedProfile = { ...profile, avatar_url: result.data };
                    setProfile(updatedProfile);
                    setCachedData(CACHE_KEY, updatedProfile);
                }
                return result.data;
            } else {
                setError(result.error || 'Failed to upload');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, [profile]);

    // Refresh
    const refresh = useCallback(async () => {
        setIsLoading(true);

        try {
            const result = await getProfile();
            if (result.success && result.data) {
                setProfile(result.data);
                setCachedData(CACHE_KEY, result.data);
                setError(null);
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete account
    const remove = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);

        try {
            const result = await deleteAccount();
            return result.success;
        } catch {
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Save extended health profile
    const saveHealthProfile = useCallback(async (input: SaveHealthProfileInput): Promise<ActionResult<any>> => {
        setIsSaving(true);
        setError(null);
        try {
            const result = await saveHealthProfileAction(input);
            if (!result.success) {
                setError(result.error || '保存失败');
            }
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : '保存失败';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsSaving(false);
        }
    }, []);

    return {
        profile,
        isLoading,
        isSaving,
        isUploading,
        isOffline: !isOnline,
        error,
        update,
        uploadPhoto,
        refresh,
        remove,
        saveHealthProfile,
    };
}

export type { UserProfile, UpdateProfileInput, SaveHealthProfileInput };
