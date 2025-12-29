'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Star3D, Bell3D, Heart3D } from '@/components/mobile/Icons3D';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'welcome' | 'notifications' | 'health' | 'activity' | 'summary';

interface ActivityLevel {
    id: string;
    labelEn: string;
    labelZh: string;
    descEn: string;
    descZh: string;
    emoji: string;
}

const activityLevels: ActivityLevel[] = [
    {
        id: 'sedentary',
        labelEn: 'Sedentary',
        labelZh: '久坐',
        descEn: 'Most of the day is spent sitting',
        descZh: '大部分时间都在坐着',
        emoji: '🪑',
    },
    {
        id: 'light',
        labelEn: 'Lightly Active',
        labelZh: '轻度活动',
        descEn: '1-3 workouts per week, 30-45 min',
        descZh: '每周1-3次锻炼，30-45分钟',
        emoji: '🚶',
    },
    {
        id: 'moderate',
        labelEn: 'Moderately Active',
        labelZh: '中度活动',
        descEn: '3-5 workouts per week',
        descZh: '每周3-5次锻炼',
        emoji: '🏃',
    },
    {
        id: 'active',
        labelEn: 'Very Active',
        labelZh: '非常活跃',
        descEn: '6-7 workouts per week, 60+ min',
        descZh: '每周6-7次锻炼，60分钟以上',
        emoji: '🏋️',
    },
];

export default function MobileOnboarding() {
    const { language } = useI18n();
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [healthEnabled, setHealthEnabled] = useState(false);

    const handleNext = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        const steps: OnboardingStep[] = ['welcome', 'notifications', 'health', 'activity', 'summary'];
        const currentIdx = steps.indexOf(step);
        if (currentIdx < steps.length - 1) {
            setStep(steps[currentIdx + 1]);
        }
    };

    const handleBack = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }

        const steps: OnboardingStep[] = ['welcome', 'notifications', 'health', 'activity', 'summary'];
        const currentIdx = steps.indexOf(step);
        if (currentIdx > 0) {
            setStep(steps[currentIdx - 1]);
        }
    };

    const handleComplete = async () => {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch { }
        router.push('/mobile');
    };

    const renderStep = () => {
        switch (step) {
            case 'welcome':
                return (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <Star3D size={120} className="mb-8" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {language === 'en' ? 'Welcome to AntiAnxiety' : '欢迎来到 AntiAnxiety'}
                        </h1>
                        <p className="text-gray-500 mb-8 max-w-xs">
                            {language === 'en'
                                ? "Before you begin, let's take a few minutes to learn more about you!"
                                : "在开始之前，让我们花几分钟来了解更多关于你的信息！"
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="w-full py-4 rounded-2xl text-white font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
                                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {language === 'en' ? 'Get Started' : '开始使用'}
                        </motion.button>
                    </motion.div>
                );

            case 'notifications':
                return (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <Bell3D size={120} className="mb-8" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {language === 'en' ? 'Help us with your goals' : '帮助你达成目标'}
                        </h1>
                        <p className="text-gray-500 mb-8 max-w-xs">
                            {language === 'en'
                                ? "Get updates on your progress and reminders to track your goals"
                                : "获取进度更新和目标追踪提醒"
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setNotificationsEnabled(true);
                                handleNext();
                            }}
                            className="w-full py-4 rounded-2xl text-white font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
                                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {language === 'en' ? 'Allow Notifications' : '允许通知'}
                        </motion.button>
                    </motion.div>
                );

            case 'health':
                return (
                    <motion.div
                        key="health"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <Heart3D size={120} className="mb-8" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {language === 'en' ? 'Allow access to Health' : '允许访问健康数据'}
                        </h1>
                        <p className="text-gray-500 mb-8 max-w-xs">
                            {language === 'en'
                                ? "AntiAnxiety needs your Health data to build activities and provide insights"
                                : "AntiAnxiety 需要你的健康数据来构建活动和提供洞察"
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setHealthEnabled(true);
                                handleNext();
                            }}
                            className="w-full py-4 rounded-2xl text-white font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
                                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            {language === 'en' ? 'Connect to Health' : '连接健康'}
                        </motion.button>
                    </motion.div>
                );

            case 'activity':
                return (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {language === 'en' ? 'What is the best define your activity level?' : '哪个最能描述你的活动水平？'}
                        </h1>
                        <p className="text-gray-500 mb-6">
                            {language === 'en' ? 'This helps us personalize your experience' : '这有助于我们个性化你的体验'}
                        </p>

                        <div className="space-y-3 mb-8">
                            {activityLevels.map((level, index) => {
                                const isSelected = selectedActivity === level.id;
                                return (
                                    <motion.button
                                        key={level.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            try {
                                                await Haptics.impact({ style: ImpactStyle.Light });
                                            } catch { }
                                            setSelectedActivity(level.id);
                                        }}
                                        className="w-full p-4 rounded-[20px] flex items-center gap-4 transition-all"
                                        style={{
                                            background: isSelected
                                                ? 'rgba(59, 130, 246, 0.08)'
                                                : 'rgba(255, 255, 255, 0.9)',
                                            backdropFilter: 'blur(10px)',
                                            border: isSelected
                                                ? '2px solid #3B82F6'
                                                : '1px solid rgba(255, 255, 255, 0.5)',
                                            boxShadow: isSelected
                                                ? '0 4px 20px rgba(59, 130, 246, 0.15)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.04)',
                                        }}
                                    >
                                        <span className="text-3xl">{level.emoji}</span>
                                        <div className="flex-1 text-left">
                                            <p className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {language === 'en' ? level.labelEn : level.labelZh}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {language === 'en' ? level.descEn : level.descZh}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBack}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                disabled={!selectedActivity}
                                className="flex-1 py-4 rounded-2xl text-white font-bold disabled:opacity-40"
                                style={{
                                    background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
                                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                {language === 'en' ? 'Continue' : '继续'}
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 'summary':
                const selectedActivityData = activityLevels.find(l => l.id === selectedActivity);
                return (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                        <div className="flex justify-center mb-6">
                            <Star3D size={80} />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            {language === 'en' ? 'Summary' : '概览'}
                        </h1>

                        <div
                            className="rounded-[24px] p-5 mb-6 space-y-4"
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔔</span>
                                <span className="text-gray-900">
                                    {language === 'en' ? 'Notifications' : '通知'}: {notificationsEnabled ? '✓' : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">❤️</span>
                                <span className="text-gray-900">
                                    {language === 'en' ? 'Health Data' : '健康数据'}: {healthEnabled ? '✓' : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{selectedActivityData?.emoji || '🏃'}</span>
                                <span className="text-gray-900">
                                    {language === 'en' ? selectedActivityData?.labelEn : selectedActivityData?.labelZh}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBack}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleComplete}
                                className="flex-1 py-4 rounded-2xl text-white font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #0B3D2E 0%, #1a5c47 100%)',
                                    boxShadow: '0 12px 32px rgba(11, 61, 46, 0.3)',
                                }}
                            >
                                {language === 'en' ? 'Confirm' : '确认'}
                            </motion.button>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col justify-center px-6 py-12"
            style={{
                background: 'linear-gradient(180deg, #B8D4E8 0%, #E8EEF2 50%, #FFFFFF 100%)',
            }}
        >
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </div>
    );
}
