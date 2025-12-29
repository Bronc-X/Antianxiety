'use client';

/**
 * useOnboarding Domain Hook (The Bridge)
 * 
 * Manages onboarding flow state.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/hooks/useNetwork';
import {
    getOnboardingProgress,
    saveOnboardingStep,
    skipOnboarding,
    resetOnboarding,
    type OnboardingProgress,
    type OnboardingData
} from '@/app/actions/onboarding';

// ============================================
// Types
// ============================================

export interface UseOnboardingReturn {
    // Data
    progress: OnboardingProgress;
    currentStep: number;
    isComplete: boolean;

    // States
    isLoading: boolean;
    isSaving: boolean;
    isOffline: boolean;
    error: string | null;

    // Actions
    saveStep: (data: Partial<OnboardingData>) => Promise<boolean>;
    nextStep: () => void;
    prevStep: () => void;
    skip: () => Promise<boolean>;
    reset: () => Promise<boolean>;
}

// ============================================
// Hook Implementation
// ============================================

export function useOnboarding(): UseOnboardingReturn {
    const router = useRouter();
    const { isOnline } = useNetwork();

    const [progress, setProgress] = useState<OnboardingProgress>({
        current_step: 1,
        total_steps: 5,
        completed_steps: [],
        is_complete: false,
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load progress on mount
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const result = await getOnboardingProgress();
                if (result.success && result.data) {
                    setProgress(result.data);
                    setCurrentStep(result.data.current_step);

                    // Redirect if already complete
                    if (result.data.is_complete) {
                        router.push('/dashboard');
                    }
                }
            } catch {
                // Ignore
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, [router]);

    // Save step
    const saveStep = useCallback(async (data: Partial<OnboardingData>): Promise<boolean> => {
        setIsSaving(true);
        setError(null);

        try {
            const result = await saveOnboardingStep(currentStep, data);

            if (result.success && result.data) {
                setProgress(result.data);

                if (result.data.is_complete) {
                    // Onboarding complete, redirect
                    router.push('/dashboard');
                } else {
                    setCurrentStep(result.data.current_step);
                }

                return true;
            } else {
                setError(result.error || 'Failed to save');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [currentStep, router]);

    // Next step (without saving)
    const nextStep = useCallback(() => {
        if (currentStep < progress.total_steps) {
            setCurrentStep(currentStep + 1);
        }
    }, [currentStep, progress.total_steps]);

    // Previous step
    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    // Skip onboarding
    const skip = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);

        try {
            const result = await skipOnboarding();

            if (result.success) {
                router.push('/dashboard');
                return true;
            }

            return false;
        } catch {
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [router]);

    // Reset onboarding
    const reset = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);

        try {
            const result = await resetOnboarding();

            if (result.success) {
                setProgress({
                    current_step: 1,
                    total_steps: 5,
                    completed_steps: [],
                    is_complete: false,
                });
                setCurrentStep(1);
                return true;
            }

            return false;
        } catch {
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    return {
        progress,
        currentStep,
        isComplete: progress.is_complete,
        isLoading,
        isSaving,
        isOffline: !isOnline,
        error,
        saveStep,
        nextStep,
        prevStep,
        skip,
        reset,
    };
}

export type { OnboardingProgress, OnboardingData };
