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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
    CheckCircle2, Brain, ChevronRight, ChevronLeft,
    Pause, AlertTriangle, Sparkles, Clock, Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { MotionButton } from '@/components/motion/MotionButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

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
    const { t, language } = useI18n();

    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [currentPage, setCurrentPage] = useState(savedProgress?.currentPage || 0);
    const [answers, setAnswers] = useState<Record<string, number>>(savedProgress?.answers || {});
    const [direction, setDirection] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [safetyMessage, setSafetyMessage] = useState('');
    const [result, setResult] = useState<OnboardingResult | null>(null);
    const [pendingSafetyQuestion, setPendingSafetyQuestion] = useState<string | null>(null);
    const [showEncouragement, setShowEncouragement] = useState(false);
    const [showIntroInfo, setShowIntroInfo] = useState(false);

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
            setSafetyMessage(getSafetyMessage(language));
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
            setCurrentPage(prev => prev + 1);
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
                        className="relative p-10 md:p-12 items-center"
                    >
                        <div className="absolute top-6 right-6 z-50">
                            <LanguageSwitcher />
                        </div>

                        <div className="flex flex-col items-center mb-8">

                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold text-[#0B3D2E] tracking-tight mb-3">
                                {userName ? `${userName}, ` : ''}{t('welcome.welcomeTo')}
                            </h2>

                            <div className="relative inline-block text-center max-w-lg mx-auto mb-8 z-20">
                                <p className="text-emerald-800/60 text-base md:text-lg leading-relaxed px-4">
                                    {t('welcome.clinicalIntro')}
                                    <br />
                                    <span className="inline-flex items-center gap-1.5 align-middle">
                                        {t('welcome.clinicalDesc')}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowIntroInfo(!showIntroInfo); }}
                                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-800 transition-colors mt-0.5 shadow-sm"
                                        >
                                            <Info className="w-3 h-3" strokeWidth={2.5} />
                                        </button>
                                    </span>
                                </p>

                                <AnimatePresence>
                                    {showIntroInfo && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            className="absolute left-0 right-0 top-full mt-3 mx-4 pointer-events-none"
                                        >
                                            <div className="bg-white/95 backdrop-blur-xl p-5 rounded-2xl border border-emerald-100 shadow-[0_8px_40px_rgba(11,61,46,0.15)] text-left pointer-events-auto relative z-50">
                                                <button
                                                    onClick={() => setShowIntroInfo(false)}
                                                    className="absolute top-3 right-3 p-1 text-emerald-300 hover:text-emerald-600 transition-colors"
                                                >
                                                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">✕</div>
                                                </button>

                                                <h4 className="font-bold text-[#0B3D2E] text-sm mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    {t('welcome.infoTitle')}
                                                </h4>
                                                <p className="text-xs text-emerald-800/70 leading-relaxed mb-3">
                                                    {t('welcome.infoDesc')}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                                                        <span className="text-xs font-bold text-[#0B3D2E]">GAD-7</span>
                                                        <span className="text-[10px] text-emerald-600 font-medium">{t('welcome.gad7')}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                                                        <span className="text-xs font-bold text-[#0B3D2E]">PHQ-9</span>
                                                        <span className="text-[10px] text-emerald-600 font-medium">{t('welcome.phq9')}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                                                        <span className="text-xs font-bold text-[#0B3D2E]">ISI</span>
                                                        <span className="text-[10px] text-emerald-600 font-medium">{t('welcome.isi')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-center gap-4 text-sm text-emerald-800/40 mb-10">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {t('welcome.estimatedTime', { minutes: ESTIMATED_MINUTES })}
                                </span>
                                <span className="text-emerald-800/20">•</span>
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    {t('welcome.scientificScale')}
                                </span>
                            </div>
                        </div>

                        {/* Scales preview */}
                        <div className="flex justify-center gap-3 mb-10">
                            {SCALES_ORDER.map((scale, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                                    {language === 'en' ? scale.id.replace(/([A-Z]+)(\d+)/, '$1-$2') : scale.name.split('-')[0].trim()}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={startOnboarding}
                            className="w-full h-14 bg-[#0B3D2E] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#06261c] transition-colors shadow-lg shadow-emerald-900/10"
                        >
                            <span>{t('welcome.startAssessment')}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}

                {/* Questions */}
                {step === 'questions' && currentQuestions.length > 0 && (
                    <motion.div
                        key={`page-${currentPage}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-6 pt-8 md:p-8 md:pt-10 overflow-visible"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-[#0B3D2E] uppercase tracking-wider mb-1">
                                    {(() => {
                                        if (!currentQuestions || currentQuestions.length === 0) return '';
                                        const scale = SCALES_ORDER.find(s => s.id === currentQuestions[0]?.scaleId);
                                        if (!scale) return '';
                                        return language === 'en' ? scale.id.replace(/([A-Z]+)(\d+)/, '$1-$2') : scale.name.split('-')[0];
                                    })()}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-[#0B3D2E]">{t('assessment.page', { page: currentPage + 1 })}</span>
                                    <span className="text-emerald-800/40 font-medium">{t('assessment.of')} {TOTAL_PAGES}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {(() => {
                                    const scaleKey = currentQuestions[0]?.scaleId || '';
                                    const info = SCALE_INFO[scaleKey];
                                    if (!info) return null;
                                    return (
                                        <div className="group relative">
                                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>{t('assessment.clinicalVerified')}</span>
                                            </button>
                                            {/* Rich source card - positioned to avoid cutoff */}
                                            <div className="absolute right-0 top-full mt-2 w-72 md:w-80 p-4 bg-white rounded-xl shadow-2xl border border-emerald-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform -translate-x-1/4 md:translate-x-0">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#0B3D2E] text-sm">{t('assessment.proScales')}</h4>
                                                        <p className="text-xs text-emerald-800/60 leading-relaxed">
                                                            {t('assessment.standardDesc', { name: SCALES_ORDER.find(s => s.id === currentQuestions[0]?.scaleId)?.name || '' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-emerald-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-emerald-800/30 uppercase tracking-widest">{t('assessment.globalStandard')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-emerald-50 rounded-full overflow-hidden mb-6">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-600 to-[#0B3D2E]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Questions - Matrix Layout */}
                        <div className="space-y-4">
                            {/* Option Legend - Desktop only */}
                            {currentQuestions.length > 0 && currentQuestions[0]?.options && (
                                <div className="hidden md:grid grid-cols-[1fr_350px] gap-8 px-4 mb-2">
                                    <div />
                                    <div className="flex justify-between w-full px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                                        {currentQuestions[0].options.map((opt, i) => (
                                            <div key={i} className="flex-1 px-1 leading-tight" title={language === 'en' ? (opt.labelEn || opt.label) : opt.label}>
                                                {language === 'en' ? (opt.labelEn || opt.label) : opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2.5">
                                {currentQuestions.map((question, idx) => {
                                    return (
                                        <div
                                            key={question.id}
                                            className="group relative grid grid-cols-1 md:grid-cols-[1fr_350px] items-center p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-50/20 hover:bg-emerald-50 transition-colors gap-3 md:gap-8 border border-transparent hover:border-emerald-100"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-[10px] md:text-xs text-emerald-800/30 tabular-nums mt-1 font-mono">
                                                    {(pageStart + idx + 1).toString().padStart(2, '0')}
                                                </span>
                                                <p className="text-sm md:text-[15px] font-medium text-[#0B3D2E] leading-snug">
                                                    {language === 'en' ? question.textEn : question.text}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-between gap-1 w-full px-0 md:px-2">
                                                {question.options.map((option, i) => {
                                                    const isSelected = answers[question.id] === option.value;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => handleAnswer(question.id, option.value)}
                                                            className={`
                                                                flex-1 flex flex-col items-center justify-center 
                                                                min-h-[44px] md:min-h-0 md:h-10
                                                                rounded-xl transition-all duration-300 
                                                                border md:border-0
                                                                ${isSelected
                                                                    ? 'bg-[#0B3D2E] border-[#0B3D2E] shadow-sm md:bg-transparent md:shadow-none'
                                                                    : 'bg-white border-emerald-100 md:bg-transparent md:border-transparent hover:md:bg-emerald-50/50'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                w-3.5 h-3.5 md:w-3 md:h-3 rounded-full mb-1.5 md:mb-0 border-2 transition-all
                                                                ${isSelected
                                                                    ? 'bg-[#0B3D2E] border-[#0B3D2E] md:scale-[1.3] shadow-[0_0_12px_rgba(11,61,46,0.2)] ring-4 ring-emerald-900/5'
                                                                    : 'bg-white border-emerald-200 md:group-hover:border-emerald-300'}
                                                            `} />
                                                            <span className={`
                                                                md:hidden text-[9px] font-medium 
                                                                ${isSelected ? 'text-white' : 'text-emerald-700'}
                                                            `}>
                                                                {language === 'en' ? (option.labelEn || option.label) : option.label}
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
                                    className="flex-1 h-11 border border-emerald-100 text-emerald-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>{t('assessment.prevPage')}</span>
                                </button>
                            )}
                            <button
                                onClick={goToNextPage}
                                disabled={!isPageComplete}
                                className="flex-1 h-11 bg-[#0B3D2E] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#06261c] transition-colors"
                            >
                                <span>{currentPage < TOTAL_PAGES - 1 ? t('assessment.nextPage') : t('assessment.complete')}</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
