'use client';

/**
 * useAssessment Domain Hook (The Bridge)
 * 
 * Manages clinical assessment flow.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getAssessmentTypes,
    getAssessmentQuestions,
    submitAssessment,
    getAssessmentHistory,
    type AssessmentType,
    type AssessmentQuestion,
    type AssessmentResult,
    type AssessmentResponse
} from '@/app/actions/assessment';

// ============================================
// Types
// ============================================

export interface UseAssessmentReturn {
    // Data
    types: AssessmentType[];
    questions: AssessmentQuestion[];
    currentResult: AssessmentResult | null;
    history: AssessmentResult[];

    // Flow state
    currentQuestion: number;
    responses: AssessmentResponse[];

    // States
    isLoading: boolean;
    isSubmitting: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    startAssessment: (typeId: string) => Promise<void>;
    answerQuestion: (questionId: string, value: number | string) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    submit: () => Promise<boolean>;
    loadHistory: (typeId?: string) => Promise<void>;
    reset: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAssessment(): UseAssessmentReturn {
    const { isOnline } = useNetwork();

    const [types, setTypes] = useState<AssessmentType[]>([]);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
    const [history, setHistory] = useState<AssessmentResult[]>([]);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load assessment types on mount
    useEffect(() => {
        const loadTypes = async () => {
            try {
                const result = await getAssessmentTypes();
                if (result.success && result.data) {
                    setTypes(result.data);
                }
            } catch {
                // Ignore
            } finally {
                setIsLoading(false);
            }
        };

        loadTypes();
    }, []);

    // Start assessment
    const startAssessment = useCallback(async (typeId: string) => {
        setIsLoading(true);
        setSelectedTypeId(typeId);
        setCurrentQuestion(0);
        setResponses([]);
        setCurrentResult(null);
        setError(null);

        try {
            const result = await getAssessmentQuestions(typeId);

            if (result.success && result.data) {
                setQuestions(result.data);
            } else {
                setError(result.error || 'Failed to load questions');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Answer question
    const answerQuestion = useCallback((questionId: string, value: number | string) => {
        setResponses(prev => {
            const existing = prev.findIndex(r => r.question_id === questionId);
            if (existing >= 0) {
                const newResponses = [...prev];
                newResponses[existing] = { question_id: questionId, value };
                return newResponses;
            }
            return [...prev, { question_id: questionId, value }];
        });
    }, []);

    // Next question
    const nextQuestion = useCallback(() => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    }, [currentQuestion, questions.length]);

    // Previous question
    const prevQuestion = useCallback(() => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    }, [currentQuestion]);

    // Submit assessment
    const submit = useCallback(async (): Promise<boolean> => {
        if (!selectedTypeId) return false;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitAssessment(selectedTypeId, responses);

            if (result.success && result.data) {
                setCurrentResult(result.data);
                return true;
            } else {
                setError(result.error || 'Failed to submit');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTypeId, responses]);

    // Load history
    const loadHistory = useCallback(async (typeId?: string) => {
        try {
            const result = await getAssessmentHistory(typeId);
            if (result.success && result.data) {
                setHistory(result.data);
            }
        } catch {
            // Ignore
        }
    }, []);

    // Reset
    const reset = useCallback(() => {
        setQuestions([]);
        setCurrentQuestion(0);
        setResponses([]);
        setCurrentResult(null);
        setSelectedTypeId(null);
        setError(null);
    }, []);

    return {
        types,
        questions,
        currentResult,
        history,
        currentQuestion,
        responses,
        isLoading,
        isSubmitting,
        isOffline: !isOnline,
        error,
        startAssessment,
        answerQuestion,
        nextQuestion,
        prevQuestion,
        submit,
        loadHistory,
        reset,
    };
}

export type { AssessmentType, AssessmentQuestion, AssessmentResult, AssessmentResponse };
