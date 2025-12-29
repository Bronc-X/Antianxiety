'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Check, Activity, Bell, Heart } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'welcome' | 'notifications' | 'health' | 'activity' | 'summary';

interface ActivityLevel {
    id: string;
    labelEn: string;
    labelZh: string;
}

const activityLevels: ActivityLevel[] = [
    { id: 'sedentary', labelEn: 'SEDENTARY', labelZh: '久坐' },
    { id: 'light', labelEn: 'LIGHT', labelZh: '轻度' },
    { id: 'moderate', labelEn: 'MODERATE', labelZh: '中度' },
    { id: 'active', labelEn: 'ACTIVE', labelZh: '高强度' },
];

export default function DarkOnboarding() {
    const { language } = useI18n();
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [healthEnabled, setHealthEnabled] = useState(false);

    const steps: OnboardingStep[] = ['welcome', 'notifications', 'health', 'activity', 'summary'];
    const currentStepIndex = steps.indexOf(step);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        if (currentStepIndex < steps.length - 1) {
            setStep(steps[currentStepIndex + 1]);
        }
    };

    const handleBack = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }

        if (currentStepIndex > 0) {
            setStep(steps[currentStepIndex - 1]);
        }
    };

    const handleComplete = async () => {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch { }
        router.push('/mobile-dark');
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
                        <div
                            className="w-24 h-24 flex items-center justify-center mb-8"
                            style={{
                                background: '#00FF9410',
                                border: '2px solid #00FF94',
                            }}
                        >
                            <Activity className="w-12 h-12" style={{ color: '#00FF94' }} />
                        </div>
                        <h1
                            className="text-2xl font-mono uppercase tracking-tight mb-3"
                            style={{ color: '#FFFFFF' }}
                        >
                            ANTIANXIETY
                        </h1>
                        <p
                            className="text-sm font-mono mb-8"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en'
                                ? 'INITIALIZE YOUR BIO-TWIN'
                                : '初始化你的生物孪生体'
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="w-full py-4 font-mono uppercase tracking-wider text-sm"
                            style={{
                                background: '#00FF94',
                                color: '#000000',
                            }}
                        >
                            {language === 'en' ? 'INITIALIZE' : '开始初始化'}
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
                        <div
                            className="w-24 h-24 flex items-center justify-center mb-8"
                            style={{
                                background: '#FFCC0010',
                                border: '2px solid #FFCC00',
                            }}
                        >
                            <Bell className="w-12 h-12" style={{ color: '#FFCC00' }} />
                        </div>
                        <h1
                            className="text-xl font-mono uppercase tracking-tight mb-3"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? 'ENABLE ALERTS' : '启用警报'}
                        </h1>
                        <p
                            className="text-sm font-mono mb-8"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en'
                                ? 'Get notified when your bio-status changes'
                                : '当生物状态变化时接收通知'
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setNotificationsEnabled(true);
                                handleNext();
                            }}
                            className="w-full py-4 font-mono uppercase tracking-wider text-sm mb-3"
                            style={{
                                background: '#FFCC00',
                                color: '#000000',
                            }}
                        >
                            {language === 'en' ? 'ALLOW' : '允许'}
                        </motion.button>
                        <button
                            onClick={handleNext}
                            className="text-[11px] font-mono uppercase tracking-wider"
                            style={{ color: '#444444' }}
                        >
                            {language === 'en' ? 'SKIP' : '跳过'}
                        </button>
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
                        <div
                            className="w-24 h-24 flex items-center justify-center mb-8"
                            style={{
                                background: '#FF3B3010',
                                border: '2px solid #FF3B30',
                            }}
                        >
                            <Heart className="w-12 h-12" style={{ color: '#FF3B30' }} />
                        </div>
                        <h1
                            className="text-xl font-mono uppercase tracking-tight mb-3"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? 'CONNECT HEALTH' : '连接健康数据'}
                        </h1>
                        <p
                            className="text-sm font-mono mb-8"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en'
                                ? 'Sync HRV, sleep, and activity data'
                                : '同步HRV、睡眠和活动数据'
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setHealthEnabled(true);
                                handleNext();
                            }}
                            className="w-full py-4 font-mono uppercase tracking-wider text-sm mb-3"
                            style={{
                                background: '#FF3B30',
                                color: '#FFFFFF',
                            }}
                        >
                            {language === 'en' ? 'CONNECT' : '连接'}
                        </motion.button>
                        <button
                            onClick={handleNext}
                            className="text-[11px] font-mono uppercase tracking-wider"
                            style={{ color: '#444444' }}
                        >
                            {language === 'en' ? 'SKIP' : '跳过'}
                        </button>
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
                        <h1
                            className="text-xl font-mono uppercase tracking-tight mb-2"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? 'ACTIVITY LEVEL' : '活动水平'}
                        </h1>
                        <p
                            className="text-sm font-mono mb-6"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en' ? 'Select your baseline' : '选择你的基准'}
                        </p>

                        <div className="space-y-[1px] mb-8" style={{ background: '#1A1A1A' }}>
                            {activityLevels.map((level, i) => {
                                const isSelected = selectedActivity === level.id;
                                return (
                                    <motion.button
                                        key={level.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            try {
                                                await Haptics.impact({ style: ImpactStyle.Light });
                                            } catch { }
                                            setSelectedActivity(level.id);
                                        }}
                                        className="w-full p-4 flex items-center justify-between"
                                        style={{
                                            background: isSelected ? '#00FF94' : '#0A0A0A',
                                        }}
                                    >
                                        <span
                                            className="text-sm font-mono uppercase tracking-wide"
                                            style={{ color: isSelected ? '#000000' : '#888888' }}
                                        >
                                            {language === 'en' ? level.labelEn : level.labelZh}
                                        </span>
                                        {isSelected && (
                                            <Check className="w-4 h-4" style={{ color: '#000000' }} />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBack}
                                className="w-12 h-12 flex items-center justify-center"
                                style={{
                                    background: '#0A0A0A',
                                    border: '1px solid #222222',
                                }}
                            >
                                <ChevronLeft className="w-5 h-5" style={{ color: '#666666' }} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNext}
                                disabled={!selectedActivity}
                                className="flex-1 py-4 font-mono uppercase tracking-wider text-sm disabled:opacity-40"
                                style={{
                                    background: '#00FF94',
                                    color: '#000000',
                                }}
                            >
                                {language === 'en' ? 'CONTINUE' : '继续'}
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 'summary':
                return (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                        <h1
                            className="text-xl font-mono uppercase tracking-tight mb-6"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? 'CONFIGURATION' : '配置'}
                        </h1>

                        <div
                            className="p-4 mb-6 space-y-3"
                            style={{
                                background: '#0A0A0A',
                                border: '1px solid #1A1A1A',
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className="text-[10px] font-mono uppercase tracking-wider"
                                    style={{ color: '#555555' }}
                                >
                                    {language === 'en' ? 'ALERTS' : '警报'}
                                </span>
                                <span
                                    className="text-[10px] font-mono"
                                    style={{ color: notificationsEnabled ? '#00FF94' : '#FF3B30' }}
                                >
                                    {notificationsEnabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span
                                    className="text-[10px] font-mono uppercase tracking-wider"
                                    style={{ color: '#555555' }}
                                >
                                    {language === 'en' ? 'HEALTH SYNC' : '健康同步'}
                                </span>
                                <span
                                    className="text-[10px] font-mono"
                                    style={{ color: healthEnabled ? '#00FF94' : '#FF3B30' }}
                                >
                                    {healthEnabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span
                                    className="text-[10px] font-mono uppercase tracking-wider"
                                    style={{ color: '#555555' }}
                                >
                                    {language === 'en' ? 'ACTIVITY' : '活动'}
                                </span>
                                <span
                                    className="text-[10px] font-mono"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    {selectedActivity?.toUpperCase() || '—'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBack}
                                className="w-12 h-12 flex items-center justify-center"
                                style={{
                                    background: '#0A0A0A',
                                    border: '1px solid #222222',
                                }}
                            >
                                <ChevronLeft className="w-5 h-5" style={{ color: '#666666' }} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleComplete}
                                className="flex-1 py-4 font-mono uppercase tracking-wider text-sm"
                                style={{
                                    background: '#00FF94',
                                    color: '#000000',
                                }}
                            >
                                {language === 'en' ? 'LAUNCH' : '启动'}
                            </motion.button>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col px-6 py-8"
            style={{ background: '#000000' }}
        >
            {/* Progress */}
            {step !== 'welcome' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-8"
                >
                    <div className="h-[2px]" style={{ background: '#1A1A1A' }}>
                        <motion.div
                            className="h-full"
                            animate={{ width: `${progress}%` }}
                            style={{ background: '#00FF94' }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </div>
        </div>
    );
}
