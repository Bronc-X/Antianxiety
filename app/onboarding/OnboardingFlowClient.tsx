'use client';

/**
 * OnboardingFlowClient
 * 
 * Entry point for clinical onboarding flow.
 * Uses ClinicalOnboarding with GAD-7 + PHQ-9 + ISI (23 questions).
 * ClinicalOnboarding handles response persistence; this component routes on completion.
 */

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ClinicalOnboarding } from '@/components/ClinicalOnboarding';
import { tr, useI18n } from '@/lib/i18n';

interface OnboardingFlowClientProps {
  userId: string;
  userName?: string;
}

interface OnboardingResult {
  gad7Score: number;
  phq9Score: number;
  isiScore: number;
  safetyTriggered: boolean;
  interpretations: {
    anxiety: string;
    depression: string;
    insomnia: string;
  };
}

export default function OnboardingFlowClient({ userId, userName }: OnboardingFlowClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useI18n();

  const handleComplete = useCallback(async (_result: OnboardingResult) => {
    setIsSubmitting(true);

    try {
      // Navigate to upgrade page
      console.log('✅ Clinical onboarding completed, navigating to upgrade');
      router.push('/unlearn/onboarding/upgrade');
      router.refresh();
    } catch (error) {
      console.error('处理问卷结果时出错:', error);
      alert(tr(language, { zh: '处理失败，请重试', en: 'Failed to process. Please try again.' }));
      setIsSubmitting(false);
    }
  }, [router, language]);

  const handlePause = useCallback((progress: { answers: Record<string, number>; currentPage: number; savedAt: string }) => {
    // Progress is auto-saved to localStorage by ClinicalOnboarding
    console.log('Onboarding paused, progress saved');
    router.push('/'); // Go to home
  }, [router]);

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">
            {tr(language, { zh: '正在分析你的回答...', en: 'Analyzing your responses...' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <ClinicalOnboarding
        userId={userId}
        userName={userName}
        onComplete={handleComplete}
        onPause={handlePause}
      />
    </div>
  );
}
