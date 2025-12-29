'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, Check } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import Link from 'next/link';
import { Trophy3D } from '@/components/mobile/Icons3D';

interface Question {
    id: string;
    titleEn: string;
    titleZh: string;
    options: { labelEn: string; labelZh: string; value: number; emoji: string }[];
}

const questions: Question[] = [
    {
        id: 'stress',
        titleEn: 'How stressed do you feel right now?',
        titleZh: '你现在感觉压力有多大？',
        options: [
            { labelEn: 'Very relaxed', labelZh: '非常放松', value: 1, emoji: '😌' },
            { labelEn: 'Slightly tense', labelZh: '有点紧张', value: 2, emoji: '😐' },
            { labelEn: 'Moderate', labelZh: '一般', value: 3, emoji: '😕' },
            { labelEn: 'Quite stressed', labelZh: '比较焦虑', value: 4, emoji: '😰' },
            { labelEn: 'Very stressed', labelZh: '非常焦虑', value: 5, emoji: '😫' },
        ],
    },
    {
        id: 'sleep',
        titleEn: 'How was your sleep last night?',
        titleZh: '昨晚睡得怎么样？',
        options: [
            { labelEn: 'Excellent', labelZh: '非常好', value: 5, emoji: '😴' },
            { labelEn: 'Good', labelZh: '不错', value: 4, emoji: '🙂' },
            { labelEn: 'Fair', labelZh: '一般', value: 3, emoji: '😐' },
            { labelEn: 'Poor', labelZh: '较差', value: 2, emoji: '😕' },
            { labelEn: 'Terrible', labelZh: '很差', value: 1, emoji: '😩' },
        ],
    },
    {
        id: 'energy',
        titleEn: 'What is your energy level?',
        titleZh: '你的精力水平如何？',
        options: [
            { labelEn: 'Full of energy', labelZh: '精力充沛', value: 5, emoji: '⚡' },
            { labelEn: 'Good', labelZh: '状态不错', value: 4, emoji: '💪' },
            { labelEn: 'Normal', labelZh: '一般', value: 3, emoji: '😐' },
            { labelEn: 'A bit tired', labelZh: '有点累', value: 2, emoji: '😩' },
            { labelEn: 'Exhausted', labelZh: '非常疲惫', value: 1, emoji: '😵' },
        ],
    },
];

export default function MobileCalibration() {
    const { language } = useI18n();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [completed, setCompleted] = useState(false);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleSelect = async (value: number) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        setAnswers({ ...answers, [currentQuestion.id]: value });

        setTimeout(async () => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                try {
                    await Haptics.notification({ type: NotificationType.Success });
                } catch { }
                setCompleted(true);
            }
        }, 300);
    };

    if (completed) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-6"
                style={{
                    background: 'linear-gradient(180deg, #B8D4E8 0%, #E8EEF2 50%, #FFFFFF 100%)',
                }}
            >
                <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mb-6"
                >
                    <Trophy3D size={120} />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-2 text-center"
                >
                    {language === 'en' ? 'Calibration Complete!' : '校准完成！'}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-500 text-center mb-8"
                >
                    {language === 'en'
                        ? "Your digital twin has been updated with today's data."
                        : '你的数字孪生已更新今日数据。'
                    }
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link href="/mobile">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-2xl text-white font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #0B3D2E 0%, #1a5c47 100%)',
                                boxShadow: '0 12px 32px rgba(11, 61, 46, 0.3)',
                            }}
                        >
                            {language === 'en' ? 'Back to Dashboard' : '返回仪表盘'}
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                background: 'linear-gradient(180deg, #B8D4E8 0%, #E8EEF2 50%, #FFFFFF 100%)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/mobile">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    </Link>
                    <span className="text-sm font-semibold text-gray-500">
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            background: 'linear-gradient(90deg, #0B3D2E 0%, #1a5c47 100%)',
                        }}
                    />
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col px-5 pt-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h1 className="text-2xl font-bold text-gray-900 mb-8 leading-tight">
                            {language === 'en' ? currentQuestion.titleEn : currentQuestion.titleZh}
                        </h1>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = answers[currentQuestion.id] === option.value;

                                return (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(option.value)}
                                        className="w-full p-4 rounded-[20px] flex items-center gap-4 transition-all"
                                        style={{
                                            background: isSelected
                                                ? 'rgba(11, 61, 46, 0.08)'
                                                : 'rgba(255, 255, 255, 0.9)',
                                            backdropFilter: 'blur(10px)',
                                            border: isSelected
                                                ? '2px solid #0B3D2E'
                                                : '1px solid rgba(255, 255, 255, 0.5)',
                                            boxShadow: isSelected
                                                ? '0 4px 20px rgba(11, 61, 46, 0.15)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.04)',
                                        }}
                                    >
                                        <span className="text-3xl">{option.emoji}</span>
                                        <span className={`font-medium flex-1 text-left ${isSelected ? 'text-[#0B3D2E]' : 'text-gray-900'
                                            }`}>
                                            {language === 'en' ? option.labelEn : option.labelZh}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #0B3D2E 0%, #1a5c47 100%)',
                                                }}
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
