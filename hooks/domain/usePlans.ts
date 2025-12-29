'use client';

/**
 * usePlans Domain Hook (The Bridge)
 * 
 * Manages plans state and calls Server Actions.
 * Shared between Desktop and Mobile presentational components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getPlans,
    createPlan,
    updatePlanStatus,
    deletePlan,
    type PlanData,
    type CreatePlanInput
} from '@/app/actions/plans';

// ============================================
// Types
// ============================================

export interface UsePlansReturn {
    // Data
    plans: PlanData[];
    activePlans: PlanData[];
    completedPlans: PlanData[];

    // States
    isLoading: boolean;
    isSaving: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    create: (input: CreatePlanInput) => Promise<boolean>;
    complete: (planId: string) => Promise<boolean>;
    pause: (planId: string) => Promise<boolean>;
    resume: (planId: string) => Promise<boolean>;
    remove: (planId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

// ============================================
// Cache
// ============================================

const CACHE_KEY = 'plans-data';
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

export function usePlans(): UsePlansReturn {
    const { isOnline } = useNetwork();

    const [plans, setPlans] = useState<PlanData[]>(() => getCachedData(CACHE_KEY) || []);
    const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastFetchRef = useRef<number>(0);
    const fetchingRef = useRef<boolean>(false);

    // Fetch plans
    const fetchPlans = useCallback(async (force = false) => {
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
            const result = await getPlans();

            if (result.success && result.data) {
                setPlans(result.data);
                setCachedData(CACHE_KEY, result.data);
                setError(null);
            } else {
                setError(result.error || 'Failed to load plans');
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
        fetchPlans();
    }, [fetchPlans]);

    // Create plan
    const create = useCallback(async (input: CreatePlanInput): Promise<boolean> => {
        setIsSaving(true);
        setError(null);

        try {
            const result = await createPlan(input);

            if (result.success && result.data) {
                setPlans(prev => [result.data!, ...prev]);
                setCachedData(CACHE_KEY, [result.data, ...plans]);
                return true;
            } else {
                setError(result.error || 'Failed to create plan');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create plan');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [plans]);

    // Complete plan
    const complete = useCallback(async (planId: string): Promise<boolean> => {
        setIsSaving(true);

        // Optimistic update
        setPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, status: 'completed' as const, progress: 100 } : p
        ));

        try {
            const result = await updatePlanStatus(planId, 'completed');

            if (!result.success) {
                // Rollback
                await fetchPlans(true);
                setError(result.error || 'Failed to complete plan');
                return false;
            }

            return true;
        } catch (err) {
            await fetchPlans(true);
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [fetchPlans]);

    // Pause plan
    const pause = useCallback(async (planId: string): Promise<boolean> => {
        setIsSaving(true);

        setPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, status: 'paused' as const } : p
        ));

        try {
            const result = await updatePlanStatus(planId, 'paused');

            if (!result.success) {
                await fetchPlans(true);
                return false;
            }

            return true;
        } catch {
            await fetchPlans(true);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [fetchPlans]);

    // Resume plan
    const resume = useCallback(async (planId: string): Promise<boolean> => {
        setIsSaving(true);

        setPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, status: 'active' as const } : p
        ));

        try {
            const result = await updatePlanStatus(planId, 'active');

            if (!result.success) {
                await fetchPlans(true);
                return false;
            }

            return true;
        } catch {
            await fetchPlans(true);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [fetchPlans]);

    // Remove plan
    const remove = useCallback(async (planId: string): Promise<boolean> => {
        setIsSaving(true);

        const original = plans;
        setPlans(prev => prev.filter(p => p.id !== planId));

        try {
            const result = await deletePlan(planId);

            if (!result.success) {
                setPlans(original);
                setError(result.error || 'Failed to delete plan');
                return false;
            }

            return true;
        } catch (err) {
            setPlans(original);
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [plans]);

    // Refresh
    const refresh = useCallback(async () => {
        await fetchPlans(true);
    }, [fetchPlans]);

    // Computed values
    const activePlans = plans.filter(p => p.status === 'active');
    const completedPlans = plans.filter(p => p.status === 'completed');

    return {
        plans,
        activePlans,
        completedPlans,
        isLoading,
        isSaving,
        isOffline: !isOnline,
        error,
        create,
        complete,
        pause,
        resume,
        remove,
        refresh,
    };
}

export type { PlanData, CreatePlanInput };
