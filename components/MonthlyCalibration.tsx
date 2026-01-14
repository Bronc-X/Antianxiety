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
import {
    GAD7,
    PHQ9,
    PSS10,
    checkSafetyTrigger,
    getSafetyMessage,
    logSafetyEvent,
} from '@/lib/clinical-scales';
import type { ScaleDefinition } from '@/lib/clinical-scales';
import { useProfileMaintenance } from '@/hooks/domain/useProfileMaintenance';
import { useScaleCalibration } from '@/hooks/domain/useScaleCalibration';

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
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
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
    PSS10: { from: 'from-[#0B3D2E]', to: 'to-emerald-800' },
    GAD7: { from: 'from-emerald-600', to: 'to-teal-700' },
    PHQ9: { from: 'from-emerald-700', to: 'to-[#0B3D2E]' },
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
    const { refresh: refreshProfile } = useProfileMaintenance();
    const { isSaving, error, saveMonthly } = useScaleCalibration();

    const scale = SCALE_MAP[scaleType];
    const colors = SCALE_COLORS[scaleType] || SCALE_COLORS.PSS10;

    const [step, setStep] = useState<CalibrationStep>('welcome');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        savedProgress?.currentIndex || 0
    );
    const [answers, setAnswers] = useState<Record<string, number>>(
        savedProgress?.answers || {}
    );
    const [safetyMessage, setSafetyMessage] = useState<string>('');
    const [result, setResult] = useState<MonthlyCalibrationResult | null>(null);

    const questions = scale.questions;
    const estimatedMinutes = Math.ceil(questions.length / 2);

    // Load saved progress
    useEffect(() => {
        if (savedProgress && savedProgress.scaleId === scaleType) {
            const timer = setTimeout(() => {
                setAnswers(savedProgress.answers);
                setCurrentQuestionIndex(savedProgress.currentIndex);
                setStep('questions');
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [savedProgress, scaleType]);

    // Start calibration
    const startCalibration = useCallback(() => {
        setStep('questions');
    }, []);

    // Complete assessment
    const completeAssessment = useCallback(async (finalAnswers: Record<string, number>) => {
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

            const responseDate = new Date().toISOString().split('T')[0];
            const saved = await saveMonthly({
                scaleId: scaleType,
                answers: finalAnswers,
                totalScore,
                interpretation,
                responseDate,
            });
            if (!saved) return;

            // Trigger refresh
            refreshProfile().catch(() => {});

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
        }
    }, [scale, scaleType, onComplete, refreshProfile, saveMonthly]);

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
    }, [answers, currentQuestionIndex, questions.length, userId, completeAssessment]);

    // Continue after safety message
    const continueAfterSafety = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setStep('questions');
        } else {
            completeAssessment(answers);
        }
    }, [currentQuestionIndex, questions.length, answers, completeAssessment]);

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
            className={`relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)] ${isSaving ? 'animate-pulse' : ''}`}
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
                            <h2 className="text-2xl md:text-3xl font-semibold text-[#0B3D2E] tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}月度评估
                            </h2>
                            <p className="text-emerald-800/60 text-base md:text-lg max-w-sm mx-auto leading-relaxed">
                                {scale.name} · {questions.length} 个问题 · 约 {estimatedMinutes} 分钟
                            </p>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button
                                onClick={() => handleSkip('busy')}
                                className="flex-1 h-14 border border-emerald-100 text-emerald-700 rounded-2xl font-medium hover:bg-emerald-50"
                            >
                                稍后再做
                            </button>
                            <button
                                onClick={startCalibration}
                                className="flex-1 h-14 bg-[#0B3D2E] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#06261c] transition-colors shadow-lg shadow-emerald-900/10"
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
                            <span className="text-sm font-medium text-emerald-800/40">
                                {currentQuestionIndex + 1} / {questions.length}
                            </span>
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 text-sm text-emerald-700 hover:text-[#0B3D2E]"
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
                        <p className="text-sm text-emerald-800/40 mb-3">{scale.description}</p>
                        <h3 className="text-xl md:text-2xl font-medium text-[#0B3D2E] mb-8 leading-relaxed">
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
                                    disabled={isSaving}
                                    className={`w-full p-5 text-left rounded-2xl border border-emerald-100/60 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all disabled:opacity-50`}
                                >
                                    <span className="text-base font-medium text-[#0B3D2E]">
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
                            <div className="text-4xl font-bold text-[#0B3D2E] mb-2">
                                {result.totalScore}
                            </div>
                            <div className="text-sm text-neutral-500">
                                总分 (满分 {scale.scoring.maxScore})
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {error && (
                <div className="px-10 pb-8 text-sm text-red-600">{error}</div>
            )}
        </motion.div>
    );
}
