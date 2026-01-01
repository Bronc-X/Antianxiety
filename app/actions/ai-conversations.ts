'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';
import type { ConversationRow, RoleType } from '@/types/assistant';

export interface SaveAiConversationInput {
  role: RoleType;
  content: string;
  metadata?: Record<string, unknown>;
}

export async function getAiConversationHistory(
  limit: number = 50
): Promise<ActionResult<ConversationRow[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit)
      .returns<ConversationRow[]>();

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

export async function saveAiConversationMessage(
  input: SaveAiConversationInput
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        role: input.role,
        content: input.content,
        metadata: input.metadata || null,
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
