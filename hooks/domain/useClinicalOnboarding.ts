'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/hooks/useNetwork';
import {
    saveClinicalAssessment,
    type ClinicalAssessmentResult
} from '@/app/actions/onboarding';
import { refreshUserProfile, syncUserProfile } from '@/app/actions/user';
import {
    GAD7, PHQ9, ISI,
    checkSafetyTrigger,
    getSafetyMessage,
    logSafetyEvent,
    type ScaleQuestion,
    type ScaleDefinition
} from '@/lib/clinical-scales';
import { useI18n } from '@/lib/i18n';

// ============================================
// Logic Helpers (Moved from Component)
// ============================================

const SCALES_ORDER: ScaleDefinition[] = [GAD7, PHQ9, ISI];
const QUESTIONS_PER_PAGE = 4;
const ENCOURAGEMENT_PAGES = [2, 4];

interface FlatQuestion extends ScaleQuestion {
    scaleId: string;
    scaleName: string;
}

function flattenQuestions(): FlatQuestion[] {
    const questions: FlatQuestion[] = [];
    for (const scale of SCALES_ORDER) {
        for (const q of scale.questions) {
            questions.push({
                ...q,
                scaleId: scale.id,
                scaleName: scale.name,
            });
        }
    }
    return questions;
}

const ALL_QUESTIONS = flattenQuestions();
const TOTAL_QUESTIONS = ALL_QUESTIONS.length;
const TOTAL_PAGES = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

// ============================================
// Types
// ============================================

export type OnboardingStep = 'welcome' | 'questions' | 'encouragement' | 'safety' | 'analyzing' | 'result';

export interface OnboardingProgress {
    answers: Record<string, number>;
    currentPage: number;
    savedAt: string;
}

export interface UseClinicalOnboardingReturn {
    // Data
    step: OnboardingStep;
    currentPage: number;
    answers: Record<string, number>;
    totalQuestions: number;
    totalPages: number;
    currentQuestions: FlatQuestion[];
    currentScaleName: string;
    progressPercent: number;
    safetyMessage: string;
    result: ClinicalAssessmentResult | null;
    isPageComplete: boolean;

    // States
    isLoading: boolean;
    isSaving: boolean;

    // Actions
    start: () => void;
    handleAnswer: (questionId: string, value: number) => Promise<void>;
    nextPage: () => void;
    prevPage: () => void;
    continueAfterSafety: () => void;
    goBackFromSafety: () => void;
    goBackFromEncouragement: () => void;
    continueFromEncouragement: () => void;
    pause: () => void;
    loadSaved: (saved: OnboardingProgress) => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useClinicalOnboarding(
    userId: string,
    onComplete?: (result: any) => void,
    onPause?: (progress: OnboardingProgress) => void
): UseClinicalOnboardingReturn {
    // Dependencies
    const router = useRouter();
    const { language } = useI18n();

    // State
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [currentPage, setCurrentPage] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [safetyMessage, setSafetyMessage] = useState('');
    const [result, setResult] = useState<ClinicalAssessmentResult | null>(null);
    const [pendingSafetyQuestion, setPendingSafetyQuestion] = useState<string | null>(null);

    // Derived State
    const pageStart = currentPage * QUESTIONS_PER_PAGE;
    const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE, TOTAL_QUESTIONS);
    const currentQuestions = ALL_QUESTIONS.slice(pageStart, pageEnd);
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / TOTAL_QUESTIONS) * 100;
    const currentScaleName = currentQuestions[0]?.scaleName || '';
    const isPageComplete = currentQuestions.every(q => q.id in answers);

    // Actions
    const start = useCallback(() => {
        setStep('questions');
    }, []);

    const handleAnswer = useCallback(async (questionId: string, value: number) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        // Check safety
        if (checkSafetyTrigger(questionId, value)) {
            await logSafetyEvent(userId, questionId, value);
            setSafetyMessage(getSafetyMessage(language));
            setPendingSafetyQuestion(questionId);
            setStep('safety');
        }
    }, [answers, userId, language]);

    const continueAfterSafety = useCallback(() => {
        setPendingSafetyQuestion(null);
        setStep('questions');
    }, []);

    const goBackFromSafety = useCallback(() => {
        // Just go back to questions, keep answers preserved
        setStep('questions');
    }, []);

    const completeOnboarding = useCallback(async () => {
        setStep('analyzing');
        setIsLoading(true);

        try {
            // Calculate scores
            const gad7Score = SCALES_ORDER[0].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );
            const phq9Score = SCALES_ORDER[1].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );
            const isiScore = SCALES_ORDER[2].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );

            // Interpretations
            const getInterpretation = (scale: ScaleDefinition, score: number) => {
                const interp = scale.scoring.interpretation.find(
                    i => score >= i.minScore && score <= i.maxScore
                );
                return interp?.label || '未知';
            };

            const interpretations = {
                anxiety: getInterpretation(GAD7, gad7Score),
                depression: getInterpretation(PHQ9, phq9Score),
                insomnia: getInterpretation(ISI, isiScore),
            };

            const safetyTriggered = Object.entries(answers).some(
                ([qId, v]) => checkSafetyTrigger(qId, v)
            );

            const resultData: ClinicalAssessmentResult = {
                gad7Score,
                phq9Score,
                isiScore,
                interpretations,
                answers,
                onboardingResult: {
                    gad7Score,
                    phq9Score,
                    isiScore,
                    safetyTriggered,
                    interpretations
                }
            };

            // Persist via Server Action
            const saveRes = await saveClinicalAssessment(userId, resultData);
            if (!saveRes.success) {
                console.error('Failed to save assessment', saveRes.error);
                // We should probably still proceed or show error?
                // For now, proceed as UI needs to move on.
            }

            // Trigger background syncs (fire-and-forget)
            refreshUserProfile().catch(() => { });
            syncUserProfile().catch(() => { });

            setTimeout(() => {
                setResult(resultData);
                setStep('result');
                if (onComplete) onComplete(resultData.onboardingResult);
            }, 2000);

        } catch (error) {
            console.error('Completion error', error);
            setStep('result');
        } finally {
            setIsLoading(false);
        }
    }, [answers, userId, onComplete]);

    const nextPage = useCallback(() => {
        // Check if we should show encouragement
        if (ENCOURAGEMENT_PAGES.includes(currentPage)) {
            setStep('encouragement');
            return;
        }

        if (currentPage < TOTAL_PAGES - 1) {
            setCurrentPage(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    }, [currentPage, completeOnboarding]);

    const continueFromEncouragement = useCallback(() => {
        // If we're on the last page's encouragement, complete the onboarding
        if (currentPage >= TOTAL_PAGES - 1) {
            completeOnboarding();
        } else {
            setCurrentPage(prev => prev + 1);
            setStep('questions');
        }
    }, [currentPage, completeOnboarding]);

    const goBackFromEncouragement = useCallback(() => {
        // Just go back to questions, keep answers preserved
        setStep('questions');
    }, []);

    const prevPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    const pause = useCallback(() => {
        const progress: OnboardingProgress = {
            answers,
            currentPage,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`onboarding_progress_${userId}`, JSON.stringify(progress));
        if (onPause) onPause(progress);
    }, [answers, currentPage, userId, onPause]);

    const loadSaved = useCallback((saved: OnboardingProgress) => {
        setAnswers(saved.answers);
        setCurrentPage(saved.currentPage);
        setStep('questions');
    }, []);

    return {
        step,
        currentPage,
        answers,
        totalQuestions: TOTAL_QUESTIONS,
        totalPages: TOTAL_PAGES,
        currentQuestions,
        currentScaleName,
        progressPercent,
        safetyMessage,
        result,
        isPageComplete,
        isLoading,
        isSaving,
        start,
        handleAnswer,
        nextPage,
        prevPage,
        continueAfterSafety,
        goBackFromSafety,
        goBackFromEncouragement,
        continueFromEncouragement,
        pause,
        loadSaved
    };
}
