'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

export interface HabitData {
  id: number;
  title: string;
  cue: string | null;
  response: string | null;
  reward: string | null;
  belief_score: number | null;
  description: string | null;
  min_resistance_level: number | null;
  created_at: string;
}

export interface HabitCreateInput {
  title: string;
  cue?: string | null;
  response?: string | null;
  reward?: string | null;
  description?: string | null;
  min_resistance_level?: number | null;
}

export interface HabitCompletionInput {
  habitId: number;
  beliefScore: number;
  completedAt?: string;
}

function formatHabitUpdateError(error: { code?: string | null; message?: string | null }): string {
  if (error.code === 'PGRST116') {
    return '未找到要更新的记录，请刷新页面后重试';
  }
  if (error.code === '42501') {
    return '权限不足，无法更新记录';
  }
  if (error.message) {
    if (
      error.message.includes('belief_score') ||
      error.message.includes('column') ||
      error.message.includes('schema cache')
    ) {
      return '数据库表结构未更新。请在 Supabase Dashboard 中执行 supabase_belief_system.sql 文件中的 SQL 语句来添加 belief_score 列。';
    }
    return `更新失败：${error.message}`;
  }
  return '更新信念分数时出错，请稍后重试';
}

function formatHabitCompletionError(error: { code?: string | null; message?: string | null }): string {
  if (error.code === '23503') {
    return '关联的习惯不存在，请刷新页面后重试';
  }
  if (error.code === '42501') {
    return '权限不足，无法创建记录';
  }
  if (error.message) {
    return `创建失败：${error.message}`;
  }
  return '创建完成记录时出错，请稍后重试';
}

export async function getHabits(): Promise<ActionResult<HabitData[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { data, error } = await supabase
      .from('habits')
      .select('id, title, cue, response, reward, belief_score, description, min_resistance_level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<HabitData[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true, data: data || [] });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load habits',
    };
  }
}

export async function createHabit(input: HabitCreateInput): Promise<ActionResult<HabitData>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    if (!input.title?.trim()) {
      return { success: false, error: '请填写习惯名称' };
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        title: input.title.trim(),
        cue: input.cue?.trim() || null,
        response: input.response?.trim() || null,
        reward: input.reward?.trim() || null,
        description: input.description?.trim() || null,
        min_resistance_level: input.min_resistance_level ?? null,
      })
      .select('id, title, cue, response, reward, belief_score, description, min_resistance_level, created_at')
      .single<HabitData>();

    if (error || !data) {
      return { success: false, error: error?.message || '保存习惯时出错，请稍后重试' };
    }

    return toSerializable({ success: true, data });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存习惯时出错，请稍后重试',
    };
  }
}

export async function completeHabit(
  input: HabitCompletionInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { error: updateError } = await supabase
      .from('habits')
      .update({ belief_score: input.beliefScore })
      .eq('id', input.habitId)
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      return { success: false, error: formatHabitUpdateError(updateError) };
    }

    const { error: insertError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: input.habitId,
        user_id: user.id,
        belief_score_snapshot: input.beliefScore,
        completed_at: input.completedAt || new Date().toISOString(),
      })
      .select();

    if (insertError) {
      return { success: false, error: formatHabitCompletionError(insertError) };
    }

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '完成习惯时发生错误，请稍后重试',
    };
  }
}
