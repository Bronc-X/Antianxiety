'use server';

import type { ActionResult } from '@/types/architecture';
import { POST as deepInferenceRoute } from '@/app/api/ai/deep-inference/route';

export interface DeepInferenceInput {
  analysisResult: any;
  recentLogs: any[];
}

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getDeepInference(
  input: DeepInferenceInput
): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://ai.local/deep-inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const response = await deepInferenceRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || '获取推演数据失败' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取推演数据失败',
    };
  }
}
