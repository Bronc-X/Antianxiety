'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, Check, ArrowRight } from 'lucide-react';
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
        titleEn: 'CORTISOL INDEX',
        titleZh: '皮质醇指数',
        options: [
            { labelEn: 'MINIMAL (1)', labelZh: '极低 (1)', value: 1 },
            { labelEn: 'LOW (2)', labelZh: '低 (2)', value: 2 },
            { labelEn: 'MODERATE (3)', labelZh: '中等 (3)', value: 3 },
            { labelEn: 'ELEVATED (4)', labelZh: '偏高 (4)', value: 4 },
            { labelEn: 'CRITICAL (5)', labelZh: '极高 (5)', value: 5 },
        ],
    },
    {
        id: 'sleep',
        titleEn: 'SLEEP EFFICIENCY',
        titleZh: '睡眠效率',
        options: [
            { labelEn: '> 95% (OPTIMAL)', labelZh: '> 95% (极佳)', value: 5 },
            { labelEn: '85-94% (GOOD)', labelZh: '85-94% (良好)', value: 4 },
            { labelEn: '75-84% (FAIR)', labelZh: '75-84% (一般)', value: 3 },
            { labelEn: '65-74% (POOR)', labelZh: '65-74% (较差)', value: 2 },
            { labelEn: '< 65% (CRITICAL)', labelZh: '< 65% (极差)', value: 1 },
        ],
    },
    {
        id: 'energy',
        titleEn: 'ENERGY RESERVES',
        titleZh: '能量储备',
        options: [
            { labelEn: 'FULL CAPACITY', labelZh: '满负荷', value: 5 },
            { labelEn: 'SUFFICIENT', labelZh: '充足', value: 4 },
            { labelEn: 'NOMINAL', labelZh: '正常', value: 3 },
            { labelEn: 'LOW BATTERY', labelZh: '低电量', value: 2 },
            { labelEn: 'DEPLETED', labelZh: '耗尽', value: 1 },
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
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { }

        setAnswers({ ...answers, [currentQuestion.id]: value });

        setTimeout(async () => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                try { await Haptics.notification({ type: NotificationType.Success }); } catch { }
                setCompleted(true);
            }
        }, 150);
    };

    if (completed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black">
                <div className="border border-[#00FF94] p-8 flex flex-col items-center relative">
                    {/* Corner Marks */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00FF94]" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00FF94]" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00FF94]" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00FF94]" />

                    <Check className="w-12 h-12 text-[#00FF94] mb-4" strokeWidth={1.5} />
                    <h1 className="text-xl font-mono uppercase tracking-widest text-white mb-2 text-center">
                        CALIBRATION<br />COMPLETE
                    </h1>
                    <p className="text-[10px] font-mono text-[#555555] text-center mb-8 tracking-widest">
                        DATA SYNCED TO BIO-TWIN CORE
                    </p>

                    <Link href="/mobile-dark" className="w-full">
                        <button className="w-full py-3 bg-[#00FF94] text-black font-mono uppercase tracking-widest text-xs font-bold hover:bg-white transition-colors">
                            RETURN TO DASHBOARD
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Header */}
            <div className="px-5 pt-14 pb-4 border-b border-[#111111] flex items-center justify-between">
                <Link href="/mobile-dark" className="p-2 -ml-2">
                    <ChevronLeft className="w-5 h-5 text-[#666666]" />
                </Link>
                <span className="text-[10px] font-mono text-[#00FF94] tracking-widest">
                    STEP {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Progress Line */}
            <div className="h-[2px] bg-[#111111] w-full">
                <motion.div
                    className="h-full bg-[#00FF94]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h1 className="text-3xl font-sans font-bold tracking-tighter text-white mb-8 leading-none">
                            {language === 'en' ? currentQuestion.titleEn : currentQuestion.titleZh}
                        </h1>

                        <div className="space-y-[1px] border border-[#222222] bg-[#222222]">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = answers[currentQuestion.id] === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className="w-full p-5 flex items-center justify-between transition-all group relative overflow-hidden"
                                        style={{
                                            background: isSelected ? '#00FF94' : '#000000',
                                        }}
                                    >
                                        <span
                                            className={`text-sm font-mono uppercase tracking-widest transition-colors ${isSelected ? 'text-black font-bold' : 'text-[#888888] group-hover:text-white'}`}
                                        >
                                            {language === 'en' ? option.labelEn : option.labelZh}
                                        </span>

                                        {isSelected && <ArrowRight className="w-4 h-4 text-black" />}

                                        {/* Hover effect for desktop, or visual indicator */}
                                        {!isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00FF94] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
