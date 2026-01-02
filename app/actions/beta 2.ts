'use server';

import type { ActionResult } from '@/types/architecture';
import { POST as betaSignupRoute } from '@/app/api/beta/signup/route';

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function submitBetaSignup(email: string): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://beta.local/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const response = await betaSignupRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return { success: false, error: data?.error || '提交失败，请稍后重试' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '提交失败，请稍后重试',
    };
  }
}
