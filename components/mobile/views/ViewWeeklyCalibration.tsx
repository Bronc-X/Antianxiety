"use client";

/**
 * ViewWeeklyCalibration - Weekly Stress Review (PSS-4)
 * Enhanced with Liquid Glass v2.0 micro-interactions
 * 
 * Features:
 * - Spring physics for natural motion
 * - Shimmer effects on glass surfaces  
 * - Haptic feedback patterns
 * - Specular glass highlights
 * - Ripple button effects
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
    ChevronLeft,
    Check,
    Loader2,
    CalendarDays,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScaleCalibration } from "@/hooks/domain/useScaleCalibration";
import { useHaptics, ImpactStyle } from "@/hooks/useHaptics";
import { springConfigs } from "@/lib/styles/liquid-glass";

// ============================================
// Types & Constants
// ============================================

interface ViewWeeklyCalibrationProps {
    onBack?: () => void;
    onComplete?: () => void;
}

const WEEKLY_QUESTIONS = [
    { id: 'pss1', text: '在过去一周，你觉得自己无法控制生活中重要事情的频率是？', emoji: '😰' },
    { id: 'pss2', text: '在过去一周，你对处理个人问题感到有信心的频率是？', emoji: '💪', inverted: true },
    { id: 'pss3', text: '在过去一周，你觉得事情发展顺利的频率是？', emoji: '✨', inverted: true },
    { id: 'pss4', text: '在过去一周，你觉得困难不断累积以至于无法克服的频率是？', emoji: '🌊' },
];

const ANSWER_OPTIONS = [
    { value: 0, label: '从不', color: 'bg-emerald-500' },
    { value: 1, label: '偶尔', color: 'bg-teal-500' },
    { value: 2, label: '有时', color: 'bg-amber-500' },
    { value: 3, label: '经常', color: 'bg-orange-500' },
    { value: 4, label: '总是', color: 'bg-rose-500' },
];

// ============================================
// Enhanced Glass Card with Shimmer
// ============================================

function GlassCardShimmer({ children, className }: { children: React.ReactNode; className?: string }) {
    const [showShimmer, setShowShimmer] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setShowShimmer(true);
            setTimeout(() => setShowShimmer(false), 1500);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-gradient-to-br from-white/25 via-white/10 to-white/5",
            "dark:from-white/15 dark:via-white/8 dark:to-white/3",
            "backdrop-blur-[25px] backdrop-saturate-[1.8]",
            "border border-white/30 dark:border-white/20",
            "shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]",
            className
        )}>
            {/* Specular highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />

            {/* Shimmer effect */}
            <AnimatePresence>
                {showShimmer && (
                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '200%', opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10">{children}</div>
        </div>
    );
}

// ============================================
// Animated Progress Bar
// ============================================

function ProgressBar({ percent }: { percent: number }) {
    const springProgress = useSpring(0, { stiffness: 100, damping: 20 });

    useEffect(() => {
        springProgress.set(percent);
    }, [percent, springProgress]);

    return (
        <div className="h-2.5 bg-stone-200/80 dark:bg-stone-700/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
                style={{ width: useTransform(springProgress, v => `${v}%`) }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 blur-sm opacity-60" />
            </motion.div>
        </div>
    );
}

// ============================================
// Ripple Button Component
// ============================================

function RippleButton({
    children,
    onClick,
    className,
    selected,
    disabled,
}: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    selected?: boolean;
    disabled?: boolean;
}) {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;

        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const id = Date.now();
            setRipples(prev => [...prev, { x, y, id }]);
            setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
        }
        onClick();
    };

    return (
        <motion.button
            ref={buttonRef}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfigs.snappy}
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                "relative w-full p-4 rounded-2xl text-left font-medium overflow-hidden",
                "transition-all duration-200",
                selected
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white/90 dark:bg-white/10 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-white/15",
                "border border-white/50 dark:border-white/20",
                className
            )}
        >
            {ripples.map(ripple => (
                <motion.span
                    key={ripple.id}
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute rounded-full bg-white/30 pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: 20,
                        height: 20,
                        marginLeft: -10,
                        marginTop: -10,
                    }}
                />
            ))}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}

// ============================================
// Main Component
// ============================================

export const ViewWeeklyCalibration = ({ onBack, onComplete }: ViewWeeklyCalibrationProps) => {
    const { saveWeekly, isSaving, error } = useScaleCalibration();
    const { impact, notification } = useHaptics();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [evolutionText, setEvolutionText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    const currentQuestion = WEEKLY_QUESTIONS[currentStep];
    const isEvolutionStep = currentStep >= WEEKLY_QUESTIONS.length;
    const progress = ((currentStep + 1) / (WEEKLY_QUESTIONS.length + 1)) * 100;

    const handleAnswer = async (questionId: string, value: number) => {
        await impact(ImpactStyle.Light);
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        setTimeout(async () => {
            await impact(ImpactStyle.Light);
            if (currentStep < WEEKLY_QUESTIONS.length) {
                setCurrentStep(prev => prev + 1);
            }
        }, 350);
    };

    const handleSubmit = async () => {
        await impact(ImpactStyle.Medium);
        const success = await saveWeekly({
            answers,
            evolutionAnswer: evolutionText,
        });
        if (success) {
            await notification(undefined);
            setIsComplete(true);
        }
    };

    // Completion Screen with particles
    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-6 relative overflow-hidden">
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: '100vh', opacity: 0 }}
                            animate={{
                                y: '-20vh',
                                opacity: [0, 0.6, 0],
                                x: [0, Math.random() * 100 - 50, 0],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 2,
                                delay: i * 0.5,
                                repeat: Infinity,
                                ease: 'easeOut',
                            }}
                            className="absolute w-3 h-3 bg-white/30 rounded-full blur-sm"
                            style={{ left: `${15 + i * 15}%` }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={springConfigs.bouncy}
                    className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl relative"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-white/50 rounded-full"
                    />
                    <Check className="w-16 h-16 text-indigo-500 relative z-10" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...springConfigs.gentle }}
                    className="text-3xl font-bold text-white mb-3"
                >
                    周复盘完成！
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, ...springConfigs.gentle }}
                    className="flex items-center gap-2 text-white/90 mb-8"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>您的反馈已记录，继续保持！</span>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, ...springConfigs.gentle }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onComplete || onBack}
                    className="px-12 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-2xl"
                >
                    完成
                </motion.button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl px-4 py-4 border-b border-stone-200/60 dark:border-stone-800"
            >
                <div className="flex items-center gap-3 mb-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30"
                        >
                            <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <h1 className="text-lg font-bold text-stone-800 dark:text-white">周复盘</h1>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-2xl">{currentQuestion?.emoji || '📝'}</span>
                        <span className="text-sm text-stone-500 font-medium">{currentStep + 1}/{WEEKLY_QUESTIONS.length + 1}</span>
                    </div>
                </div>
                <ProgressBar percent={progress} />
            </motion.div>

            {/* Content */}
            <div className="p-4 pb-24">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {!isEvolutionStep && currentQuestion ? (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -50, scale: 0.95 }}
                            transition={springConfigs.gentle}
                        >
                            <GlassCardShimmer className="p-6">
                                <p className="text-xl font-semibold text-stone-800 dark:text-white mb-8 leading-relaxed">
                                    {currentQuestion.text}
                                </p>

                                <motion.div
                                    className="space-y-3"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.06 }
                                        }
                                    }}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {ANSWER_OPTIONS.map((option) => (
                                        <motion.div
                                            key={option.value}
                                            variants={{
                                                hidden: { opacity: 0, x: 20 },
                                                show: { opacity: 1, x: 0 }
                                            }}
                                        >
                                            <RippleButton
                                                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                                selected={answers[currentQuestion.id] === option.value}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "w-3 h-3 rounded-full",
                                                        answers[currentQuestion.id] === option.value ? 'bg-white' : option.color
                                                    )} />
                                                    {option.label}
                                                </span>
                                            </RippleButton>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </GlassCardShimmer>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="evolution"
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -50, scale: 0.95 }}
                            transition={springConfigs.gentle}
                        >
                            <GlassCardShimmer className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">💭</span>
                                    <p className="text-xl font-semibold text-stone-800 dark:text-white">
                                        这一周你有什么收获或变化？
                                    </p>
                                </div>
                                <p className="text-sm text-stone-500 mb-4">
                                    自由记录你的感受和想法...
                                </p>

                                <textarea
                                    value={evolutionText}
                                    onChange={(e) => setEvolutionText(e.target.value)}
                                    placeholder="写下你的思考..."
                                    className="w-full h-44 p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/50 backdrop-blur text-stone-800 dark:text-white placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-stone-200/50 dark:border-stone-700/50 transition-all"
                                />
                            </GlassCardShimmer>

                            <motion.button
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, ...springConfigs.gentle }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 relative overflow-hidden"
                            >
                                {/* Button shimmer */}
                                <motion.div
                                    animate={{ x: ['0%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                                />
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>提交周复盘</span>
                                        <Sparkles className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ViewWeeklyCalibration;
