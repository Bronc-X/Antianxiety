'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, ArrowRight, Activity, Brain, Moon } from 'lucide-react';

interface QuickQuestion {
    id: string;
    question: string;
    options: { label: string; value: number }[];
}

const QUICK_QUESTIONS: QuickQuestion[] = [
    {
        id: 'sleep',
        question: 'How did you sleep last night?',
        options: [
            { label: 'Terrible', value: 1 },
            { label: 'Poor', value: 2 },
            { label: 'Okay', value: 3 },
            { label: 'Good', value: 4 },
            { label: 'Excellent', value: 5 },
        ],
    },
    {
        id: 'energy',
        question: "What's your energy level right now?",
        options: [
            { label: 'Exhausted', value: 1 },
            { label: 'Low', value: 2 },
            { label: 'Moderate', value: 3 },
            { label: 'High', value: 4 },
            { label: 'Energized', value: 5 },
        ],
    },
    {
        id: 'stress',
        question: 'How stressed are you feeling?',
        options: [
            { label: 'Very Stressed', value: 5 },
            { label: 'Stressed', value: 4 },
            { label: 'Moderate', value: 3 },
            { label: 'Calm', value: 2 },
            { label: 'Very Calm', value: 1 },
        ],
    },
];

interface DemoResult {
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'push';
    explanation: string;
}

function calculateRecommendation(answers: Record<string, number>): DemoResult {
    const sleep = answers.sleep || 3;
    const energy = answers.energy || 3;
    const stress = answers.stress || 3;

    const recoveryScore = (sleep * 2 + energy * 1.5 + (6 - stress) * 1.5) / 5;

    if (recoveryScore < 2) {
        return {
            recommendation: 'Rest Day',
            intensity: 'rest',
            explanation: 'Your recovery signals indicate you need rest. Pushing through today would only increase cortisol and delay adaptation.',
        };
    } else if (recoveryScore < 3) {
        return {
            recommendation: 'Light Activity',
            intensity: 'light',
            explanation: 'Your body is recovering. A gentle walk or stretching would support recovery without adding stress.',
        };
    } else if (recoveryScore < 4) {
        return {
            recommendation: 'Moderate Training',
            intensity: 'moderate',
            explanation: 'Good recovery status. You can train at 70-80% capacity today.',
        };
    } else {
        return {
            recommendation: 'Peak Day',
            intensity: 'push',
            explanation: 'Excellent recovery signals! This is a green light day—push harder, set PRs.',
        };
    }
}

export default function BrutalistDemoSection() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<DemoResult | null>(null);

    const handleAnswer = (value: number) => {
        const question = QUICK_QUESTIONS[currentStep];
        const newAnswers = { ...answers, [question.id]: value };
        setAnswers(newAnswers);

        if (currentStep < QUICK_QUESTIONS.length - 1) {
            setTimeout(() => setCurrentStep(currentStep + 1), 300);
        } else {
            const recommendation = calculateRecommendation(newAnswers);
            setResult(recommendation);
            setTimeout(() => setShowResult(true), 300);
        }
    };

    const resetDemo = () => {
        setCurrentStep(0);
        setAnswers({});
        setShowResult(false);
        setResult(null);
    };

    const getIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'rest': return 'text-blue-400 border-blue-400/50';
            case 'light': return 'text-cyan-400 border-cyan-400/50';
            case 'moderate': return 'text-yellow-400 border-yellow-400/50';
            case 'push': return 'signal-green signal-green-border';
            default: return 'text-white';
        }
    };

    return (
        <section className="brutalist-section">
            <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12 text-center"
                >
                    <span className="brutalist-body uppercase tracking-[0.3em] text-[#888] mb-4 block">
                        Try It Now
                    </span>
                    <h2 className="brutalist-h2 mb-4">
                        30-Second
                        <br />
                        <span className="signal-green">Demo.</span>
                    </h2>
                    <p className="brutalist-body-lg max-w-xl mx-auto">
                        Answer 3 quick questions. See how Bayesian calibration works in real-time.
                    </p>
                </motion.div>

                {/* Demo Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="brutalist-card p-8 md:p-12"
                >
                    <AnimatePresence mode="wait">
                        {!showResult ? (
                            <motion.div
                                key={`question-${currentStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Progress */}
                                <div className="flex items-center gap-3 mb-8">
                                    {QUICK_QUESTIONS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 transition-all duration-300 ${i < currentStep
                                                    ? 'bg-[#00FF94]'
                                                    : i === currentStep
                                                        ? 'bg-white'
                                                        : 'bg-[#333]'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Question */}
                                <div className="flex items-start gap-4 mb-8">
                                    <div className="p-3 border border-[#222]">
                                        {currentStep === 0 && <Moon className="w-5 h-5 text-blue-400" />}
                                        {currentStep === 1 && <Activity className="w-5 h-5 text-yellow-400" />}
                                        {currentStep === 2 && <Brain className="w-5 h-5 text-purple-400" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#888] uppercase tracking-wider mb-2">
                                            Question {currentStep + 1} of {QUICK_QUESTIONS.length}
                                        </p>
                                        <h3 className="brutalist-h3">
                                            {QUICK_QUESTIONS[currentStep].question}
                                        </h3>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {QUICK_QUESTIONS[currentStep].options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleAnswer(option.value)}
                                            className="p-4 border border-[#333] hover:border-white hover:bg-white/5 transition-all text-center group"
                                        >
                                            <span className="block text-sm font-medium group-hover:text-white transition-colors">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center"
                            >
                                {/* Result Badge */}
                                <div className={`inline-flex items-center gap-3 px-6 py-3 border mb-8 ${getIntensityColor(result?.intensity || '')}`}>
                                    <Check className="w-5 h-5" />
                                    <span className="text-lg font-bold uppercase tracking-wider">
                                        {result?.recommendation}
                                    </span>
                                </div>

                                {/* Explanation */}
                                <p className="brutalist-body-lg max-w-lg mx-auto mb-8">
                                    {result?.explanation}
                                </p>

                                {/* Visual Indicator */}
                                <div className="flex items-center justify-center gap-4 mb-12">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${result?.intensity === 'rest' ? 'bg-blue-400' : 'bg-[#333]'}`} />
                                        <span className="text-xs text-[#888]">Rest</span>
                                    </div>
                                    <div className="w-16 h-px bg-[#333]" />
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${result?.intensity === 'light' ? 'bg-cyan-400' : 'bg-[#333]'}`} />
                                        <span className="text-xs text-[#888]">Light</span>
                                    </div>
                                    <div className="w-16 h-px bg-[#333]" />
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${result?.intensity === 'moderate' ? 'bg-yellow-400' : 'bg-[#333]'}`} />
                                        <span className="text-xs text-[#888]">Moderate</span>
                                    </div>
                                    <div className="w-16 h-px bg-[#333]" />
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${result?.intensity === 'push' ? 'bg-[#00FF94]' : 'bg-[#333]'}`} />
                                        <span className="text-xs text-[#888]">Push</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <button
                                        onClick={resetDemo}
                                        className="brutalist-cta"
                                    >
                                        Try Again
                                    </button>
                                    <a
                                        href="/brutalist/signup"
                                        className="brutalist-cta brutalist-cta-filled group"
                                    >
                                        <span>Get Full Calibration</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Trust Indicator */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center mt-8 text-xs text-[#555]"
                >
                    This demo runs 100% in your browser. No data is collected.
                </motion.p>
            </div>
        </section>
    );
}
