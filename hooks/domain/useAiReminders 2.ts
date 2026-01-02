'use client';

/**
 * useAiReminders Domain Hook (The Bridge)
 *
 * Wraps AI reminder actions and realtime updates.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/domain/useAuth';
import {
  getAiReminders,
  markAiReminderRead,
  dismissAiReminder,
  type AiReminder,
} from '@/app/actions/ai-reminders';

export interface UseAiRemindersReturn {
  reminders: AiReminder[];
  isLoading: boolean;
  error: string | null;
  load: (limit?: number) => Promise<AiReminder[]>;
  markRead: (reminderId: number) => Promise<boolean>;
  dismiss: (reminderId: number) => Promise<boolean>;
  clearError: () => void;
}

interface UseAiRemindersOptions {
  userId?: string;
  autoLoad?: boolean;
  autoSubscribe?: boolean;
  limit?: number;
}

export function useAiReminders(options: UseAiRemindersOptions = {}): UseAiRemindersReturn {
  const { user } = useAuth();
  const userId = options.userId || user?.id;
  const [reminders, setReminders] = useState<AiReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAiReminders(limit ?? options.limit ?? 5);
      if (!result.success) {
        setError(result.error || '获取AI提醒失败');
        setReminders([]);
        return [];
      }
      const data = result.data || [];
      setReminders(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取AI提醒失败');
      setReminders([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [options.limit]);

  const markRead = useCallback(async (reminderId: number) => {
    setError(null);
    try {
      const result = await markAiReminderRead(reminderId);
      if (!result.success) {
        setError(result.error || '标记提醒失败');
        return false;
      }
      setReminders(prev => prev.map(reminder =>
        reminder.id === reminderId ? { ...reminder, read: true } : reminder
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '标记提醒失败');
      return false;
    }
  }, []);

  const dismiss = useCallback(async (reminderId: number) => {
    setError(null);
    try {
      const result = await dismissAiReminder(reminderId);
      if (!result.success) {
        setError(result.error || '忽略提醒失败');
        return false;
      }
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '忽略提醒失败');
      return false;
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
      .channel(`ai-reminders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_reminders', filter: `user_id=eq.${userId}` },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, options.autoSubscribe, userId]);

  return {
    reminders,
    isLoading,
    error,
    load,
    markRead,
    dismiss,
    clearError,
  };
}

export type { AiReminder };
