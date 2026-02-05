'use server';

import type { ActionResult } from '@/types/architecture';
import { POST as voiceAnalysisRoute } from '@/app/api/ai/analyze-voice-input/route';

export interface VoiceAnalysisInput {
  transcript: string;
  currentFormState: {
    sleepDuration: string;
    sleepQuality: string;
    exerciseDuration: string;
    moodStatus: string;
    stressLevel: string;
    notes: string;
  };
}

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function analyzeVoiceInput(
  input: VoiceAnalysisInput
): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://ai.local/analyze-voice-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const response = await voiceAnalysisRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || 'AI分析失败' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI分析失败',
    };
  }
}
