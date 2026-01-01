'use client';

/**
 * usePhaseGoals Domain Hook (The Bridge)
 *
 * Wraps phase goals fetch + modify actions.
 */

import { useCallback, useState } from 'react';
import { getPhaseGoals } from '@/app/actions/settings';
import { modifyGoal } from '@/app/actions/onboarding';

export interface UsePhaseGoalsReturn {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchGoals: (userId?: string) => Promise<any>;
  explainGoal: (goalId: string) => Promise<any>;
  confirmGoal: (goalId: string, newGoalType: string, newTitle?: string) => Promise<any>;
  clearError: () => void;
}

export function usePhaseGoals(): UsePhaseGoalsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPhaseGoals(userId);
      if (!result.success) {
        setError(result.error || 'Failed to load goals');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const explainGoal = useCallback(async (goalId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await modifyGoal({ goalId, action: 'explain' });
      if (!result.success) {
        setError(result.error || 'Failed to load goal explanation');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal explanation');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const confirmGoal = useCallback(async (goalId: string, newGoalType: string, newTitle?: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await modifyGoal({
        goalId,
        newGoalType,
        newTitle,
        action: 'confirm',
      });
      if (!result.success) {
        setError(result.error || 'Failed to update goal');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    isSaving,
    error,
    fetchGoals,
    explainGoal,
    confirmGoal,
    clearError,
  };
}
