'use server';

import type { ActionResult } from '@/types/architecture';
import { GET as getDebugSessionRoute } from '@/app/api/debug/session/route';

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getDebugSession(): Promise<ActionResult<any>> {
  try {
    const response = await getDebugSessionRoute(new Request('http://debug.local/session'));
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Failed to load session' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load session',
    };
  }
}
