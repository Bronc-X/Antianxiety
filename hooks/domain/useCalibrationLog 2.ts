'use client';

/**
 * useCalibrationLog Domain Hook (The Bridge)
 *
 * Wraps daily calibration CRUD actions.
 */

import { useCallback, useState } from 'react';
import {
  getTodayCalibration,
  saveCalibration,
  getCalibrationHistory,
  type CalibrationData,
  type CalibrationInput,
} from '@/app/actions/calibration';

export interface UseCalibrationLogReturn {
  today: CalibrationData | null;
  history: CalibrationData[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadToday: () => Promise<CalibrationData | null>;
  loadHistory: (days?: number) => Promise<CalibrationData[]>;
  save: (input: CalibrationInput) => Promise<CalibrationData | null>;
  clearError: () => void;
}

export function useCalibrationLog(): UseCalibrationLogReturn {
  const [today, setToday] = useState<CalibrationData | null>(null);
  const [history, setHistory] = useState<CalibrationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTodayCalibration();
      if (!result.success) {
        setError(result.error || 'Failed to load today\'s calibration');
        setToday(null);
        return null;
      }
      setToday(result.data || null);
      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load today\'s calibration');
      setToday(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (days = 7) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCalibrationHistory(days);
      if (!result.success) {
        setError(result.error || 'Failed to load calibration history');
        setHistory([]);
        return [];
      }
      const entries = result.data || [];
      setHistory(entries);
      return entries;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calibration history');
      setHistory([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (input: CalibrationInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveCalibration(input);
      if (!result.success) {
        setError(result.error || 'Failed to save calibration');
        return null;
      }
      const saved = result.data || null;
      setToday(saved);
      if (saved) {
        setHistory(prev => {
          const next = prev.filter(entry => entry.log_date !== saved.log_date);
          return [saved, ...next];
        });
      }
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save calibration');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    today,
    history,
    isLoading,
    isSaving,
    error,
    loadToday,
    loadHistory,
    save,
    clearError,
  };
}

export type { CalibrationData, CalibrationInput };
