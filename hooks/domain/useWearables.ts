'use client';

/**
 * useWearables Domain Hook (The Bridge)
 *
 * Enhanced wearable device integration with OAuth flow, metrics retrieval, and health checks.
 * Supports Oura, Fitbit, Apple Health, and other providers.
 */

import { useCallback, useState, useEffect } from 'react';
import {
  getWearablesStatus,
  syncWearables,
  disconnectWearable,
  type WearablesSyncInput
} from '@/app/actions/wearables';
import { isNative } from '@/lib/capacitor';

// ============================================
// Types
// ============================================

export type WearableProvider = 'oura' | 'fitbit' | 'apple_health' | 'garmin' | 'whoop';

export interface WearableStatus {
  providers: ProviderStatus[];
  lastSync: string | null;
  totalMetrics: number;
}

export interface ProviderStatus {
  provider: WearableProvider;
  isConnected: boolean;
  lastSync: string | null;
  tokenExpiry: string | null;
  needsReauth: boolean;
  metricsAvailable: string[];
}

export interface ProviderHealth {
  provider: WearableProvider;
  isConnected: boolean;
  lastSync: Date | null;
  tokenExpiry: Date | null;
  needsReauth: boolean;
  syncHealth: 'healthy' | 'stale' | 'error';
  daysUntilExpiry: number | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SleepStage {
  stage: 'deep' | 'light' | 'rem' | 'awake';
  duration: number; // minutes
  startTime: string;
}

export interface SleepData {
  date: string;
  duration: number; // minutes
  quality: number; // 0-100
  stages: SleepStage[];
  efficiency: number;
  latency: number; // minutes to fall asleep
}

export interface HeartRateData {
  date: string;
  avg: number;
  min: number;
  max: number;
  hrv: number; // Heart Rate Variability
  restingHr: number;
}

export interface ActivityData {
  date: string;
  steps: number;
  calories: number;
  activeMinutes: number;
  distance: number; // meters
}

export interface WearableMetrics {
  sleep: SleepData[];
  heartRate: HeartRateData[];
  activity: ActivityData[];
  provider: WearableProvider;
  dateRange: DateRange;
}

export interface UseWearablesReturn {
  // State
  status: WearableStatus | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDisconnecting: boolean;
  isConnecting: boolean;
  error: string | null;

  // Core Actions
  loadStatus: () => Promise<WearableStatus | null>;
  sync: (input?: WearablesSyncInput) => Promise<boolean>;
  disconnect: (provider: WearableProvider) => Promise<boolean>;
  clearError: () => void;

  // NEW: OAuth Connection Flow
  connect: (provider: WearableProvider) => Promise<string | null>;
  handleCallback: (code: string, provider: WearableProvider) => Promise<boolean>;

  // NEW: Metrics Retrieval
  getMetrics: (provider: WearableProvider, dateRange: DateRange) => Promise<WearableMetrics | null>;
  isLoadingMetrics: boolean;

  // NEW: Connection Health Check
  checkHealth: () => Promise<ProviderHealth[]>;
  providerHealths: ProviderHealth[];

  // NEW: Helpers
  isProviderConnected: (provider: WearableProvider) => boolean;
  getConnectedProviders: () => WearableProvider[];
}

const SERVER_OAUTH_PROVIDERS: WearableProvider[] = ['oura', 'fitbit'];
const NATIVE_WEARABLE_REDIRECT = 'antianxiety://oauth/wearables';

// ============================================
// Hook Implementation
// ============================================

export function useWearables(): UseWearablesReturn {
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerHealths, setProviderHealths] = useState<ProviderHealth[]>([]);

  // Load wearable status
  const loadStatus = useCallback(async (): Promise<WearableStatus | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWearablesStatus();
      if (!result.success) {
        setError(result.error || 'Failed to load wearables status');
        setStatus(null);
        return null;
      }
      setStatus(result.data as WearableStatus);
      return result.data as WearableStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wearables status');
      setStatus(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync wearable data
  const sync = useCallback(async (input: WearablesSyncInput = {}): Promise<boolean> => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncWearables(input);
      if (!result.success) {
        setError(result.error || 'Sync failed');
        return false;
      }
      setStatus(result.data as WearableStatus);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Disconnect provider
  const disconnect = useCallback(async (provider: WearableProvider): Promise<boolean> => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const result = await disconnectWearable(provider);
      if (!result.success) {
        setError(result.error || 'Disconnect failed');
        return false;
      }
      await loadStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, [loadStatus]);

  // NEW: Connect via OAuth - returns OAuth URL to redirect to
  const connect = useCallback(async (provider: WearableProvider): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      if (provider === 'apple_health') {
        setError('Apple Health requires native app integration');
        return null;
      }

      if (!SERVER_OAUTH_PROVIDERS.includes(provider)) {
        setError(`OAuth not supported for ${provider}`);
        return null;
      }

      const webOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || webOrigin;
      if (!appOrigin) {
        setError('App URL not configured');
        return null;
      }

      const redirectParam = isNative()
        ? `?redirect_uri=${encodeURIComponent(NATIVE_WEARABLE_REDIRECT)}`
        : '';
      const oauthUrl = `${appOrigin}/api/wearables/connect/${provider}${redirectParam}`;

      console.log(`[Wearables] Using server OAuth for ${provider}`);
      return oauthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate OAuth URL');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // NEW: Handle OAuth callback
  const handleCallback = useCallback(async (code: string, provider: WearableProvider): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!SERVER_OAUTH_PROVIDERS.includes(provider)) {
        setError(`OAuth not supported for ${provider}`);
        return false;
      }

      const payload: { code: string; provider: WearableProvider; redirectUri?: string } = { code, provider };
      if (isNative()) {
        payload.redirectUri = NATIVE_WEARABLE_REDIRECT;
      }

      const response = await fetch('/api/wearables/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'OAuth callback failed');
        return false;
      }

      // Reload status after successful connection
      await loadStatus();
      console.log(`[Wearables] Successfully connected ${provider}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth callback failed');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [loadStatus]);

  // NEW: Get metrics for a provider
  const getMetrics = useCallback(async (
    provider: WearableProvider,
    dateRange: DateRange
  ): Promise<WearableMetrics | null> => {
    setIsLoadingMetrics(true);
    setError(null);

    try {
      const response = await fetch('/api/wearables/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch metrics');
        return null;
      }

      const data = await response.json();
      return {
        ...data,
        provider,
        dateRange,
      } as WearableMetrics;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      return null;
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // NEW: Check health of all connected providers
  const checkHealth = useCallback(async (): Promise<ProviderHealth[]> => {
    if (!status?.providers) return [];

    const healths: ProviderHealth[] = status.providers.map(p => {
      const lastSync = p.lastSync ? new Date(p.lastSync) : null;
      const tokenExpiry = p.tokenExpiry ? new Date(p.tokenExpiry) : null;
      const now = new Date();

      // Calculate sync health
      let syncHealth: 'healthy' | 'stale' | 'error' = 'healthy';
      if (!lastSync) {
        syncHealth = 'error';
      } else {
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync > 24) syncHealth = 'stale';
        if (hoursSinceSync > 72) syncHealth = 'error';
      }

      // Calculate days until token expiry
      const daysUntilExpiry = tokenExpiry
        ? Math.floor((tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        provider: p.provider,
        isConnected: p.isConnected,
        lastSync,
        tokenExpiry,
        needsReauth: p.needsReauth || (daysUntilExpiry !== null && daysUntilExpiry < 7),
        syncHealth,
        daysUntilExpiry,
      };
    });

    setProviderHealths(healths);
    return healths;
  }, [status]);

  // NEW: Helper - check if provider is connected
  const isProviderConnected = useCallback((provider: WearableProvider): boolean => {
    return status?.providers?.some(p => p.provider === provider && p.isConnected) ?? false;
  }, [status]);

  // NEW: Helper - get list of connected providers
  const getConnectedProviders = useCallback((): WearableProvider[] => {
    return status?.providers?.filter(p => p.isConnected).map(p => p.provider) ?? [];
  }, [status]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check health when status changes
  useEffect(() => {
    if (status) {
      void checkHealth();
    }
  }, [status, checkHealth]);

  return {
    // State
    status,
    isLoading,
    isSyncing,
    isDisconnecting,
    isConnecting,
    error,

    // Core Actions
    loadStatus,
    sync,
    disconnect,
    clearError,

    // OAuth Connection Flow
    connect,
    handleCallback,

    // Metrics Retrieval
    getMetrics,
    isLoadingMetrics,

    // Connection Health Check
    checkHealth,
    providerHealths,

    // Helpers
    isProviderConnected,
    getConnectedProviders,
  };
}

export default useWearables;
