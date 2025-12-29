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
import { getDashboardData, syncProfile } from '@/app/actions/dashboard';
import type { 
  UseDashboardReturn, 
  DashboardData,
  UnifiedProfile,
  WellnessLog,
  HardwareData 
} from '@/types/architecture';

// ============================================
// Cache Configuration
// ============================================

/** Cache key for dashboard data */
const CACHE_KEY = 'dashboard-data';

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

/**
 * Domain hook for dashboard data management.
 * 
 * @returns UseDashboardReturn interface with data, states, and actions
 * 
 * @example
 * function DashboardComponent() {
 *   const { profile, isLoading, sync, isOffline } = useDashboard();
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (isOffline) return <OfflineBanner />;
 *   
 *   return <ProfileCard profile={profile} onSync={sync} />;
 * }
 */
export function useDashboard(): UseDashboardReturn {
  // Network status
  const { isOnline } = useNetwork();
  
  // Data state
  const [data, setData] = useState<DashboardData | null>(() => getCachedData(CACHE_KEY));
  const [isLoading, setIsLoading] = useState(!getCachedData(CACHE_KEY));
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Deduplication ref
  const lastFetchRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);
  
  // ============================================
  // Data Fetching
  // ============================================
  
  const fetchData = useCallback(async (force = false) => {
    // Deduplication: skip if recently fetched
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DEDUPE_INTERVAL) {
      return;
    }
    
    // Skip if already fetching
    if (fetchingRef.current) {
      return;
    }
    
    // Skip if offline and have cached data
    if (!isOnline && getCachedData(CACHE_KEY)) {
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;
    
    // Only show loading if no cached data
    if (!getCachedData(CACHE_KEY)) {
      setIsLoading(true);
    }
    
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
  
  // ============================================
  // Initial Fetch & Revalidation
  // ============================================
  
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Revalidate when coming back online
    if (isOnline && isCacheStale(CACHE_KEY)) {
      fetchData(true);
    }
  }, [fetchData, isOnline]);
  
  // ============================================
  // Actions
  // ============================================
  
  /**
   * Trigger profile sync and refresh data.
   */
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
      
      // Refresh data after sync
      await fetchData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, fetchData]);
  
  /**
   * Manually refresh data.
   */
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);
  
  /**
   * Optimistic update / manual mutation.
   */
  const mutate = useCallback(async (
    newData?: DashboardData, 
    shouldRevalidate = true
  ) => {
    if (newData) {
      setData(newData);
      setCachedData(CACHE_KEY, newData);
    }
    
    if (shouldRevalidate) {
      await fetchData(true);
    }
  }, [fetchData]);
  
  // ============================================
  // Return Interface
  // ============================================
  
  return {
    // Data (destructured for convenience)
    profile: data?.profile ?? null,
    weeklyLogs: data?.weeklyLogs ?? [],
    hardwareData: data?.hardwareData ?? null,
    
    // States
    isLoading,
    isSyncing,
    isOffline: !isOnline,
    error,
    
    // Actions
    sync,
    refresh,
    mutate,
  };
}

// Re-export types for convenience
export type { 
  UseDashboardReturn, 
  DashboardData,
  UnifiedProfile,
  WellnessLog,
  HardwareData 
};
