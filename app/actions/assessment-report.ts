'use server';

import type { ActionResult } from '@/types/architecture';
import { GET as exportReportRoute } from '@/app/api/assessment/export/route';
import { POST as emailReportRoute } from '@/app/api/assessment/email/route';

async function parseJsonResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function exportAssessmentReport(
  sessionId: string,
  format: 'html' | 'json' = 'html'
): Promise<ActionResult<any>> {
  try {
    const url = new URL('http://assessment.local/assessment/export');
    url.searchParams.set('session_id', sessionId);
    url.searchParams.set('format', format);

    const request = new Request(url.toString(), { method: 'GET' });
    const response = await exportReportRoute(request);

    if (!response.ok) {
      const data = await parseJsonResponse(response);
      return { success: false, error: data?.error?.message || 'Export failed' };
    }

    if (format === 'json') {
      const data = await parseJsonResponse(response);
      return { success: true, data };
    }

    const html = await response.text();
    return { success: true, data: html };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

export async function emailAssessmentReport(
  sessionId: string,
  email?: string
): Promise<ActionResult<any>> {
  try {
    const request = new Request('http://assessment.local/assessment/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, email }),
    });

    const response = await emailReportRoute(request as Request);
    const data = await parseJsonResponse(response);

    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error?.message || 'Email failed' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email failed',
    };
  }
}
