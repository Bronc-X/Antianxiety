'use client';

/**
 * SpotlightTour Component
 * 
 * Creates a real spotlight effect that highlights actual DOM elements.
 * Uses CSS clip-path to create a "hole" in the dark overlay.
 * Elements are targeted using data-tour-id attributes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Heart, Clock, Dna, Compass } from 'lucide-react';
import MaxAvatar from '@/components/max/MaxAvatar';

interface TourStep {
    id: string;
    targetId: string; // data-tour-id attribute value
    titleZh: string;
    subtitleZh: string;
    descriptionZh: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    icon: React.ReactNode;
    color: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        targetId: 'welcome', // Will center on screen
        titleZh: '欢迎来到 AntiAnxiety',
        subtitleZh: '反焦虑',
        descriptionZh: '让我们一起开启旅程。',
        position: 'bottom',
        icon: <MaxAvatar size={32} state="idle" />,
        color: 'emerald',
    },
    {
        id: 'calibration',
        targetId: 'tour-calibration',
        titleZh: '每日校准',
        subtitleZh: '30秒，让理解更精准',
        descriptionZh: '每天点击这里进行30秒的简短互动，Max 对你的了解就能趋近90%的相似度。时间越久，越懂你。',
        position: 'bottom',
        icon: <Clock className="w-6 h-6 text-amber-500" />,
        color: 'amber',
    },
    {
        id: 'digital-twin',
        targetId: 'tour-digital-twin',
        titleZh: '数字孪生',
        subtitleZh: '你的专属健康模型',
        descriptionZh: '基于认知行为理论和神经可塑性原理，这里展示 Max 为你构建的独一无二的数字孪生，预测你的情绪波动。',
        position: 'top',
        icon: <Dna className="w-6 h-6 text-indigo-500" />,
        color: 'indigo',
    },
    {
        id: 'hrv',
        targetId: 'tour-wearable',
        titleZh: '生理数据',
        subtitleZh: '连接你的可穿戴设备',
        descriptionZh: '连接 Apple Watch、Oura Ring 等可穿戴设备后，Max 可以获取你的心率变异性（HRV）等生理指标，帮助更全面地了解你的身体状态。',
        position: 'top',
        icon: <Heart className="w-6 h-6 text-rose-500" />,
        color: 'rose',
    },
    {
        id: 'max-chat',
        targetId: 'tour-max-chat',
        titleZh: 'Max 对话',
        subtitleZh: '你的健康智能伙伴',
        descriptionZh: '点击这里随时与 Max 对话。Max 会主动关心你，也会在你需要时给予支持。全球首例个人健康智能体。',
        position: 'top', // Changed to top so it appears above the floating button
        icon: <Compass className="w-6 h-6 text-sky-500" />,
        color: 'sky',
    },
];

interface SpotlightTourProps {
    onComplete: () => void;
    onSkip?: () => void;
}

export default function SpotlightTour({ onComplete, onSkip }: SpotlightTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;
    const isFirstStep = currentStep === 0;
    const isWelcome = step.id === 'welcome';

    // Find and measure target element
    const measureTarget = useCallback(() => {
        if (isWelcome) {
            // Center for welcome
            setTargetRect(null);
            setTooltipPosition({
                top: window.innerHeight / 2 - 150,
                left: window.innerWidth / 2 - 180,
            });
            return;
        }

        const target = document.querySelector(`[data-tour-id="${step.targetId}"]`);
        if (target) {
            const rect = target.getBoundingClientRect();
            setTargetRect(rect);

            // Calculate tooltip position based on step.position
            let top = 0, left = 0;
            const padding = 16;
            const tooltipWidth = 360;
            const tooltipHeight = 200;

            switch (step.position) {
                case 'top':
                    top = rect.top - tooltipHeight - padding;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + padding;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - padding;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + padding;
                    break;
            }

            // Keep on screen
            top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
            left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

            setTooltipPosition({ top, left });

            // Scroll into view if needed
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [step, isWelcome]);

    useEffect(() => {
        const timer = setTimeout(() => measureTarget(), 0);
        window.addEventListener('resize', measureTarget);
        window.addEventListener('scroll', measureTarget);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', measureTarget);
            window.removeEventListener('scroll', measureTarget);
        };
    }, [measureTarget]);

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

    const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
        sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600' },
    };

    const colors = colorClasses[step.color] || colorClasses.emerald;

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Dark overlay with spotlight hole */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Highlight border around target */}
            {targetRect && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute rounded-xl border-2 border-white/80 shadow-[0_0_0_4px_rgba(255,255,255,0.2)] pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                    }}
                />
            )}

            {/* Skip button */}
            {onSkip && (
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>
            )}

            {/* Progress indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="text-white/70 text-sm font-medium">
                    {currentStep + 1} / {TOUR_STEPS.length}
                </span>
                <div className="flex gap-1">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-white' : i < currentStep ? 'bg-white/60' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10"
                    style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
                >
                    {/* Header */}
                    <div className={`${colors.bg} p-4 border-b ${colors.border}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                                {step.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#0B3D2E]">{step.titleZh}</h3>
                                <p className={`text-sm ${colors.text}`}>{step.subtitleZh}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <p className="text-[#0B3D2E]/70 text-sm leading-relaxed mb-4">
                            {step.descriptionZh}
                        </p>

                        {/* Navigation */}
                        <div className="flex gap-2">
                            {!isFirstStep && (
                                <button
                                    onClick={goPrev}
                                    className="flex-1 h-10 border border-gray-200 text-[#0B3D2E] rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    上一步
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                className={`${isFirstStep ? 'w-full' : 'flex-1'} h-10 bg-[#0B3D2E] text-white rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-[#06261c] transition-colors text-sm`}
                            >
                                {isLastStep ? '完成' : '下一步'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
