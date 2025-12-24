'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, MessageCircle, Activity, BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

interface NewUserGuideProps {
    userId?: string;
    onComplete?: () => void;
}

export default function NewUserGuide({ userId, onComplete }: NewUserGuideProps) {
    const { t, language } = useI18n();
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: Sparkles,
            title: language === 'en' ? 'Welcome to Antianxiety!' : '欢迎使用 Antianxiety！',
            description: language === 'en'
                ? 'Your personal AI-powered health companion. Let us show you around.'
                : '你的私人 AI 健康助手。让我们带你了解一下。',
            color: 'from-[#D4AF37] to-[#C4A77D]',
        },
        {
            icon: MessageCircle,
            title: language === 'en' ? 'Meet Max' : '认识 Max',
            description: language === 'en'
                ? 'Max is your AI health assistant. It monitors your data and proactively reaches out with personalized insights.'
                : 'Max 是你的 AI 健康助手。它会监测你的数据，并主动提供个性化建议。',
            color: 'from-[#9CAF88] to-[#7a9268]',
        },
        {
            icon: Activity,
            title: language === 'en' ? 'Daily Calibration' : '每日校准',
            description: language === 'en'
                ? 'Spend 1 minute each morning to log your status. This helps Max understand you better.'
                : '每天早晨花 1 分钟记录你的状态。这能帮助 Max 更好地了解你。',
            color: 'from-[#0B3D2E] to-[#1a5c47]',
        },
        {
            icon: BookOpen,
            title: language === 'en' ? 'Personalized Feed' : '个性化推荐',
            description: language === 'en'
                ? 'We curate scientific articles and insights based on your health profile. No noise, only signal.'
                : '我们根据你的健康画像推送科研文章和洞察。只有精准信号，没有噪音。',
            color: 'from-purple-500 to-indigo-600',
        },
    ];

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    // Check if this is a new user on mount
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('nma_guide_completed');
        if (!hasSeenGuide) {
            // Delay showing the guide for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('nma_guide_completed', 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
                >
                    {/* Progress Indicator */}
                    <div className="flex gap-1.5 p-4 pb-0">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`flex-1 h-1 rounded-full transition-all duration-300 ${index <= currentStep ? 'bg-[#9CAF88]' : 'bg-neutral-200 dark:bg-neutral-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="text-center"
                            >
                                {/* Icon */}
                                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center shadow-lg`}>
                                    <currentStepData.icon className="w-10 h-10 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-3">
                                    {currentStepData.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed mb-6">
                                    {currentStepData.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between p-4 pt-0 gap-3">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 text-sm text-[#1A1A1A]/50 dark:text-white/50 hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
                        >
                            {language === 'en' ? 'Skip' : '跳过'}
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 bg-[#0B3D2E] dark:bg-[#9CAF88] text-white dark:text-[#1A1A1A] rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {isLastStep
                                ? (language === 'en' ? 'Get Started' : '开始使用')
                                : (language === 'en' ? 'Next' : '下一步')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
