'use client';

/**
 * useDailyQuestionnaire Domain Hook (The Bridge)
 *
 * Manages daily questionnaire persistence and summary caching.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getDailyQuestionnaireResponse,
  saveDailyQuestionnaireResponse,
  type DailyQuestionnaireResponse,
  type SaveDailyQuestionnaireInput,
} from '@/app/actions/daily-questionnaire';

export interface DailyQuestionnaireSummary {
  sleepQuality?: number;
  energyLevel?: number;
  stressLevel?: number;
  moodState?: number;
  focusAbility?: number;
}

export interface UseDailyQuestionnaireReturn {
  response: DailyQuestionnaireResponse | null;
  summary: DailyQuestionnaireSummary | null;
  completed: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadStatus: () => Promise<void>;
  saveResponse: (input: SaveDailyQuestionnaireInput) => Promise<boolean>;
  clearError: () => void;
}

interface UseDailyQuestionnaireOptions {
  userId?: string;
  date?: string;
  autoLoad?: boolean;
}

const COMPLETED_KEY = 'nma_questionnaire_date';
const SUMMARY_PREFIX = 'nma_questionnaire_summary_';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function buildSummary(responses: Record<string, number>): DailyQuestionnaireSummary {
  return {
    sleepQuality: responses.sleep_quality,
    energyLevel: responses.morning_energy,
    stressLevel: responses.stress_level,
    moodState: responses.mood_state,
    focusAbility: responses.focus_ability,
  };
}

export function useDailyQuestionnaire(
  options: UseDailyQuestionnaireOptions = {}
): UseDailyQuestionnaireReturn {
  const responseDate = useMemo(() => options.date || getTodayDate(), [options.date]);
  const [response, setResponse] = useState<DailyQuestionnaireResponse | null>(null);
  const [summary, setSummary] = useState<DailyQuestionnaireSummary | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateSummaryFromCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem(`${SUMMARY_PREFIX}${responseDate}`);
    if (!cached) return;
    try {
      setSummary(JSON.parse(cached));
    } catch {
      // Ignore invalid cache
    }
  }, [responseDate]);

  const cacheCompletion = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COMPLETED_KEY, responseDate);
  }, [responseDate]);

  const cacheSummary = useCallback((nextSummary: DailyQuestionnaireSummary) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${SUMMARY_PREFIX}${responseDate}`, JSON.stringify(nextSummary));
  }, [responseDate]);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let localCompleted = false;
    if (typeof window !== 'undefined') {
      localCompleted = localStorage.getItem(COMPLETED_KEY) === responseDate;
      if (localCompleted) {
        setCompleted(true);
        hydrateSummaryFromCache();
      }
    }

    if (!options.userId) {
      if (!localCompleted) {
        setCompleted(false);
      }
      setIsLoading(false);
      return;
    }

    try {
      const result = await getDailyQuestionnaireResponse(responseDate);
      if (!result.success) {
        if (!localCompleted) {
          setCompleted(false);
          setError(result.error || 'Failed to load questionnaire');
        }
        return;
      }

      if (result.data) {
        setResponse(result.data);
        setCompleted(true);
        cacheCompletion();
        const nextSummary = buildSummary(result.data.responses || {});
        setSummary(nextSummary);
        cacheSummary(nextSummary);
      } else if (!localCompleted) {
        setCompleted(false);
      }
    } catch (err) {
      if (!localCompleted) {
        setCompleted(false);
        setError(err instanceof Error ? err.message : 'Failed to load questionnaire');
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheCompletion, cacheSummary, hydrateSummaryFromCache, options.userId, responseDate]);

  const saveResponse = useCallback(async (input: SaveDailyQuestionnaireInput) => {
    setIsSaving(true);
    setError(null);

    const payload = {
      ...input,
      responseDate: input.responseDate || responseDate,
    };

    try {
      if (!options.userId) {
        const nextSummary = buildSummary(payload.responses || {});
        setSummary(nextSummary);
        cacheSummary(nextSummary);
        cacheCompletion();
        setCompleted(true);
        setIsSaving(false);
        return true;
      }

      const result = await saveDailyQuestionnaireResponse(payload);
      if (!result.success || !result.data) {
        setError(result.error || '保存问卷失败');
        return false;
      }
      setResponse(result.data);
      const nextSummary = buildSummary(result.data.responses || {});
      setSummary(nextSummary);
      cacheSummary(nextSummary);
      cacheCompletion();
      setCompleted(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存问卷失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [cacheCompletion, cacheSummary, options.userId, responseDate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (options.autoLoad === false) return;
    loadStatus();
  }, [loadStatus, options.autoLoad]);

  return {
    response,
    summary,
    completed,
    isLoading,
    isSaving,
    error,
    loadStatus,
    saveResponse,
    clearError,
  };
}

export type { DailyQuestionnaireResponse, SaveDailyQuestionnaireInput };
