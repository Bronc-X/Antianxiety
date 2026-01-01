'use client';

/**
 * useAssessment Domain Hook (The Bridge)
 * 
 * Manages the dynamic AI-driven clinical assessment flow ("Bio-Ledger").
 * Replaces the previous static scale implementation.
 */

import { useState, useCallback, useEffect } from 'react';
import { useI18n, type Language } from '@/lib/i18n';
import {
    AssessmentPhase,
    AssessmentResponse,
    QuestionStep,
    AnswerRecord
} from '@/types/assessment';
import {
    startAssessmentSession,
    submitAssessmentAnswer,
    dismissEmergencySession
} from '@/app/actions/assessment-engine';

// ============================================
// Types
// ============================================

export interface AssessmentState {
    sessionId: string | null;
    phase: AssessmentPhase;
    currentStep: AssessmentResponse | null;
    history: AnswerRecord[];
    isLoading: boolean;
    error: string | null;
    language: Language;
    countryCode: string;
    // Dynamic loading context implementation
    loadingContext: {
        lastQuestion?: string;
        lastAnswer?: string;
        questionCount: number;
        currentQuestionId?: string;
    };
}

export interface UseAssessmentReturn extends AssessmentState {
    // Actions
    startAssessment: () => Promise<void>;
    submitAnswer: (questionId: string, value: string | string[] | number | boolean) => Promise<void>;
    resetAssessment: () => void;
    dismissEmergency: () => Promise<void>;
    setLanguage: (lang: Language) => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAssessment(): UseAssessmentReturn {
    const { language: appLanguage, setLanguage: setAppLanguage } = useI18n();

    const [state, setState] = useState<AssessmentState>({
        sessionId: null,
        phase: 'welcome',
        currentStep: null,
        history: [],
        isLoading: false,
        error: null,
        language: appLanguage,
        countryCode: 'CN',
        loadingContext: {
            questionCount: 0
        }
    });

    // Sync language and detect country
    useEffect(() => {
        setState(prev => ({ ...prev, language: appLanguage }));

        // Only fetch if not already set or default
        if (state.countryCode === 'CN') {
            const detectCountry = async () => {
                try {
                    const res = await fetch('https://ipapi.co/country/');
                    const code = await res.text();
                    if (code && code.length === 2) {
                        setState(prev => ({ ...prev, countryCode: code }));
                    }
                } catch (e) {
                    // Ignore errors
                }
            };
            detectCountry();
        }
    }, [appLanguage, state.countryCode]);

    const startAssessment = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await startAssessmentSession(
                state.language === 'en' ? 'en' : 'zh',
                state.countryCode
            );

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Request failed');
            }

            const data = result.data;

            setState(prev => ({
                ...prev,
                sessionId: data.session_id,
                phase: data.phase,
                currentStep: data,
                isLoading: false,
                loadingContext: { questionCount: 0 }
            }));
        } catch (error) {
            console.error('Assessment start error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }, [state.language, state.countryCode]);

    const submitAnswer = useCallback(async (
        questionId: string,
        value: string | string[] | number | boolean
    ) => {
        if (!state.sessionId) return;

        const currentQuestion = (state.currentStep as QuestionStep)?.question?.text || '';
        const answerText = typeof value === 'string' ? value : JSON.stringify(value);

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            loadingContext: {
                lastQuestion: currentQuestion,
                lastAnswer: answerText,
                questionCount: prev.history.length + 1,
                currentQuestionId: questionId
            }
        }));

        try {
            const result = await submitAssessmentAnswer(
                state.sessionId,
                { question_id: questionId, value },
                state.language === 'en' ? 'en' : 'zh',
                state.countryCode
            );

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to submit answer');
            }

            const data = result.data;

            const newHistory: AnswerRecord = {
                question_id: questionId,
                question_text: (state.currentStep as QuestionStep)?.question?.text || '',
                value,
                answered_at: new Date().toISOString()
            };

            setState(prev => ({
                ...prev,
                phase: data.phase,
                currentStep: data,
                history: [...prev.history, newHistory],
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }, [state.sessionId, state.language, state.countryCode, state.currentStep]);

    const resetAssessment = useCallback(() => {
        setState(prev => ({
            sessionId: null,
            phase: 'welcome',
            currentStep: null,
            history: [],
            isLoading: false,
            error: null,
            language: prev.language,
            countryCode: prev.countryCode,
            loadingContext: { questionCount: 0 }
        }));
    }, []);

    const dismissEmergency = useCallback(async () => {
        if (!state.sessionId) return;

        try {
            await dismissEmergencySession(state.sessionId);
        } catch (error) {
            console.error('Failed to log emergency dismissal:', error);
        }

        resetAssessment();
    }, [state.sessionId, resetAssessment]);

    const setLanguage = useCallback((lang: Language) => {
        setAppLanguage(lang);
        // state update for language is handled by effect
    }, [setAppLanguage]);

    return {
        ...state,
        startAssessment,
        submitAnswer,
        resetAssessment,
        dismissEmergency,
        setLanguage
    };
}
