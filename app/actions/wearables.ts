'use server';

/**
 * Wearables Server Actions (The Brain)
 *
 * Wraps /api/wearables/sync for GET (status) and POST (sync).
 */

import { NextRequest } from 'next/server';
import type { ActionResult } from '@/types/architecture';
import { GET as getWearablesRoute, POST as syncWearablesRoute } from '@/app/api/wearables/sync/route';
import type { WearableProvider } from '@/types/wearable';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface WearablesSyncInput {
  provider?: WearableProvider;
  daysBack?: number;
}

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getWearablesStatus(): Promise<ActionResult<any>> {
  try {
    const request = new NextRequest('http://wearables.local/api/wearables/sync');
    const response = await getWearablesRoute(request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Failed to load wearables status' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Wearables Action] getWearablesStatus error:', error);
    return { success: false, error: 'Failed to load wearables status' };
  }
}

export async function syncWearables(
  input: WearablesSyncInput = {}
): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://wearables.local/api/wearables/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const response = await syncWearablesRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'Sync failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Wearables Action] syncWearables error:', error);
    return { success: false, error: 'Sync failed' };
  }
}

export async function disconnectWearable(
  provider: WearableProvider
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Please sign in' };
    }

    const { error } = await supabase
      .from('wearable_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Wearables Action] disconnectWearable error:', error);
    return { success: false, error: 'Failed to disconnect wearables' };
  }
}
