'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, Check } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import Link from 'next/link';

interface Question {
    id: string;
    titleEn: string;
    titleZh: string;
    type: 'scale' | 'select';
    options?: { labelEn: string; labelZh: string; value: number; emoji?: string }[];
}

const questions: Question[] = [
    {
        id: 'stress',
        titleEn: 'How stressed do you feel right now?',
        titleZh: '你现在感觉压力有多大？',
        type: 'scale',
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
        type: 'scale',
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
        type: 'scale',
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

        // Auto-advance after short delay
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-screen px-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-[#0B3D2E] rounded-full flex items-center justify-center mb-6"
                >
                    <Check className="w-12 h-12 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {language === 'en' ? 'Calibration Complete!' : '校准完成！'}
                </h1>
                <p className="text-gray-500 text-center mb-8">
                    {language === 'en'
                        ? 'Your digital twin has been updated with today\'s data.'
                        : '你的数字孪生已更新今日数据。'
                    }
                </p>
                <Link href="/mobile">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-[#0B3D2E] text-white font-semibold rounded-2xl"
                    >
                        {language === 'en' ? 'Back to Dashboard' : '返回仪表盘'}
                    </motion.button>
                </Link>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/mobile">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    </Link>
                    <span className="text-sm text-gray-500">
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#0B3D2E]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col px-6 pt-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h1 className="text-2xl font-bold text-gray-900 mb-8">
                            {language === 'en' ? currentQuestion.titleEn : currentQuestion.titleZh}
                        </h1>

                        <div className="space-y-3">
                            {currentQuestion.options?.map((option, index) => (
                                <motion.button
                                    key={option.value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-colors ${answers[currentQuestion.id] === option.value
                                            ? 'border-[#0B3D2E] bg-[#0B3D2E]/5'
                                            : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <span className="text-2xl">{option.emoji}</span>
                                    <span className="font-medium text-gray-900">
                                        {language === 'en' ? option.labelEn : option.labelZh}
                                    </span>
                                    {answers[currentQuestion.id] === option.value && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto w-6 h-6 bg-[#0B3D2E] rounded-full flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
