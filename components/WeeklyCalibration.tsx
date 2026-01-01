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
import { getPSS4Questions } from '@/lib/clinical-scales';
import { useProfileMaintenance } from '@/hooks/domain/useProfileMaintenance';
import { useScaleCalibration } from '@/hooks/domain/useScaleCalibration';

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
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
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
    userId: _userId,
    userName,
    onComplete,
    onSkip,
}: WeeklyCalibrationProps) {
    const { isSaving, error, saveWeekly } = useScaleCalibration();

    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const { refresh } = useProfileMaintenance();

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
        try {
            // Calculate PSS-4 score
            const pss4Score = Object.values(answers).reduce((sum, v) => sum + v, 0);

            // Determine stress level (PSS-4 max is 16)
            let stressLevel: 'low' | 'moderate' | 'high';
            if (pss4Score <= 5) stressLevel = 'low';
            else if (pss4Score <= 10) stressLevel = 'moderate';
            else stressLevel = 'high';

            const responseDate = new Date().toISOString().split('T')[0];
            const saved = await saveWeekly({
                answers,
                evolutionAnswer: value,
                responseDate,
            });
            if (!saved) return;

            // Trigger refresh
            refresh().catch(() => {});

            const result: WeeklyCalibrationResult = {
                pss4Score,
                stressLevel,
                evolutionAnswer: value,
            };

            setStep('result');
            if (onComplete) onComplete(result);
        } catch (error) {
            console.error('Weekly calibration failed:', error);
        }
    }, [answers, onComplete, refresh, saveWeekly]);

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
            className={`relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)] ${isSaving ? 'animate-pulse' : ''}`}
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
                                    disabled={isSaving}
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
            {error && (
                <div className="px-10 pb-8 text-sm text-red-600">{error}</div>
            )}
        </motion.div>
    );
}
