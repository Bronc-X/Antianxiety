'use client';

/**
 * useVoiceAnalysis Domain Hook (The Bridge)
 *
 * Wraps voice analysis action.
 */

import { useCallback, useState } from 'react';
import { analyzeVoiceInput, type VoiceAnalysisInput } from '@/app/actions/voice-analysis';

export interface UseVoiceAnalysisReturn {
  isProcessing: boolean;
  error: string | null;
  analyze: (input: VoiceAnalysisInput) => Promise<unknown | null>;
  clearError: () => void;
}

export function useVoiceAnalysis(): UseVoiceAnalysisReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (input: VoiceAnalysisInput) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await analyzeVoiceInput(input);
      if (!result.success) {
        setError(result.error || 'AI分析失败');
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI分析失败');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    analyze,
    clearError,
  };
}
