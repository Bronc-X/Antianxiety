'use client';

/**
 * useBetaSignup Domain Hook (The Bridge)
 *
 * Wraps beta signup action.
 */

import { useCallback, useState } from 'react';
import { submitBetaSignup } from '@/app/actions/beta';

export interface UseBetaSignupReturn {
  isSubmitting: boolean;
  error: string | null;
  submit: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export function useBetaSignup(): UseBetaSignupReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (email: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitBetaSignup(email);
      if (!result.success) {
        const message = result.error || '提交失败，请稍后重试';
        const normalized = message.toLowerCase();
        const isDuplicate =
          message.includes('已经') ||
          message.includes('申请过') ||
          normalized.includes('already') ||
          normalized.includes('exists') ||
          normalized.includes('duplicate');
        if (isDuplicate) {
          return true;
        }
        setError(message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submit,
    clearError,
  };
}
