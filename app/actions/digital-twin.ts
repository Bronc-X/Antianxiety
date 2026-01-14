'use server';

import type { ActionResult } from '@/types/architecture';
import type { AnalyzeResponse } from '@/types/digital-twin';
import { POST as analyzeDigitalTwinRoute } from '@/app/api/digital-twin/analyze/route';

export interface DigitalTwinAnalyzeInput {
  userId?: string;
  forceRefresh?: boolean;
}

type DigitalTwinPayload = {
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

export async function analyzeDigitalTwin(
  input: DigitalTwinAnalyzeInput
): Promise<ActionResult<AnalyzeResponse>> {
  try {
    const request = new Request('http://digital-twin.local/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const response = await analyzeDigitalTwinRoute(request as Request);
    const data = await parseJsonResponse(response);
    const payload = typeof data === 'object' && data !== null ? (data as DigitalTwinPayload) : null;

    if (!response.ok) {
      return { success: false, error: payload?.error || 'Analysis failed' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}
