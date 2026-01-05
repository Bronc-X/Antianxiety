'use server';

/**
 * Chat Server Actions (The Brain)
 * 
 * Pure server-side functions for chat operations.
 * No UI code, no client-side imports.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import { deriveConversationTitle, isDefaultConversationTitle } from '@/lib/chat-title';
import { generatePersonalizedStarters } from '@/lib/max/starter-questions';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface ChatMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    last_message_at: string;
    message_count: number;
}

export interface AppendMessageInput {
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
}

export async function getStarterQuestions(): Promise<ActionResult<string[]>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const questions = await generatePersonalizedStarters(user.id);
        return toSerializable({ success: true, data: questions });
    } catch (error) {
        console.error('[Chat Action] getStarterQuestions error:', error);
        return { success: false, error: 'Failed to load starter questions' };
    }
}

// ============================================
// Server Actions
// ============================================

/**
 * Get all conversations for the current user.
 */
export async function getConversations(): Promise<ActionResult<Conversation[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in to view conversations' };
        }

        const { data, error } = await supabase
            .from('chat_conversations')
            .select('id, user_id, title, last_message_at, message_count')
            .eq('user_id', user.id)
            .order('last_message_at', { ascending: false })
            .limit(50);

        if (error) {
            // Table might not exist yet
            console.warn('[Chat Action] getConversations error:', error);
            return { success: true, data: [] };
        }

        const conversations: Conversation[] = (data || []).map(conv => ({
            id: conv.id,
            user_id: conv.user_id,
            title: conv.title || 'New Chat',
            last_message_at: dateToISO(conv.last_message_at) || new Date().toISOString(),
            message_count: conv.message_count || 0,
        }));

        return toSerializable({ success: true, data: conversations });

    } catch (error) {
        console.error('[Chat Action] getConversations error:', error);
        return { success: false, error: 'Failed to load conversations' };
    }
}

/**
 * Get chat history for a conversation.
 */
export async function getChatHistory(conversationId?: string): Promise<ActionResult<ChatMessage[]>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        if (!conversationId) {
            return { success: true, data: [] };
        }

        const { data, error } = await supabase
            .from('chat_messages')
            .select('id, conversation_id, role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            console.warn('[Chat Action] getChatHistory error:', error);
            return { success: true, data: [] };
        }

        const messages: ChatMessage[] = (data || []).map(msg => ({
            id: msg.id,
            conversation_id: msg.conversation_id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            created_at: dateToISO(msg.created_at) || new Date().toISOString(),
        }));

        return toSerializable({ success: true, data: messages });

    } catch (error) {
        console.error('[Chat Action] getChatHistory error:', error);
        return { success: false, error: 'Failed to load messages' };
    }
}

/**
 * Create a new conversation.
 */
export async function createConversation(title?: string): Promise<ActionResult<Conversation>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data, error } = await supabase
            .from('chat_conversations')
            .insert({
                user_id: user.id,
                title: title || 'New Chat',
                last_message_at: new Date().toISOString(),
                message_count: 0,
                role: 'user', // 'max' failed check constraint, trying 'user'
                content: 'New Chat', // 'content' cannot be empty? or just value
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        const conversation: Conversation = {
            id: data.id,
            user_id: data.user_id,
            title: data.title || 'New Chat',
            last_message_at: dateToISO(data.last_message_at) || new Date().toISOString(),
            message_count: data.message_count || 0,
        };

        return toSerializable({ success: true, data: conversation });

    } catch (error) {
        console.error('[Chat Action] createConversation error:', error);
        return { success: false, error: 'Failed to create conversation' };
    }
}

/**
 * Append a message to a conversation and update metadata.
 */
export async function appendMessage(
    input: AppendMessageInput
): Promise<ActionResult<ChatMessage>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: conversation, error: convError } = await supabase
            .from('chat_conversations')
            .select('id, message_count, title')
            .eq('id', input.conversation_id)
            .eq('user_id', user.id)
            .single();

        if (convError || !conversation) {
            return { success: false, error: 'Conversation not found' };
        }

        const { data: message, error: insertError } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: input.conversation_id,
                role: input.role,
                content: input.content,
            })
            .select('id, conversation_id, role, content, created_at')
            .single();

        if (insertError || !message) {
            return { success: false, error: insertError?.message || 'Failed to save message' };
        }

        const nextCount = (conversation.message_count || 0) + 1;
        const updatePayload: Record<string, unknown> = {
            last_message_at: new Date().toISOString(),
            message_count: nextCount,
        };

        if (input.role === 'user' && isDefaultConversationTitle(conversation.title)) {
            updatePayload.title = deriveConversationTitle(input.content);
        }

        await supabase
            .from('chat_conversations')
            .update(updatePayload)
            .eq('id', input.conversation_id)
            .eq('user_id', user.id);

        const saved: ChatMessage = {
            id: message.id,
            conversation_id: message.conversation_id,
            role: message.role as 'user' | 'assistant',
            content: message.content,
            created_at: dateToISO(message.created_at) || new Date().toISOString(),
        };

        return toSerializable({ success: true, data: saved });

    } catch (error) {
        console.error('[Chat Action] appendMessage error:', error);
        return { success: false, error: 'Failed to save message' };
    }
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(conversationId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Delete messages first
        await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);

        // Delete conversation
        const { error } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error('[Chat Action] deleteConversation error:', error);
        return { success: false, error: 'Failed to delete conversation' };
    }
}
