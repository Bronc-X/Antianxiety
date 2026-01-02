"use client";

/**
 * ViewAssessment - AI-Driven Clinical Assessment Flow
 * 
 * Mobile UI for the Bio-Ledger assessment powered by useAssessment hook.
 */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    ChevronLeft,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/hooks/domain/useAssessment";
import { QuestionStep, ReportStep } from "@/types/assessment";

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
};

// ============================================
// Sub-Components
// ============================================

function WelcomeScreen({ onStart, isLoading, language, onLanguageChange }: {
    onStart: () => void;
    isLoading: boolean;
    language: 'zh' | 'en';
    onLanguageChange: (lang: 'zh' | 'en') => void;
}) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={pageTransition}
            className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/30"
            >
                <Brain className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50 mb-3">
                {language === 'zh' ? '健康评估' : 'Health Assessment'}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xs mb-8">
                {language === 'zh'
                    ? 'AI驱动的个性化评估，帮助我们更好地了解您的身心状态。'
                    : 'AI-powered personalized assessment to better understand your mental and physical well-being.'}
            </p>

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                disabled={isLoading}
                className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        {language === 'zh' ? '开始评估' : 'Start Assessment'}
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </motion.button>

            <button
                onClick={() => onLanguageChange(language === 'zh' ? 'en' : 'zh')}
                className="mt-6 flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
            >
                <Globe size={16} />
                <span className="text-sm">{language === 'zh' ? 'English' : '中文'}</span>
            </button>
        </motion.div>
    );
}

function QuestionScreen({ step, onAnswer, isLoading, questionNumber, loadingContext }: {
    step: QuestionStep;
    onAnswer: (questionId: string, value: string | number) => void;
    isLoading: boolean;
    questionNumber: number;
    loadingContext?: { lastQuestion?: string; lastAnswer?: string };
}) {
    const question = step.question;

    return (
        <motion.div
            key={question.id}
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={pageTransition}
            className="pb-24"
        >
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-500">
                        Question {questionNumber}
                    </span>
                </div>
                <div className="h-1 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, questionNumber * 10)}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-6 leading-relaxed">
                {question.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
                {question.type === 'multiple_choice' && question.options?.map((option, idx) => (
                    <motion.button
                        key={option}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onAnswer(question.id, option)}
                        disabled={isLoading}
                        className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-left hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group disabled:opacity-50"
                    >
                        <span className="text-emerald-950 dark:text-emerald-50 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            {option}
                        </span>
                    </motion.button>
                ))}

                {question.type === 'slider' && (
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-stone-200 dark:border-white/10">
                        <div className="flex justify-between mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => onAnswer(question.id, val)}
                                    disabled={isLoading}
                                    className={cn(
                                        "w-8 h-8 rounded-full text-sm font-bold transition-all",
                                        "bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400",
                                        "hover:bg-emerald-500 hover:text-white",
                                        isLoading && "opacity-50"
                                    )}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-stone-400">
                            <span>{question.slider_min_label || 'Low'}</span>
                            <span>{question.slider_max_label || 'High'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Loading Context */}
            {isLoading && loadingContext?.lastAnswer && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Analyzing your response...
                        </span>
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {loadingContext.lastAnswer}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}

function ResultScreen({ step, onReset }: {
    step: ReportStep | any;
    onReset: () => void;
}) {
    // Handle both 'result' and 'report' property names
    const result = step.report || step.result || {};

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={pageTransition}
            className="pb-24"
        >
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                >
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </motion.div>
            </div>

            <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 text-center mb-4">
                Assessment Complete
            </h2>

            {/* Conditions/Summary */}
            {result.conditions && result.conditions.length > 0 && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                        Analysis Results
                    </h3>
                    {result.conditions.map((condition: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-emerald-950 dark:text-emerald-50">{condition.name}</h4>
                                {condition.probability && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                        {condition.probability}%
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-stone-600 dark:text-stone-300">{condition.description}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Next Steps */}
            {result.next_steps && result.next_steps.length > 0 && (
                <div className="space-y-2 mb-6">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                        Recommended Next Steps
                    </h3>
                    {result.next_steps.map((step: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center gap-3">
                            <span className="text-xl">{step.icon}</span>
                            <span className="text-sm text-emerald-900 dark:text-emerald-100">{step.action}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onReset}
                className="w-full py-4 bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 rounded-2xl font-medium flex items-center justify-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                Start New Assessment
            </motion.button>
        </motion.div>
    );
}

function EmergencyScreen({ onDismiss }: { onDismiss: () => void }) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={pageTransition}
            className="pb-24"
        >
            <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 text-center mb-4">
                We're Here For You
            </h2>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    Based on your responses, we recommend speaking with a professional.
                    If you're in crisis, please reach out to a crisis hotline immediately.
                </p>
            </div>

            <div className="space-y-3 mb-6">
                <a
                    href="tel:400-161-9995"
                    className="block w-full p-4 bg-emerald-600 text-white rounded-2xl text-center font-semibold"
                >
                    Call Crisis Hotline
                </a>
                <button
                    onClick={onDismiss}
                    className="w-full p-4 bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400 rounded-2xl font-medium"
                >
                    I'm feeling better now
                </button>
            </div>
        </motion.div>
    );
}

// ============================================
// Main Component
// ============================================

interface ViewAssessmentProps {
    onBack?: () => void;
}

export const ViewAssessment = ({ onBack }: ViewAssessmentProps) => {
    const {
        phase,
        currentStep,
        isLoading,
        error,
        history,
        language,
        loadingContext,
        startAssessment,
        submitAnswer,
        resetAssessment,
        dismissEmergency,
        setLanguage
    } = useAssessment();

    const renderContent = () => {
        // If loading and no current step, show loading state for questioning phases
        if (isLoading && !currentStep && phase !== 'welcome') {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-[50vh]"
                >
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-stone-500">Loading assessment...</p>
                </motion.div>
            );
        }

        // Welcome phase
        if (phase === 'welcome') {
            return (
                <WelcomeScreen
                    onStart={startAssessment}
                    isLoading={isLoading}
                    language={language}
                    onLanguageChange={setLanguage}
                />
            );
        }

        // Emergency phase
        if (phase === 'emergency' || (currentStep && 'step_type' in currentStep && currentStep.step_type === 'emergency')) {
            return <EmergencyScreen onDismiss={dismissEmergency} />;
        }

        // Report/result phase
        if (phase === 'report' || (currentStep && 'step_type' in currentStep && currentStep.step_type === 'report')) {
            if (currentStep && 'report' in currentStep) {
                return (
                    <ResultScreen
                        step={currentStep as any}
                        onReset={resetAssessment}
                    />
                );
            }
        }

        // Questioning phases (baseline, chief_complaint, differential)
        if (currentStep && 'step_type' in currentStep && currentStep.step_type === 'question') {
            return (
                <QuestionScreen
                    step={currentStep as QuestionStep}
                    onAnswer={submitAnswer}
                    isLoading={isLoading}
                    questionNumber={history.length + 1}
                    loadingContext={loadingContext}
                />
            );
        }

        // Fallback for any questioning phase
        if (['baseline', 'chief_complaint', 'differential'].includes(phase) && currentStep && 'question' in currentStep) {
            return (
                <QuestionScreen
                    step={currentStep as QuestionStep}
                    onAnswer={submitAnswer}
                    isLoading={isLoading}
                    questionNumber={history.length + 1}
                    loadingContext={loadingContext}
                />
            );
        }

        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen px-2"
        >
            {/* Header */}
            {phase !== 'welcome' && (
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={phase === 'questioning' ? resetAssessment : onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                    </button>
                    <h1 className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
                        Assessment
                    </h1>
                </div>
            )}

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </motion.div>
    );
};
