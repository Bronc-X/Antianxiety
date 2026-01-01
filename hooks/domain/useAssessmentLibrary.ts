'use client';

/**
 * useAssessmentLibrary Domain Hook (The Bridge)
 *
 * Wraps assessment catalog, questions, submissions, and history.
 */

import { useCallback, useState } from 'react';
import {
  getAssessmentTypes,
  getAssessmentQuestions,
  submitAssessment,
  getAssessmentHistory,
  type AssessmentType,
  type AssessmentQuestion,
  type AssessmentResult,
  type AssessmentResponse,
} from '@/app/actions/assessment';

export interface UseAssessmentLibraryReturn {
  types: AssessmentType[];
  questions: AssessmentQuestion[];
  history: AssessmentResult[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadTypes: () => Promise<AssessmentType[]>;
  loadQuestions: (assessmentTypeId: string) => Promise<AssessmentQuestion[]>;
  submit: (assessmentTypeId: string, responses: AssessmentResponse[]) => Promise<AssessmentResult | null>;
  loadHistory: (assessmentTypeId?: string) => Promise<AssessmentResult[]>;
  clearError: () => void;
}

export function useAssessmentLibrary(): UseAssessmentLibraryReturn {
  const [types, setTypes] = useState<AssessmentType[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAssessmentTypes();
      if (!result.success) {
        setError(result.error || 'Failed to load assessment types');
        setTypes([]);
        return [];
      }
      const data = result.data || [];
      setTypes(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment types');
      setTypes([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async (assessmentTypeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAssessmentQuestions(assessmentTypeId);
      if (!result.success) {
        setError(result.error || 'Failed to load questions');
        setQuestions([]);
        return [];
      }
      const data = result.data || [];
      setQuestions(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      setQuestions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submit = useCallback(async (assessmentTypeId: string, responses: AssessmentResponse[]) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitAssessment(assessmentTypeId, responses);
      if (!result.success) {
        setError(result.error || 'Failed to submit assessment');
        return null;
      }
      const saved = result.data || null;
      if (saved) {
        setHistory(prev => [saved, ...prev]);
      }
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loadHistory = useCallback(async (assessmentTypeId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAssessmentHistory(assessmentTypeId);
      if (!result.success) {
        setError(result.error || 'Failed to load assessment history');
        setHistory([]);
        return [];
      }
      const data = result.data || [];
      setHistory(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment history');
      setHistory([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    types,
    questions,
    history,
    isLoading,
    isSubmitting,
    error,
    loadTypes,
    loadQuestions,
    submit,
    loadHistory,
    clearError,
  };
}

export type { AssessmentType, AssessmentQuestion, AssessmentResult, AssessmentResponse };
