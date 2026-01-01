'use client';

/**
 * useHabits Domain Hook (The Bridge)
 *
 * Wraps habit CRUD actions and optional realtime refresh.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/domain/useAuth';
import {
  getHabits,
  createHabit as createHabitAction,
  completeHabit as completeHabitAction,
  type HabitData,
  type HabitCreateInput,
} from '@/app/actions/habits';

export interface UseHabitsReturn {
  habits: HabitData[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  load: () => Promise<HabitData[]>;
  create: (input: HabitCreateInput) => Promise<boolean>;
  complete: (habitId: number, beliefScore: number) => Promise<boolean>;
  clearError: () => void;
}

interface UseHabitsOptions {
  initialHabits?: HabitData[];
  userId?: string | null;
  autoLoad?: boolean;
  autoSubscribe?: boolean;
}

export function useHabits(options: UseHabitsOptions = {}): UseHabitsReturn {
  const { user } = useAuth();
  const userId = options.userId || user?.id || null;
  const [habits, setHabits] = useState<HabitData[]>(options.initialHabits || []);
  const [isLoading, setIsLoading] = useState(!options.initialHabits);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getHabits();
      if (!result.success) {
        setError(result.error || 'Failed to load habits');
        setHabits([]);
        return [];
      }
      const data = result.data || [];
      setHabits(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
      setHabits([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (input: HabitCreateInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await createHabitAction(input);
      if (!result.success || !result.data) {
        setError(result.error || '保存习惯时出错，请稍后重试');
        return false;
      }
      setHabits(prev => [result.data!, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存习惯时出错，请稍后重试');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const complete = useCallback(async (habitId: number, beliefScore: number) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await completeHabitAction({ habitId, beliefScore });
      if (!result.success) {
        setError(result.error || '完成习惯时发生错误，请稍后重试');
        return false;
      }
      setHabits(prev => prev.map(habit =>
        habit.id === habitId ? { ...habit, belief_score: beliefScore } : habit
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '完成习惯时发生错误，请稍后重试');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (options.autoLoad === false) return;
    load();
  }, [load, options.autoLoad]);

  useEffect(() => {
    if (!userId || options.autoSubscribe === false) return;
    const supabase = createClientSupabaseClient();
    const channel = supabase
      .channel(`habit-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => {
          load();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        (payload) => {
          const newHabitId = (payload.new as { habit_id?: number } | null)?.habit_id;
          const oldHabitId = (payload.old as { habit_id?: number } | null)?.habit_id;
          if (typeof newHabitId === 'number' || typeof oldHabitId === 'number') {
            load();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, options.autoSubscribe, userId]);

  return {
    habits,
    isLoading,
    isSaving,
    error,
    load,
    create,
    complete,
    clearError,
  };
}

export type { HabitData, HabitCreateInput };
