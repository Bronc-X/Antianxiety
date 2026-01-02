'use client';

/**
 * useAuthProviders Domain Hook (The Bridge)
 *
 * Wraps provider-specific auth actions.
 */

import { useCallback, useState } from 'react';
import { getWeChatQr, getRedditLoginUrl } from '@/app/actions/auth';
import type { WeChatQrResult, RedditLoginResult } from '@/app/actions/auth';

export interface UseAuthProvidersReturn {
  isLoading: boolean;
  error: string | null;
  loadWeChatQr: () => Promise<WeChatQrResult | null>;
  loadRedditLogin: () => Promise<RedditLoginResult | null>;
  clearError: () => void;
}

export function useAuthProviders(): UseAuthProvidersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeChatQr = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWeChatQr();
      if (!result.success) {
        setError(result.error || '获取二维码失败');
        return null;
      }
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取二维码失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRedditLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRedditLoginUrl();
      if (!result.success) {
        setError(result.error || 'Failed to load Reddit login');
        return null;
      }
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Reddit login');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    loadWeChatQr,
    loadRedditLogin,
    clearError,
  };
}
