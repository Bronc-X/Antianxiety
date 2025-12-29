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
    options: { labelEn: string; labelZh: string; value: number }[];
}

const questions: Question[] = [
    {
        id: 'stress',
        titleEn: 'STRESS LEVEL',
        titleZh: '压力水平',
        options: [
            { labelEn: 'Minimal', labelZh: '极低', value: 1 },
            { labelEn: 'Low', labelZh: '低', value: 2 },
            { labelEn: 'Moderate', labelZh: '中等', value: 3 },
            { labelEn: 'Elevated', labelZh: '偏高', value: 4 },
            { labelEn: 'High', labelZh: '高', value: 5 },
        ],
    },
    {
        id: 'sleep',
        titleEn: 'SLEEP QUALITY',
        titleZh: '睡眠质量',
        options: [
            { labelEn: 'Excellent', labelZh: '优秀', value: 5 },
            { labelEn: 'Good', labelZh: '良好', value: 4 },
            { labelEn: 'Fair', labelZh: '一般', value: 3 },
            { labelEn: 'Poor', labelZh: '较差', value: 2 },
            { labelEn: 'Very Poor', labelZh: '很差', value: 1 },
        ],
    },
    {
        id: 'energy',
        titleEn: 'ENERGY STATUS',
        titleZh: '精力状态',
        options: [
            { labelEn: 'Optimal', labelZh: '充沛', value: 5 },
            { labelEn: 'Good', labelZh: '良好', value: 4 },
            { labelEn: 'Normal', labelZh: '正常', value: 3 },
            { labelEn: 'Low', labelZh: '偏低', value: 2 },
            { labelEn: 'Depleted', labelZh: '耗尽', value: 1 },
        ],
    },
];

export default function DarkCalibration() {
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
        }, 200);
    };

    if (completed) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-6"
                style={{ background: '#000000' }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 flex items-center justify-center mb-8"
                    style={{
                        background: 'transparent',
                        border: '2px solid #00FF94',
                    }}
                >
                    <Check className="w-8 h-8" style={{ color: '#00FF94' }} />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-mono uppercase tracking-wider mb-2"
                    style={{ color: '#FFFFFF' }}
                >
                    {language === 'en' ? 'CALIBRATION COMPLETE' : '校准完成'}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-mono text-center mb-8"
                    style={{ color: '#555555' }}
                >
                    {language === 'en'
                        ? 'Bio-twin synchronized.'
                        : '生物孪生已同步。'
                    }
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/mobile-dark">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 font-mono uppercase tracking-wider text-sm"
                            style={{
                                background: 'transparent',
                                border: '1px solid #00FF94',
                                color: '#00FF94',
                            }}
                        >
                            {language === 'en' ? 'RETURN' : '返回'}
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: '#000000' }}
        >
            {/* Header */}
            <div className="px-5 pt-4">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/mobile-dark">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 flex items-center justify-center"
                            style={{
                                background: '#0A0A0A',
                                border: '1px solid #222222',
                            }}
                        >
                            <ChevronLeft className="w-5 h-5" style={{ color: '#666666' }} />
                        </motion.button>
                    </Link>
                    <span
                        className="text-[11px] font-mono uppercase tracking-wider"
                        style={{ color: '#555555' }}
                    >
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div
                    className="h-[2px] mb-8"
                    style={{ background: '#1A1A1A' }}
                >
                    <motion.div
                        className="h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ background: '#00FF94' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <h1
                            className="text-2xl font-mono uppercase tracking-tight mb-8"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? currentQuestion.titleEn : currentQuestion.titleZh}
                        </h1>

                        <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = answers[currentQuestion.id] === option.value;

                                return (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(option.value)}
                                        className="w-full p-4 flex items-center justify-between transition-colors"
                                        style={{
                                            background: isSelected ? '#00FF94' : '#0A0A0A',
                                            border: isSelected ? '1px solid #00FF94' : '1px solid #222222',
                                        }}
                                    >
                                        <span
                                            className="text-sm font-mono uppercase tracking-wide"
                                            style={{ color: isSelected ? '#000000' : '#888888' }}
                                        >
                                            {language === 'en' ? option.labelEn : option.labelZh}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check className="w-4 h-4" style={{ color: '#000000' }} />
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
