'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Clock, BookOpen, ExternalLink, Check, ChevronRight, Sparkles, Target, FileText } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Tab component
function TabButton({
    active,
    onClick,
    children
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all ${active
                    ? 'bg-[#0B3D2E] text-white shadow-lg shadow-[#0B3D2E]/20'
                    : 'text-gray-500'
                }`}
        >
            {children}
        </motion.button>
    );
}

// Feed Item Card
function FeedCard({
    title,
    summary,
    source,
    readTime,
    category,
    delay
}: {
    title: string;
    summary: string;
    source: string;
    readTime: number;
    category: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
                try {
                    await Haptics.impact({ style: ImpactStyle.Light });
                } catch { }
            }}
            className="rounded-[24px] p-5"
            style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-[#0B3D2E] bg-[#0B3D2E]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {category}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readTime} min
                </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
                {title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {summary}
            </p>
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {source}
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </motion.div>
    );
}

// Plan Step Card
function PlanStepCard({
    step,
    onToggle,
    delay
}: {
    step: {
        id: string;
        title: string;
        description: string;
        completed: boolean;
        time?: string;
    };
    onToggle: () => void;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggle}
            className={`rounded-[24px] p-5 transition-all ${step.completed ? 'opacity-60' : ''
                }`}
            style={{
                background: step.completed
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: step.completed
                    ? '2px solid rgba(11, 61, 46, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: step.completed
                    ? 'none'
                    : '0 8px 32px rgba(0, 0, 0, 0.06)',
            }}
        >
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <motion.div
                    animate={{
                        backgroundColor: step.completed ? '#0B3D2E' : '#F3F4F6',
                        scale: step.completed ? 1 : 0.9,
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                >
                    <AnimatePresence>
                        {step.completed && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Check className="w-4 h-4 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${step.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {step.title}
                        </h4>
                        {step.time && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {step.time}
                            </span>
                        )}
                    </div>
                    <p className={`text-sm ${step.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// Mock data
const feedItems = [
    {
        id: '1',
        title: 'HRV与焦虑：新研究揭示心率变异性如何预测情绪状态',
        summary: '斯坦福大学最新研究表明，心率变异性可以提前24小时预测焦虑发作...',
        source: 'Nature Medicine',
        readTime: 5,
        category: 'HRV',
    },
    {
        id: '2',
        title: '正念冥想对自主神经系统的长期影响',
        summary: '为期8周的正念训练可显著提高基线HRV，改善压力恢复能力...',
        source: 'JAMA Psychiatry',
        readTime: 7,
        category: 'Mindfulness',
    },
    {
        id: '3',
        title: '睡眠质量与第二天工作效率的量化关系',
        summary: '深度睡眠每增加30分钟，第二天认知表现提升15%...',
        source: 'Sleep Research',
        readTime: 4,
        category: 'Sleep',
    },
];

const initialPlanSteps = [
    {
        id: '1',
        title: '晨间深呼吸',
        description: '吸气4秒，屏息4秒，呼气6秒，重复5次',
        completed: true,
        time: '起床后',
    },
    {
        id: '2',
        title: '午间短走',
        description: '午餐后慢走10分钟，专注呼吸',
        completed: true,
        time: '午餐后',
    },
    {
        id: '3',
        title: '渐进放松',
        description: '睡前10分钟渐进式肌肉放松',
        completed: false,
        time: '睡前',
    },
    {
        id: '4',
        title: '创意表达',
        description: '每周1次创意活动（绘画、写作等）',
        completed: false,
    },
];

export default function MobileDiscover() {
    const { language } = useI18n();
    const [activeTab, setActiveTab] = useState<'feed' | 'plans'>('feed');
    const [planSteps, setPlanSteps] = useState(initialPlanSteps);

    const toggleStep = async (stepId: string) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        const step = planSteps.find(s => s.id === stepId);
        if (step && !step.completed) {
            try {
                await Haptics.notification({ type: NotificationType.Success });
            } catch { }
        }

        setPlanSteps(prev => prev.map(s =>
            s.id === stepId ? { ...s, completed: !s.completed } : s
        ));
    };

    const completedCount = planSteps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / planSteps.length) * 100);

    return (
        <div
            className="min-h-screen pb-8"
            style={{
                background: 'linear-gradient(180deg, #F0F4F8 0%, #FFFFFF 100%)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-4">
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-gray-900 mb-4"
                >
                    {language === 'en' ? 'Discover' : '发现'}
                </motion.h1>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl"
                >
                    <TabButton
                        active={activeTab === 'feed'}
                        onClick={async () => {
                            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { }
                            setActiveTab('feed');
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" />
                            {language === 'en' ? 'Feed' : '资讯'}
                        </div>
                    </TabButton>
                    <TabButton
                        active={activeTab === 'plans'}
                        onClick={async () => {
                            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { }
                            setActiveTab('plans');
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Target className="w-4 h-4" />
                            {language === 'en' ? 'Plans' : '计划'}
                        </div>
                    </TabButton>
                </motion.div>
            </div>

            {/* Content */}
            <div className="px-5">
                <AnimatePresence mode="wait">
                    {activeTab === 'feed' ? (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {feedItems.map((item, i) => (
                                <FeedCard key={item.id} {...item} delay={i * 0.1} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="plans"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Plan Header Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-[24px] p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #0B3D2E 0%, #1a5c47 100%)',
                                    boxShadow: '0 12px 40px rgba(11, 61, 46, 0.25)',
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center">
                                        <Sparkles className="w-7 h-7 text-[#D4AF37]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white mb-1">
                                            {language === 'en' ? 'AI Recovery Plan' : 'Max 个性化计划'}
                                        </h3>
                                        <p className="text-white/60 text-sm">
                                            {progress}% {language === 'en' ? 'complete' : '已完成'}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-[#D4AF37] rounded-full"
                                    />
                                </div>
                            </motion.div>

                            {/* Plan Steps */}
                            {planSteps.map((step, i) => (
                                <PlanStepCard
                                    key={step.id}
                                    step={step}
                                    onToggle={() => toggleStep(step.id)}
                                    delay={0.1 + i * 0.1}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
