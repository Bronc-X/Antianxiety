'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { useCalibration } from '@/hooks/domain/useCalibration';

export default function DailyCalibration() {
    const { language } = useI18n();

    // MVVM Hook (The Bridge)
    const {
        step,
        questions,
        currentQuestionIndex,
        answers,
        isLoading,
        shouldShowToday,
        hasCompletedToday,
        start,
        answerQuestion,
        progressPercent,
        currentQuestion
    } = useCalibration();

    // Auto-start if should show, handled by user click usually or auto? 
    // The original UI didn't seem to have a "Start" button, it just showed questions if available.
    // The original UI initialized step=0. 
    // Let's call start() on mount if shouldShowToday and not completed.

    useEffect(() => {
        if (shouldShowToday && !hasCompletedToday && step === 'welcome') {
            start();
        }
    }, [shouldShowToday, hasCompletedToday, step, start]);

    const handleAnswer = (value: number) => {
        if (!currentQuestion) return;
        answerQuestion(currentQuestion.id, value);
    };

    // Derived UI state
    const isCompleted = hasCompletedToday || step === 'result';

    if (isLoading) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[600px] mx-auto text-center">
                    <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">
                        {language === 'en' ? 'Loading...' : '加载中...'}
                    </p>
                </div>
            </section>
        );
    }

    if (isCompleted) {
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
                        {language === 'en' ? 'Calibration Complete!' : '今日校准完成！'}
                    </h2>
                    <p className="text-white/60">
                        {language === 'en'
                            ? 'Your digital twin has been updated with today\'s data. Come back tomorrow for your next calibration.'
                            : '你的数字孪生已更新今日数据。明天再来进行下一次校准吧。'}
                    </p>
                </div>
            </section>
        );
    }

    if (!shouldShowToday) {
        return null;
    }

    if (!currentQuestion) return null;

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
                        <span>{language === 'en' ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : `第 ${currentQuestionIndex + 1} / ${questions.length} 题`}</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#D4AF37]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-white/5 border border-white/10 p-8"
                    >
                        <h3 className="text-white text-xl mb-8">{currentQuestion.text}</h3>

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

                        {currentQuestion.type === 'single' && currentQuestion.options && (
                            <div className="grid gap-3">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className={`p-4 text-left border transition-all font-medium ${answers[currentQuestion.id] === option.value
                                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                                                : 'bg-white/10 border-white/20 text-white hover:border-white/40 hover:bg-white/15'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option.label}</span>
                                            {answers[currentQuestion.id] === option.value && (
                                                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {currentQuestion.type === 'slider' && (
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => handleAnswer(answers[currentQuestion.id] || 5)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#E5C158] transition-colors"
                        >
                            {currentQuestionIndex < questions.length - 1
                                ? (language === 'en' ? 'Next' : '下一步')
                                : (language === 'en' ? 'Complete' : '完成')
                            }
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
