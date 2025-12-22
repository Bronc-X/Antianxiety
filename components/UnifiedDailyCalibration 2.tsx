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
import { CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
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

    // Check if already completed today
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `calibration_${userId}_${today}`;
        const completed = localStorage.getItem(storageKey);
        if (completed) {
            setHasCompletedToday(true);
        }
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

    // ============ Render: Already Completed ============
    if (hasCompletedToday) {
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
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                            {language === 'en' ? 'Calibration Complete' : '今日校准已完成'}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {language === 'en' ? 'See you tomorrow for your next check-in.' : '明天再来继续追踪你的状态'}
                        </p>
                    </div>
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
