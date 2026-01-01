'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

export type AiReminderType = 'habit_prompt' | 'stress_check' | 'exercise_reminder' | 'custom';

export interface AiReminder {
  id: number;
  reminder_type: AiReminderType;
  title: string;
  content: string;
  scheduled_at: string;
  read: boolean;
  dismissed: boolean;
  created_at: string;
}

export async function getAiReminders(limit = 5): Promise<ActionResult<AiReminder[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { data, error } = await supabase
      .from('ai_reminders')
      .select('id, reminder_type, title, content, scheduled_at, read, dismissed, created_at')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('scheduled_at', { ascending: false })
      .limit(limit)
      .returns<AiReminder[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    const reminders = (data || []).map(reminder => ({
      ...reminder,
      scheduled_at: dateToISO(reminder.scheduled_at) || reminder.scheduled_at,
      created_at: dateToISO(reminder.created_at) || reminder.created_at,
    }));

    return toSerializable({ success: true, data: reminders });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取AI提醒失败',
    };
  }
}

export async function markAiReminderRead(reminderId: number): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { error } = await supabase
      .from('ai_reminders')
      .update({ read: true })
      .eq('id', reminderId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '标记提醒失败',
    };
  }
}

export async function dismissAiReminder(reminderId: number): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '请先登录' };
    }

    const { error } = await supabase
      .from('ai_reminders')
      .update({ dismissed: true })
      .eq('id', reminderId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '忽略提醒失败',
    };
  }
}
