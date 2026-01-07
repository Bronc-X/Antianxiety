"use client";

/**
 * ViewMonthlyCalibration - Monthly Standard Scale Assessment
 * 
 * Monthly evaluation using clinical scales: GAD-7, PHQ-9, PSS-10.
 * Uses useScaleCalibration hook for persistence.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Check,
    Loader2,
    CalendarRange,
    Brain,
    Heart,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScaleCalibration } from "@/hooks/domain/useScaleCalibration";
import { useHaptics, ImpactStyle } from "@/hooks/useHaptics";

// ============================================
// Types & Constants
// ============================================

interface ViewMonthlyCalibrationProps {
    onBack?: () => void;
    onComplete?: () => void;
}

type ScaleId = 'GAD7' | 'PHQ9' | 'PSS10';

const SCALES: Record<ScaleId, {
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    questions: string[];
}> = {
    GAD7: {
        name: 'GAD-7 焦虑量表',
        description: '评估焦虑症状的严重程度',
        icon: Brain,
        color: 'indigo',
        questions: [
            '感到紧张、焦虑或烦躁',
            '无法停止或控制担忧',
            '过度担心各种事情',
            '难以放松',
            '心烦意乱以至于难以坐着不动',
            '容易恼怒或易激惹',
            '感到害怕，好像有什么可怕的事会发生',
        ],
    },
    PHQ9: {
        name: 'PHQ-9 抑郁量表',
        description: '评估抑郁症状的严重程度',
        icon: Heart,
        color: 'rose',
        questions: [
            '做事时缺乏兴趣或乐趣',
            '感到心情低落、沮丧或绝望',
            '入睡困难、睡不安稳或睡眠过多',
            '感到疲倦或没有活力',
            '食欲不振或吃得过多',
            '觉得自己很糟，或觉得自己很失败',
            '难以集中精神做事',
            '动作或说话慢得别人注意到了，或相反太坐立不安',
            '有伤害自己的念头或觉得活着不如死了好',
        ],
    },
    PSS10: {
        name: 'PSS-10 压力量表',
        description: '评估压力感知程度',
        icon: Activity,
        color: 'amber',
        questions: [
            '因为意外发生的事情而感到心烦',
            '感觉自己无法控制生活中重要的事情',
            '感到紧张和有压力',
            '成功地应对了生活中的小烦恼',
            '感觉很好地处理了生活中的重要变化',
            '对自己处理个人问题的能力有信心',
            '感觉事情都在按照你的意愿发展',
            '发现自己无法处理所有你必须做的事情',
            '能够控制生活中的烦恼',
            '感觉自己对事情掌控自如',
        ],
    },
};

const ANSWER_OPTIONS = [
    { value: 0, label: '完全没有' },
    { value: 1, label: '少于一半' },
    { value: 2, label: '超过一半' },
    { value: 3, label: '几乎每天' },
];

// ============================================
// Components
// ============================================

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-white/80 dark:bg-white/10 backdrop-blur-xl",
            "border border-white/40 dark:border-white/20",
            "shadow-lg shadow-stone-200/50 dark:shadow-none",
            className
        )}>
            {children}
        </div>
    );
}

function ProgressBar({ percent, color = 'pink' }: { percent: number; color?: string }) {
    const gradients: Record<string, string> = {
        indigo: 'from-indigo-500 to-blue-500',
        rose: 'from-rose-500 to-pink-500',
        amber: 'from-amber-500 to-orange-500',
        pink: 'from-pink-500 to-rose-500',
    };

    return (
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.3 }}
                className={cn("h-full rounded-full bg-gradient-to-r", gradients[color] || gradients.pink)}
            />
        </div>
    );
}

// ============================================
// Utility Functions
// ============================================

function getInterpretation(scaleId: ScaleId, score: number): { text: string; severity: 'low' | 'medium' | 'high' } {
    if (scaleId === 'GAD7') {
        if (score <= 4) return { text: '无焦虑', severity: 'low' };
        if (score <= 9) return { text: '轻度焦虑', severity: 'low' };
        if (score <= 14) return { text: '中度焦虑', severity: 'medium' };
        return { text: '重度焦虑', severity: 'high' };
    }
    if (scaleId === 'PHQ9') {
        if (score <= 4) return { text: '无抑郁', severity: 'low' };
        if (score <= 9) return { text: '轻度抑郁', severity: 'low' };
        if (score <= 14) return { text: '中度抑郁', severity: 'medium' };
        if (score <= 19) return { text: '中重度抑郁', severity: 'high' };
        return { text: '重度抑郁', severity: 'high' };
    }
    // PSS10
    if (score <= 13) return { text: '低压力', severity: 'low' };
    if (score <= 26) return { text: '中等压力', severity: 'medium' };
    return { text: '高压力', severity: 'high' };
}

// ============================================
// Main Component
// ============================================

export const ViewMonthlyCalibration = ({ onBack, onComplete }: ViewMonthlyCalibrationProps) => {
    const { saveMonthly, isSaving, error } = useScaleCalibration();
    const { impact } = useHaptics();

    const [selectedScale, setSelectedScale] = useState<ScaleId | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isComplete, setIsComplete] = useState(false);

    const scale = selectedScale ? SCALES[selectedScale] : null;
    const questions = scale?.questions || [];
    const currentQuestion = questions[currentStep];
    const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;
    const allAnswered = Object.keys(answers).length === questions.length;

    const calculateScore = () => Object.values(answers).reduce((sum, v) => sum + v, 0);

    const handleAnswer = async (value: number) => {
        await impact(ImpactStyle.Light);
        setAnswers(prev => ({ ...prev, [`q${currentStep}`]: value }));

        if (currentStep < questions.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        }
    };

    const handleSubmit = async () => {
        if (!selectedScale) return;
        await impact(ImpactStyle.Medium);

        const score = calculateScore();
        const interpretation = getInterpretation(selectedScale, score);

        const success = await saveMonthly({
            scaleId: selectedScale,
            answers,
            totalScore: score,
            interpretation: interpretation.text,
        });

        if (success) {
            setIsComplete(true);
        }
    };

    // Scale Selection Screen
    if (!selectedScale) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
                <div className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl px-4 py-4 border-b border-stone-200/60 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800">
                            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                                <CalendarRange className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h1 className="text-lg font-bold text-stone-800 dark:text-white">月度评估</h1>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-stone-500 dark:text-stone-400 text-sm mb-2">
                        选择一个标准化量表进行评估
                    </p>

                    {(Object.keys(SCALES) as ScaleId[]).map(key => {
                        const scaleInfo = SCALES[key];
                        const Icon = scaleInfo.icon;
                        const colors: Record<string, string> = {
                            indigo: 'from-indigo-500 to-blue-500',
                            rose: 'from-rose-500 to-pink-500',
                            amber: 'from-amber-500 to-orange-500',
                        };

                        return (
                            <motion.button
                                key={key}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedScale(key)}
                                className="w-full p-5 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/20 text-left shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-xl bg-gradient-to-br", colors[scaleInfo.color])}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-stone-800 dark:text-white">{scaleInfo.name}</h3>
                                        <p className="text-sm text-stone-500">{scaleInfo.description}</p>
                                        <p className="text-xs text-stone-400 mt-1">{scaleInfo.questions.length} 个问题 · 约 {Math.ceil(scaleInfo.questions.length * 0.5)} 分钟</p>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Completion Screen
    if (isComplete) {
        const score = calculateScore();
        const interpretation = getInterpretation(selectedScale, score);
        const colors: Record<string, string> = {
            indigo: 'from-indigo-500 via-blue-500 to-cyan-500',
            rose: 'from-rose-500 via-pink-500 to-fuchsia-500',
            amber: 'from-amber-500 via-orange-500 to-red-500',
        };

        return (
            <div className={cn("min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br", colors[scale?.color || 'pink'])}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                >
                    <Check className="w-14 h-14 text-pink-500" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2"
                >
                    评估完成
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/80 mb-6"
                >
                    {scale?.name}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/20 backdrop-blur rounded-2xl px-10 py-6 mb-8"
                >
                    <p className="text-5xl font-bold text-white text-center">{score}</p>
                    <p className="text-white/80 text-center mt-2">{interpretation.text}</p>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onComplete || onBack}
                    className="px-10 py-4 bg-white text-pink-600 rounded-2xl font-semibold shadow-lg"
                >
                    完成
                </motion.button>
            </div>
        );
    }

    // Questions Screen
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
            <div className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl px-4 py-4 border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setSelectedScale(null)}
                        className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <h1 className="text-lg font-bold text-stone-800 dark:text-white">{scale?.name}</h1>
                    <span className="ml-auto text-sm text-stone-500">{currentStep + 1}/{questions.length}</span>
                </div>
                <ProgressBar percent={progress} color={scale?.color} />
            </div>

            <div className="p-4 pb-24">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ type: "spring", damping: 25 }}
                    >
                        <GlassCard className="p-6">
                            <p className="text-sm text-stone-500 mb-3">过去两周内</p>
                            <p className="text-lg font-medium text-stone-800 dark:text-white mb-6 leading-relaxed">
                                {currentQuestion}
                            </p>

                            <div className="space-y-3">
                                {ANSWER_OPTIONS.map(option => (
                                    <motion.button
                                        key={option.value}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(option.value)}
                                        className={cn(
                                            "w-full p-4 rounded-xl text-left transition-all font-medium",
                                            answers[`q${currentStep}`] === option.value
                                                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                                                : "bg-white dark:bg-white/10 text-stone-700 dark:text-stone-300 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                                        )}
                                    >
                                        {option.label}
                                    </motion.button>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                </AnimatePresence>

                {allAnswered && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        提交评估
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ViewMonthlyCalibration;
