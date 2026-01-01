'use client';

/**
 * useMaxApi Domain Hook (The Bridge)
 *
 * Wraps Max-specific actions (plans, belief, response, settings).
 */

import { useCallback, useState } from 'react';
import {
  getMaxResponse,
  submitMaxBelief,
  maxPlanChat,
  maxPlanReplace,
  getMaxSettings,
  updateMaxSettings,
} from '@/app/actions/max';

export interface UseMaxApiReturn {
  isLoading: boolean;
  error: string | null;
  getResponse: (payload: Record<string, unknown>) => Promise<any>;
  submitBelief: (payload: Record<string, unknown>) => Promise<any>;
  planChat: (payload: Record<string, unknown>) => Promise<any>;
  planReplace: (payload: Record<string, unknown>) => Promise<any>;
  loadSettings: () => Promise<any>;
  saveSettings: (payload: Record<string, unknown>) => Promise<any>;
  clearError: () => void;
}

export function useMaxApi(): UseMaxApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getResponse = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMaxResponse(payload);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitBelief = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await submitMaxBelief(payload);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const planChat = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await maxPlanChat(payload);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const planReplace = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await maxPlanReplace(payload);
      if (!result.success) {
        setError(result.error || 'Request failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMaxSettings();
      if (!result.success) {
        setError(result.error || 'Failed to load settings');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (payload: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateMaxSettings(payload);
      if (!result.success) {
        setError(result.error || 'Failed to update settings');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    getResponse,
    submitBelief,
    planChat,
    planReplace,
    loadSettings,
    saveSettings,
    clearError,
  };
}
