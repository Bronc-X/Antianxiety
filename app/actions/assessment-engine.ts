'use server';

import type { ActionResult } from '@/types/architecture';
import type { AssessmentResponse } from '@/types/assessment';
import { POST as startAssessmentRoute } from '@/app/api/assessment/start/route';
import { POST as nextAssessmentRoute } from '@/app/api/assessment/next/route';
import { POST as dismissEmergencyRoute } from '@/app/api/assessment/dismiss-emergency/route';

interface AssessmentAnswerInput {
  question_id: string;
  value: string | string[] | number | boolean;
  input_method?: 'tap' | 'type' | 'voice';
}

type AssessmentRouteResponse = AssessmentResponse & {
  success?: boolean;
  error?: {
    message?: string;
  };
};

async function callAssessmentRoute(
  handler: (req: Request) => Promise<Response>,
  payload: Record<string, unknown>
): Promise<ActionResult<AssessmentResponse>> {
  try {
    const request = new Request('http://assessment.local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    let data: AssessmentRouteResponse | null = null;

    try {
      data = (await response.json()) as AssessmentRouteResponse;
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || 'Request failed',
      };
    }

    if (data?.success === false) {
      return {
        success: false,
        error: data?.error?.message || 'Request failed',
      };
    }

    return {
      success: true,
      data: data as AssessmentResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

export async function startAssessmentSession(
  language: 'zh' | 'en' = 'zh',
  countryCode: string = 'CN'
): Promise<ActionResult<AssessmentResponse>> {
  return callAssessmentRoute(startAssessmentRoute, {
    language,
    country_code: countryCode,
  });
}

export async function submitAssessmentAnswer(
  sessionId: string,
  answer: AssessmentAnswerInput,
  language: 'zh' | 'en' = 'zh',
  countryCode: string = 'CN'
): Promise<ActionResult<AssessmentResponse>> {
  return callAssessmentRoute(nextAssessmentRoute, {
    session_id: sessionId,
    answer,
    language,
    country_code: countryCode,
  });
}

export async function dismissEmergencySession(
  sessionId: string
): Promise<ActionResult<void>> {
  try {
    const request = new Request('http://assessment.local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });

    const response = await dismissEmergencyRoute(request);
    let data: AssessmentRouteResponse | null = null;

    try {
      data = (await response.json()) as AssessmentRouteResponse;
    } catch {
      data = null;
    }

    if (!response.ok || data?.success === false) {
      return {
        success: false,
        error: data?.error?.message || 'Request failed',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}
