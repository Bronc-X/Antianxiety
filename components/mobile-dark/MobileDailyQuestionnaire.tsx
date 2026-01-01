'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useDailyQuestionnaire } from '@/hooks/domain/useDailyQuestionnaire';

// --- Shared Logic from PC (Duplicated for isolation/styling freedom) ---

const QUESTION_POOL = [
    // Sleep
    { id: 'sleep_quality', category: 'sleep', question: 'How was your sleep quality?', type: 'scale', options: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
    { id: 'wake_feeling', category: 'sleep', question: 'How did you feel waking up?', type: 'scale', options: ['Exhausted', 'Grogginess', 'Okay', 'Refreshed', 'Energized'] },
    // Energy
    { id: 'morning_energy', category: 'energy', question: 'Current energy level?', type: 'scale', options: ['Drain', 'Low', 'Moderate', 'High', 'Peak'] },
    // Stress
    { id: 'stress_level', category: 'stress', question: 'Current stress perception?', type: 'scale', options: ['Zen', 'Calm', 'Neutral', 'Stressed', 'Overwhelmed'] },
    // Body
    { id: 'body_tension', category: 'body', question: 'Any physical tension?', type: 'choice', options: ['None', 'Mild', 'Noticeable', 'Severe'] },
    // Focus
    { id: 'focus_ability', category: 'cognitive', question: 'Ability to focus right now?', type: 'scale', options: ['Scattered', 'Distracted', 'Okay', 'Sharp', 'Laser'] },
];

function getTodayQuestions(date: Date = new Date()) {
    // Simply return all for mobile demo or slice based on logic
    // Using a subset for flow
    return QUESTION_POOL.slice(0, 5);
}

interface MobileDailyQuestionnaireProps {
    userId?: string;
    onComplete?: () => void;
}

export function MobileDailyQuestionnaire({ userId, onComplete }: MobileDailyQuestionnaireProps) {
    const { completed, isLoading, isSaving, error, saveResponse } = useDailyQuestionnaire({ userId });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const questions = getTodayQuestions();
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Haptic feedback helper
    const triggerHaptic = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore on web
        }
    };

    const handleAnswer = (index: number) => {
        triggerHaptic();
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: index }));

        if (currentIndex < questions.length - 1) {
            setTimeout(() => setCurrentIndex(currentIndex + 1), 250);
        } else {
            // Last question answered
        }
    };

    const handleSubmit = async () => {
        triggerHaptic();
        const success = await saveResponse({
            responses: answers,
            questions: questions.map(q => q.id),
        });
        if (success) {
            onComplete?.();
        }
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 rounded-2xl border border-[#222222] bg-[#0A0A0A] text-center animate-pulse"
            >
                <div className="w-12 h-12 rounded-full bg-[#00FF94]/20 flex items-center justify-center mx-auto mb-4" />
                <div className="h-4 w-40 bg-[#222222] mx-auto rounded mb-2" />
                <div className="h-3 w-28 bg-[#1A1A1A] mx-auto rounded" />
            </motion.div>
        );
    }

    if (completed) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 rounded-2xl border border-[#222222] bg-[#0A0A0A] text-center"
            >
                <div className="w-12 h-12 rounded-full bg-[#00FF94]/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-[#00FF94]" />
                </div>
                <h3 className="text-white font-bold mb-2">Calibration Complete</h3>
                <p className="text-[#666666] text-xs">Your bio-twin has been updated.</p>
            </motion.div>
        );
    }

    if (questions.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-mono text-[#666666]">
                    {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1} / {questions.length < 10 ? `0${questions.length}` : questions.length}
                </span>
                <div className="flex-1 h-[2px] bg-[#222222]">
                    <motion.div
                        className="h-full bg-[#00FF94]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="min-h-[80px]">
                        <h2 className="text-xl font-bold text-white leading-tight">
                            {currentQuestion.question}
                        </h2>
                        <p className="text-[10px] font-mono text-[#007AFF] mt-2 uppercase tracking-wider">
                            CATEGORY: {currentQuestion.category}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = answers[currentQuestion.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group active:scale-[0.98] ${isSelected
                                            ? 'bg-[#00FF94] border-[#00FF94] text-black'
                                            : 'bg-[#0A0A0A] border-[#222222] text-[#CCCCCC] hover:border-[#444444]'
                                        }`}
                                >
                                    <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
                                        {option}
                                    </span>
                                    {isSelected && <Check className="w-4 h-4 text-black" />}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Submit Button (Only on last question) */}
            {currentIndex === questions.length - 1 && Object.keys(answers).length === questions.length && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                >
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full py-4 bg-[#007AFF] text-white font-bold tracking-wide uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-[#0060C9] transition-colors"
                    >
                        {isSaving ? (
                            <span className="text-xs">Processing Data...</span>
                        ) : (
                            <>
                                <span>Update Bio-Twin</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </motion.div>
            )}

            {error && (
                <div className="mt-4 text-xs text-red-400">{error}</div>
            )}
        </div>
    );
}
