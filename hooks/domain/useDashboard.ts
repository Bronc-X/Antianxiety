'use client';

/**
 * useDashboard Domain Hook (The Bridge)
 * 
 * Manages dashboard state and calls Server Actions.
 * Shared between Desktop and Mobile presentational components.
 * 
 * Features:
 * - SWR-based data fetching with caching
 * - Offline support with cached data
 * - Sync operation with loading state
 * - Optimistic update support via mutate
 * 
 * Requirements: 2.2, 2.3, 2.4, 5.3, 5.4
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { getDashboardData, syncProfile, getDigitalTwinData } from '@/app/actions/dashboard';
import { analyzeDigitalTwin as analyzeDigitalTwinAction } from '@/app/actions/digital-twin';
import type {
  UseDashboardReturn,
  DashboardData,
  UnifiedProfile,
  WellnessLog,
  HardwareData
} from '@/types/architecture';
import type { DashboardResponse } from '@/types/digital-twin';

// ============================================
// Cache Configuration
// ============================================

/** Cache key for dashboard data */
const CACHE_KEY = 'dashboard-data';
const TWIN_CACHE_KEY = 'digital-twin-data';

/** Stale time in milliseconds (30 seconds) */
const STALE_TIME = 30 * 1000;

/** Deduplication interval in milliseconds */
const DEDUPE_INTERVAL = 5 * 1000;

// ============================================
// Simple In-Memory Cache
// ============================================

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

function isCacheStale(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return true;
  return Date.now() - entry.timestamp > STALE_TIME;
}

// ============================================
// Hook Implementation
// ============================================

interface ExtendedUseDashboardReturn extends UseDashboardReturn {
  digitalTwin: DigitalTwinState;
  loadingDigitalTwin: boolean;
  loadDigitalTwin: () => Promise<void>;
  analyzeDigitalTwin: (forceRefresh?: boolean) => Promise<boolean>;
}

type DigitalTwinState = DashboardResponse | { status: string; collectionStatus?: unknown; message?: string } | null;

export function useDashboard(): ExtendedUseDashboardReturn {
  // Network status
  const { isOnline } = useNetwork();

  // Data state
  const [data, setData] = useState<DashboardData | null>(() => getCachedData(CACHE_KEY));
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinState>(() => getCachedData(TWIN_CACHE_KEY));

  const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
  const [loadingDigitalTwin, setLoadingDigitalTwin] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deduplication ref
  const lastFetchRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DEDUPE_INTERVAL) return;
    if (fetchingRef.current) return;
    if (!isOnline && getCachedData(CACHE_KEY)) return;

    fetchingRef.current = true;
    lastFetchRef.current = now;

    if (!getCachedData(CACHE_KEY)) setIsLoading(true);

    try {
      const result = await getDashboardData();

      if (result.success && result.data) {
        setData(result.data);
        setCachedData(CACHE_KEY, result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isOnline]);

  const loadDigitalTwin = useCallback(async () => {
    // Dedupe for digital twin specifically? 
    // For now, simple fetch
    setLoadingDigitalTwin(true);
    try {
      const result = await getDigitalTwinData();
      if (result.success && result.data) {
        setDigitalTwin(result.data);
        setCachedData(TWIN_CACHE_KEY, result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDigitalTwin(false);
    }
  }, []);

  const analyzeDigitalTwin = useCallback(async (forceRefresh = true) => {
    setLoadingDigitalTwin(true);
    setError(null);
    try {
      const result = await analyzeDigitalTwinAction({ forceRefresh });
      if (!result.success) {
        setError(result.error || 'Analysis failed');
        return false;
      }
      await loadDigitalTwin();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return false;
    } finally {
      setLoadingDigitalTwin(false);
    }
  }, [loadDigitalTwin]);

  // ============================================
  // Initial Fetch & Revalidation
  // ============================================

  useEffect(() => {
    fetchData();
    if (isOnline && isCacheStale(CACHE_KEY)) {
      fetchData(true);
    }
  }, [fetchData, isOnline]);

  // ============================================
  // Actions
  // ============================================

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncProfile();
      if (!result.success) {
        setError(result.error || 'Sync failed');
        return;
      }
      await fetchData(true);
      // Also refresh digital twin if loaded
      if (digitalTwin) loadDigitalTwin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, fetchData, digitalTwin, loadDigitalTwin]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchData(true), loadDigitalTwin()]);
  }, [fetchData, loadDigitalTwin]);

  const mutate = useCallback(async (
    newData?: DashboardData,
    shouldRevalidate = true
  ) => {
    if (newData) {
      setData(newData);
      setCachedData(CACHE_KEY, newData);
    }
    if (shouldRevalidate) await fetchData(true);
  }, [fetchData]);

  return {
    profile: data?.profile ?? null,
    weeklyLogs: data?.weeklyLogs ?? [],
    hardwareData: data?.hardwareData ?? null,
    digitalTwin,

    isLoading,
    loadingDigitalTwin,
    isSyncing,
    isOffline: !isOnline,
    error,

    sync,
    refresh,
    mutate,
    loadDigitalTwin,
    analyzeDigitalTwin
  };
}

export type {
  UseDashboardReturn,
  ExtendedUseDashboardReturn,
  DashboardData,
  UnifiedProfile,
  WellnessLog,
  HardwareData
};
