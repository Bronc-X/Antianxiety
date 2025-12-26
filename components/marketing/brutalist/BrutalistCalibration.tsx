'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Moon, Activity, Brain, Heart, Zap, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BrutalistNav from './BrutalistNav';

interface Question {
    id: string;
    question: string;
    category: 'sleep' | 'energy' | 'stress' | 'body' | 'cognitive';
    options: { label: string; value: number }[];
}

const CALIBRATION_QUESTIONS: Question[] = [
    {
        id: 'sleep_quality',
        question: 'How would you rate your sleep quality last night?',
        category: 'sleep',
        options: [
            { label: 'Very Poor', value: 1 },
            { label: 'Poor', value: 2 },
            { label: 'Fair', value: 3 },
            { label: 'Good', value: 4 },
            { label: 'Excellent', value: 5 },
        ],
    },
    {
        id: 'sleep_duration',
        question: 'How many hours did you sleep?',
        category: 'sleep',
        options: [
            { label: '< 5 hrs', value: 1 },
            { label: '5-6 hrs', value: 2 },
            { label: '6-7 hrs', value: 3 },
            { label: '7-8 hrs', value: 4 },
            { label: '> 8 hrs', value: 5 },
        ],
    },
    {
        id: 'morning_energy',
        question: 'How energized do you feel this morning?',
        category: 'energy',
        options: [
            { label: 'Exhausted', value: 1 },
            { label: 'Tired', value: 2 },
            { label: 'Neutral', value: 3 },
            { label: 'Energized', value: 4 },
            { label: 'Very Energized', value: 5 },
        ],
    },
    {
        id: 'stress_level',
        question: "What's your current stress level?",
        category: 'stress',
        options: [
            { label: 'Very High', value: 5 },
            { label: 'High', value: 4 },
            { label: 'Moderate', value: 3 },
            { label: 'Low', value: 2 },
            { label: 'Very Low', value: 1 },
        ],
    },
    {
        id: 'body_soreness',
        question: 'Any muscle soreness or body tension?',
        category: 'body',
        options: [
            { label: 'Severe', value: 5 },
            { label: 'Significant', value: 4 },
            { label: 'Mild', value: 3 },
            { label: 'Minimal', value: 2 },
            { label: 'None', value: 1 },
        ],
    },
    {
        id: 'mental_clarity',
        question: 'How clear is your mind right now?',
        category: 'cognitive',
        options: [
            { label: 'Very Foggy', value: 1 },
            { label: 'Foggy', value: 2 },
            { label: 'Okay', value: 3 },
            { label: 'Clear', value: 4 },
            { label: 'Very Clear', value: 5 },
        ],
    },
];

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'sleep': return Moon;
        case 'energy': return Zap;
        case 'stress': return Brain;
        case 'body': return Heart;
        case 'cognitive': return Activity;
        default: return Activity;
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'sleep': return 'text-blue-400';
        case 'energy': return 'text-yellow-400';
        case 'stress': return 'text-purple-400';
        case 'body': return 'text-red-400';
        case 'cognitive': return 'signal-green';
        default: return 'text-white';
    }
};

interface CalibrationResult {
    score: number;
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'push';
    details: string[];
}

function calculateResult(answers: Record<string, number>): CalibrationResult {
    const sleepScore = ((answers.sleep_quality || 3) + (answers.sleep_duration || 3)) / 2;
    const energyScore = answers.morning_energy || 3;
    const stressScore = 6 - (answers.stress_level || 3);
    const bodyScore = 6 - (answers.body_soreness || 3);
    const cognitiveScore = answers.mental_clarity || 3;

    const overallScore = (sleepScore * 0.3 + energyScore * 0.2 + stressScore * 0.2 + bodyScore * 0.15 + cognitiveScore * 0.15);

    const details: string[] = [];

    if (sleepScore < 3) details.push('Sleep quality needs improvement');
    if (stressScore < 3) details.push('Elevated stress detected');
    if (bodyScore < 3) details.push('Physical recovery in progress');
    if (cognitiveScore < 3) details.push('Mental fatigue present');

    if (overallScore < 2.5) {
        return {
            score: overallScore,
            recommendation: 'Active Recovery Day',
            intensity: 'rest',
            details: details.length ? details : ['Your body needs rest to optimize recovery'],
        };
    } else if (overallScore < 3.5) {
        return {
            score: overallScore,
            recommendation: 'Light Activity Recommended',
            intensity: 'light',
            details: details.length ? details : ['Light movement will support recovery'],
        };
    } else if (overallScore < 4.2) {
        return {
            score: overallScore,
            recommendation: 'Moderate Training OK',
            intensity: 'moderate',
            details: ['Good recovery status', 'Train at 70-80% capacity'],
        };
    } else {
        return {
            score: overallScore,
            recommendation: 'Peak Performance Day',
            intensity: 'push',
            details: ['Excellent recovery signals', 'Green light for high intensity'],
        };
    }
}

export default function BrutalistCalibration() {
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [userId, setUserId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<CalibrationResult | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/brutalist/signup');
            } else {
                setUserId(user.id);
            }
        }
        checkAuth();
    }, [supabase, router]);

    const handleAnswer = (value: number) => {
        const question = CALIBRATION_QUESTIONS[currentStep];
        const newAnswers = { ...answers, [question.id]: value };
        setAnswers(newAnswers);

        if (currentStep < CALIBRATION_QUESTIONS.length - 1) {
            setTimeout(() => setCurrentStep(currentStep + 1), 300);
        } else {
            const calcResult = calculateResult(newAnswers);
            setResult(calcResult);
            saveCalibration(newAnswers, calcResult);
            setTimeout(() => setShowResult(true), 300);
        }
    };

    const saveCalibration = async (ans: Record<string, number>, res: CalibrationResult) => {
        if (!userId) return;
        setSaving(true);

        try {
            await supabase.from('daily_wellness_logs').insert({
                user_id: userId,
                log_date: new Date().toISOString().split('T')[0],
                sleep_quality: ans.sleep_quality,
                sleep_duration_minutes: (ans.sleep_duration || 3) * 90,
                morning_energy: ans.morning_energy,
                stress_level: ans.stress_level,
                body_tension: ans.body_soreness,
                mental_clarity: ans.mental_clarity,
                overall_readiness: res.score,
                ai_recommendation: res.recommendation,
            });
        } catch (err) {
            console.error('Failed to save calibration:', err);
        } finally {
            setSaving(false);
        }
    };

    const question = CALIBRATION_QUESTIONS[currentStep];
    const Icon = getCategoryIcon(question?.category);

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.back()}
                            className="p-3 border border-[#333] hover:border-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="brutalist-h3">Daily Calibration</h1>
                            <p className="text-sm text-[#888]">Your morning readiness check</p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {!showResult ? (
                            <motion.div
                                key={`q-${currentStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="brutalist-card p-8"
                            >
                                {/* Progress */}
                                <div className="flex items-center gap-2 mb-8">
                                    {CALIBRATION_QUESTIONS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 transition-all ${i < currentStep ? 'bg-[#00FF94]' : i === currentStep ? 'bg-white' : 'bg-[#333]'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Question */}
                                <div className="flex items-start gap-4 mb-8">
                                    <div className={`p-3 border border-[#333] ${getCategoryColor(question.category)}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#888] uppercase tracking-wider mb-2">
                                            {question.category.toUpperCase()} · {currentStep + 1}/{CALIBRATION_QUESTIONS.length}
                                        </p>
                                        <h2 className="brutalist-h3">{question.question}</h2>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    {question.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleAnswer(opt.value)}
                                            className="w-full p-4 border border-[#333] hover:border-white hover:bg-white/5 transition-all flex items-center justify-between group"
                                        >
                                            <span className="font-medium">{opt.label}</span>
                                            <ChevronRight className="w-4 h-4 text-[#555] group-hover:text-white transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="brutalist-card p-8"
                            >
                                {/* Score */}
                                <div className="text-center mb-8">
                                    <div className="text-6xl font-bold mb-2">
                                        {(result?.score || 0).toFixed(1)}
                                        <span className="text-2xl text-[#888]">/5</span>
                                    </div>
                                    <p className="text-sm text-[#888]">Readiness Score</p>
                                </div>

                                {/* Recommendation */}
                                <div className={`p-6 border mb-8 text-center ${result?.intensity === 'rest' ? 'border-blue-500/50 bg-blue-500/10' :
                                        result?.intensity === 'light' ? 'border-cyan-500/50 bg-cyan-500/10' :
                                            result?.intensity === 'moderate' ? 'border-yellow-500/50 bg-yellow-500/10' :
                                                'border-[#00FF94]/50 bg-[#00FF94]/10'
                                    }`}>
                                    <Check className={`w-8 h-8 mx-auto mb-3 ${result?.intensity === 'rest' ? 'text-blue-400' :
                                            result?.intensity === 'light' ? 'text-cyan-400' :
                                                result?.intensity === 'moderate' ? 'text-yellow-400' :
                                                    'signal-green'
                                        }`} />
                                    <h3 className="brutalist-h3 mb-2">{result?.recommendation}</h3>
                                    <ul className="space-y-1">
                                        {result?.details.map((d, i) => (
                                            <li key={i} className="text-sm text-[#888]">{d}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => router.push('/brutalist/dashboard')}
                                        className="brutalist-cta brutalist-cta-filled flex-1 group"
                                    >
                                        <span>View Dashboard</span>
                                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="brutalist-cta flex-1"
                                    >
                                        Done
                                    </button>
                                </div>

                                {saving && (
                                    <p className="text-center mt-4 text-xs text-[#555]">
                                        Saving locally...
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
