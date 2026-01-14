/**
 * ViewOnboarding - Clinical Assessment Wizard
 * 
 * Multi-step wizard for GAD-7, PHQ-9, and ISI assessments.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    type LucideIcon,
    ChevronLeft,
    Check,
    Brain,
    Activity,
    Moon,
    ArrowRight,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicalOnboarding } from '@/hooks/domain/useClinicalOnboarding';
import { useProfile } from '@/hooks/domain/useProfile';
import { CardGlass } from '@/components/mobile/HealthWidgets';
import type { ClinicalAssessmentResult } from '@/app/actions/onboarding';

// ============================================
// Props
// ============================================

interface ViewOnboardingProps {
    onComplete?: () => void;
}

// ============================================
// Main Component
// ============================================

export const ViewOnboarding = ({ onComplete }: ViewOnboardingProps) => {
    const { profile } = useProfile();

    // Pass onComplete to hook so it gets called when result is ready
    const {
        step,
        currentQuestions,
        currentScaleName,
        progressPercent,
        answers,
        handleAnswer,
        nextPage,
        prevPage,
        start,
        continueFromEncouragement,
        continueAfterSafety,
        safetyMessage,
        result,
        isPageComplete
    } = useClinicalOnboarding(profile?.id || 'guest', () => {
        if (onComplete) onComplete();
    });

    // Render Steps
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 'welcome' && (
                    <StepWelcome key="welcome" onStart={start} />
                )}
                {step === 'questions' && (
                    <StepQuestions
                        key="questions"
                        questions={currentQuestions}
                        scaleName={currentScaleName}
                        answers={answers}
                        onAnswer={handleAnswer}
                        onNext={nextPage}
                        onPrev={prevPage}
                        canNext={isPageComplete}
                        progress={progressPercent}
                    />
                )}
                {step === 'encouragement' && (
                    <StepEncouragement key="encouragement" onContinue={continueFromEncouragement} />
                )}
                {step === 'safety' && (
                    <StepSafety key="safety" message={safetyMessage} onContinue={continueAfterSafety} />
                )}
                {step === 'analyzing' && (
                    <StepAnalyzing key="analyzing" />
                )}
                {step === 'result' && result && (
                    <StepResult key="result" result={result} onFinish={onComplete} />
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// Sub-Components (Steps)
// ============================================

function StepWelcome({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10">
                <Brain size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Let&apos;s personalize your plan
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs leading-relaxed">
                Take a quick 2-minute assessment to help us understand your anxiety, mood, and sleep patterns.
            </p>
            <button
                onClick={onStart}
                className="w-full max-w-sm h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                Start Assessment <ArrowRight />
            </button>
        </motion.div>
    );
}

interface QuestionOption {
    label: string;
    value: number;
}

interface QuestionItem {
    id: string;
    text: string;
    options: QuestionOption[];
}

interface StepQuestionsProps {
    questions: QuestionItem[];
    scaleName: string;
    answers: Record<string, number>;
    onAnswer: (questionId: string, value: number) => void | Promise<void>;
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
    progress: number;
}

function StepQuestions({
    questions,
    scaleName,
    answers,
    onAnswer,
    onNext,
    onPrev,
    canNext,
    progress
}: StepQuestionsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full h-full overflow-hidden"
        >
            {/* Progress */}
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden flex-shrink-0">
                <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="mb-3 flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {scaleName}
                </span>
            </div>

            {/* Questions - scrollable area */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-2">
                {questions.map((q) => (
                    <div key={q.id} className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                            {q.text}
                        </h3>
                        <div className="space-y-1.5">
                            {q.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => onAnswer(q.id, opt.value)}
                                    className={cn(
                                        "w-full p-3 rounded-xl text-left border-2 transition-all flex items-center justify-between group",
                                        answers[q.id] === opt.value
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100"
                                            : "border-transparent bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 active:bg-slate-50 dark:active:bg-white/10"
                                    )}
                                >
                                    <span className="font-medium text-xs">{opt.label}</span>
                                    {answers[q.id] === opt.value && (
                                        <Check size={16} className="text-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions - sticky to bottom within container */}
            <div className="flex-shrink-0 pt-3 pb-2 bg-gradient-to-t from-indigo-50 via-indigo-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 flex items-center justify-between">
                <button
                    onClick={onPrev}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={onNext}
                    disabled={!canNext}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-30 transition-all active:scale-95 shadow-lg"
                >
                    Next
                </button>
            </div>
        </motion.div>
    );
}


function StepEncouragement({ onContinue }: { onContinue: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Check size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Great job!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
                You&apos;re making great progress. Keep going, just a few more questions.
            </p>
            <button
                onClick={onContinue}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
                Continue
            </button>
        </motion.div>
    );
}

function StepSafety({ message, onContinue }: { message: string; onContinue: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center z-50 bg-rose-50 dark:bg-rose-950/30"
        >
            <ShieldAlert size={60} className="text-rose-500 mb-6" />
            <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300 mb-4">Safety Check</h2>
            <CardGlass className="p-6 mb-8 text-left bg-white/50 border-rose-200 dark:border-rose-800">
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {message}
                </p>
            </CardGlass>
            <button
                onClick={onContinue}
                className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all active:scale-95"
            >
                I Understand, Continue
            </button>
        </motion.div>
    );
}

function StepAnalyzing() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">
                Analyzing your responses...
            </h3>
        </div>
    );
}

function StepResult({ result, onFinish }: { result: ClinicalAssessmentResult; onFinish?: () => void }) {
    const { onboardingResult } = result;
    const { gad7Score, phq9Score, isiScore, interpretations } = onboardingResult;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col p-6 overflow-y-auto pb-24"
        >
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
                Your Personal Insights
            </h2>

            <div className="grid gap-4">
                <ResultCard
                    title="Anxiety Level"
                    score={gad7Score}
                    label={interpretations.anxiety}
                    icon={Activity}
                    color="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                />
                <ResultCard
                    title="Mood Score"
                    score={phq9Score}
                    label={interpretations.depression}
                    icon={Brain}
                    color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                />
                <ResultCard
                    title="Sleep Quality"
                    score={isiScore}
                    label={interpretations.insomnia}
                    icon={Moon}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                />
            </div>

            <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Recommended Plan</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Based on your results, we&apos;ve generated a personalized daily plan to help improve your sleep and reduce anxiety levels gradually.
                </p>
            </div>

            <button
                onClick={onFinish}
                className="mt-8 w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                View My Plan <ArrowRight size={20} />
            </button>
        </motion.div>
    );
}

interface ResultCardProps {
    title: string;
    score: number;
    label: string;
    icon: LucideIcon;
    color: string;
}

function ResultCard({ title, score, label, icon: Icon, color }: ResultCardProps) {
    return (
        <CardGlass className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{title}</h4>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {label}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{score}</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Score</p>
            </div>
        </CardGlass>
    );
}
