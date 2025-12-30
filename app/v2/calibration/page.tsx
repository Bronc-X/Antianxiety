'use client';

/**
 * V2 Daily Calibration Page
 * 
 * 每日校准，收集用户当日健康数据
 * 数据存储到 Supabase
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCalibration } from '@/hooks/domain/useCalibration';

const QUESTIONS = [
    {
        id: 'sleep_hours',
        question: '昨晚睡了多久？',
        type: 'slider',
        min: 4,
        max: 12,
        step: 0.5,
        unit: '小时',
        defaultValue: 7,
    },
    {
        id: 'sleep_quality',
        question: '睡眠质量如何？',
        type: 'options',
        options: [
            { label: '很差', value: 'poor', icon: '😫' },
            { label: '一般', value: 'fair', icon: '😐' },
            { label: '不错', value: 'good', icon: '😊' },
            { label: '很好', value: 'excellent', icon: '😄' },
        ],
    },
    {
        id: 'energy_level',
        question: '现在的能量状态？',
        type: 'options',
        options: [
            { label: '疲惫', value: 'low', icon: '🔋' },
            { label: '一般', value: 'medium', icon: '🔋' },
            { label: '充沛', value: 'high', icon: '🔋' },
        ],
    },
    {
        id: 'stress_level',
        question: '今天的压力水平？',
        type: 'options',
        options: [
            { label: '很大', value: 'high', icon: '😰' },
            { label: '中等', value: 'medium', icon: '😐' },
            { label: '轻松', value: 'low', icon: '😌' },
        ],
    },
];

export default function V2CalibrationPage() {
    const router = useRouter();
    const { save, isLoading, todayData } = useCalibration();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [sliderValue, setSliderValue] = useState(7);

    const currentQuestion = QUESTIONS[currentStep];
    const isLastQuestion = currentStep === QUESTIONS.length - 1;

    const handleAnswer = async (value: string | number) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        if (isLastQuestion) {
            // 保存到数据库
            const success = await save({
                sleep_duration_minutes: Number(newAnswers.sleep_hours || 7) * 60,
                sleep_quality: String(newAnswers.sleep_quality || 'good'),
                energy_level: String(newAnswers.energy_level || 'medium'),
                stress_level: String(newAnswers.stress_level || 'medium'),
                mood_status: 'neutral',
            });

            if (success) {
                console.log('[V2 Calibration] 校准完成，数据已保存');
                router.push('/v2/home');
            }
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    // 如果今天已校准
    if (todayData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <span className="text-6xl mb-4 block">✅</span>
                    <h1 className="text-2xl font-bold text-white mb-2">今日已校准</h1>
                    <p className="text-emerald-400/60 mb-8">明天再来吧</p>
                    <Link
                        href="/v2/home"
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-colors"
                    >
                        返回首页
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Progress */}
            <div className="w-full max-w-md mb-8">
                <div className="flex justify-between text-emerald-400/60 text-sm mb-2">
                    <span>⚡ 每日校准</span>
                    <span>{currentStep + 1} / {QUESTIONS.length}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                        animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md"
            >
                <h2 className="text-2xl font-bold text-white mb-8 text-center">
                    {currentQuestion.question}
                </h2>

                {currentQuestion.type === 'slider' ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <span className="text-5xl font-bold text-emerald-400">
                                {sliderValue}
                            </span>
                            <span className="text-emerald-400/60 ml-2">{currentQuestion.unit}</span>
                        </div>
                        <input
                            type="range"
                            min={currentQuestion.min}
                            max={currentQuestion.max}
                            step={currentQuestion.step}
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <button
                            onClick={() => handleAnswer(sliderValue)}
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-semibold disabled:opacity-50"
                        >
                            {isLoading ? '保存中...' : '下一步'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentQuestion.options?.map((option, index) => (
                            <motion.button
                                key={option.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleAnswer(option.value)}
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
                )}
            </motion.div>
        </div>
    );
}
