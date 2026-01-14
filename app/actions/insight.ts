'use server';

import type { ActionResult } from '@/types/architecture';
import { POST as generateInsightRoute } from '@/app/api/insight/generate/route';
import { POST as fallbackInsightRoute } from '@/app/api/insight/route';

export interface InsightInput {
  sleep_hours: number;
  hrv: number;
  stress_level: number;
  exercise_minutes?: number;
}

type InsightPayload = {
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

export async function generateInsight(
  input: InsightInput
): Promise<ActionResult<string>> {
  try {
    const request = new Request('http://insight.local/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const response = await generateInsightRoute(request as Request);
    const raw = await response.text();

    if (!response.ok) {
      let message = 'Failed to generate insight';
      try {
        const data = JSON.parse(raw);
        message = data?.error || message;
      } catch {
        message = raw || message;
      }
      return { success: false, error: message };
    }

    return { success: true, data: raw };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insight',
    };
  }
}

export async function getFallbackInsight(): Promise<ActionResult<unknown>> {
  try {
    const request = new Request('http://insight.local/fallback', {
      method: 'POST',
    });

    const response = await fallbackInsightRoute(request as Request);
    const data = await parseJsonResponse(response);
    const payload = typeof data === 'object' && data !== null ? (data as InsightPayload) : null;

    if (!response.ok) {
      return { success: false, error: payload?.error || 'Failed to generate insight' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insight',
    };
  }
}
