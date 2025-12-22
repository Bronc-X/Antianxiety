# Clinical Assessment CORE CODE
This file contains the full source code for the 10 core components of the Adaptive Assessment System.

---
## File: app/onboarding/OnboardingFlowClient.tsx

```tsx
'use client';

/**
 * OnboardingFlowClient
 * 
 * Entry point for clinical onboarding flow.
 * Uses ClinicalOnboarding with GAD-7 + PHQ-9 + ISI (23 questions).
 * Saves results to user_scale_responses and generates AI goals.
 */

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ClinicalOnboarding } from '@/components/ClinicalOnboarding';
import { createClientSupabaseClient } from '@/lib/supabase-client';
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

  const handleComplete = useCallback(async (result: OnboardingResult) => {
    setIsSubmitting(true);

    try {
      const supabase = createClientSupabaseClient();

      // 1. Generate AI goals based on clinical scores
      const goalsResponse = await fetch('/api/onboarding/recommend-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicalScores: {
            gad7: result.gad7Score,
            phq9: result.phq9Score,
            isi: result.isiScore,
          },
          interpretations: result.interpretations,
        }),
      });

      if (goalsResponse.ok) {
        const { goals, metabolicProfile } = await goalsResponse.json();

        // 2. Save metabolic profile
        await supabase
          .from('profiles')
          .update({
            metabolic_profile: metabolicProfile,
          })
          .eq('id', userId);

        // 3. Save Phase Goals
        for (const goal of goals || []) {
          await supabase
            .from('phase_goals')
            .upsert({
              id: goal.id,
              user_id: userId,
              goal_type: goal.goal_type,
              priority: goal.priority,
              title: goal.title,
              rationale: goal.rationale,
              citations: goal.citations,
              is_ai_recommended: true,
              user_modified: false,
            }, {
              onConflict: 'user_id,priority',
            });
        }
      }

      // 4. Navigate to upgrade page
      console.log('✅ Clinical onboarding completed, navigating to upgrade');
      router.push('/onboarding/upgrade');
      router.refresh();
    } catch (error) {
      console.error('处理问卷结果时出错:', error);
      alert(tr(language, { zh: '处理失败，请重试', en: 'Failed to process. Please try again.' }));
      setIsSubmitting(false);
    }
  }, [userId, router, language]);

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

```

---
## File: components/UnifiedDailyCalibration.tsx

```tsx
'use client';

/**
 * UnifiedDailyCalibration Component
 * 
 * Premium Apple-inspired design with:
 * - SF Pro typography feel
 * - Glass morphism effects
 * - Subtle micro-animations
 * - Clean minimal layout
 * - Precise spacing system
 * 
 * Design Principle: "用真相打破焦虑" - Simple, focused, one entry point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, ChevronRight, Info, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { useI18n } from '@/lib/i18n';
import {
    generateDailyQuestions,
    QUESTION_SOURCE_RATIO,
    MAX_DAILY_QUESTIONS,
} from '@/lib/calibration-engine';
import type { CalibrationQuestion } from '@/lib/calibration-engine';
import {
    runHealthAssessment,
    extractTagsForStorage,
    type HealthAssessmentResult,
} from '@/lib/health-assessment-engine';
import {
    getUserCalibrationFrequency,
    resetToDailyFrequency,
    shouldCalibrateToday,
} from '@/lib/assessment';

// ============ Types ============

interface UnifiedDailyCalibrationProps {
    userId: string;
    userName?: string;
    onComplete?: (result: HealthAssessmentResult) => void;
}

type CalibrationStep = 'welcome' | 'questions' | 'analyzing' | 'result';

interface UserAnswers {
    [questionId: string]: string | number;
}

// ============ Apple-style Animation Variants ============

const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] // Apple easing
        }
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.3 }
    }
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -100 : 100,
        opacity: 0,
        transition: { duration: 0.3 }
    })
};

// ============ Component ============

export function UnifiedDailyCalibration({
    userId,
    userName,
    onComplete,
}: UnifiedDailyCalibrationProps) {
    const { t, language } = useI18n();
    const supabase = createClient();

    // State
    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [questions, setQuestions] = useState<CalibrationQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [assessmentResult, setAssessmentResult] = useState<HealthAssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCompletedToday, setHasCompletedToday] = useState(false);
    const [direction, setDirection] = useState(1);

    // Frequency state
    const [frequency, setFrequency] = useState<'daily' | 'every_other_day'>('daily');
    const [frequencyReason, setFrequencyReason] = useState<string | undefined>();
    const [showFrequencyTooltip, setShowFrequencyTooltip] = useState(false);
    const [isRestoringFrequency, setIsRestoringFrequency] = useState(false);
    const [shouldShowToday, setShouldShowToday] = useState(true);

    // Check if already completed today and load frequency
    useEffect(() => {
        const loadFrequencyAndCheckCompletion = async () => {
            const today = new Date().toISOString().split('T')[0];
            const storageKey = `calibration_${userId}_${today}`;
            const completed = localStorage.getItem(storageKey);
            if (completed) {
                setHasCompletedToday(true);
            }

            // Load frequency preferences
            try {
                const freqData = await getUserCalibrationFrequency(userId);
                setFrequency(freqData.dailyFrequency);
                setFrequencyReason(freqData.frequencyReason);

                // Check if should show today based on frequency
                const shouldShow = await shouldCalibrateToday(userId);
                setShouldShowToday(shouldShow);
            } catch (e) {
                // Default to daily if error
                setFrequency('daily');
            }
        };
        loadFrequencyAndCheckCompletion();
    }, [userId]);

    // Generate questions on start
    const startCalibration = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: goals } = await supabase
                .from('phase_goals')
                .select('*')
                .eq('user_id', userId)
                .order('priority', { ascending: true });

            const { data: profile } = await supabase
                .from('profiles')
                .select('last_assessment_at')
                .eq('id', userId)
                .single();

            const consecutiveDays = profile?.last_assessment_at ? 1 : 0;
            const dailyQuestions = generateDailyQuestions(goals || [], consecutiveDays, []);
            const limitedQuestions = dailyQuestions.slice(0, MAX_DAILY_QUESTIONS);

            setQuestions(limitedQuestions);
            setDirection(1);
            setStep('questions');
        } catch (error) {
            console.error('Failed to start calibration:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    // Handle answer submission
    const handleAnswer = useCallback((questionId: string, value: string | number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setDirection(1);
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                runAssessment();
            }
        }, 400);
    }, [currentQuestionIndex, questions.length]);

    // Run health assessment
    const runAssessment = useCallback(async () => {
        setStep('analyzing');
        setIsLoading(true);

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('gender, age, height, weight')
                .eq('id', userId)
                .single();

            const gad7Answers: Record<string, string> = {};
            if (answers['anchor_stress_level']) {
                const stressMap: Record<string, string> = {
                    'low': 'not_at_all',
                    'medium': 'several_days',
                    'high': 'more_than_half',
                };
                const mapped = stressMap[answers['anchor_stress_level'] as string] || 'several_days';
                gad7Answers['gad7_1'] = mapped;
                gad7Answers['gad7_2'] = mapped;
                gad7Answers['gad7_3'] = mapped;
            }

            const result = runHealthAssessment(
                {
                    id: userId,
                    gender: profile?.gender as 'male' | 'female' | 'other',
                    age: profile?.age,
                    height: profile?.height ? profile.height / 100 : undefined,
                    weight: profile?.weight,
                },
                {
                    gad7: Object.keys(gad7Answers).length > 0 ? gad7Answers : undefined,
                }
            );

            const tagsToSave = extractTagsForStorage(result);
            if (tagsToSave.length > 0) {
                await supabase
                    .from('profiles')
                    .update({
                        tags: tagsToSave,
                        last_assessment_at: new Date().toISOString(),
                    })
                    .eq('id', userId);
            }

            // 🆕 Sync to daily_wellness_logs for AI chat integration
            const today = new Date().toISOString().split('T')[0];

            // Map calibration answers to wellness log fields
            const stressMap: Record<string, number> = { 'low': 2, 'medium': 5, 'high': 8 };
            const sleepMap: Record<string, number> = { 'poor': 300, 'fair': 360, 'good': 420, 'excellent': 480 };
            const moodMap: Record<string, string> = { 'low': '低落', 'medium': '一般', 'high': '良好' };

            const wellnessData = {
                user_id: userId,
                log_date: today,
                stress_level: answers['anchor_stress_level'] ? stressMap[answers['anchor_stress_level'] as string] || 5 : null,
                sleep_duration_minutes: answers['anchor_sleep_quality'] ? sleepMap[answers['anchor_sleep_quality'] as string] || 420 : null,
                sleep_quality: answers['anchor_sleep_quality'] as string || null,
                mood_status: answers['anchor_energy_level'] ? moodMap[answers['anchor_energy_level'] as string] || '一般' : null,
                notes: `每日校准完成 - 识别标签: ${tagsToSave.join(', ')}`,
            };

            // Upsert to handle both insert and update cases
            await supabase
                .from('daily_wellness_logs')
                .upsert(wellnessData, {
                    onConflict: 'user_id,log_date',
                    ignoreDuplicates: false
                });

            // 🆕 Trigger user refresh to update AI analysis and persona embedding
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });

            localStorage.setItem(`calibration_${userId}_${today}`, 'true');

            setAssessmentResult(result);
            setStep('result');
            if (onComplete) onComplete(result);
        } catch (error) {
            console.error('Assessment failed:', error);
            setStep('result');
        } finally {
            setIsLoading(false);
        }
    }, [answers, userId, supabase, onComplete]);

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    // ============ Render: Already Completed or Not Today ============
    if (hasCompletedToday || !shouldShowToday) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
            >
                <div className="p-8 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                            {hasCompletedToday
                                ? (language === 'en' ? 'Calibration Complete' : '今日校准已完成')
                                : (language === 'en' ? 'Rest Day' : '今天休息')}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {hasCompletedToday
                                ? (language === 'en' ? 'See you tomorrow for your next check-in.' : '明天再来继续追踪你的状态')
                                : (language === 'en' ? 'Next check-in tomorrow.' : '明天再来校准')}
                        </p>
                    </div>
                    {/* Restore button for reduced frequency */}
                    {!hasCompletedToday && frequency === 'every_other_day' && (
                        <button
                            onClick={async () => {
                                setIsRestoringFrequency(true);
                                try {
                                    await resetToDailyFrequency(userId);
                                    setFrequency('daily');
                                    setShouldShowToday(true);
                                } finally {
                                    setIsRestoringFrequency(false);
                                }
                            }}
                            disabled={isRestoringFrequency}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                            {isRestoringFrequency ? '...' : (language === 'en' ? 'Do it anyway' : '我要校准')}
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // ============ Render: Main Component ============
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)]"
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 via-transparent to-neutral-100/30 pointer-events-none" />

            <AnimatePresence mode="wait" custom={direction}>
                {/* ============ Welcome Step ============ */}
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12"
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="relative"
                            >
                                <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center shadow-2xl shadow-neutral-900/20">
                                    <Sparkles className="w-9 h-9 text-white" strokeWidth={1.5} />
                                </div>
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-neutral-900 to-neutral-800 blur-xl opacity-30 -z-10" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}{language === 'en' ? 'Daily Calibration' : '每日校准'}
                            </h2>
                            <p className="text-neutral-500 text-base md:text-lg max-w-sm mx-auto leading-relaxed">
                                {language === 'en'
                                    ? `${MAX_DAILY_QUESTIONS} quick questions to help Max understand you better.`
                                    : `${MAX_DAILY_QUESTIONS} 个问题，帮助 Max 更好地了解你`}
                            </p>

                            {/* Frequency Badge */}
                            {frequency === 'every_other_day' && (
                                <div className="mt-4 inline-flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                        {language === 'en' ? 'Reduced Frequency' : '已降低频率'}
                                    </span>
                                    <button
                                        onClick={() => setShowFrequencyTooltip(!showFrequencyTooltip)}
                                        className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors"
                                    >
                                        <Info className="w-3 h-3 text-neutral-600" />
                                    </button>
                                </div>
                            )}

                            {/* Frequency Tooltip */}
                            <AnimatePresence>
                                {showFrequencyTooltip && frequency === 'every_other_day' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="mt-3 p-4 bg-neutral-900 text-white text-sm rounded-xl max-w-xs mx-auto"
                                    >
                                        <p className="mb-3">
                                            {frequencyReason === 'stable_7d'
                                                ? (language === 'en'
                                                    ? 'Your condition has been stable for 7 days, so we reduced the frequency.'
                                                    : '你的状态已稳定 7 天，我们自动降低了频率。')
                                                : (language === 'en'
                                                    ? 'Frequency was reduced based on your settings.'
                                                    : '频率已根据你的设置降低。')}
                                        </p>
                                        <button
                                            onClick={async () => {
                                                setIsRestoringFrequency(true);
                                                try {
                                                    await resetToDailyFrequency(userId);
                                                    setFrequency('daily');
                                                    setShowFrequencyTooltip(false);
                                                } finally {
                                                    setIsRestoringFrequency(false);
                                                }
                                            }}
                                            disabled={isRestoringFrequency}
                                            className="w-full py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isRestoringFrequency ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4" />
                                                    <span>{language === 'en' ? 'Restore Daily' : '恢复每日'}</span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Source ratio pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-center gap-2 mt-8 mb-10"
                        >
                            {[
                                { icon: '📊', label: language === 'en' ? 'Scales' : '量表', pct: QUESTION_SOURCE_RATIO.presetScales },
                                { icon: '🧠', label: language === 'en' ? 'Logic' : '逻辑', pct: QUESTION_SOURCE_RATIO.decisionTree },
                                { icon: '✨', label: 'AI', pct: QUESTION_SOURCE_RATIO.aiAdaptive },
                            ].map((item, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label} {Math.round(item.pct * 100)}%</span>
                                </span>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={startCalibration}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    <span>{language === 'en' ? 'Begin' : '开始校准'}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                )}

                {/* ============ Questions Step ============ */}
                {step === 'questions' && currentQuestion && (
                    <motion.div
                        key={`question-${currentQuestionIndex}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12"
                    >
                        {/* Progress Bar */}
                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-neutral-400">
                                    {currentQuestionIndex + 1} / {questions.length}
                                </span>
                                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    {currentQuestion.type === 'anchor' && (language === 'en' ? 'Core' : '核心')}
                                    {currentQuestion.type === 'adaptive' && (language === 'en' ? 'Adaptive' : '适应')}
                                    {currentQuestion.type === 'evolution' && (language === 'en' ? 'Evolution' : '进化')}
                                </span>
                            </div>
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-neutral-900 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight mb-8 leading-snug">
                            {currentQuestion.question}
                        </h3>

                        {/* Options */}
                        {currentQuestion.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-200 ${answers[currentQuestion.id] === option.value
                                            ? 'border-neutral-900 bg-neutral-900 text-white'
                                            : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-900'
                                            }`}
                                    >
                                        <span className="font-medium">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Slider Input */}
                        {currentQuestion.inputType === 'slider' && (
                            <div className="mt-6">
                                <div className="relative pt-8 pb-4">
                                    <input
                                        type="range"
                                        min={currentQuestion.min || 0}
                                        max={currentQuestion.max || 10}
                                        value={answers[currentQuestion.id] as number || currentQuestion.min || 0}
                                        onChange={(e) => handleAnswer(currentQuestion.id, parseInt(e.target.value))}
                                        className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer slider-apple"
                                    />
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                                        <span className="text-3xl font-semibold text-neutral-900">
                                            {answers[currentQuestion.id] ?? (currentQuestion.min || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-neutral-400 font-medium">
                                    <span>{currentQuestion.min || 0}</span>
                                    <span>{currentQuestion.max || 10}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ============ Analyzing Step ============ */}
                {step === 'analyzing' && (
                    <motion.div
                        key="analyzing"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12 text-center"
                    >
                        <div className="py-12">
                            {/* Pulsing rings */}
                            <div className="relative w-24 h-24 mx-auto mb-10">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border-2 border-neutral-900"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{
                                            scale: [0.5, 1.5],
                                            opacity: [0.8, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.6,
                                            ease: 'easeOut'
                                        }}
                                    />
                                ))}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center">
                                        <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                                {language === 'en' ? 'Analyzing...' : '正在分析...'}
                            </h3>
                            <p className="text-neutral-500">
                                {language === 'en' ? 'Max is cross-analyzing your health data' : 'Max 正在交叉分析你的健康数据'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ============ Result Step ============ */}
                {step === 'result' && assessmentResult && (
                    <motion.div
                        key="result"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12"
                    >
                        {/* Success Icon */}
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                            </motion.div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                                {language === 'en' ? 'Calibration Complete' : '校准完成'}
                            </h3>
                            <p className="text-neutral-500">
                                {language === 'en' ? 'Your profile has been updated.' : '你的档案已更新'}
                            </p>
                        </div>

                        {/* Tags */}
                        {assessmentResult.tags.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-6"
                            >
                                <p className="text-sm text-neutral-400 mb-3 font-medium">
                                    {language === 'en' ? 'Identified Tags' : '识别到的标签'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {assessmentResult.tags.map((tag, i) => (
                                        <motion.span
                                            key={tag}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            className="px-4 py-2 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700"
                                        >
                                            {tag}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Cross Analysis Insight */}
                        {assessmentResult.crossAnalysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl text-white mb-6"
                            >
                                <p className="text-xs uppercase tracking-wider text-white/60 mb-2 font-medium">
                                    {language === 'en' ? 'Deep Insight' : '深度洞察'}
                                </p>
                                <p className="font-semibold text-lg">{assessmentResult.crossAnalysis.syndrome}</p>
                            </motion.div>
                        )}

                        {/* Severity Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-between p-5 bg-neutral-50 rounded-2xl"
                        >
                            <span className="text-sm text-neutral-500 font-medium">
                                {language === 'en' ? 'Overall Status' : '整体状态'}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${assessmentResult.severity === 'low'
                                ? 'bg-emerald-100 text-emerald-700'
                                : assessmentResult.severity === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                {assessmentResult.severity === 'low'
                                    ? (language === 'en' ? 'Good' : '良好')
                                    : assessmentResult.severity === 'medium'
                                        ? (language === 'en' ? 'Monitor' : '关注')
                                        : (language === 'en' ? 'Action Needed' : '需关注')}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom slider styles */}
            <style jsx>{`
        .slider-apple::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .slider-apple::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider-apple::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
        </motion.div>
    );
}

export default UnifiedDailyCalibration;

```

---
## File: lib/assessment/daily-calibration-integration.ts

```typescript
/**
 * Daily Calibration Integration
 * 
 * Bridges the clinical scales library with the UnifiedDailyCalibration component.
 * Handles:
 * - Question generation from clinical scales
 * - Response storage to user_scale_responses
 * - Stability calculation and frequency adaptation
 * - Trigger detection for full scales
 * - Safety system integration
 */

import { createClient } from '@/lib/supabase-client';
import {
    getDailyQuestions,
    calculateDailyIndex,
    checkDailyRedFlags,
    GAD2_TRIGGER_THRESHOLD,
    shouldTriggerFullGAD7,
    checkSafetyTrigger,
    logSafetyEvent,
    getSafetyMessage,
    type DailyQuestion,
} from '@/lib/clinical-scales';
import {
    calculateDailyStability,
    fetchUserStabilityData,
    updateUserFrequency,
    type StabilityResult,
} from './stability-calculator';

export interface DailyCalibrationQuestion {
    id: string;
    text: string;
    type: 'single' | 'slider';
    category: 'anxiety' | 'sleep' | 'stress' | 'ai_pick';
    options?: { value: number; label: string }[];
    min?: number;
    max?: number;
    isSafetyQuestion?: boolean;
}

export interface DailyCalibrationResult {
    dailyIndex: number;
    gad2Score: number;
    sleepDurationScore: number;
    sleepQualityScore: number;
    stressScore: number;
    triggerFullScale: 'GAD7' | 'PHQ9' | null;
    safetyTriggered: boolean;
    stability: StabilityResult | null;
}

/**
 * Get daily calibration questions
 * Returns 5 fixed questions from clinical scales
 */
export function getDailyCalibrationQuestions(): DailyCalibrationQuestion[] {
    const clinicalQuestions = getDailyQuestions();

    return clinicalQuestions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.options ? 'single' : 'slider',
        category: q.category,
        options: q.options,
        min: (q as any).min,
        max: (q as any).max,
        isSafetyQuestion: q.isSafetyQuestion,
    }));
}

/**
 * Save daily calibration responses to database
 */
export async function saveDailyCalibrationResponses(
    userId: string,
    responses: Record<string, number>
): Promise<void> {
    const supabase = createClient();
    const now = new Date();
    const responseDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const records = Object.entries(responses).map(([questionId, value]) => ({
        user_id: userId,
        scale_id: 'DAILY',
        question_id: questionId,
        answer_value: value,
        source: 'daily',
        response_date: responseDate,
        created_at: now.toISOString(),
    }));

    await supabase
        .from('user_scale_responses')
        .upsert(records, {
            onConflict: 'user_id,scale_id,question_id,response_date,source',
            ignoreDuplicates: false,
        });
}

/**
 * Process daily calibration responses
 * Returns result with scores, triggers, and stability
 */
export async function processDailyCalibration(
    userId: string,
    responses: Record<string, number>
): Promise<DailyCalibrationResult> {
    // Save responses
    await saveDailyCalibrationResponses(userId, responses);

    // Calculate scores
    const gad2Score = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    const sleepDurationScore = responses['daily_sleep_duration'] || 0;
    const sleepQualityScore = responses['daily_sleep_quality'] || 0;
    const stressScore = responses['daily_stress_level'] || 0;

    const dailyIndex = calculateDailyIndex(responses);

    // Check for triggers
    let triggerFullScale: 'GAD7' | 'PHQ9' | null = null;
    if (shouldTriggerFullGAD7(gad2Score)) {
        triggerFullScale = 'GAD7';
        await logScaleTrigger(userId, 'GAD2', gad2Score, 'GAD7');
    }

    // Check for safety triggers (PHQ-9 Q9 won't be in daily, but check anyway)
    const safetyTriggered = Object.entries(responses).some(
        ([qId, value]) => checkSafetyTrigger(qId, value)
    );

    if (safetyTriggered) {
        await logSafetyEvent(userId, 'daily_calibration', 1);
    }

    // Calculate stability
    const { dailyResponses, consecutiveStableDays } = await fetchUserStabilityData(userId);
    const stability = calculateDailyStability(dailyResponses, consecutiveStableDays);

    // Update frequency if needed
    await updateUserFrequency(userId, stability);

    // Update profile
    const supabase = createClient();
    await supabase
        .from('profiles')
        .update({
            last_daily_calibration: new Date().toISOString(),
            daily_stability_streak: stability.consecutiveStableDays,
        })
        .eq('id', userId);

    return {
        dailyIndex,
        gad2Score,
        sleepDurationScore,
        sleepQualityScore,
        stressScore,
        triggerFullScale,
        safetyTriggered,
        stability,
    };
}

/**
 * Log when a short scale triggers a full scale
 */
async function logScaleTrigger(
    userId: string,
    shortScale: string,
    shortScore: number,
    fullScale: string
): Promise<void> {
    const supabase = createClient();

    await supabase.from('scale_trigger_logs').insert({
        user_id: userId,
        short_scale: shortScale,
        short_score: shortScore,
        triggered_full_scale: fullScale,
        trigger_reason: `score >= ${GAD2_TRIGGER_THRESHOLD}`,
        confidence: 0.85,
    });
}

/**
 * Get user's current calibration frequency
 */
export async function getUserCalibrationFrequency(userId: string): Promise<{
    dailyFrequency: 'daily' | 'every_other_day';
    weeklyFrequency: 'weekly' | 'biweekly';
    nextDailyDate: Date;
    frequencyReason?: string;
}> {
    const supabase = createClient();

    const { data: prefs } = await supabase
        .from('user_assessment_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    const { data: profile } = await supabase
        .from('profiles')
        .select('last_daily_calibration')
        .eq('id', userId)
        .single();

    const dailyFrequency = (prefs?.daily_frequency as 'daily' | 'every_other_day') || 'daily';
    const weeklyFrequency = (prefs?.weekly_frequency as 'weekly' | 'biweekly') || 'weekly';

    // Calculate next daily date
    const lastDaily = profile?.last_daily_calibration
        ? new Date(profile.last_daily_calibration)
        : new Date(0);

    const nextDailyDate = new Date(lastDaily);
    if (dailyFrequency === 'daily') {
        nextDailyDate.setDate(nextDailyDate.getDate() + 1);
    } else {
        nextDailyDate.setDate(nextDailyDate.getDate() + 2);
    }

    return {
        dailyFrequency,
        weeklyFrequency,
        nextDailyDate,
        frequencyReason: prefs?.daily_frequency_reason,
    };
}

/**
 * Check if user should do calibration today
 */
export async function shouldCalibrateToday(userId: string): Promise<boolean> {
    const { dailyFrequency, nextDailyDate } = await getUserCalibrationFrequency(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDailyDate.setHours(0, 0, 0, 0);

    return today >= nextDailyDate;
}

/**
 * Reset user to daily frequency (user-initiated)
 */
export async function resetToDailyFrequency(userId: string): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            daily_frequency: 'daily',
            daily_frequency_reason: 'user_choice',
            last_frequency_change: new Date().toISOString(),
        }, {
            onConflict: 'user_id',
        });

    await supabase
        .from('profiles')
        .update({ daily_stability_streak: 0 })
        .eq('id', userId);
}

```

---
## File: lib/assessment/stability-calculator.ts

```typescript
/**
 * Stability Calculator for Adaptive Assessment System
 * 
 * Calculates user stability metrics to determine if assessment frequency
 * can be reduced (daily → every-other-day, weekly → biweekly).
 * 
 * Stability Criteria:
 * - Completion rate: 7 days ≥ 5 responses (71%)
 * - Low risk: 7-day average ≤ 3, max single day ≤ 5
 * - Trend stable: 7-day slope ≤ 0.3/day
 * - No red flags: GAD-2 ≥ 3, PHQ-2 ≥ 3, sleep < 5h × 2 days, safety keywords
 * - Debounce: Must meet criteria for 3 consecutive days before frequency change
 */

import { createClient } from '@/lib/supabase-client';

export interface DailyResponse {
    date: string;
    gad2Score: number;     // 0-6
    sleepDuration: number; // hours
    sleepQuality: number;  // 0-2 (easy, somewhat, difficult)
    stressLevel: number;   // 0-2 (low, medium, high)
    dailyIndex: number;    // calculated total
}

export interface StabilityResult {
    isStable: boolean;
    completionRate: number;       // 0-1
    averageScore: number;         // daily index average
    maxSingleDay: number;         // peak daily index
    slope: number;                // trend per day
    hasRedFlag: boolean;
    redFlagReasons: string[];
    canReduceFrequency: boolean;
    consecutiveStableDays: number;
    recommendation: 'daily' | 'every_other_day' | 'increase_to_daily';
}

export interface WeeklyStabilityResult {
    isStable: boolean;
    completionRate: number;       // 4 weeks
    averageScore: number;
    scoreVariance: number;
    canReduceFrequency: boolean;
    recommendation: 'weekly' | 'biweekly';
}

/**
 * Calculate daily index from individual responses
 * dailyIndex = GAD2(0-6) + stress(0-2) + sleepQuality(0-2) + sleepDuration(0-2)
 * Max = 12
 */
export function calculateDailyIndexFromResponses(
    gad2Score: number,
    stressLevel: number,
    sleepQuality: number,
    sleepDuration: number
): number {
    // Sleep duration scoring: <5h=2, 5-6h=2, 6-7h=1, 7-9h=0, >9h=1
    let sleepDurationScore = 0;
    if (sleepDuration < 5) sleepDurationScore = 2;
    else if (sleepDuration < 6) sleepDurationScore = 2;
    else if (sleepDuration < 7) sleepDurationScore = 1;
    else if (sleepDuration <= 9) sleepDurationScore = 0;
    else sleepDurationScore = 1;

    return gad2Score + stressLevel + sleepQuality + sleepDurationScore;
}

/**
 * Calculate linear regression slope for trend analysis
 */
function calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0+1+2+...+(n-1)
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squares

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
}

/**
 * Check for red flags in the last 7 days of data
 */
export function checkRedFlags(
    responses: DailyResponse[],
    consecutiveSleepLowDays: number = 2
): { hasRedFlag: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for GAD-2 ≥ 3 on any day
    const highGAD2 = responses.filter(r => r.gad2Score >= 3);
    if (highGAD2.length > 0) {
        reasons.push(`GAD-2 ≥ 3 on ${highGAD2.length} day(s)`);
    }

    // Check for consecutive low sleep days
    let consecutiveLowSleep = 0;
    for (const r of responses.sort((a, b) => a.date.localeCompare(b.date))) {
        if (r.sleepDuration < 5) {
            consecutiveLowSleep++;
            if (consecutiveLowSleep >= consecutiveSleepLowDays) {
                reasons.push(`Sleep < 5h for ${consecutiveLowSleep} consecutive days`);
                break;
            }
        } else {
            consecutiveLowSleep = 0;
        }
    }

    // Check for high stress on multiple days
    const highStressDays = responses.filter(r => r.stressLevel === 2).length;
    if (highStressDays >= 3) {
        reasons.push(`High stress on ${highStressDays} days`);
    }

    return {
        hasRedFlag: reasons.length > 0,
        reasons,
    };
}

/**
 * Calculate stability for daily calibration frequency
 */
export function calculateDailyStability(
    responses: DailyResponse[],
    previousConsecutiveStableDays: number = 0
): StabilityResult {
    const DAYS_WINDOW = 7;
    const MIN_COMPLETION_RATE = 0.71; // 5/7
    const MAX_AVG_SCORE = 3;
    const MAX_SINGLE_DAY = 5;
    const MAX_SLOPE = 0.3;
    const DEBOUNCE_DAYS = 3;

    // Calculate completion rate
    const completionRate = Math.min(responses.length / DAYS_WINDOW, 1);

    // Calculate average score
    const scores = responses.map(r => r.dailyIndex);
    const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    // Calculate max single day
    const maxSingleDay = scores.length > 0 ? Math.max(...scores) : 0;

    // Calculate slope (trend)
    const slope = calculateSlope(scores);

    // Check red flags
    const { hasRedFlag, reasons: redFlagReasons } = checkRedFlags(responses);

    // Determine stability
    const isStableCriteria =
        completionRate >= MIN_COMPLETION_RATE &&
        averageScore <= MAX_AVG_SCORE &&
        maxSingleDay <= MAX_SINGLE_DAY &&
        Math.abs(slope) <= MAX_SLOPE &&
        !hasRedFlag;

    // Calculate consecutive stable days (debounce)
    const consecutiveStableDays = isStableCriteria
        ? previousConsecutiveStableDays + 1
        : 0;

    // Can reduce frequency only after debounce period
    const canReduceFrequency = consecutiveStableDays >= DEBOUNCE_DAYS;

    // Recommendation
    let recommendation: 'daily' | 'every_other_day' | 'increase_to_daily';
    if (hasRedFlag) {
        recommendation = 'increase_to_daily';
    } else if (canReduceFrequency) {
        recommendation = 'every_other_day';
    } else {
        recommendation = 'daily';
    }

    return {
        isStable: isStableCriteria,
        completionRate,
        averageScore,
        maxSingleDay,
        slope,
        hasRedFlag,
        redFlagReasons,
        canReduceFrequency,
        consecutiveStableDays,
        recommendation,
    };
}

/**
 * Calculate stability for weekly calibration frequency
 */
export function calculateWeeklyStability(
    weeklyScores: number[], // PSS-4 scores for last 4 weeks
    completedWeeks: number
): WeeklyStabilityResult {
    const WEEKS_WINDOW = 4;
    const MIN_COMPLETION_RATE = 0.75; // 3/4 weeks
    const MAX_VARIANCE = 1;

    const completionRate = Math.min(completedWeeks / WEEKS_WINDOW, 1);
    const averageScore = weeklyScores.length > 0
        ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
        : 0;

    // Calculate variance
    const variance = weeklyScores.length > 1
        ? weeklyScores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / weeklyScores.length
        : 0;

    const isStable =
        completionRate >= MIN_COMPLETION_RATE &&
        variance <= MAX_VARIANCE;

    return {
        isStable,
        completionRate,
        averageScore,
        scoreVariance: variance,
        canReduceFrequency: isStable,
        recommendation: isStable ? 'biweekly' : 'weekly',
    };
}

/**
 * Fetch user's stability data from database
 */
export async function fetchUserStabilityData(userId: string): Promise<{
    dailyResponses: DailyResponse[];
    consecutiveStableDays: number;
}> {
    const supabase = createClient();

    // Get last 7 days of daily responses
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: responses } = await supabase
        .from('user_scale_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('source', 'daily')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    // Get current stability streak
    const { data: profile } = await supabase
        .from('profiles')
        .select('daily_stability_streak')
        .eq('id', userId)
        .single();

    // Group responses by date and calculate daily index
    const dailyMap = new Map<string, DailyResponse>();

    for (const r of responses || []) {
        const date = r.created_at.split('T')[0];
        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                date,
                gad2Score: 0,
                sleepDuration: 7, // default
                sleepQuality: 0,
                stressLevel: 0,
                dailyIndex: 0,
            });
        }

        const day = dailyMap.get(date)!;

        // Update based on question ID
        if (r.question_id === 'gad7_q1' || r.question_id === 'gad7_q2') {
            day.gad2Score += r.answer_value || 0;
        } else if (r.question_id === 'daily_sleep_duration') {
            // Map answer value to hours
            const durationMap: Record<number, number> = { 0: 4, 1: 5.5, 2: 6.5, 3: 7.5, 4: 8.5, 5: 10 };
            day.sleepDuration = durationMap[r.answer_value] || 7;
        } else if (r.question_id === 'daily_sleep_quality') {
            day.sleepQuality = r.answer_value || 0;
        } else if (r.question_id === 'daily_stress_level') {
            day.stressLevel = r.answer_value || 0;
        }
    }

    // Calculate daily index for each day
    const dailyResponses = Array.from(dailyMap.values()).map(d => ({
        ...d,
        dailyIndex: calculateDailyIndexFromResponses(
            d.gad2Score,
            d.stressLevel,
            d.sleepQuality,
            d.sleepDuration
        ),
    }));

    return {
        dailyResponses,
        consecutiveStableDays: profile?.daily_stability_streak || 0,
    };
}

/**
 * Update user's frequency preference based on stability
 */
export async function updateUserFrequency(
    userId: string,
    stability: StabilityResult
): Promise<void> {
    const supabase = createClient();

    // Update profile stability streak
    await supabase
        .from('profiles')
        .update({
            daily_stability_streak: stability.consecutiveStableDays,
        })
        .eq('id', userId);

    // Update preferences if frequency should change
    if (stability.canReduceFrequency || stability.hasRedFlag) {
        await supabase
            .from('user_assessment_preferences')
            .upsert({
                user_id: userId,
                daily_frequency: stability.recommendation === 'increase_to_daily' ? 'daily' : stability.recommendation,
                daily_frequency_reason: stability.hasRedFlag
                    ? `red_flag: ${stability.redFlagReasons.join(', ')}`
                    : 'stable_7d',
                last_frequency_change: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });
    }
}

```

---
## File: lib/clinical-scales/daily-questions.ts

```typescript
/**
 * Daily Calibration Questions
 * 
 * Minimal set of questions for daily check-in:
 * - GAD-2 (anxiety short screen, 2 questions)
 * - Sleep duration (1 question)
 * - Sleep quality/ease (1 question)
 * - Stress level (1 question)
 * 
 * Total: 5 fixed questions
 * 
 * DESIGN: Each question uses incremental values (0,1,2,3...) for storage.
 * Actual hours/meanings are derived via mapping tables.
 */

import type { ScaleQuestion } from './types';
import { getGAD2Questions } from './gad';

export interface DailyQuestion extends ScaleQuestion {
    category: 'anxiety' | 'sleep' | 'stress' | 'ai_pick';
}

/**
 * Sleep duration mapping: value -> hours range
 * Values are ordered by "concern level" (0 = optimal, higher = more concerning)
 */
export const SLEEP_DURATION_MAP: Record<number, { hours: string; minHours: number; maxHours: number }> = {
    0: { hours: '7-8小时', minHours: 7, maxHours: 8 },
    1: { hours: '8-9小时', minHours: 8, maxHours: 9 },
    2: { hours: '6-7小时', minHours: 6, maxHours: 7 },
    3: { hours: '5-6小时', minHours: 5, maxHours: 6 },
    4: { hours: '超过9小时', minHours: 9, maxHours: 12 },
    5: { hours: '少于5小时', minHours: 0, maxHours: 5 },
};

/**
 * Sleep duration question
 * value: 0=optimal(7-8h), higher=more concerning
 */
export const SLEEP_DURATION_QUESTION: DailyQuestion = {
    id: 'daily_sleep_duration',
    text: '昨晚睡了多少小时？',
    textEn: 'How many hours did you sleep last night?',
    category: 'sleep',
    options: [
        { value: 0, label: '7-8小时', labelEn: '7-8 hours' },      // optimal
        { value: 1, label: '8-9小时', labelEn: '8-9 hours' },      // slightly long
        { value: 2, label: '6-7小时', labelEn: '6-7 hours' },      // slightly short
        { value: 3, label: '5-6小时', labelEn: '5-6 hours' },      // concerning
        { value: 4, label: '超过9小时', labelEn: 'More than 9 hours' }, // oversleep
        { value: 5, label: '少于5小时', labelEn: 'Less than 5 hours' }, // critical
    ],
};

/**
 * Sleep quality / ease of falling asleep question
 */
export const SLEEP_QUALITY_QUESTION: DailyQuestion = {
    id: 'daily_sleep_quality',
    text: '入睡容易吗？',
    textEn: 'Was it easy to fall asleep?',
    category: 'sleep',
    options: [
        { value: 0, label: '很容易', labelEn: 'Very easy' },
        { value: 1, label: '有点困难', labelEn: 'Somewhat difficult' },
        { value: 2, label: '很困难', labelEn: 'Very difficult' },
    ],
};

/**
 * Stress level question
 */
export const STRESS_LEVEL_QUESTION: DailyQuestion = {
    id: 'daily_stress_level',
    text: '当前压力水平？',
    textEn: 'Current stress level?',
    category: 'stress',
    options: [
        { value: 0, label: '低压', labelEn: 'Low' },
        { value: 1, label: '中压', labelEn: 'Medium' },
        { value: 2, label: '高压', labelEn: 'High' },
    ],
};

/**
 * Get all daily calibration questions
 */
export function getDailyQuestions(): DailyQuestion[] {
    const gad2 = getGAD2Questions().map(q => ({
        ...q,
        category: 'anxiety' as const,
    }));

    return [
        ...gad2,
        SLEEP_DURATION_QUESTION,
        SLEEP_QUALITY_QUESTION,
        STRESS_LEVEL_QUESTION,
    ];
}

/**
 * Get sleep hours from answer value
 */
export function getSleepHoursFromValue(value: number): number {
    const mapping = SLEEP_DURATION_MAP[value];
    if (!mapping) return 7; // default
    // Return midpoint of range
    return (mapping.minHours + mapping.maxHours) / 2;
}

/**
 * Check if sleep duration is critically low
 */
export function isSleepCriticallyLow(value: number): boolean {
    // value 5 = <5 hours, value 3 = 5-6 hours (also concerning)
    return value >= 5;
}

/**
 * Calculate daily index score (normalized 0-1 scale)
 * Each component contributes equally
 */
export function calculateDailyIndex(responses: Record<string, number>): number {
    // GAD-2: 0-6, normalized to 0-1
    const gad2 = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    const gad2Norm = gad2 / 6;

    // Sleep duration: 0-5, normalized to 0-1  
    const sleepDur = responses['daily_sleep_duration'] || 0;
    const sleepDurNorm = sleepDur / 5;

    // Sleep quality: 0-2, normalized to 0-1
    const sleepQual = responses['daily_sleep_quality'] || 0;
    const sleepQualNorm = sleepQual / 2;

    // Stress: 0-2, normalized to 0-1
    const stress = responses['daily_stress_level'] || 0;
    const stressNorm = stress / 2;

    // Weighted average (anxiety gets more weight)
    const index = (gad2Norm * 0.4) + (sleepDurNorm * 0.2) + (sleepQualNorm * 0.2) + (stressNorm * 0.2);

    return Math.round(index * 100) / 100; // 0.00 - 1.00
}

/**
 * Calculate raw daily score (for backward compatibility)
 * Sum of all values, max = 6 + 5 + 2 + 2 = 15
 */
export function calculateDailyRawScore(responses: Record<string, number>): number {
    return (
        (responses['gad7_q1'] || 0) +
        (responses['gad7_q2'] || 0) +
        (responses['daily_sleep_duration'] || 0) +
        (responses['daily_sleep_quality'] || 0) +
        (responses['daily_stress_level'] || 0)
    );
}

/**
 * Check for red flags in daily responses
 */
export function checkDailyRedFlags(responses: Record<string, number>): {
    hasRedFlag: boolean;
    reasons: string[];
} {
    const reasons: string[] = [];

    // GAD-2 ≥ 3 (triggers full GAD-7)
    const gad2Score = (responses['gad7_q1'] || 0) + (responses['gad7_q2'] || 0);
    if (gad2Score >= 3) {
        reasons.push('GAD-2 ≥ 3');
    }

    // Sleep < 5h (value = 5)
    const sleepValue = responses['daily_sleep_duration'];
    if (sleepValue !== undefined && isSleepCriticallyLow(sleepValue)) {
        reasons.push('Sleep < 5h');
    }

    // High stress (value = 2)
    if (responses['daily_stress_level'] === 2) {
        reasons.push('High stress');
    }

    return {
        hasRedFlag: reasons.length > 0,
        reasons,
    };
}

```

---
## File: lib/clinical-scales/gad.ts

```typescript
/**
 * GAD-7 / GAD-2 - Generalized Anxiety Disorder Scale
 * 
 * Reference: Spitzer RL, Kroenke K, Williams JBW, Löwe B. (2006)
 * A Brief Measure for Assessing Generalized Anxiety Disorder.
 * Archives of Internal Medicine, 166(10), 1092-1097.
 * 
 * Public Domain - Free to use
 */

import type { ScaleDefinition } from './types';

export const GAD7: ScaleDefinition = {
    id: 'GAD7',
    name: '广泛性焦虑障碍量表-7',
    nameEn: 'Generalized Anxiety Disorder 7-item Scale',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        {
            id: 'gad7_q1',
            text: '感到紧张、焦虑或急切',
            textEn: 'Feeling nervous, anxious, or on edge',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q2',
            text: '不能停止或控制担忧',
            textEn: 'Not being able to stop or control worrying',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q3',
            text: '对各种各样的事情担忧过多',
            textEn: 'Worrying too much about different things',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q4',
            text: '很难放松下来',
            textEn: 'Trouble relaxing',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q5',
            text: '由于不安而无法静坐',
            textEn: 'Being so restless that it is hard to sit still',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q6',
            text: '变得容易烦恼或急躁',
            textEn: 'Becoming easily annoyed or irritable',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'gad7_q7',
            text: '感到好像将有可怕的事情发生',
            textEn: 'Feeling afraid, as if something awful might happen',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
    ],

    shortVersion: {
        questionIds: ['gad7_q1', 'gad7_q2'],
        triggerThreshold: 3, // GAD-2 ≥ 3 triggers full GAD-7
    },

    scoring: {
        minScore: 0,
        maxScore: 21,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微焦虑', labelEn: 'Minimal anxiety' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度焦虑', labelEn: 'Mild anxiety' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度焦虑', labelEn: 'Moderate anxiety' },
            { minScore: 15, maxScore: 21, level: 'severe', label: '重度焦虑', labelEn: 'Severe anxiety' },
        ],
    },
};

// GAD-2 helper functions
export const GAD2_QUESTION_IDS = GAD7.shortVersion!.questionIds;
export const GAD2_TRIGGER_THRESHOLD = GAD7.shortVersion!.triggerThreshold;

export function getGAD2Questions() {
    return GAD7.questions.filter(q => GAD2_QUESTION_IDS.includes(q.id));
}

export function shouldTriggerFullGAD7(gad2Score: number): boolean {
    return gad2Score >= GAD2_TRIGGER_THRESHOLD;
}

export function interpretGAD7Score(score: number): string {
    const interpretation = GAD7.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}

```

---
## File: lib/clinical-scales/phq.ts

```typescript
/**
 * PHQ-9 / PHQ-2 - Patient Health Questionnaire
 * 
 * Reference: Kroenke K, Spitzer RL, Williams JB. (2001)
 * The PHQ-9: validity of a brief depression severity measure.
 * Journal of General Internal Medicine, 16(9), 606-613.
 * 
 * Public Domain - Free to use
 * 
 * ⚠️ SAFETY NOTE: Question 9 assesses suicidal ideation.
 * Must implement safety branch when value ≥ 1.
 */

import type { ScaleDefinition } from './types';

export const PHQ9: ScaleDefinition = {
    id: 'PHQ9',
    name: '患者健康问卷-9',
    nameEn: 'Patient Health Questionnaire-9',
    description: '过去两周内，您有多少时候受到以下问题困扰？',

    questions: [
        {
            id: 'phq9_q1',
            text: '做事时提不起劲或没有兴趣',
            textEn: 'Little interest or pleasure in doing things',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q2',
            text: '感到心情低落、沮丧或绝望',
            textEn: 'Feeling down, depressed, or hopeless',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q3',
            text: '入睡困难、睡不安稳或睡眠过多',
            textEn: 'Trouble falling or staying asleep, or sleeping too much',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q4',
            text: '感觉疲倦或没有活力',
            textEn: 'Feeling tired or having little energy',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q5',
            text: '食欲不振或吃太多',
            textEn: 'Poor appetite or overeating',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q6',
            text: '觉得自己很糟糕或觉得自己很失败，或让自己或家人失望',
            textEn: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q7',
            text: '对事物专注有困难，例如阅读报纸或看电视',
            textEn: 'Trouble concentrating on things, such as reading the newspaper or watching television',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q8',
            text: '动作或说话速度缓慢到别人可以觉察，或正好相反——烦躁或坐立不安',
            textEn: 'Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
        },
        {
            id: 'phq9_q9',
            text: '有不如死掉或用某种方式伤害自己的念头',
            textEn: 'Thoughts that you would be better off dead or of hurting yourself in some way',
            options: [
                { value: 0, label: '完全没有', labelEn: 'Not at all' },
                { value: 1, label: '好几天', labelEn: 'Several days' },
                { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
                { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
            ],
            isSafetyQuestion: true,
            safetyThreshold: 1, // ≥ 1 triggers safety branch
        },
    ],

    shortVersion: {
        questionIds: ['phq9_q1', 'phq9_q2'],
        triggerThreshold: 3, // PHQ-2 ≥ 3 triggers full PHQ-9
    },

    scoring: {
        minScore: 0,
        maxScore: 27,
        interpretation: [
            { minScore: 0, maxScore: 4, level: 'minimal', label: '极轻微抑郁', labelEn: 'Minimal depression' },
            { minScore: 5, maxScore: 9, level: 'mild', label: '轻度抑郁', labelEn: 'Mild depression' },
            { minScore: 10, maxScore: 14, level: 'moderate', label: '中度抑郁', labelEn: 'Moderate depression' },
            { minScore: 15, maxScore: 19, level: 'moderately_severe', label: '中重度抑郁', labelEn: 'Moderately severe depression' },
            { minScore: 20, maxScore: 27, level: 'severe', label: '重度抑郁', labelEn: 'Severe depression' },
        ],
    },
};

// PHQ-2 helper functions
export const PHQ2_QUESTION_IDS = PHQ9.shortVersion!.questionIds;
export const PHQ2_TRIGGER_THRESHOLD = PHQ9.shortVersion!.triggerThreshold;
export const PHQ9_SAFETY_QUESTION_ID = 'phq9_q9';

export function getPHQ2Questions() {
    return PHQ9.questions.filter(q => PHQ2_QUESTION_IDS.includes(q.id));
}

export function shouldTriggerFullPHQ9(phq2Score: number): boolean {
    return phq2Score >= PHQ2_TRIGGER_THRESHOLD;
}

export function isSafetyQuestionTriggered(questionId: string, value: number): boolean {
    if (questionId !== PHQ9_SAFETY_QUESTION_ID) return false;
    const question = PHQ9.questions.find(q => q.id === questionId);
    if (!question?.isSafetyQuestion) return false;
    return value >= (question.safetyThreshold || 1);
}

export function interpretPHQ9Score(score: number): string {
    const interpretation = PHQ9.scoring.interpretation.find(
        i => score >= i.minScore && score <= i.maxScore
    );
    return interpretation?.label || '未知';
}

```

---
## File: components/WeeklyCalibration.tsx

```tsx
'use client';

/**
 * WeeklyCalibration Component
 * 
 * Weekly assessment using PSS-4 + 1 AI evolution question.
 * Adaptive frequency: weekly → biweekly for stable users.
 * 
 * Design: Same Apple-inspired premium look as daily calibration.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, TrendingUp, ChevronRight, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { getPSS4Questions, PSS10 } from '@/lib/clinical-scales';
import type { ScaleQuestion } from '@/lib/clinical-scales';

// ============ Types ============

interface WeeklyCalibrationProps {
    userId: string;
    userName?: string;
    onComplete?: (result: WeeklyCalibrationResult) => void;
    onSkip?: (reason: string) => void;
}

interface WeeklyCalibrationResult {
    pss4Score: number;
    stressLevel: 'low' | 'moderate' | 'high';
    evolutionAnswer?: string;
}

type CalibrationStep = 'welcome' | 'questions' | 'evolution' | 'result';

// ============ Animation Variants ============

const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
};

const slideVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3 } },
};

// ============ Evolution Question ============

const EVOLUTION_QUESTION = {
    id: 'weekly_evolution',
    text: '这周最大的挑战是什么？',
    textEn: 'What was your biggest challenge this week?',
    options: [
        { value: 'work', label: '工作压力', labelEn: 'Work stress' },
        { value: 'sleep', label: '睡眠问题', labelEn: 'Sleep issues' },
        { value: 'relationships', label: '人际关系', labelEn: 'Relationships' },
        { value: 'health', label: '健康担忧', labelEn: 'Health concerns' },
        { value: 'none', label: '没有特别的', labelEn: 'Nothing particular' },
    ],
};

// ============ Component ============

export function WeeklyCalibration({
    userId,
    userName,
    onComplete,
    onSkip,
}: WeeklyCalibrationProps) {
    const supabase = createClient();

    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [evolutionAnswer, setEvolutionAnswer] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const pss4Questions = getPSS4Questions();

    // Start calibration
    const startCalibration = useCallback(() => {
        setStep('questions');
    }, []);

    // Handle PSS-4 answer
    const handleAnswer = useCallback((questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        setTimeout(() => {
            if (currentQuestionIndex < pss4Questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setStep('evolution');
            }
        }, 400);
    }, [currentQuestionIndex, pss4Questions.length]);

    // Handle evolution answer and complete
    const handleEvolutionAnswer = useCallback(async (value: string) => {
        setEvolutionAnswer(value);
        setIsLoading(true);

        try {
            // Calculate PSS-4 score
            const pss4Score = Object.values(answers).reduce((sum, v) => sum + v, 0);

            // Determine stress level (PSS-4 max is 16)
            let stressLevel: 'low' | 'moderate' | 'high';
            if (pss4Score <= 5) stressLevel = 'low';
            else if (pss4Score <= 10) stressLevel = 'moderate';
            else stressLevel = 'high';

            // Save to database
            const now = new Date().toISOString();
            const records = Object.entries(answers).map(([questionId, answerValue]) => ({
                user_id: userId,
                scale_id: 'PSS4',
                question_id: questionId,
                answer_value: answerValue,
                source: 'weekly',
                created_at: now,
            }));

            // Add evolution answer
            records.push({
                user_id: userId,
                scale_id: 'WEEKLY_EVO',
                question_id: 'weekly_evolution',
                answer_value: EVOLUTION_QUESTION.options.findIndex(o => o.value === value),
                source: 'weekly',
                created_at: now,
            });

            await supabase.from('user_scale_responses').insert(records);

            // Update profile
            await supabase
                .from('profiles')
                .update({ last_weekly_calibration: now })
                .eq('id', userId);

            // Trigger refresh
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });

            const result: WeeklyCalibrationResult = {
                pss4Score,
                stressLevel,
                evolutionAnswer: value,
            };

            setStep('result');
            if (onComplete) onComplete(result);
        } catch (error) {
            console.error('Weekly calibration failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [answers, userId, supabase, onComplete]);

    // Skip handler
    const handleSkip = useCallback((reason: string) => {
        if (onSkip) onSkip(reason);
    }, [onSkip]);

    const currentQuestion = pss4Questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / (pss4Questions.length + 1)) * 100;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)]"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-orange-50/20 pointer-events-none" />

            <AnimatePresence mode="wait">
                {/* Welcome */}
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/20">
                                <Calendar className="w-9 h-9 text-white" strokeWidth={1.5} />
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}每周复盘
                            </h2>
                            <p className="text-neutral-500 text-base md:text-lg max-w-sm mx-auto leading-relaxed">
                                5 个问题，追踪你的压力趋势
                            </p>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button
                                onClick={() => handleSkip('busy')}
                                className="flex-1 h-14 border border-neutral-200 text-neutral-600 rounded-2xl font-medium hover:bg-neutral-50"
                            >
                                稍后再做
                            </button>
                            <button
                                onClick={startCalibration}
                                className="flex-1 h-14 bg-neutral-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
                            >
                                <span>开始</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Questions */}
                {step === 'questions' && currentQuestion && (
                    <motion.div
                        key={`question-${currentQuestionIndex}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        {/* Progress */}
                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-neutral-400">
                                    {currentQuestionIndex + 1} / {pss4Questions.length + 1}
                                </span>
                                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                                    压力评估
                                </span>
                            </div>
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 mb-8 leading-relaxed">
                            {currentQuestion.text}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                    className="w-full p-5 text-left rounded-2xl border border-neutral-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all"
                                >
                                    <span className="text-base font-medium text-neutral-800">
                                        {option.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Evolution Question */}
                {step === 'evolution' && (
                    <motion.div
                        key="evolution"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        <div className="mb-10">
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                                    animate={{ width: '90%' }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-6 h-6 text-amber-500" />
                            <span className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                                进化问题
                            </span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 mb-8 leading-relaxed">
                            {EVOLUTION_QUESTION.text}
                        </h3>

                        <div className="space-y-3">
                            {EVOLUTION_QUESTION.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleEvolutionAnswer(option.value)}
                                    disabled={isLoading}
                                    className="w-full p-5 text-left rounded-2xl border border-neutral-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all disabled:opacity-50"
                                >
                                    <span className="text-base font-medium text-neutral-800">
                                        {option.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Result */}
                {step === 'result' && (
                    <motion.div
                        key="result"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12 text-center"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
                            本周复盘完成
                        </h2>
                        <p className="text-neutral-500 text-base">
                            下周同一时间再见！
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

```

---
## File: components/MonthlyCalibration.tsx

```tsx
'use client';

/**
 * MonthlyCalibration Component
 * 
 * Monthly assessment using GAD-7/PHQ-9 rotation + PSS-10.
 * Split across weeks to avoid survey fatigue:
 * - Week 1: PSS-10 (10 questions)
 * - Week 3: GAD-7 or PHQ-9 alternating (7-9 questions)
 * 
 * Features:
 * - Progress save/resume for interrupted sessions
 * - Skip tracking with reason
 * - PHQ-9 Q9 safety branch integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Brain, ChevronRight, Pause, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import {
    GAD7,
    PHQ9,
    PSS10,
    checkSafetyTrigger,
    getSafetyMessage,
    logSafetyEvent,
} from '@/lib/clinical-scales';
import type { ScaleQuestion, ScaleDefinition } from '@/lib/clinical-scales';

// ============ Types ============

interface MonthlyCalibrationProps {
    userId: string;
    userName?: string;
    scaleType: 'PSS10' | 'GAD7' | 'PHQ9';
    onComplete?: (result: MonthlyCalibrationResult) => void;
    onPause?: (progress: SavedProgress) => void;
    onSkip?: (reason: string) => void;
    savedProgress?: SavedProgress;
}

interface MonthlyCalibrationResult {
    scaleId: string;
    totalScore: number;
    interpretation: string;
    safetyTriggered: boolean;
}

interface SavedProgress {
    scaleId: string;
    answers: Record<string, number>;
    currentIndex: number;
    savedAt: string;
}

type CalibrationStep = 'welcome' | 'questions' | 'safety' | 'result';

// ============ Animation Variants ============

const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
};

const slideVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3 } },
};

// ============ Scale Mapping ============

const SCALE_MAP: Record<string, ScaleDefinition> = {
    PSS10,
    GAD7,
    PHQ9,
};

const SCALE_COLORS: Record<string, { from: string; to: string }> = {
    PSS10: { from: 'from-purple-500', to: 'to-violet-500' },
    GAD7: { from: 'from-blue-500', to: 'to-cyan-500' },
    PHQ9: { from: 'from-rose-500', to: 'to-pink-500' },
};

// ============ Component ============

export function MonthlyCalibration({
    userId,
    userName,
    scaleType,
    onComplete,
    onPause,
    onSkip,
    savedProgress,
}: MonthlyCalibrationProps) {
    const supabase = createClient();

    const scale = SCALE_MAP[scaleType];
    const colors = SCALE_COLORS[scaleType] || SCALE_COLORS.PSS10;

    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        savedProgress?.currentIndex || 0
    );
    const [answers, setAnswers] = useState<Record<string, number>>(
        savedProgress?.answers || {}
    );
    const [isLoading, setIsLoading] = useState(false);
    const [safetyMessage, setSafetyMessage] = useState<string>('');
    const [result, setResult] = useState<MonthlyCalibrationResult | null>(null);

    const questions = scale.questions;
    const estimatedMinutes = Math.ceil(questions.length / 2);

    // Load saved progress
    useEffect(() => {
        if (savedProgress && savedProgress.scaleId === scaleType) {
            setAnswers(savedProgress.answers);
            setCurrentQuestionIndex(savedProgress.currentIndex);
            setStep('questions');
        }
    }, [savedProgress, scaleType]);

    // Start calibration
    const startCalibration = useCallback(() => {
        setStep('questions');
    }, []);

    // Handle answer
    const handleAnswer = useCallback(async (questionId: string, value: number) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        // Check for safety trigger (PHQ-9 Q9)
        if (checkSafetyTrigger(questionId, value)) {
            await logSafetyEvent(userId, questionId, value);
            setSafetyMessage(getSafetyMessage('zh'));
            setStep('safety');
            return;
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                completeAssessment(newAnswers);
            }
        }, 400);
    }, [answers, currentQuestionIndex, questions.length, userId]);

    // Continue after safety message
    const continueAfterSafety = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setStep('questions');
        } else {
            completeAssessment(answers);
        }
    }, [currentQuestionIndex, questions.length, answers]);

    // Complete assessment
    const completeAssessment = useCallback(async (finalAnswers: Record<string, number>) => {
        setIsLoading(true);

        try {
            // Calculate total score
            const totalScore = Object.values(finalAnswers).reduce((sum, v) => sum + v, 0);

            // Get interpretation
            const interpretation = scale.scoring.interpretation.find(
                i => totalScore >= i.minScore && totalScore <= i.maxScore
            )?.label || '未知';

            // Check if safety was triggered
            const safetyTriggered = Object.entries(finalAnswers).some(
                ([qId, v]) => checkSafetyTrigger(qId, v)
            );

            // Save to database
            const now = new Date();
            const responseDate = now.toISOString().split('T')[0];
            const records = Object.entries(finalAnswers).map(([questionId, answerValue]) => ({
                user_id: userId,
                scale_id: scaleType,
                question_id: questionId,
                answer_value: answerValue,
                source: 'monthly',
                response_date: responseDate,
                created_at: now.toISOString(),
            }));

            await supabase.from('user_scale_responses').insert(records);

            // Update profile - MERGE scores instead of overwriting
            await supabase.rpc('merge_inferred_scores', {
                p_user_id: userId,
                p_scale_id: scaleType,
                p_score: totalScore,
                p_interpretation: interpretation,
            });

            // Update last_monthly_calibration
            await supabase
                .from('profiles')
                .update({ last_monthly_calibration: now.toISOString() })
                .eq('id', userId);

            // Trigger refresh
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });

            const resultData: MonthlyCalibrationResult = {
                scaleId: scaleType,
                totalScore,
                interpretation,
                safetyTriggered,
            };

            setResult(resultData);
            setStep('result');
            if (onComplete) onComplete(resultData);
        } catch (error) {
            console.error('Monthly calibration failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [scale, scaleType, userId, supabase, onComplete]);

    // Pause and save progress
    const handlePause = useCallback(() => {
        const progress: SavedProgress = {
            scaleId: scaleType,
            answers,
            currentIndex: currentQuestionIndex,
            savedAt: new Date().toISOString(),
        };

        // Save to localStorage
        localStorage.setItem(`monthly_progress_${userId}`, JSON.stringify(progress));

        if (onPause) onPause(progress);
    }, [scaleType, answers, currentQuestionIndex, userId, onPause]);

    // Skip handler
    const handleSkip = useCallback((reason: string) => {
        if (onSkip) onSkip(reason);
    }, [onSkip]);

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)]"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.from}/10 via-transparent ${colors.to}/5 pointer-events-none`} />

            <AnimatePresence mode="wait">
                {/* Welcome */}
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        <div className="flex justify-center mb-8">
                            <div className={`w-20 h-20 rounded-[22px] bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-2xl`}>
                                <Brain className="w-9 h-9 text-white" strokeWidth={1.5} />
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}月度评估
                            </h2>
                            <p className="text-neutral-500 text-base md:text-lg max-w-sm mx-auto leading-relaxed">
                                {scale.name} · {questions.length} 个问题 · 约 {estimatedMinutes} 分钟
                            </p>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button
                                onClick={() => handleSkip('busy')}
                                className="flex-1 h-14 border border-neutral-200 text-neutral-600 rounded-2xl font-medium hover:bg-neutral-50"
                            >
                                稍后再做
                            </button>
                            <button
                                onClick={startCalibration}
                                className="flex-1 h-14 bg-neutral-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
                            >
                                <span>开始评估</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Questions */}
                {step === 'questions' && currentQuestion && (
                    <motion.div
                        key={`question-${currentQuestionIndex}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        {/* Header with pause */}
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-neutral-400">
                                {currentQuestionIndex + 1} / {questions.length}
                            </span>
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
                            >
                                <Pause className="w-4 h-4" />
                                <span>暂停保存</span>
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mb-10">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${colors.from} ${colors.to}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Question */}
                        <p className="text-sm text-neutral-400 mb-3">{scale.description}</p>
                        <h3 className="text-xl md:text-2xl font-medium text-neutral-900 mb-8 leading-relaxed">
                            {currentQuestion.text}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                    disabled={isLoading}
                                    className={`w-full p-5 text-left rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all disabled:opacity-50`}
                                >
                                    <span className="text-base font-medium text-neutral-800">
                                        {option.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Safety Message */}
                {step === 'safety' && (
                    <motion.div
                        key="safety"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                我们关心你的状态
                            </h3>
                        </div>

                        <div className="bg-neutral-50 rounded-2xl p-6 mb-8 whitespace-pre-line text-neutral-700 text-sm leading-relaxed">
                            {safetyMessage}
                        </div>

                        <button
                            onClick={continueAfterSafety}
                            className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-medium"
                        >
                            我知道了，继续
                        </button>
                    </motion.div>
                )}

                {/* Result */}
                {step === 'result' && result && (
                    <motion.div
                        key="result"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="relative p-10 md:p-12 text-center"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
                            评估完成
                        </h2>
                        <p className="text-neutral-500 text-base mb-6">
                            {scale.name}: {result.interpretation}
                        </p>

                        <div className="bg-neutral-50 rounded-2xl p-6">
                            <div className="text-4xl font-bold text-neutral-900 mb-2">
                                {result.totalScore}
                            </div>
                            <div className="text-sm text-neutral-500">
                                总分 (满分 {scale.scoring.maxScore})
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

```

---
## File: lib/active-inquiry-guardrails.ts

```typescript
/**
 * Active Inquiry Guardrails
 * 
 * Manages AI active inquiry with:
 * - Template + variable generation (not fully open)
 * - Cooldown logic (24h same user, 48h same type)
 * - Forbidden topics (diagnosis, dosage)
 * - User preference (pause 7 days, reduce frequency)
 */

import { createClient } from '@/lib/supabase-client';

// ============ Types ============

export interface InquiryTemplate {
    id: string;
    category: 'plan_tracking' | 'status_check' | 'anomaly_follow' | 'info_gap' | 'deep_explore';
    templateZh: string;
    templateEn: string;
    variables: string[];
    cooldownHours: number;
}

export interface InquiryCooldown {
    userId: string;
    templateId: string;
    category: string;
    lastTriggeredAt: Date;
    expiresAt: Date;
}

export interface UserInquiryPreferences {
    isPaused: boolean;
    pausedUntil?: Date;
    frequency: 'normal' | 'reduced' | 'off';
    cooldownMultiplier: number;
}

export interface InquiryResult {
    allowed: boolean;
    reason?: string;
    question?: string;
    questionZh?: string;
    templateId?: string;
}

// ============ Inquiry Templates ============

export const INQUIRY_TEMPLATES: InquiryTemplate[] = [
    // Plan Tracking
    {
        id: 'plan_checkin_morning',
        category: 'plan_tracking',
        templateZh: '{name}，今天是执行"{plan_title}"的第{day}天。准备好了吗？',
        templateEn: '{name}, Day {day} of "{plan_title}". Ready to go?',
        variables: ['name', 'plan_title', 'day'],
        cooldownHours: 24,
    },
    {
        id: 'plan_item_followup',
        category: 'plan_tracking',
        templateZh: '{name}，你说的{plan_item}，今天做到了吗？',
        templateEn: '{name}, did you manage to do {plan_item} today?',
        variables: ['name', 'plan_item'],
        cooldownHours: 24,
    },

    // Anomaly Follow-up
    {
        id: 'sleep_anomaly',
        category: 'anomaly_follow',
        templateZh: '连续{n}天睡眠不足{hours}小时，是什么原因？',
        templateEn: 'Sleep under {hours}h for {n} consecutive days. What\'s happening?',
        variables: ['n', 'hours'],
        cooldownHours: 48,
    },
    {
        id: 'stress_anomaly',
        category: 'anomaly_follow',
        templateZh: '你的压力指数连续{n}天偏高，工作上有什么事吗？',
        templateEn: 'Stress levels high for {n} days. Anything going on at work?',
        variables: ['n'],
        cooldownHours: 48,
    },

    // Info Gap
    {
        id: 'energy_rhythm',
        category: 'info_gap',
        templateZh: '你一般几点开始犯困？',
        templateEn: 'What time do you usually start feeling tired?',
        variables: [],
        cooldownHours: 168, // 7 days
    },
    {
        id: 'caffeine_habit',
        category: 'info_gap',
        templateZh: '你每天大概喝多少咖啡或茶？',
        templateEn: 'How much coffee or tea do you usually drink per day?',
        variables: [],
        cooldownHours: 168,
    },

    // Deep Explore
    {
        id: 'keyword_followup',
        category: 'deep_explore',
        templateZh: '上次你提到{keyword}，现在情况有好转吗？',
        templateEn: 'You mentioned {keyword} before. Has the situation improved?',
        variables: ['keyword'],
        cooldownHours: 72,
    },

    // Status Check
    {
        id: 'morning_check',
        category: 'status_check',
        templateZh: '{name}，早安。昨晚睡得怎么样？',
        templateEn: '{name}, good morning. How did you sleep?',
        variables: ['name'],
        cooldownHours: 24,
    },
    {
        id: 'evening_check',
        category: 'status_check',
        templateZh: '{name}，今天过得怎么样？',
        templateEn: '{name}, how was your day?',
        variables: ['name'],
        cooldownHours: 24,
    },
];

// ============ Forbidden Topics ============

/**
 * Topics that should NEVER be asked about
 * (Safety-related questions are ALLOWED - handled in safety-system.ts)
 */
export const FORBIDDEN_TOPICS = [
    // Medical diagnosis
    '诊断', '确诊', 'diagnose', 'diagnosis',
    // Medication dosage
    '用药剂量', '药物剂量', '吃多少药', 'dosage', 'medication dose',
    // Prescription
    '处方', '开药', 'prescription', 'prescribe',
    // Medical advice
    '应该吃什么药', '推荐什么药', 'what medication', 'which drug',
];

/**
 * Check if a question contains forbidden topics
 */
export function containsForbiddenTopic(text: string): boolean {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_TOPICS.some(topic => lowerText.includes(topic.toLowerCase()));
}

// ============ Cooldown Logic ============

/**
 * Check if a template is in cooldown for a user
 */
export async function isInCooldown(
    userId: string,
    templateId: string
): Promise<boolean> {
    const supabase = createClient();
    const now = new Date();

    const { data } = await supabase
        .from('ai_memory')
        .select('created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'active_inquiry')
        .like('content', `%template_id:${templateId}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return false;

    const template = INQUIRY_TEMPLATES.find(t => t.id === templateId);
    if (!template) return false;

    const lastTriggered = new Date(data[0].created_at);
    const cooldownMs = template.cooldownHours * 60 * 60 * 1000;

    return now.getTime() - lastTriggered.getTime() < cooldownMs;
}

/**
 * Check if any template of a category is in cooldown
 */
export async function isCategoryInCooldown(
    userId: string,
    category: InquiryTemplate['category']
): Promise<boolean> {
    const supabase = createClient();
    const now = new Date();

    const { data } = await supabase
        .from('ai_memory')
        .select('created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'active_inquiry')
        .like('content', `%category:${category}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return false;

    // Category cooldown: 48h for anomaly/deep, 24h for others
    const cooldownHours = ['anomaly_follow', 'deep_explore'].includes(category) ? 48 : 24;
    const lastTriggered = new Date(data[0].created_at);
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    return now.getTime() - lastTriggered.getTime() < cooldownMs;
}

// ============ User Preferences ============

/**
 * Get user's active inquiry preferences
 */
export async function getUserInquiryPreferences(
    userId: string
): Promise<UserInquiryPreferences> {
    const supabase = createClient();

    const { data } = await supabase
        .from('user_assessment_preferences')
        .select('active_inquiry_paused_until, active_inquiry_frequency')
        .eq('user_id', userId)
        .single();

    const now = new Date();
    const pausedUntil = data?.active_inquiry_paused_until
        ? new Date(data.active_inquiry_paused_until)
        : undefined;

    const isPaused = pausedUntil ? now < pausedUntil : false;
    const frequency = (data?.active_inquiry_frequency as 'normal' | 'reduced' | 'off') || 'normal';

    return {
        isPaused,
        pausedUntil,
        frequency,
        cooldownMultiplier: frequency === 'reduced' ? 2 : 1,
    };
}

/**
 * Pause active inquiry for N days
 */
export async function pauseActiveInquiry(
    userId: string,
    days: number = 7
): Promise<void> {
    const supabase = createClient();

    const pausedUntil = new Date();
    pausedUntil.setDate(pausedUntil.getDate() + days);

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            active_inquiry_paused_until: pausedUntil.toISOString(),
        }, {
            onConflict: 'user_id',
        });
}

/**
 * Resume active inquiry
 */
export async function resumeActiveInquiry(userId: string): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .update({ active_inquiry_paused_until: null })
        .eq('user_id', userId);
}

/**
 * Set active inquiry frequency
 */
export async function setActiveInquiryFrequency(
    userId: string,
    frequency: 'normal' | 'reduced' | 'off'
): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            active_inquiry_frequency: frequency,
        }, {
            onConflict: 'user_id',
        });
}

// ============ Template Generation ============

/**
 * Fill template with variables
 */
export function fillTemplate(
    template: InquiryTemplate,
    variables: Record<string, string>,
    language: 'zh' | 'en' = 'zh'
): string {
    let text = language === 'en' ? template.templateEn : template.templateZh;

    for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return text;
}

/**
 * Generate an active inquiry with guardrails
 */
export async function generateGuardedInquiry(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    language: 'zh' | 'en' = 'zh'
): Promise<InquiryResult> {
    // 1. Check user preferences
    const prefs = await getUserInquiryPreferences(userId);

    if (prefs.isPaused) {
        return {
            allowed: false,
            reason: `User paused until ${prefs.pausedUntil?.toISOString()}`,
        };
    }

    if (prefs.frequency === 'off') {
        return {
            allowed: false,
            reason: 'User turned off active inquiry',
        };
    }

    // 2. Find template
    const template = INQUIRY_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        return {
            allowed: false,
            reason: `Template not found: ${templateId}`,
        };
    }

    // 3. Check cooldown (with multiplier for reduced frequency)
    const effectiveCooldown = template.cooldownHours * prefs.cooldownMultiplier;
    const inCooldown = await isInCooldown(userId, templateId);

    if (inCooldown) {
        return {
            allowed: false,
            reason: `Template in cooldown (${effectiveCooldown}h)`,
        };
    }

    // 4. Generate question
    const question = fillTemplate(template, variables, language);
    const questionZh = fillTemplate(template, variables, 'zh');

    // 5. Check forbidden topics
    if (containsForbiddenTopic(question)) {
        return {
            allowed: false,
            reason: 'Generated question contains forbidden topic',
        };
    }

    // 6. Log inquiry for cooldown tracking
    const supabase = createClient();
    await supabase.from('ai_memory').insert({
        user_id: userId,
        memory_type: 'active_inquiry',
        content: `template_id:${templateId};category:${template.category};question:${question}`,
        importance: 0.3,
    });

    return {
        allowed: true,
        question,
        questionZh,
        templateId,
    };
}

/**
 * Get next available inquiry for a user
 * Returns the first template that passes all guardrails
 */
export async function getNextAvailableInquiry(
    userId: string,
    preferredCategories: InquiryTemplate['category'][] = ['plan_tracking', 'status_check'],
    variables: Record<string, string> = {},
    language: 'zh' | 'en' = 'zh'
): Promise<InquiryResult> {
    // Check user preferences first
    const prefs = await getUserInquiryPreferences(userId);
    if (prefs.isPaused || prefs.frequency === 'off') {
        return { allowed: false, reason: 'User preference blocks inquiry' };
    }

    // Try templates in order of preferred categories
    const orderedTemplates = INQUIRY_TEMPLATES.sort((a, b) => {
        const aIndex = preferredCategories.indexOf(a.category);
        const bIndex = preferredCategories.indexOf(b.category);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    for (const template of orderedTemplates) {
        // Check if all required variables are present
        const hasAllVars = template.variables.every(v => v in variables);
        if (!hasAllVars) continue;

        // Check cooldown
        const inCooldown = await isInCooldown(userId, template.id);
        if (inCooldown) continue;

        // Generate and return
        return generateGuardedInquiry(userId, template.id, variables, language);
    }

    return { allowed: false, reason: 'No available templates' };
}

```

