'use server';

import type { ActionResult } from '@/types/architecture';
import { GET as getDebugSessionRoute } from '@/app/api/debug/session/route';

type DebugSessionPayload = {
  error?: string;
} & Record<string, unknown>;

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getDebugSession(): Promise<ActionResult<unknown>> {
  try {
    const response = await getDebugSessionRoute(new Request('http://debug.local/session'));
    const data = await parseJsonResponse(response);
    const payload = typeof data === 'object' && data !== null ? (data as DebugSessionPayload) : null;

    if (!response.ok) {
      return { success: false, error: payload?.error || 'Failed to load session' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load session',
    };
  }
}
