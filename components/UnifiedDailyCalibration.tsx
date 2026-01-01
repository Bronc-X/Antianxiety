'use client';

/**
 * UnifiedDailyCalibration Component
 * 
 * Premium Apple-inspired design with:
 * - SF Pro typography feel
 * - Glass morphism effects
 * - Subtle micro-animations
 * - Clean minimal layout
 * - Precise spacing system
 * 
 * Design Principle: "用真相打破焦虑" - Simple, focused, one entry point
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, ChevronRight, Info, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { DailyCalibrationResult } from '@/lib/assessment';
import { useCalibration } from '@/hooks/domain/useCalibration';

// ============ Types ============

interface UnifiedDailyCalibrationProps {
    userId?: string;
    userName?: string; // Optional if using hook
    onComplete?: (result: DailyCalibrationResult) => void;
}

// ============ Apple-style Animation Variants ============

const easeApple = [0.25, 0.46, 0.45, 0.94] as any;

const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: easeApple
        }
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.3 }
    }
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: easeApple
        }
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -100 : 100,
        opacity: 0,
        transition: { duration: 0.3 }
    })
};

// ============ Component ============

export function UnifiedDailyCalibration({
    userId,
    userName,
    onComplete,
}: UnifiedDailyCalibrationProps) {
    const { t, language } = useI18n();

    // Connect to Domain Hook (ViewModel)
    const {
        step,
        questions,
        currentQuestionIndex,
        answers,
        result,
        isLoading,
        frequency,
        frequencyReason,
        shouldShowToday,
        hasCompletedToday,
        isRestoringFrequency,
        start,
        answerQuestion,
        resetFrequency,
        progressPercent,
        currentQuestion
    } = useCalibration(userId);

    // UI State for animations
    const [direction, setDirection] = useState(1);
    const [showFrequencyTooltip, setShowFrequencyTooltip] = useState(false);

    // Trigger onComplete when result is ready
    useEffect(() => {
        if (step === 'result' && result && onComplete) {
            onComplete(result);
        }
    }, [step, result, onComplete]);

    // Handle Answer Wrapper to manage animation direction
    const handleAnswerUI = (questionId: string, value: number) => {
        setDirection(1);
        answerQuestion(questionId, value);
    };

    // ============ Render: Already Completed or Not Today ============
    if (hasCompletedToday || !shouldShowToday) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
            >
                <div className="p-8 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                            {hasCompletedToday
                                ? (language === 'en' ? 'Calibration Complete' : '今日校准已完成')
                                : (language === 'en' ? 'Rest Day' : '今天休息')}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {hasCompletedToday
                                ? (language === 'en' ? 'See you tomorrow for your next check-in.' : '明天再来继续追踪你的状态')
                                : (language === 'en' ? 'Next check-in tomorrow.' : '明天再来校准')}
                        </p>
                    </div>
                    {/* Restore button for reduced frequency */}
                    {!hasCompletedToday && frequency === 'every_other_day' && (
                        <button
                            onClick={() => resetFrequency()}
                            disabled={isRestoringFrequency}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                            {isRestoringFrequency ? '...' : (language === 'en' ? 'Do it anyway' : '我要校准')}
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // ============ Render: Main Component ============
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.04] shadow-[0_8px_60px_rgba(0,0,0,0.06)]"
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 via-transparent to-neutral-100/30 pointer-events-none" />

            <AnimatePresence mode="wait" custom={direction}>
                {/* ============ Welcome Step ============ */}
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
                        {/* Icon */}
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5, ease: easeApple }}
                                className="relative"
                            >
                                <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center shadow-2xl shadow-neutral-900/20">
                                    <Sparkles className="w-9 h-9 text-white" strokeWidth={1.5} />
                                </div>
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-neutral-900 to-neutral-800 blur-xl opacity-30 -z-10" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
                                {userName ? `${userName}，` : ''}{language === 'en' ? 'Daily Calibration' : '每日校准'}
                            </h2>
                            <p className="text-neutral-500 text-base md:text-lg max-w-sm mx-auto leading-relaxed">
                                {language === 'en'
                                    ? 'Quick check-in to help Max understand you better.'
                                    : '简单问卷，帮助 Max 更好地了解你'}
                            </p>

                            {/* Frequency Badge */}
                            {frequency === 'every_other_day' && (
                                <div className="mt-4 inline-flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                        {language === 'en' ? 'Reduced Frequency' : '已降低频率'}
                                    </span>
                                    <button
                                        onClick={() => setShowFrequencyTooltip(!showFrequencyTooltip)}
                                        className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors"
                                    >
                                        <Info className="w-3 h-3 text-neutral-600" />
                                    </button>
                                </div>
                            )}

                            {/* Frequency Tooltip */}
                            <AnimatePresence>
                                {showFrequencyTooltip && frequency === 'every_other_day' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="mt-3 p-4 bg-neutral-900 text-white text-sm rounded-xl max-w-xs mx-auto"
                                    >
                                        <p className="mb-3">
                                            {frequencyReason === 'stable_7d'
                                                ? (language === 'en'
                                                    ? 'Your condition has been stable for 7 days, so we reduced the frequency.'
                                                    : '你的状态已稳定 7 天，我们自动降低了频率。')
                                                : (language === 'en'
                                                    ? 'Frequency was reduced based on your settings.'
                                                    : '频率已根据你的设置降低。')}
                                        </p>
                                        <button
                                            onClick={() => {
                                                resetFrequency();
                                                setShowFrequencyTooltip(false);
                                            }}
                                            disabled={isRestoringFrequency}
                                            className="w-full py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isRestoringFrequency ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4" />
                                                    <span>{language === 'en' ? 'Restore Daily' : '恢复每日'}</span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Focus area pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-center gap-2 mt-8 mb-10"
                        >
                            {(language === 'en' ? ['Anxiety', 'Sleep', 'Stress'] : ['焦虑', '睡眠', '压力']).map((label) => (
                                <span key={label} className="px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                                    {label}
                                </span>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={() => start()}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    <span>{language === 'en' ? 'Begin' : '开始校准'}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                )}

                {/* ============ Questions Step ============ */}
                {step === 'questions' && currentQuestion && (
                    <motion.div
                        key={`question-${currentQuestionIndex}`}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        custom={direction}
                        className="relative p-10 md:p-12"
                    >
                        {/* Progress Bar */}
                        <div className="mb-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-neutral-400">
                                    {currentQuestionIndex + 1} / {questions.length}
                                </span>
                                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    {currentQuestion.category === 'anxiety' && (language === 'en' ? 'Anxiety' : '焦虑')}
                                    {currentQuestion.category === 'sleep' && (language === 'en' ? 'Sleep' : '睡眠')}
                                    {currentQuestion.category === 'stress' && (language === 'en' ? 'Stress' : '压力')}
                                    {currentQuestion.category === 'ai_pick' && 'AI'}
                                </span>
                            </div>
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-neutral-900 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.4, ease: easeApple }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight mb-8 leading-snug">
                            {currentQuestion.text}
                        </h3>

                        {/* Options */}
                        {currentQuestion.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleAnswerUI(currentQuestion.id, option.value)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-200 ${answers[currentQuestion.id] === option.value
                                            ? 'border-neutral-900 bg-neutral-900 text-white'
                                            : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-900'
                                            }`}
                                    >
                                        <span className="font-medium">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Slider Input */}
                        {currentQuestion.type === 'slider' && (
                            <div className="mt-6">
                                <div className="relative pt-8 pb-4">
                                    <input
                                        type="range"
                                        min={currentQuestion.min || 0}
                                        max={currentQuestion.max || 10}
                                        value={answers[currentQuestion.id] as number || currentQuestion.min || 0}
                                        onChange={(e) => handleAnswerUI(currentQuestion.id, parseInt(e.target.value))}
                                        className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer slider-apple"
                                    />
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                                        <span className="text-3xl font-semibold text-neutral-900">
                                            {answers[currentQuestion.id] ?? (currentQuestion.min || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-neutral-400 font-medium">
                                    <span>{currentQuestion.min || 0}</span>
                                    <span>{currentQuestion.max || 10}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ============ Analyzing Step ============ */}
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
                        <div className="py-12">
                            {/* Pulsing rings */}
                            <div className="relative w-24 h-24 mx-auto mb-10">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border-2 border-neutral-900"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{
                                            scale: [0.5, 1.5],
                                            opacity: [0.8, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.6,
                                            ease: 'easeOut'
                                        }}
                                    />
                                ))}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center">
                                        <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                                {language === 'en' ? 'Analyzing...' : '正在分析...'}
                            </h3>
                            <p className="text-neutral-500">
                                {language === 'en' ? 'Max is cross-analyzing your health data' : 'Max 正在交叉分析你的健康数据'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ============ Result Step ============ */}
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
                        {/* Success Icon */}
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                            </motion.div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                                {language === 'en' ? 'Check-in saved' : '已记录'}
                            </h3>
                            <p className="text-neutral-500">
                                {language === 'en'
                                    ? 'Thanks for sharing. We\'ll keep it light and only check in when helpful.'
                                    : '谢谢你分享，已记录今日状态。如有需要，我们会轻轻提醒。'}
                            </p>
                        </div>

                        {/* Daily Index & Frequency Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-neutral-900 mb-1">
                                    {result.dailyIndex}
                                </div>
                                <div className="text-xs text-neutral-500">
                                    {language === 'en' ? 'Daily Index' : '今日指数'}
                                </div>
                            </div>
                            <div className="bg-neutral-50 rounded-2xl p-4 text-center">
                                <div className="text-lg font-semibold text-neutral-900 mb-1">
                                    {result.stability?.recommendation === 'every_other_day'
                                        ? (language === 'en' ? 'Every other day' : '隔日')
                                        : (language === 'en' ? 'Daily' : '每日')}
                                </div>
                                <div className="text-xs text-neutral-500">
                                    {language === 'en' ? 'Suggested Frequency' : '建议频率'}
                                </div>
                            </div>
                        </div>

                        {/* Red Flag Alert */}
                        {result.stability?.hasRedFlag && (
                            <div className="p-4 bg-rose-50 rounded-2xl text-sm text-rose-700 mb-4">
                                {language === 'en'
                                    ? `A few signals may need attention: ${result.stability.redFlagReasons.join(' / ')}`
                                    : `有些状态值得留意：${result.stability.redFlagReasons.join(' / ')}`}
                            </div>
                        )}

                        {/* Full Scale Trigger */}
                        {result.triggerFullScale && (
                            <div className="p-4 bg-amber-50 rounded-2xl text-sm text-amber-700">
                                {language === 'en'
                                    ? 'If you\'d like, we can do a fuller check for better clarity.'
                                    : '如果你愿意，可以做一组更完整的问卷，帮助更准确了解状态。'}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom slider styles */}
            <style jsx>{`
        .slider-apple::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .slider-apple::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider-apple::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
        </motion.div>
    );
}

export default UnifiedDailyCalibration;
