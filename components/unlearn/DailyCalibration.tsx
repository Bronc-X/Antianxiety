'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sun, Moon, Battery, Brain, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';

interface CalibrationQuestion {
    id: string;
    type: 'slider' | 'options' | 'text';
    question: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
}

export default function DailyCalibration() {
    const { language } = useI18n();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    const questions: CalibrationQuestion[] = [
        {
            id: 'sleep_quality',
            type: 'slider',
            question: language === 'en' ? 'How was your sleep quality last night?' : '你昨晚的睡眠质量如何？',
            min: 1,
            max: 10,
        },
        {
            id: 'energy_level',
            type: 'slider',
            question: language === 'en' ? 'What is your current energy level?' : '你现在的精力水平如何？',
            min: 1,
            max: 10,
        },
        {
            id: 'stress_level',
            type: 'options',
            question: language === 'en' ? 'How stressed do you feel today?' : '你今天感觉压力大吗？',
            options: [
                { label: language === 'en' ? 'Not at all' : '完全没有', value: 'none' },
                { label: language === 'en' ? 'A little' : '有一点', value: 'low' },
                { label: language === 'en' ? 'Moderate' : '中等', value: 'medium' },
                { label: language === 'en' ? 'High' : '很高', value: 'high' },
            ],
        },
        {
            id: 'mood',
            type: 'options',
            question: language === 'en' ? 'How would you describe your mood?' : '你现在的心情怎么样？',
            options: [
                { label: '😊 ' + (language === 'en' ? 'Great' : '很好'), value: 'great' },
                { label: '🙂 ' + (language === 'en' ? 'Good' : '不错'), value: 'good' },
                { label: '😐 ' + (language === 'en' ? 'Neutral' : '一般'), value: 'neutral' },
                { label: '😔 ' + (language === 'en' ? 'Low' : '低落'), value: 'low' },
            ],
        },
    ];

    const currentQuestion = questions[step];
    const progress = ((step + 1) / questions.length) * 100;

    const handleAnswer = (value: string | number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    };

    const handleNext = async () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Submit calibration
            setSubmitting(true);
            try {
                await fetch('/api/assessment/daily-calibration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ responses: answers }),
                });
                setCompleted(true);
            } catch (error) {
                console.error('Failed to submit calibration:', error);
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (completed) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[600px] mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-[#D4AF37] flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-10 h-10 text-[#0B3D2E]" />
                    </motion.div>
                    <h2 className="text-white text-2xl font-bold mb-4">
                        {language === 'en' ? 'Calibration Complete!' : '校准完成！'}
                    </h2>
                    <p className="text-white/60 mb-8">
                        {language === 'en'
                            ? 'Your digital twin has been updated with today\'s data. Max will use this to personalize your recommendations.'
                            : '你的数字孪生已更新今日数据。Max 将使用这些数据来个性化你的建议。'}
                    </p>
                    <button
                        onClick={() => {
                            setCompleted(false);
                            setStep(0);
                            setAnswers({});
                        }}
                        className="px-6 py-3 border border-white/20 text-white hover:bg-white/5 transition-colors"
                    >
                        {language === 'en' ? 'Start New Calibration' : '开始新的校准'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[600px] mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-sm uppercase tracking-widest font-medium mb-2 text-[#D4AF37]">
                        {language === 'en' ? 'Daily Calibration' : '每日校准'}
                    </p>
                    <h2 className="text-white text-2xl font-bold">
                        {language === 'en' ? 'How are you feeling today?' : '你今天感觉怎么样？'}
                    </h2>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-white/40 mb-2">
                        <span>{language === 'en' ? `Question ${step + 1} of ${questions.length}` : `第 ${step + 1} / ${questions.length} 题`}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#D4AF37]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-white/5 border border-white/10 p-8"
                    >
                        <h3 className="text-white text-xl mb-8">{currentQuestion.question}</h3>

                        {currentQuestion.type === 'slider' && (
                            <div className="space-y-6">
                                <input
                                    type="range"
                                    min={currentQuestion.min}
                                    max={currentQuestion.max}
                                    value={answers[currentQuestion.id] || 5}
                                    onChange={(e) => handleAnswer(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                                        [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-sm text-white/40">
                                    <span>{currentQuestion.min}</span>
                                    <span className="text-[#D4AF37] text-2xl font-bold">{answers[currentQuestion.id] || 5}</span>
                                    <span>{currentQuestion.max}</span>
                                </div>
                            </div>
                        )}

                        {currentQuestion.type === 'options' && currentQuestion.options && (
                            <div className="grid gap-3">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className={`p-4 text-left border transition-all ${answers[currentQuestion.id] === option.value
                                                ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white'
                                                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        className="px-6 py-3 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {language === 'en' ? 'Back' : '上一步'}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={submitting || !answers[currentQuestion.id]}
                        className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {step < questions.length - 1
                                    ? (language === 'en' ? 'Next' : '下一步')
                                    : (language === 'en' ? 'Complete' : '完成')
                                }
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
