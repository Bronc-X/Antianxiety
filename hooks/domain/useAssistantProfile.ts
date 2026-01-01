'use client';

/**
 * useAssistantProfile Domain Hook (The Bridge)
 *
 * Handles AI assistant profile data flow.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAssistantProfile,
  saveAssistantProfile,
  type AssistantProfileData,
  type AssistantProfileInput,
} from '@/app/actions/assistant-profile';

export interface UseAssistantProfileReturn {
  data: AssistantProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  save: (input: AssistantProfileInput) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useAssistantProfile(): UseAssistantProfileReturn {
  const [data, setData] = useState<AssistantProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAssistantProfile();
      if (result.success) {
        setData(result.data || null);
      } else {
        setError(result.error || 'Failed to load profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const save = useCallback(async (input: AssistantProfileInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveAssistantProfile(input);
      if (!result.success) {
        setError(result.error || 'Failed to save profile');
        return false;
      }
      setData(prev => ({ ...(prev || {}), ...input }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    isSaving,
    error,
    save,
    refresh: fetchProfile,
    clearError,
  };
}
