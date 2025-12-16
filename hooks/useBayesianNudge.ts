'use client';

/**
 * useBayesianNudge Hook
 * 
 * 用于触发被动微调的 React Hook
 * 监听习惯完成事件并显示 PassiveNudge 组件
 * 
 * @module hooks/useBayesianNudge
 */

import { useState, useCallback, useEffect } from 'react';
import { createClientSupabaseClient as createClient } from '@/lib/supabase-client';

// ============================================
// Types
// ============================================

export interface NudgeState {
  isVisible: boolean;
  actionType: string;
  correction: number;
}

export interface UseBayesianNudgeReturn {
  nudgeState: NudgeState | null;
  triggerNudge: (actionType: string, durationMinutes?: number) => Promise<void>;
  dismissNudge: () => void;
}

// ============================================
// Hook
// ============================================

export function useBayesianNudge(): UseBayesianNudgeReturn {
  const [nudgeState, setNudgeState] = useState<NudgeState | null>(null);

  /**
   * 触发被动微调
   */
  const triggerNudge = useCallback(async (actionType: string, durationMinutes?: number) => {
    try {
      const response = await fetch('/api/bayesian/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          duration_minutes: durationMinutes
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setNudgeState({
          isVisible: true,
          actionType,
          correction: result.data.correction
        });
      }
    } catch (error) {
      console.error('❌ Failed to trigger nudge:', error);
    }
  }, []);

  /**
   * 关闭微调提示
   */
  const dismissNudge = useCallback(() => {
    setNudgeState(null);
  }, []);

  /**
   * 监听习惯完成事件（Supabase Realtime）
   */
  useEffect(() => {
    const supabase = createClient();
    
    // 订阅 habit_completions 表的 INSERT 事件
    const channel = supabase
      .channel('habit-completions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habit_completions'
        },
        async (payload) => {
          const { new: completion } = payload;
          
          if (completion && completion.habit_id) {
            // 获取习惯类型
            const { data: habit, error } = await supabase
              .from('habits')
              .select('name, category')
              .eq('id', completion.habit_id)
              .single();

            if (error) {
              console.warn('⚠️ Failed to fetch habit:', error.message);
              return;
            }

            if (habit) {
              // 映射习惯类别到 action_type - ensure we have a valid string
              const categoryOrName = habit.category ?? habit.name ?? 'default';
              const actionType = mapHabitToActionType(categoryOrName);
              await triggerNudge(actionType, completion.duration_minutes);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [triggerNudge]);

  return {
    nudgeState,
    triggerNudge,
    dismissNudge
  };
}

/**
 * 将习惯类别映射到 action_type
 */
function mapHabitToActionType(category: string | undefined | null): string {
  if (!category) {
    return 'default';
  }

  const mapping: Record<string, string> = {
    breathing: 'breathing_exercise',
    meditation: 'meditation',
    exercise: 'exercise',
    fitness: 'exercise',
    sleep: 'sleep_improvement',
    hydration: 'hydration',
    water: 'hydration',
    journal: 'journaling',
    writing: 'journaling',
    stretch: 'stretching',
    yoga: 'stretching'
  };

  const lowerCategory = category.toLowerCase();
  
  for (const [key, value] of Object.entries(mapping)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'default';
}

export default useBayesianNudge;
