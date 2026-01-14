"use client";

/**
 * ViewCalibration - Complete Mobile Calibration Component
 * 
 * Full-featured daily calibration flow with:
 * - Step-based flow: Welcome → Questions → Analyzing → Result
 * - Glass morphism design consistent with iOS 26
 * - Haptic feedback integration
 * - Adaptive frequency support
 * - Progress tracking
 * - Calibration history (useCalibrationLog)
 * - Weekly/Monthly scale calibration (useScaleCalibration)
 * 
 * Properly integrates with useCalibration, useCalibrationLog, useScaleCalibration hooks
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Moon,
    Zap,
    Heart,
    Activity,
    Smile,
    RefreshCw,
    Check,
    ChevronLeft,
    ChevronRight,
    Calendar,
    TrendingUp,
    TrendingDown,
    Sparkles,
    Play,
    Loader2,
    History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalibration } from "@/hooks/domain/useCalibration";
import { useCalibrationLog, type CalibrationData } from "@/hooks/domain/useCalibrationLog";
import { useHaptics, ImpactStyle } from "@/hooks/useHaptics";
import type { DailyCalibrationResult } from "@/lib/assessment";

// ============================================
// Types
// ============================================

type CalibrationHistoryEntry = CalibrationData & { mood_score?: number | null };
type CalibrationResult = DailyCalibrationResult & {
    insights?: string[];
    trend?: "improving" | "stable" | "worsening";
    message?: string;
};

interface ViewCalibrationProps {
    onNavigate?: (view: string) => void;
    onBack?: () => void;
    onComplete?: () => void;
}

const ANALYZING_MESSAGES = [
    "正在分析您的数据...",
    "更新您的健康画像...",
    "生成个性化建议...",
    "优化 AI 模型参数...",
];

// ============================================
// Animation Variants
// ============================================

const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 }
};

const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, y: -30, scale: 0.95 }
};

const pulseVariants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

// ============================================
// Glass Card Component
// ============================================

function GlassCard({
    children,
    className,
    gradient = false
}: {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}) {
    return (
        <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                "relative overflow-hidden rounded-3xl",
                gradient
                    ? "bg-gradient-to-br from-emerald-500/90 via-teal-500/90 to-cyan-500/90"
                    : "bg-white/80 dark:bg-white/10 backdrop-blur-xl",
                "border border-white/40 dark:border-white/20",
                "shadow-lg shadow-stone-200/50 dark:shadow-none",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// Progress Bar Component
// ============================================

function ProgressBar({ percent, label }: { percent: number; label?: string }) {
    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-stone-500 dark:text-stone-400">{label}</span>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{Math.round(percent)}%</span>
                </div>
            )}
            <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
            </div>
        </div>
    );
}

// ============================================
// Slider Question Component
// ============================================

function SliderQuestion({
    question,
    value,
    onChange,
    min = 0,
    max = 10,
}: {
    question: { id: string; text: string; description?: string; icon?: string };
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}) {
    const { impact } = useHaptics();
    const [localValue, setLocalValue] = useState(value || Math.round((max - min) / 2));

    // Get icon based on question type
    const getIcon = () => {
        const iconMap: Record<string, React.ReactNode> = {
            sleep: <Moon className="w-6 h-6" />,
            energy: <Zap className="w-6 h-6" />,
            stress: <Brain className="w-6 h-6" />,
            anxiety: <Heart className="w-6 h-6" />,
            mood: <Smile className="w-6 h-6" />,
            activity: <Activity className="w-6 h-6" />,
        };
        const key = question.id.toLowerCase();
        return iconMap[key] || <Sparkles className="w-6 h-6" />;
    };

    // Get color based on value
    const getColor = () => {
        const ratio = (localValue - min) / (max - min);
        if (ratio < 0.33) return "from-red-500 to-orange-500";
        if (ratio < 0.66) return "from-amber-500 to-yellow-500";
        return "from-emerald-500 to-teal-500";
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        setLocalValue(newValue);
        await impact(ImpactStyle.Light);
    };

    const handleRelease = () => {
        onChange(localValue);
    };

    // Emoji feedback based on value
    const getEmoji = () => {
        const ratio = (localValue - min) / (max - min);
        if (ratio < 0.25) return "😔";
        if (ratio < 0.5) return "😐";
        if (ratio < 0.75) return "🙂";
        return "😊";
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                    "p-3 rounded-2xl",
                    "bg-gradient-to-br", getColor(),
                    "text-white shadow-lg"
                )}>
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-white">
                        {question.text}
                    </h3>
                    {question.description && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                            {question.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Value Display */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl">{getEmoji()}</span>
                <div className="text-center">
                    <span className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {localValue}
                    </span>
                    <span className="text-2xl text-stone-400">/{max}</span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative pt-2 pb-6">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localValue}
                    onChange={handleChange}
                    onMouseUp={handleRelease}
                    onTouchEnd={handleRelease}
                    className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${((localValue - min) / (max - min)) * 100}%, #e5e7eb ${((localValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`
                    }}
                />

                {/* Scale Labels */}
                <div className="flex justify-between mt-3 text-xs text-stone-400">
                    <span>低</span>
                    <span>中</span>
                    <span>高</span>
                </div>
            </div>
        </GlassCard>
    );
}

// ============================================
// Welcome Step Component
// ============================================

function WelcomeStep({
    onStart,
    hasCompletedToday,
    frequency,
    frequencyReason,
    onResetFrequency,
    isRestoringFrequency,
    onShowHistory,
    historyCount,
}: {
    onStart: () => void;
    hasCompletedToday: boolean;
    frequency: 'daily' | 'every_other_day';
    frequencyReason?: string;
    onResetFrequency: () => void;
    isRestoringFrequency: boolean;
    onShowHistory?: () => void;
    historyCount?: number;
}) {
    const { impact } = useHaptics();

    const handleStart = async () => {
        await impact(ImpactStyle.Medium);
        onStart();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
            {/* Animated Icon */}
            <motion.div
                variants={pulseVariants}
                initial="initial"
                animate="animate"
                className="mb-8"
            >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
                    <Brain className="w-16 h-16 text-white" />
                </div>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-stone-800 dark:text-white mb-3 text-center"
            >
                {hasCompletedToday ? "今日已完成" : "每日校准"}
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-stone-500 dark:text-stone-400 text-center mb-8 max-w-xs"
            >
                {hasCompletedToday
                    ? "您今天已经完成了校准，明天再来吧！"
                    : "花一分钟记录您的状态，帮助 AI 更好地了解您"
                }
            </motion.p>

            {/* History Quick Access */}
            {historyCount !== undefined && historyCount > 0 && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShowHistory}
                    className="mb-6 px-4 py-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/20 flex items-center gap-3"
                >
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-stone-800 dark:text-white">查看校准历史</p>
                        <p className="text-xs text-stone-500">最近 {historyCount} 条记录</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 ml-2" />
                </motion.button>
            )}

            {/* Frequency Info */}
            {frequency === 'every_other_day' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-200 dark:border-amber-700"
                >
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                隔日校准模式
                            </p>
                            {frequencyReason && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    {frequencyReason}
                                </p>
                            )}
                            <button
                                onClick={onResetFrequency}
                                disabled={isRestoringFrequency}
                                className="text-xs text-amber-700 dark:text-amber-300 underline mt-2 flex items-center gap-1"
                            >
                                {isRestoringFrequency && <Loader2 className="w-3 h-3 animate-spin" />}
                                恢复每日校准
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Start Button */}
            {!hasCompletedToday && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStart}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-shadow"
                >
                    <Play className="w-5 h-5" />
                    开始校准
                </motion.button>
            )}
        </div>
    );
}

// ============================================
// Calibration History Component
// ============================================

function CalibrationHistoryView({
    onBack
}: {
    onBack: () => void;
}) {
    const { history, loadHistory, isLoading } = useCalibrationLog();
    const { impact } = useHaptics();

    useEffect(() => {
        loadHistory(30); // Load last 30 days
    }, [loadHistory]);

    const handleBack = async () => {
        await impact(ImpactStyle.Light);
        onBack();
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl px-4 py-4 border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <h1 className="text-lg font-bold text-stone-800 dark:text-white">校准历史</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                        <p className="text-stone-500">暂无校准记录</p>
                    </div>
                ) : (
                    history.map((entry, idx) => (
                        <motion.div
                            key={entry.log_date || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-4 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/20"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-stone-800 dark:text-white">
                                    {entry.log_date ? new Date(entry.log_date).toLocaleDateString('zh-CN', {
                                        month: 'short',
                                        day: 'numeric',
                                        weekday: 'short'
                                    }) : '未知日期'}
                                </span>
                                {(() => {
                                    const moodScore = (entry as CalibrationHistoryEntry).mood_score;
                                    if (typeof moodScore !== "number") return null;
                                    const moodIcon = moodScore >= 4 ? "😊" : moodScore >= 3 ? "🙂" : moodScore >= 2 ? "😐" : "😔";
                                    return <span className="text-lg">{moodIcon}</span>;
                                })()}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-xs text-stone-500">能量</p>
                                    <p className="text-lg font-bold text-emerald-600">{entry.energy_level ?? '--'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">压力</p>
                                    <p className="text-lg font-bold text-amber-600">{entry.stress_level ?? '--'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">焦虑</p>
                                    <p className="text-lg font-bold text-rose-600">{entry.anxiety_level ?? '--'}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// Questions Step Component
// ============================================

function QuestionsStep({
    questions,
    currentIndex,
    answers,
    onAnswer,
    progressPercent,
    onBack,
}: {
    questions: Array<{ id: string; text: string; description?: string }>;
    currentIndex: number;
    answers: Record<string, number>;
    onAnswer: (questionId: string, value: number) => void;
    progressPercent: number;
    onBack?: () => void;
}) {
    const { impact } = useHaptics();
    const currentQuestion = questions[currentIndex];
    const [pendingValue, setPendingValue] = useState<number | null>(null);

    if (!currentQuestion) return null;

    const handleNext = async () => {
        if (pendingValue !== null) {
            await impact(ImpactStyle.Medium);
            onAnswer(currentQuestion.id, pendingValue);
            setPendingValue(null);
        }
    };

    const canProceed = pendingValue !== null || answers[currentQuestion.id] !== undefined;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with Progress */}
            <div className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl px-4 py-4 border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                        {currentIndex + 1} / {questions.length}
                    </span>
                    <div className="w-9" /> {/* Spacer */}
                </div>
                <ProgressBar percent={progressPercent} />
            </div>

            {/* Question Content */}
            <div className="flex-1 p-4 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    >
                        <SliderQuestion
                            question={currentQuestion}
                            value={answers[currentQuestion.id] ?? 5}
                            onChange={(value) => {
                                setPendingValue(value);
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Next Button */}
            <div className="p-4 pb-8">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all",
                        canProceed
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-stone-200 dark:bg-stone-800 text-stone-400"
                    )}
                >
                    {currentIndex < questions.length - 1 ? (
                        <>
                            下一题
                            <ChevronRight className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            完成
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

// ============================================
// Analyzing Step Component
// ============================================

function AnalyzingStep() {
    const [messageIndex, setMessageIndex] = useState(0);
    const messageCount = ANALYZING_MESSAGES.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messageCount);
        }, 1500);
        return () => clearInterval(interval);
    }, [messageCount]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
            {/* Animated Brain */}
            <motion.div
                animate={{
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-8"
            >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Brain className="w-12 h-12 text-white" />
                </div>
            </motion.div>

            {/* Loading Text */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-medium text-stone-700 dark:text-stone-300 text-center"
                >
                    {ANALYZING_MESSAGES[messageIndex]}
                </motion.p>
            </AnimatePresence>

            {/* Spinner */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="mt-8"
            >
                <RefreshCw className="w-8 h-8 text-purple-500" />
            </motion.div>
        </div>
    );
}

// ============================================
// Result Step Component
// ============================================

function ResultStep({
    result,
    onDone,
    onNavigate,
}: {
    result: CalibrationResult | null;
    onDone?: () => void;
    onNavigate?: (view: string) => void;
}) {
    const { notification } = useHaptics();

    useEffect(() => {
        notification('success');
    }, [notification]);

    // Extract insights from result
    const insights = result?.insights || [];
    const trend = result?.trend || 'stable';
    const message = result?.message || '数据已保存，继续保持！';

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex flex-col">
            {/* Success Animation */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        <Check className="w-14 h-14 text-emerald-500" />
                    </motion.div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-3 text-center"
                >
                    校准完成！
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/80 text-center mb-8 max-w-xs"
                >
                    {message}
                </motion.p>

                {/* Trend Indicator */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur rounded-2xl mb-8"
                >
                    {trend === 'up' ? (
                        <TrendingUp className="w-6 h-6 text-white" />
                    ) : trend === 'down' ? (
                        <TrendingDown className="w-6 h-6 text-white" />
                    ) : (
                        <Activity className="w-6 h-6 text-white" />
                    )}
                    <span className="text-white font-medium">
                        {trend === 'up' ? '状态上升' : trend === 'down' ? '需要关注' : '保持稳定'}
                    </span>
                </motion.div>

                {/* Insights */}
                {insights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="w-full max-w-sm space-y-3"
                    >
                        {insights.slice(0, 3).map((insight: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur rounded-xl"
                            >
                                <Sparkles className="w-5 h-5 text-white/80 mt-0.5" />
                                <p className="text-sm text-white/90">{insight}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-4 pb-8">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDone || (() => onNavigate?.('dashboard'))}
                    className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-semibold shadow-lg"
                >
                    完成
                </motion.button>
            </div>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export const ViewCalibration = ({ onNavigate, onBack, onComplete }: ViewCalibrationProps) => {
    const {
        step,
        questions,
        currentQuestionIndex,
        answers,
        result,
        isLoading,
        frequency,
        frequencyReason,
        hasCompletedToday,
        isRestoringFrequency,
        start,
        answerQuestion,
        resetFrequency,
        progressPercent,
    } = useCalibration();

    const { history: calibrationHistory, loadHistory } = useCalibrationLog();
    const [showHistory, setShowHistory] = useState(false);

    // Load history on mount to get count
    useEffect(() => {
        loadHistory(7); // Load last 7 days for count preview
    }, [loadHistory]);

    // Render history view
    if (showHistory) {
        return <CalibrationHistoryView onBack={() => setShowHistory(false)} />;
    }

    // Render based on step
    const renderStep = () => {
        switch (step) {
            case 'welcome':
                return (
                    <WelcomeStep
                        onStart={start}
                        hasCompletedToday={hasCompletedToday}
                        frequency={frequency}
                        frequencyReason={frequencyReason}
                        onResetFrequency={resetFrequency}
                        isRestoringFrequency={isRestoringFrequency}
                        onShowHistory={() => setShowHistory(true)}
                        historyCount={calibrationHistory.length}
                    />
                );
            case 'questions':
                return (
                    <QuestionsStep
                        questions={questions}
                        currentIndex={currentQuestionIndex}
                        answers={answers}
                        onAnswer={answerQuestion}
                        progressPercent={progressPercent}
                        onBack={onBack}
                    />
                );
            case 'analyzing':
                return <AnalyzingStep />;
            case 'result':
                return (
                    <ResultStep
                        result={result}
                        onDone={onComplete}
                        onNavigate={onNavigate}
                    />
                );
            default:
                return null;
        }
    };

    if (isLoading && step === 'welcome') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                    <RefreshCw className="w-8 h-8 text-emerald-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className={cn(
                "min-h-screen",
                step === 'result'
                    ? ""
                    : "bg-stone-50 dark:bg-stone-950"
            )}
        >
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </motion.div>
    );
};

export default ViewCalibration;
