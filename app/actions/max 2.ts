'use server';

/**
 * Max Server Actions (The Brain)
 *
 * Wraps /api/max/* endpoints for client use.
 */

import type { ActionResult } from '@/types/architecture';
import { GET as getMaxSettingsRoute, PATCH as updateMaxSettingsRoute } from '@/app/api/max/settings/route';
import { POST as maxResponseRoute } from '@/app/api/max/response/route';
import { POST as maxBeliefRoute } from '@/app/api/max/belief/route';
import { POST as maxPlanChatRoute } from '@/app/api/max/plan-chat/route';
import { POST as maxPlanReplaceRoute } from '@/app/api/max/plan-replace/route';

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function callPostRoute(handler: (req: Request) => Promise<Response>, payload: Record<string, unknown>): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://max.local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const response = await handler(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
  }
}

export async function getMaxSettings(): Promise<ActionResult<any>> {
  try {
    const response = await getMaxSettingsRoute();
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Failed to load settings' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load settings' };
  }
}

export async function updateMaxSettings(payload: Record<string, unknown>): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://max.local/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await updateMaxSettingsRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Failed to update settings' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update settings' };
  }
}

export async function getMaxResponse(payload: Record<string, unknown>): Promise<ActionResult<any>> {
  return callPostRoute(maxResponseRoute, payload);
}

export async function submitMaxBelief(payload: Record<string, unknown>): Promise<ActionResult<any>> {
  return callPostRoute(maxBeliefRoute, payload);
}

export async function maxPlanChat(payload: Record<string, unknown>): Promise<ActionResult<any>> {
  return callPostRoute(maxPlanChatRoute, payload);
}

export async function maxPlanReplace(payload: Record<string, unknown>): Promise<ActionResult<any>> {
  return callPostRoute(maxPlanReplaceRoute, payload);
}
