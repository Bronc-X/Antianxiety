'use client';

/**
 * useScaleCalibration Domain Hook (The Bridge)
 *
 * Wraps weekly/monthly calibration persistence.
 */

import { useCallback, useState } from 'react';
import {
  saveWeeklyCalibration,
  saveMonthlyCalibration,
  type WeeklyCalibrationInput,
  type MonthlyCalibrationInput,
} from '@/app/actions/calibration-scales';

export interface UseScaleCalibrationReturn {
  isSaving: boolean;
  error: string | null;
  saveWeekly: (input: WeeklyCalibrationInput) => Promise<boolean>;
  saveMonthly: (input: MonthlyCalibrationInput) => Promise<boolean>;
  clearError: () => void;
}

export function useScaleCalibration(): UseScaleCalibrationReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveWeekly = useCallback(async (input: WeeklyCalibrationInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveWeeklyCalibration(input);
      if (!result.success) {
        setError(result.error || '每周复盘保存失败');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '每周复盘保存失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveMonthly = useCallback(async (input: MonthlyCalibrationInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveMonthlyCalibration(input);
      if (!result.success) {
        setError(result.error || '月度评估保存失败');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '月度评估保存失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSaving,
    error,
    saveWeekly,
    saveMonthly,
    clearError,
  };
}

export type { WeeklyCalibrationInput, MonthlyCalibrationInput };
