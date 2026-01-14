'use server';

import type { ActionResult } from '@/types/architecture';
import { POST as chatRoute } from '@/app/api/chat/route';
import { POST as chatPapersRoute } from '@/app/api/chat/papers/route';

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
  experimental_attachments?: Array<{
    name?: string;
    contentType?: string;
    url?: string;
  }>;
}

type ChatApiPayload = {
  error?: string;
  message?: string;
} & Record<string, unknown>;

export async function generateChatResponse(
  messages: ChatMessageInput[],
  language: 'zh' | 'en' = 'zh',
  mode: 'fast' | 'think' = 'fast'
): Promise<ActionResult<string>> {
  try {
    const request = new Request('http://chat.local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: false, language, mode }),
    });

    const response = await chatRoute(request);
    const raw = await response.text();

    if (!response.ok) {
      let message = 'AI service unavailable';
      try {
        const data = JSON.parse(raw);
        message = data?.error || data?.message || message;
      } catch {
        // Keep fallback.
      }
      return { success: false, error: message };
    }

    let content = raw;
    try {
      const data = JSON.parse(raw);
      content = data?.response || data?.reply || data?.message || raw;
    } catch {
      // Non-JSON response is expected for streaming.
    }

    return { success: true, data: content || '' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI service unavailable',
    };
  }
}

export async function callChatPayload(
  payload: Record<string, unknown>
): Promise<ActionResult<unknown>> {
  try {
    const request = new Request('http://chat.local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await chatRoute(request);
    const raw = await response.text();

    let data: unknown = null;
    try {
      data = JSON.parse(raw) as ChatApiPayload;
    } catch {
      data = raw;
    }
    const payloadData = typeof data === 'object' && data !== null ? (data as ChatApiPayload) : null;

    if (!response.ok) {
      return {
        success: false,
        error: payloadData?.error || payloadData?.message || 'Request failed',
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

export async function getChatPapers(
  query: string
): Promise<ActionResult<unknown>> {
  try {
    const request = new Request('http://chat.local/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const response = await chatPapersRoute(request);
    const raw = await response.text();

    let data: unknown = null;
    try {
      data = JSON.parse(raw) as ChatApiPayload;
    } catch {
      data = raw;
    }
    const payloadData = typeof data === 'object' && data !== null ? (data as ChatApiPayload) : null;

    if (!response.ok) {
      return {
        success: false,
        error: payloadData?.error || payloadData?.message || 'Request failed',
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}
