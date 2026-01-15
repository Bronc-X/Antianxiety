'use client';

/**
 * useAssessmentReport Domain Hook (The Bridge)
 *
 * Wraps assessment export + email actions.
 */

import { useCallback, useState } from 'react';
import {
  exportAssessmentReport,
  emailAssessmentReport,
} from '@/app/actions/assessment-report';

export interface UseAssessmentReportReturn {
  isExporting: boolean;
  isSending: boolean;
  error: string | null;
  exportReport: (sessionId: string, format?: 'html' | 'json') => Promise<unknown | null>;
  sendEmail: (sessionId: string, email?: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAssessmentReport(): UseAssessmentReportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (sessionId: string, format: 'html' | 'json' = 'html') => {
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportAssessmentReport(sessionId, format);
      if (!result.success) {
        setError(result.error || 'Export failed');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const sendEmail = useCallback(async (sessionId: string, email?: string) => {
    setIsSending(true);
    setError(null);
    try {
      const result = await emailAssessmentReport(sessionId, email);
      if (!result.success) {
        setError(result.error || 'Email failed');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email failed');
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isExporting,
    isSending,
    error,
    exportReport,
    sendEmail,
    clearError,
  };
}
