'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import type { RoleType } from '@/types/assistant';

export interface ChatConversationRow {
  role: RoleType;
  content: string;
  created_at: string;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SaveChatConversationInput {
  role: RoleType;
  content: string;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function getChatConversationHistory(
  limit: number = 50
): Promise<ActionResult<ChatConversationRow[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('role, content, created_at, session_id, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<ChatConversationRow[]>();

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true, data: data || [] });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load conversations',
    };
  }
}

export async function saveChatConversationMessage(
  input: SaveChatConversationInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? null,
        session_id: input.session_id ?? null,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return toSerializable({ success: true });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save message',
    };
  }
}
