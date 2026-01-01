'use client';

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { useAuth } from '@/hooks/domain/useAuth';
import {
    getDailyCalibrationQuestions,
    processDailyCalibration,
    getUserCalibrationFrequency,
    resetToDailyFrequency,
    shouldCalibrateToday,
    type DailyCalibrationQuestion,
    type DailyCalibrationResult,
} from '@/lib/assessment';

// ============================================
// Types
// ============================================

export type CalibrationStep = 'welcome' | 'questions' | 'analyzing' | 'result';

export interface UseCalibrationReturn {
    // State
    step: CalibrationStep;
    questions: DailyCalibrationQuestion[];
    currentQuestionIndex: number;
    answers: Record<string, number>;
    result: DailyCalibrationResult | null;
    isLoading: boolean;
    isSaving: boolean; // separate saving state if needed

    // Frequency State
    frequency: 'daily' | 'every_other_day';
    frequencyReason: string | undefined;
    shouldShowToday: boolean;
    hasCompletedToday: boolean;
    isRestoringFrequency: boolean;

    // Actions
    start: () => Promise<void>;
    answerQuestion: (questionId: string, value: number) => void;
    checkFrequency: () => Promise<void>;
    resetFrequency: () => Promise<void>;

    // Helpers
    progressPercent: number;
    currentQuestion: DailyCalibrationQuestion | undefined;
}

// ============================================
// Hook Implementation
// ============================================

export function useCalibration(initialUserId?: string): UseCalibrationReturn {
    const { user } = useAuth();
    const userId = initialUserId || user?.id; // Priority to prop, then auth

    // Flow State
    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [questions, setQuestions] = useState<DailyCalibrationQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<DailyCalibrationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Frequency State
    const [frequency, setFrequency] = useState<'daily' | 'every_other_day'>('daily');
    const [frequencyReason, setFrequencyReason] = useState<string | undefined>();
    const [shouldShowToday, setShouldShowToday] = useState(true);
    const [hasCompletedToday, setHasCompletedToday] = useState(false);
    const [isRestoringFrequency, setIsRestoringFrequency] = useState(false);

    // Check frequency and completion on mount
    const checkFrequency = useCallback(async () => {
        if (!userId) return;

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `calibration_${userId}_${today}`;
        const completed = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

        if (completed) {
            setHasCompletedToday(true);
        }

        try {
            const freqData = await getUserCalibrationFrequency(userId);
            setFrequency(freqData.dailyFrequency);
            setFrequencyReason(freqData.frequencyReason);

            const shouldShow = await shouldCalibrateToday(userId);
            setShouldShowToday(shouldShow);
        } catch (e) {
            console.error('Failed to load frequency:', e);
            setFrequency('daily');
        }
    }, [userId]);

    useEffect(() => {
        checkFrequency();
    }, [checkFrequency]);

    // Start flow
    const start = useCallback(async () => {
        setIsLoading(true);
        try {
            const dailyQuestions = getDailyCalibrationQuestions();
            setQuestions(dailyQuestions);
            setStep('questions');
            setCurrentQuestionIndex(0);
        } catch (error) {
            console.error('Failed to start calibration:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle Answer
    const answerQuestion = useCallback((questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        // Logic for advancing is handled by UI (delay) or we can expose a 'next' function
        // For now, we update state immediately.

        // Automated progression logic
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                submitAssessment({ ...answers, [questionId]: value });
            }
        }, 400); // Small delay for UI feedback, but this couples logic with UI timing...
        // Ideally UI handles the delay and calls 'next'. 
        // But preserving original behavior which had timeout in handler.
    }, [currentQuestionIndex, questions.length, answers]);

    // Submit Assessment
    const submitAssessment = useCallback(async (finalAnswers: Record<string, number>) => {
        if (!userId) return;
        setStep('analyzing');
        setIsLoading(true);

        try {
            // Process logic (Client Lib for now, wrapping Server calls)
            const assessmentResult = await processDailyCalibration(userId, finalAnswers);

            // Mark local storage
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`calibration_${userId}_${today}`, 'true');

            setResult(assessmentResult);
            setStep('result');
            setHasCompletedToday(true);
        } catch (error) {
            console.error('Assessment failed:', error);
            setStep('result'); // Or error state
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Reset Frequency
    const resetFrequency = useCallback(async () => {
        if (!userId) return;
        setIsRestoringFrequency(true);
        try {
            await resetToDailyFrequency(userId);
            setFrequency('daily');
            setShouldShowToday(true);
            setFrequencyReason(undefined);
        } catch (e) {
            console.error('Failed to reset frequency:', e);
        } finally {
            setIsRestoringFrequency(false);
        }
    }, [userId]);

    const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    const currentQuestion = questions[currentQuestionIndex];

    return {
        step,
        questions,
        currentQuestionIndex,
        answers,
        result,
        isLoading,
        isSaving,
        frequency,
        frequencyReason,
        shouldShowToday,
        hasCompletedToday,
        isRestoringFrequency,
        start,
        answerQuestion,
        checkFrequency,
        resetFrequency,
        progressPercent,
        currentQuestion
    };
}
