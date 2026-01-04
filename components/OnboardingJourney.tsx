'use client';

/**
 * OnboardingJourney Component - Horizontal Journey Map Style
 * 
 * A clean, visible journey map showing the 5-step path with
 * step indicators and descriptions. No overlay/blur effects.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Heart, Clock, Dna, Compass, Check } from 'lucide-react';
import MaxAvatar from '@/components/max/MaxAvatar';

interface OnboardingJourneyProps {
    onComplete: () => void;
    onSkip?: () => void;
}

const JOURNEY_STEPS = [
    {
        id: 'welcome',
        color: 'emerald',
        colorClass: 'bg-emerald-500',
        lightColorClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-600',
        titleZh: '欢迎来到 AntiAnxiety',
        subtitleZh: '反焦虑',
        descriptionZh: '我们一起开启接下来的旅程。你将了解如何与 Max 建立专属的健康连接。',
        icon: null,
        useMaxAvatar: true,
    },
    {
        id: 'assessment',
        color: 'emerald',
        colorClass: 'bg-emerald-500',
        lightColorClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-600',
        titleZh: '科学评估',
        subtitleZh: '建立你的心理健康基线',
        descriptionZh: '通过 GAD-7、PHQ-9、ISI 等国际权威临床量表，精准评估你的焦虑、情绪与睡眠状态。这些量表经过全球50+国家验证。',
        icon: <Sparkles className="w-6 h-6" />,
    },
    {
        id: 'inquiry',
        color: 'rose',
        colorClass: 'bg-rose-500',
        lightColorClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        textClass: 'text-rose-600',
        titleZh: 'Max 主动关怀',
        subtitleZh: '像朋友一样关心你',
        descriptionZh: 'Max 会主动关注你的状态变化，在适当时候温柔询问你的感受，而不只是被动回答问题。',
        icon: <Heart className="w-6 h-6" />,
    },
    {
        id: 'calibration',
        color: 'amber',
        colorClass: 'bg-amber-500',
        lightColorClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        textClass: 'text-amber-600',
        titleZh: '每日校准',
        subtitleZh: '30秒，让理解更精准',
        descriptionZh: '每天只需30秒的简短互动，Max 对你的了解就能趋近90%的相似度。时间越久，越懂你。',
        icon: <Clock className="w-6 h-6" />,
    },
    {
        id: 'digital-twin',
        color: 'indigo',
        colorClass: 'bg-indigo-500',
        lightColorClass: 'bg-indigo-50',
        borderClass: 'border-indigo-200',
        textClass: 'text-indigo-600',
        titleZh: '数字孪生',
        subtitleZh: '你的专属健康模型',
        descriptionZh: '基于认知行为理论和神经可塑性原理，Max 为你构建独一无二的数字孪生，提前预测情绪波动。',
        icon: <Dna className="w-6 h-6" />,
    },
    {
        id: 'value',
        color: 'sky',
        colorClass: 'bg-sky-500',
        lightColorClass: 'bg-sky-50',
        borderClass: 'border-sky-200',
        textClass: 'text-sky-600',
        titleZh: '你将获得',
        subtitleZh: '全球首例个人健康智能体',
        descriptionZh: '一位始终陪伴的健康伙伴。Max 融合临床心理学与人工智能，帮助你理解自己，掌控焦虑，活得更好。',
        icon: <Compass className="w-6 h-6" />,
    },
];

export default function OnboardingJourney({ onComplete, onSkip }: OnboardingJourneyProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const step = JOURNEY_STEPS[currentStep];
    const isLastStep = currentStep === JOURNEY_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const goNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goPrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FAF6EF] to-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6">
                <div className="flex items-center gap-2">
                    <MaxAvatar size={32} state="idle" />
                    <span className="text-sm font-medium text-[#0B3D2E]/60">AntiAnxiety</span>
                </div>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="text-sm text-[#0B3D2E]/40 hover:text-[#0B3D2E] transition-colors"
                    >
                        跳过
                    </button>
                )}
            </div>

            {/* Journey Map - Horizontal Steps */}
            <div className="px-4 md:px-8 py-4 overflow-x-auto">
                <div className="flex items-center justify-center min-w-max gap-0">
                    {JOURNEY_STEPS.map((s, index) => (
                        <div key={s.id} className="flex items-center">
                            {/* Step Circle */}
                            <button
                                onClick={() => setCurrentStep(index)}
                                className={`relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${index === currentStep
                                        ? `${s.colorClass} text-white scale-110 shadow-lg`
                                        : index < currentStep
                                            ? `${s.colorClass} text-white`
                                            : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                {index < currentStep ? (
                                    <Check className="w-5 h-5" />
                                ) : s.useMaxAvatar ? (
                                    <MaxAvatar size={24} state="idle" />
                                ) : (
                                    <span className="text-sm font-bold">{index}</span>
                                )}
                            </button>

                            {/* Connecting Line */}
                            {index < JOURNEY_STEPS.length - 1 && (
                                <div
                                    className={`w-8 md:w-16 h-1 transition-colors duration-300 ${index < currentStep ? JOURNEY_STEPS[index + 1].colorClass : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-lg text-center"
                    >
                        {/* Icon/Avatar */}
                        <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl ${step.lightColorClass} ${step.borderClass} border-2 flex items-center justify-center`}>
                            {step.useMaxAvatar ? (
                                <MaxAvatar size={56} state="idle" />
                            ) : (
                                <div className={step.textClass}>{step.icon}</div>
                            )}
                        </div>

                        {/* Step Indicator */}
                        {!isFirstStep && (
                            <div className={`inline-block px-3 py-1 rounded-full ${step.lightColorClass} ${step.textClass} text-xs font-bold mb-3`}>
                                第 {currentStep} 步
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-[#0B3D2E] mb-2 tracking-tight">
                            {step.titleZh}
                        </h1>

                        {/* Subtitle */}
                        <p className={`text-base ${step.textClass} font-medium mb-4`}>
                            {step.subtitleZh}
                        </p>

                        {/* Description */}
                        <p className="text-[#0B3D2E]/60 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                            {step.descriptionZh}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-6 pb-8">
                <div className="flex gap-3 max-w-sm mx-auto">
                    {!isFirstStep && (
                        <button
                            onClick={goPrev}
                            className="flex-1 h-12 border border-[#0B3D2E]/20 text-[#0B3D2E] rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-[#0B3D2E]/5 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>上一步</span>
                        </button>
                    )}
                    <button
                        onClick={goNext}
                        className={`${isFirstStep ? 'w-full' : 'flex-1'} h-12 ${step.colorClass} text-white rounded-xl font-medium flex items-center justify-center gap-1 hover:opacity-90 transition-colors shadow-md`}
                    >
                        <span>{isLastStep ? '开始旅程' : '下一步'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
