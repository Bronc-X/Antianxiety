'use client';

/**
 * useGoals Domain Hook (The Bridge)
 * 
 * Manages goals state and calls Server Actions.
 * Shared between Desktop and Mobile presentational components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getGoals,
    createGoal,
    toggleGoalComplete,
    deleteGoal,
    type PhaseGoal,
    type CreateGoalInput
} from '@/app/actions/goals';

// ============================================
// Types
// ============================================

export interface UseGoalsReturn {
    // Data
    goals: PhaseGoal[];
    activeGoals: PhaseGoal[];
    completedGoals: PhaseGoal[];

    // States
    isLoading: boolean;
    isSaving: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    create: (input: CreateGoalInput) => Promise<boolean>;
    toggle: (goalId: string) => Promise<boolean>;
    remove: (goalId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY = 'goals-data';
const STALE_TIME = 30 * 1000;
const DEDUPE_INTERVAL = 5 * 1000;

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

export function useGoals(): UseGoalsReturn {
    const { isOnline } = useNetwork();

    const [goals, setGoals] = useState<PhaseGoal[]>(() => getCachedData(CACHE_KEY) || []);
    const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastFetchRef = useRef<number>(0);
    const fetchingRef = useRef<boolean>(false);

    // Fetch goals
    const fetchGoals = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchRef.current < DEDUPE_INTERVAL) return;
        if (fetchingRef.current) return;
        if (!isOnline && getCachedData(CACHE_KEY)) return;

        fetchingRef.current = true;
        lastFetchRef.current = now;

        if (!getCachedData(CACHE_KEY)) {
            setIsLoading(true);
        }

        try {
            const result = await getGoals();

            if (result.success && result.data) {
                setGoals(result.data);
                setCachedData(CACHE_KEY, result.data);
                setError(null);
            } else {
                setError(result.error || 'Failed to load goals');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [isOnline]);

    // Initial fetch
    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    // Create goal
    const create = useCallback(async (input: CreateGoalInput): Promise<boolean> => {
        setIsSaving(true);
        setError(null);

        try {
            const result = await createGoal(input);

            if (result.success && result.data) {
                setGoals(prev => [result.data!, ...prev]);
                setCachedData(CACHE_KEY, [result.data, ...goals]);
                return true;
            } else {
                setError(result.error || 'Failed to create goal');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create goal');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [goals]);

    // Toggle goal completion
    const toggle = useCallback(async (goalId: string): Promise<boolean> => {
        setIsSaving(true);

        // Optimistic update
        setGoals(prev => prev.map(g =>
            g.id === goalId
                ? { ...g, is_completed: !g.is_completed, progress: g.is_completed ? 0 : 100 }
                : g
        ));

        try {
            const result = await toggleGoalComplete(goalId);

            if (!result.success) {
                // Rollback
                await fetchGoals(true);
                setError(result.error || 'Failed to update goal');
                return false;
            }

            return true;
        } catch (err) {
            await fetchGoals(true);
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [fetchGoals]);

    // Remove goal
    const remove = useCallback(async (goalId: string): Promise<boolean> => {
        setIsSaving(true);

        const original = goals;
        setGoals(prev => prev.filter(g => g.id !== goalId));

        try {
            const result = await deleteGoal(goalId);

            if (!result.success) {
                setGoals(original);
                setError(result.error || 'Failed to delete goal');
                return false;
            }

            return true;
        } catch (err) {
            setGoals(original);
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [goals]);

    // Refresh
    const refresh = useCallback(async () => {
        await fetchGoals(true);
    }, [fetchGoals]);

    // Computed values
    const activeGoals = goals.filter(g => !g.is_completed);
    const completedGoals = goals.filter(g => g.is_completed);

    return {
        goals,
        activeGoals,
        completedGoals,
        isLoading,
        isSaving,
        isOffline: !isOnline,
        error,
        create,
        toggle,
        remove,
        refresh,
    };
}

export type { PhaseGoal, CreateGoalInput };
