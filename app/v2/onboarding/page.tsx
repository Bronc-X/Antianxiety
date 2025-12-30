'use client';

/**
 * V2 Onboarding Page
 * 
 * 新用户问卷，收集健康目标
 * 数据存储到 Supabase
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/hooks/domain/useOnboarding';

const QUESTIONS = [
    {
        id: 'primary_goal',
        question: '你最想解决的健康问题是什么？',
        options: [
            { label: '改善睡眠', value: 'sleep', icon: '😴' },
            { label: '缓解压力', value: 'stress', icon: '😌' },
            { label: '提升能量', value: 'energy', icon: '⚡' },
            { label: '体重管理', value: 'weight', icon: '⚖️' },
        ],
    },
    {
        id: 'sleep_quality',
        question: '你的睡眠质量如何？',
        options: [
            { label: '经常失眠', value: 'poor', icon: '😫' },
            { label: '偶尔睡不好', value: 'fair', icon: '😐' },
            { label: '还不错', value: 'good', icon: '😊' },
            { label: '非常好', value: 'excellent', icon: '😄' },
        ],
    },
    {
        id: 'stress_level',
        question: '日常压力水平如何？',
        options: [
            { label: '压力很大', value: 'high', icon: '😰' },
            { label: '有些压力', value: 'medium', icon: '😟' },
            { label: '轻度压力', value: 'low', icon: '🙂' },
            { label: '几乎没有', value: 'none', icon: '😎' },
        ],
    },
    {
        id: 'exercise_frequency',
        question: '每周运动频率？',
        options: [
            { label: '几乎不运动', value: 'none', icon: '🛋️' },
            { label: '1-2次', value: 'low', icon: '🚶' },
            { label: '3-4次', value: 'medium', icon: '🏃' },
            { label: '5次以上', value: 'high', icon: '💪' },
        ],
    },
];

export default function V2OnboardingPage() {
    const router = useRouter();
    const { saveStep, completeOnboarding, isLoading } = useOnboarding();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const currentQuestion = QUESTIONS[currentStep];
    const isLastQuestion = currentStep === QUESTIONS.length - 1;

    const handleSelect = async (value: string) => {
        const questionId = currentQuestion.id;
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        // 保存到数据库
        await saveStep({
            questionId,
            answer: value,
            step: currentStep + 1,
            totalSteps: QUESTIONS.length,
        });

        console.log(`[V2 Onboarding] 保存答案: ${questionId} = ${value}`);

        if (isLastQuestion) {
            // 完成 onboarding
            await completeOnboarding(newAnswers);
            console.log('[V2 Onboarding] 完成问卷，跳转到首页');
            router.push('/v2/home');
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Progress */}
            <div className="w-full max-w-md mb-8">
                <div className="flex justify-between text-emerald-400/60 text-sm mb-2">
                    <span>第 {currentStep + 1} 题</span>
                    <span>共 {QUESTIONS.length} 题</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full max-w-md"
                >
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">
                        {currentQuestion.question}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <motion.button
                                key={option.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleSelect(option.value)}
                                disabled={isLoading}
                                className="w-full p-4 bg-slate-800/50 hover:bg-emerald-900/30 border border-emerald-900/30 hover:border-emerald-600/50 rounded-2xl text-left transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{option.icon}</span>
                                    <span className="text-white group-hover:text-emerald-300 transition-colors">
                                        {option.label}
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
