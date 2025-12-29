'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Check, ChevronRight, Clock, Target, Sparkles } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface PlanStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    time?: string;
}

interface Plan {
    id: string;
    name: string;
    progress: number;
    duration: string;
    steps: PlanStep[];
}

const mockPlan: Plan = {
    id: '1',
    name: 'Max 个性化计划',
    progress: 75,
    duration: '14 天',
    steps: [
        {
            id: '1',
            title: '晨间深呼吸',
            description: '起床后做3分钟深呼吸练习：吸气4秒，屏息4秒，呼气6秒，重复5次',
            completed: true,
            time: '起床后',
        },
        {
            id: '2',
            title: '午间短走',
            description: '午餐后慢走10分钟，专注于感受脚步和呼吸',
            completed: true,
            time: '午餐后',
        },
        {
            id: '3',
            title: '渐进放松',
            description: '睡前进行10分钟渐进式肌肉放松',
            completed: false,
            time: '睡前',
        },
        {
            id: '4',
            title: '创意表达',
            description: '每周进行1次创意活动（绘画、写作、音乐等）',
            completed: false,
        },
    ],
};

export default function MobilePlans() {
    const { language } = useI18n();
    const [plan, setPlan] = useState<Plan>(mockPlan);

    const toggleStep = async (stepId: string) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        setPlan(prev => ({
            ...prev,
            steps: prev.steps.map(step =>
                step.id === stepId ? { ...step, completed: !step.completed } : step
            ),
        }));

        // Check if completing step (not uncompleting)
        const step = plan.steps.find(s => s.id === stepId);
        if (step && !step.completed) {
            try {
                await Haptics.notification({ type: NotificationType.Success });
            } catch { }
        }
    };

    const completedCount = plan.steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / plan.steps.length) * 100);

    return (
        <div className="px-4 pt-4 pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-[#D4AF37] font-medium uppercase tracking-wider">
                            {language === 'en' ? 'Your Plan' : '你的计划'}
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {language === 'en' ? 'AI Recovery Plan' : '个性化行动方案'}
                        </h1>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 flex items-center gap-1"
                    >
                        <Clock className="w-4 h-4" />
                        {language === 'en' ? 'History' : '历史计划'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Plan Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-5 shadow-sm mb-6"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{plan.duration}</span>
                            <span>•</span>
                            <span className="text-[#0B3D2E] font-medium">{progress}% {language === 'en' ? 'complete' : '已完成'}</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#D4AF37]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
            </motion.div>

            {/* Steps List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {plan.steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleStep(step.id)}
                            className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${step.completed ? 'border-[#0B3D2E]/20' : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <motion.div
                                    animate={{
                                        backgroundColor: step.completed ? '#0B3D2E' : '#F3F4F6',
                                        borderColor: step.completed ? '#0B3D2E' : '#E5E7EB',
                                    }}
                                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                                >
                                    <AnimatePresence>
                                        {step.completed && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Check className="w-3 h-3 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-medium ${step.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {step.title}
                                        </h4>
                                        {step.time && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {step.time}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${step.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {step.description}
                                    </p>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* AI Suggestion */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-gradient-to-br from-[#0B3D2E] to-[#1a5c47] rounded-2xl p-4"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">
                        Max {language === 'en' ? 'Suggestion' : '建议'}
                    </span>
                </div>
                <p className="text-white text-sm leading-relaxed">
                    {language === 'en'
                        ? "Based on your recent HRV data, I recommend focusing on the breathing exercise today. Your recovery is looking good!"
                        : "根据你最近的 HRV 数据，我建议今天重点完成呼吸练习。你的恢复状态看起来不错！"
                    }
                </p>
            </motion.div>
        </div>
    );
}
