'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

interface ExportWarning {
  table: string;
  error: string;
}

interface ExportPayload {
  meta: {
    exported_at: string;
    version: number;
  };
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  data: Record<string, unknown>;
  warnings: ExportWarning[];
}

interface TableExport {
  key: string;
  table: string;
  select?: string;
  filterField?: string;
}

const TABLE_EXPORTS: TableExport[] = [
  { key: 'plans', table: 'user_plans' },
  { key: 'plan_completions', table: 'user_plan_completions' },
  { key: 'goals', table: 'phase_goals' },
  { key: 'habits', table: 'user_habits' },
  { key: 'habit_log', table: 'habit_log' },
  { key: 'habit_completions', table: 'habit_completions' },
  { key: 'daily_wellness_logs', table: 'daily_wellness_logs' },
  { key: 'user_metrics', table: 'user_metrics' },
  { key: 'ai_reminders', table: 'ai_reminders' },
  { key: 'ai_memories', table: 'ai_memories' },
  { key: 'ai_conversations', table: 'ai_conversations' },
  { key: 'wearable_data', table: 'wearable_data' },
  { key: 'wearable_sync_log', table: 'wearable_sync_log' },
  { key: 'feed_interactions', table: 'user_feed_interactions' },
  { key: 'feed_feedback', table: 'user_feed_feedback' },
  { key: 'wearable_connections', table: 'wearable_tokens', select: 'provider, expires_at, scope, device_name, last_sync_at, created_at, updated_at' },
  { key: 'chat_conversations', table: 'chat_conversations', select: 'id, title, created_at, updated_at' },
];

async function safeSelect(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  table: string,
  select: string | undefined,
  filterField: string,
  filterValue: string
): Promise<{ data: unknown[]; error?: string }> {
  try {
    const query = supabase
      .from(table)
      .select(select || '*')
      .eq(filterField, filterValue);
    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }
    return { data: data || [] };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function safeSelectIn(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  table: string,
  select: string,
  field: string,
  values: string[]
): Promise<{ data: unknown[]; error?: string }> {
  if (!values.length) {
    return { data: [] };
  }
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in(field, values);
    if (error) {
      return { data: [], error: error.message };
    }
    return { data: data || [] };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function exportUserData(): Promise<ActionResult<{ filename: string; payload: ExportPayload }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const warnings: ExportWarning[] = [];

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      warnings.push({ table: 'profiles', error: profileError.message });
    }

    const sanitizedProfile = profileData && typeof profileData === 'object'
      ? { ...(profileData as Record<string, unknown>) }
      : null;

    if (sanitizedProfile) {
      delete sanitizedProfile.wearable_token;
      delete sanitizedProfile.wearable_access_token;
      delete sanitizedProfile.wearable_refresh_token;
    }

    const { data: settingsData, error: settingsError } = await supabase
      .from('profiles')
      .select('height, weight, age, gender, primary_goal, ai_personality, current_focus, full_name, avatar_url, ai_settings, ai_persona_context')
      .eq('id', user.id)
      .single();

    if (settingsError) {
      warnings.push({ table: 'settings', error: settingsError.message });
    }

    const data: Record<string, unknown> = {};

    for (const entry of TABLE_EXPORTS) {
      const { data: rows, error } = await safeSelect(
        supabase,
        entry.table,
        entry.select,
        entry.filterField || 'user_id',
        user.id
      );
      if (error) {
        warnings.push({ table: entry.table, error });
      }
      data[entry.key] = rows;
    }

    const conversations = data.chat_conversations as Array<{ id?: string }> | undefined;
    const conversationIds = Array.isArray(conversations)
      ? conversations.map(item => item.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];

    const { data: messages, error: messagesError } = await safeSelectIn(
      supabase,
      'chat_messages',
      'id, conversation_id, role, content, created_at',
      'conversation_id',
      conversationIds
    );

    if (messagesError) {
      warnings.push({ table: 'chat_messages', error: messagesError });
    }

    data.chat_messages = messages;

    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = now.toISOString().slice(11, 19).replace(/:/g, '');
    const filename = `antianxiety-export-${dateStamp}-${timeStamp}.json`;

    const payload: ExportPayload = {
      meta: {
        exported_at: now.toISOString(),
        version: 1,
      },
      profile: sanitizedProfile,
      settings: settingsData || null,
      data,
      warnings,
    };

    return toSerializable({
      success: true,
      data: { filename, payload },
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}
