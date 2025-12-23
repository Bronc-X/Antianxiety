'use client';

/**
 * ClinicalOnboarding Component
 * 
 * Clinical scales-based onboarding using:
 * - GAD-7 (7 questions, anxiety)
 * - PHQ-9 (9 questions, depression with Q9 safety)
 * - ISI (7 questions, insomnia)
 * 
 * Total: 23 questions, paged (3-4 per page)
 * 
 * Features:
 * - Progress save/resume
 * - Skip tracking with reason
 * - PHQ-9 Q9 safety branch
 * - Premium Apple-inspired design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Brain, ChevronRight, ChevronLeft,
    Pause, AlertTriangle, Sparkles, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import {
    GAD7,
    PHQ9,
    ISI,
    checkSafetyTrigger,
    getSafetyMessage,
    logSafetyEvent,
} from '@/lib/clinical-scales';
import type { ScaleQuestion, ScaleDefinition } from '@/lib/clinical-scales';

// ============ Types ============

interface ClinicalOnboardingProps {
    userId: string;
    userName?: string;
    onComplete?: (result: OnboardingResult) => void;
    onPause?: (progress: OnboardingProgress) => void;
    savedProgress?: OnboardingProgress;
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

interface OnboardingProgress {
    answers: Record<string, number>;
    currentPage: number;
    savedAt: string;
}

type OnboardingStep = 'welcome' | 'questions' | 'encouragement' | 'safety' | 'analyzing' | 'result';

// ============ Scale Configuration ============

const SCALES_ORDER: ScaleDefinition[] = [GAD7, PHQ9, ISI];
const QUESTIONS_PER_PAGE = 4;

// Encouragement pages - show after specific pages
const ENCOURAGEMENT_PAGES = [2, 4]; // Show after page 2 and page 4 (0-indexed)

// Flatten all questions with scale info
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
const ESTIMATED_MINUTES = Math.ceil(TOTAL_QUESTIONS / 3);

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
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 }),
};

// ============ Component ============

export function ClinicalOnboarding({
    userId,
    userName,
    onComplete,
    onPause,
    savedProgress,
}: ClinicalOnboardingProps) {
    const supabase = createClient();

    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [currentPage, setCurrentPage] = useState(savedProgress?.currentPage || 0);
    const [answers, setAnswers] = useState<Record<string, number>>(savedProgress?.answers || {});
    const [direction, setDirection] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [safetyMessage, setSafetyMessage] = useState('');
    const [result, setResult] = useState<OnboardingResult | null>(null);
    const [pendingSafetyQuestion, setPendingSafetyQuestion] = useState<string | null>(null);
    const [showEncouragement, setShowEncouragement] = useState(false);

    // Get questions for current page
    const pageStart = currentPage * QUESTIONS_PER_PAGE;
    const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE, TOTAL_QUESTIONS);
    const currentQuestions = ALL_QUESTIONS.slice(pageStart, pageEnd);

    // Progress
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / TOTAL_QUESTIONS) * 100;
    const currentScaleName = currentQuestions[0]?.scaleName || '';

    // Check if current page is complete
    const isPageComplete = currentQuestions.every(q => q.id in answers);

    // Load saved progress
    useEffect(() => {
        if (savedProgress) {
            setAnswers(savedProgress.answers);
            setCurrentPage(savedProgress.currentPage);
            setStep('questions');
        }
    }, [savedProgress]);

    // Handle answer
    const handleAnswer = useCallback(async (questionId: string, value: number) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        // Check for safety trigger (PHQ-9 Q9)
        if (checkSafetyTrigger(questionId, value)) {
            await logSafetyEvent(userId, questionId, value);
            setSafetyMessage(getSafetyMessage('zh'));
            setPendingSafetyQuestion(questionId);
            setStep('safety');
        }
    }, [answers, userId]);

    // Continue after safety message
    const continueAfterSafety = useCallback(() => {
        setPendingSafetyQuestion(null);
        setStep('questions');
    }, []);

    // Go to next page
    const goToNextPage = useCallback(() => {
        if (currentPage < TOTAL_PAGES - 1) {
            setDirection(1);
            
            // Check if we should show encouragement after this page
            if (ENCOURAGEMENT_PAGES.includes(currentPage)) {
                setShowEncouragement(true);
                setStep('encouragement');
            } else {
                setCurrentPage(prev => prev + 1);
            }
        } else {
            // All pages complete
            completeOnboarding();
        }
    }, [currentPage]);

    // Continue from encouragement
    const continueFromEncouragement = useCallback(() => {
        setShowEncouragement(false);
        setStep('questions');
        setCurrentPage(prev => prev + 1);
    }, []);

    // Go to previous page
    const goToPreviousPage = useCallback(() => {
        if (currentPage > 0) {
            setDirection(-1);
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    // Complete onboarding
    const completeOnboarding = useCallback(async () => {
        setStep('analyzing');
        setIsLoading(true);

        try {
            // Calculate scores for each scale
            const gad7Score = SCALES_ORDER[0].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );
            const phq9Score = SCALES_ORDER[1].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );
            const isiScore = SCALES_ORDER[2].questions.reduce(
                (sum, q) => sum + (answers[q.id] || 0), 0
            );

            // Get interpretations
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

            // Check if safety was triggered
            const safetyTriggered = Object.entries(answers).some(
                ([qId, v]) => checkSafetyTrigger(qId, v)
            );

            // Save all responses to database
            const now = new Date().toISOString();
            const records = Object.entries(answers).map(([questionId, answerValue]) => {
                const q = ALL_QUESTIONS.find(x => x.id === questionId);
                return {
                    user_id: userId,
                    scale_id: q?.scaleId || 'UNKNOWN',
                    question_id: questionId,
                    answer_value: answerValue,
                    source: 'onboarding',
                    created_at: now,
                };
            });

            await supabase.from('user_scale_responses').insert(records);

            // Update profile with inferred scores AND metabolic_profile
            // CRITICAL: metabolic_profile must be set for landing page redirect check
            await supabase
                .from('profiles')
                .update({
                    inferred_scale_scores: {
                        GAD7: { score: gad7Score, interpretation: interpretations.anxiety, updatedAt: now },
                        PHQ9: { score: phq9Score, interpretation: interpretations.depression, updatedAt: now },
                        ISI: { score: isiScore, interpretation: interpretations.insomnia, updatedAt: now },
                    },
                    metabolic_profile: {
                        completed: true,
                        completedAt: now,
                        gad7Score,
                        phq9Score,
                        isiScore,
                        interpretations,
                    },
                })
                .eq('id', userId);

            // Trigger refresh
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });

            const resultData: OnboardingResult = {
                gad7Score,
                phq9Score,
                isiScore,
                safetyTriggered,
                interpretations,
            };

            // Short delay for animation
            setTimeout(() => {
                setResult(resultData);
                setStep('result');
                if (onComplete) onComplete(resultData);
            }, 2000);
        } catch (error) {
            console.error('Onboarding failed:', error);
            setStep('result');
        } finally {
            setIsLoading(false);
        }
    }, [answers, userId, supabase, onComplete]);

    // Pause and save progress
    const handlePause = useCallback(() => {
        const progress: OnboardingProgress = {
            answers,
            currentPage,
            savedAt: new Date().toISOString(),
        };

        localStorage.setItem(`onboarding_progress_${userId}`, JSON.stringify(progress));

        if (onPause) onPause(progress);
    }, [answers, currentPage, userId, onPause]);

    // Start onboarding
    const startOnboarding = useCallback(() => {
        setStep('questions');
    }, []);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)] max-w-2xl mx-auto"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 via-transparent to-neutral-100/30 pointer-events-none" />

            <AnimatePresence mode="wait" custom={direction}>
                {/* Welcome */}
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
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center shadow-2xl"
                            >
                                <Brain className="w-9 h-9 text-white" strokeWidth={1.5} />
                            </motion.div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}欢迎来到 AntiAnxiety
                            </h2>
                            <p className="text-neutral-500 text-base md:text-lg max-w-sm mx-auto leading-relaxed mb-6">
                                让我们通过 {TOTAL_QUESTIONS} 个问题，更好地了解你的状态
                            </p>

                            <div className="flex items-center justify-center gap-4 text-sm text-neutral-400 mb-10">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    约 {ESTIMATED_MINUTES} 分钟
                                </span>
                                <span className="text-neutral-300">•</span>
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    科学量表
                                </span>
                            </div>
                        </div>

                        {/* Scales preview */}
                        <div className="flex justify-center gap-3 mb-10">
                            {SCALES_ORDER.map((scale, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                                    {scale.name.split('-')[0].trim()}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={startOnboarding}
                            className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                        >
                            <span>开始评估</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}

                {/* Questions */}
                {step === 'questions' && (
                    <motion.div
                        key={`page-${currentPage}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-8 md:p-10"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <span className="text-sm font-medium text-neutral-400">
                                    第 {currentPage + 1} / {TOTAL_PAGES} 页
                                </span>
                                <span className="mx-2 text-neutral-300">•</span>
                                <span className="text-sm font-medium text-neutral-500">
                                    {currentScaleName}
                                </span>
                            </div>
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
                            >
                                <Pause className="w-4 h-4" />
                                <span>暂停</span>
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-8">
                            <motion.div
                                className="h-full bg-gradient-to-r from-neutral-800 to-neutral-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Questions */}
                        <div className="space-y-8">
                            {currentQuestions.map((question, idx) => (
                                <div key={question.id} className="space-y-4">
                                    <p className="text-lg font-medium text-neutral-900">
                                        {pageStart + idx + 1}. {question.text}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {question.options.map((option) => {
                                            const isSelected = answers[question.id] === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleAnswer(question.id, option.value)}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-neutral-900 text-white'
                                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-10">
                            {currentPage > 0 && (
                                <button
                                    onClick={goToPreviousPage}
                                    className="flex-1 h-12 border border-neutral-200 text-neutral-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>上一页</span>
                                </button>
                            )}
                            <button
                                onClick={goToNextPage}
                                disabled={!isPageComplete}
                                className="flex-1 h-12 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{currentPage < TOTAL_PAGES - 1 ? '下一页' : '完成'}</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Encouragement */}
                {step === 'encouragement' && (
                    <motion.div
                        key="encouragement"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12 text-center"
                    >
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl"
                            >
                                <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                                {currentPage === 2 ? '做得很好！' : '快完成了！'}
                            </h3>
                            <p className="text-neutral-500 text-lg mb-6">
                                {currentPage === 2 
                                    ? '你已经完成了一半，继续保持！' 
                                    : '只剩最后几个问题了，坚持住！'
                                }
                            </p>

                            {/* Progress visualization */}
                            <div className="flex justify-center gap-2 mb-8">
                                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 rounded-full transition-all ${
                                            i <= currentPage 
                                                ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-500' 
                                                : 'w-2 bg-neutral-200'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8">
                                <p className="text-sm text-neutral-700 leading-relaxed">
                                    {currentPage === 2 
                                        ? '你的每一个回答都在帮助 Max 更好地了解你，为你定制最适合的健康方案。' 
                                        : 'Max 已经开始为你准备个性化建议了，马上就能看到你的健康画像！'
                                    }
                                </p>
                            </div>
                        </motion.div>

                        <button
                            onClick={continueFromEncouragement}
                            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span>继续</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
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
                        custom={direction}
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

                {/* Analyzing */}
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
                        <div className="flex justify-center mb-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-16 h-16 rounded-full border-4 border-neutral-200 border-t-neutral-800"
                            />
                        </div>

                        <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                            正在分析你的回答...
                        </h3>
                        <p className="text-neutral-500">
                            Max 正在为你生成个性化建议
                        </p>
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
                        custom={direction}
                        className="relative p-10 md:p-12"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
                                评估完成
                            </h2>
                            <p className="text-neutral-500">
                                以下是你的初始健康画像
                            </p>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-900 mb-1">
                                    {result.gad7Score}
                                </div>
                                <div className="text-xs text-neutral-500 mb-2">焦虑</div>
                                <div className="text-sm font-medium text-neutral-700">
                                    {result.interpretations.anxiety}
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-900 mb-1">
                                    {result.phq9Score}
                                </div>
                                <div className="text-xs text-neutral-500 mb-2">情绪</div>
                                <div className="text-sm font-medium text-neutral-700">
                                    {result.interpretations.depression}
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-900 mb-1">
                                    {result.isiScore}
                                </div>
                                <div className="text-xs text-neutral-500 mb-2">睡眠</div>
                                <div className="text-sm font-medium text-neutral-700">
                                    {result.interpretations.insomnia}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-neutral-400 text-center">
                            Max 会根据这些数据为你定制专属计划
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
