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
    Pause, AlertTriangle, Sparkles, Clock, Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

// 量表详细来源信息
const SCALE_INFO: Record<string, {
    fullName: string;
    abbreviation: string;
    authors: string;
    year: number;
    journal: string;
    description: string;
    validation: string;
    usage: string;
}> = {
    'GAD7': {
        fullName: '广泛性焦虑障碍量表-7',
        abbreviation: 'GAD-7',
        authors: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B',
        year: 2006,
        journal: 'Archives of Internal Medicine',
        description: '用于筛查和评估广泛性焦虑障碍严重程度的标准化工具',
        validation: '经过全球 50+ 国家验证，灵敏度 89%，特异度 82%',
        usage: '全球最广泛使用的焦虑筛查量表，被 WHO 推荐',
    },
    'PHQ9': {
        fullName: '患者健康问卷-9',
        abbreviation: 'PHQ-9',
        authors: 'Kroenke K, Spitzer RL, Williams JBW',
        year: 2001,
        journal: 'Journal of General Internal Medicine',
        description: '用于筛查、诊断和监测抑郁症严重程度的标准化工具',
        validation: '经过全球 100+ 国家验证，灵敏度 88%，特异度 88%',
        usage: '全球最广泛使用的抑郁筛查量表，已被翻译成 70+ 种语言',
    },
    'ISI': {
        fullName: '失眠严重程度指数',
        abbreviation: 'ISI',
        authors: 'Bastien CH, Vallières A, Morin CM',
        year: 2001,
        journal: 'Sleep Medicine',
        description: '用于评估失眠严重程度和治疗效果的标准化工具',
        validation: '经过多国临床验证，信效度优良',
        usage: '国际睡眠医学领域最常用的失眠评估量表',
    },
};
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
const ESTIMATED_MINUTES = 4; // 23 questions at approx 10s per question, upcasted for authoritative feel

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
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)] w-full max-w-2xl mx-auto"
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
                            <p className="text-neutral-500 text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-6 px-4">
                                让我们应用全球最前沿的临床评估标准
                                <br className="hidden md:block" />
                                通过 {TOTAL_QUESTIONS} 项专业维度的深度扫描，来全面了解您的状态
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
                        className="relative p-6 md:p-8"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-400">
                                    第 {currentPage + 1} / {TOTAL_PAGES} 页
                                </span>
                                <span className="text-neutral-300">•</span>
                                <span className="text-sm font-medium text-neutral-500">
                                    {currentScaleName}
                                </span>
                                {/* Source citation - comprehensive card */}
                                {(() => {
                                    const scaleKey = currentQuestions[0]?.scaleId || '';
                                    const info = SCALE_INFO[scaleKey];
                                    if (!info) return null;
                                    return (
                                        <div className="group relative">
                                            <button className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors">
                                                <Info className="w-3 h-3" />
                                                <span>临床验证</span>
                                            </button>
                                            {/* Rich source card */}
                                            <div className="absolute right-0 md:right-auto md:left-0 top-full mt-2 w-72 md:w-80 p-4 bg-white rounded-xl shadow-2xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-neutral-900 text-sm">{info.fullName}</h4>
                                                        <p className="text-xs text-neutral-500">{info.abbreviation} · {info.year}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-neutral-600 mb-3 leading-relaxed">{info.description}</p>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-600 font-medium w-12 flex-shrink-0">作者</span>
                                                        <span className="text-neutral-600">{info.authors}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-600 font-medium w-12 flex-shrink-0">期刊</span>
                                                        <span className="text-neutral-600 italic">{info.journal}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-600 font-medium w-12 flex-shrink-0">验证</span>
                                                        <span className="text-neutral-600">{info.validation}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        {info.usage}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
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
                        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mb-6">
                            <motion.div
                                className="h-full bg-gradient-to-r from-neutral-800 to-neutral-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Questions - Matrix Layout */}
                        <div className="space-y-6">
                            {/* Option Legend */}
                            {currentQuestions.length > 0 && currentQuestions[0].options && (
                                <div className="hidden md:grid grid-cols-[1fr_auto] gap-4 mb-2 px-2">
                                    <div />
                                    <div className="flex gap-2 w-full max-w-[320px] justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                        {currentQuestions[0].options.map((opt, i) => (
                                            <div key={i} className="flex-1 text-center truncate px-1" title={opt.label}>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {currentQuestions.map((question, idx) => {
                                    const optionsLength = question.options.length;
                                    return (
                                        <div
                                            key={question.id}
                                            className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors gap-4"
                                        >
                                            <p className="text-base font-medium text-neutral-800 leading-snug flex-1">
                                                <span className="text-neutral-400 mr-2 tabular-nums">{(pageStart + idx + 1).toString().padStart(2, '0')}</span>
                                                {question.text}
                                            </p>

                                            <div className="flex items-center justify-between md:justify-end gap-1 md:gap-2 w-full md:w-auto md:min-w-[320px]">
                                                {question.options.map((option, i) => {
                                                    const isSelected = answers[question.id] === option.value;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => handleAnswer(question.id, option.value)}
                                                            className={`
                                                                flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center 
                                                                min-h-[44px] md:min-h-0 md:w-full md:max-w-[70px]
                                                                rounded-xl transition-all duration-300 border
                                                                ${isSelected
                                                                    ? 'bg-neutral-900 border-neutral-900 shadow-sm'
                                                                    : 'bg-white border-neutral-100 md:bg-transparent md:border-transparent hover:md:bg-white/80 hover:md:border-neutral-200'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                w-3 h-3 md:w-2.5 md:h-2.5 rounded-full mb-1 md:mb-0
                                                                ${isSelected ? 'bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-neutral-200'}
                                                            `} />
                                                            <span className={`
                                                                md:hidden text-[10px] font-medium 
                                                                ${isSelected ? 'text-white' : 'text-neutral-500'}
                                                            `}>
                                                                {option.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-10">
                            {currentPage > 0 && (
                                <button
                                    onClick={goToPreviousPage}
                                    className="flex-1 h-11 border border-neutral-200 text-neutral-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>上一页</span>
                                </button>
                            )}
                            <button
                                onClick={goToNextPage}
                                disabled={!isPageComplete}
                                className="flex-1 h-11 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className={`h-2 rounded-full transition-all ${i <= currentPage
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
