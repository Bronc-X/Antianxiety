'use server';

import type { ActionResult } from '@/types/architecture';
import { NextRequest } from 'next/server';
import { GET as understandingScoreRoute } from '@/app/api/understanding-score/route';

export interface UnderstandingScoreOptions {
  userId?: string;
  includeHistory?: boolean;
  days?: number;
}

type UnderstandingScorePayload = {
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

export async function getUnderstandingScore(
  options: UnderstandingScoreOptions = {}
): Promise<ActionResult<unknown>> {
  try {
    const url = new URL('http://understanding.local/api/understanding-score');
    if (options.userId) {
      url.searchParams.set('userId', options.userId);
    }
    if (options.includeHistory) {
      url.searchParams.set('includeHistory', 'true');
    }
    if (typeof options.days === 'number') {
      url.searchParams.set('days', String(options.days));
    }

    const request = new NextRequest(url.toString());
    const response = await understandingScoreRoute(request);
    const data = await parseJsonResponse(response);
    const payload = typeof data === 'object' && data !== null ? (data as UnderstandingScorePayload) : null;

    if (!response.ok) {
      return { success: false, error: payload?.error || 'Failed to load score' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load score',
    };
  }
}
