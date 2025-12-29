'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Clock, Check, ChevronRight, Sparkles } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { InsightCard } from '@/components/mobile-dark/DarkComponents';

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
            className="flex-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-all"
            style={{
                background: active ? '#00FF94' : 'transparent',
                color: active ? '#000000' : '#555555',
                border: active ? '1px solid #00FF94' : '1px solid #222222',
            }}
        >
            {children}
        </motion.button>
    );
}

// Feed Item
interface FeedItem {
    id: string;
    source: string;
    title: string;
    readTime: number;
}

const feedItems: FeedItem[] = [
    {
        id: '1',
        source: 'NATURE MEDICINE',
        title: 'HRV patterns predict stress episodes 24 hours in advance',
        readTime: 5,
    },
    {
        id: '2',
        source: 'JAMA PSYCHIATRY',
        title: 'Chronic stress reduces vagal tone by 15% over 3 months',
        readTime: 7,
    },
    {
        id: '3',
        source: 'SLEEP JOURNAL',
        title: 'Deep sleep optimization through temperature regulation',
        readTime: 4,
    },
];

// Plan Step
interface PlanStep {
    id: string;
    title: string;
    time?: string;
    completed: boolean;
}

const initialSteps: PlanStep[] = [
    { id: '1', title: 'Morning breath work', time: '07:00', completed: true },
    { id: '2', title: 'Midday walk', time: '12:30', completed: true },
    { id: '3', title: 'Evening wind-down', time: '21:00', completed: false },
    { id: '4', title: 'Sleep optimization', time: '22:30', completed: false },
];

export default function DarkDiscover() {
    const { language } = useI18n();
    const [activeTab, setActiveTab] = useState<'feed' | 'plan'>('feed');
    const [steps, setSteps] = useState(initialSteps);

    const toggleStep = async (stepId: string) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }

        const step = steps.find(s => s.id === stepId);
        if (step && !step.completed) {
            try {
                await Haptics.notification({ type: NotificationType.Success });
            } catch { }
        }

        setSteps(prev => prev.map(s =>
            s.id === stepId ? { ...s, completed: !s.completed } : s
        ));
    };

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <div
            className="min-h-screen pb-8"
            style={{ background: '#000000' }}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-4">
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-mono uppercase tracking-tight mb-4"
                    style={{ color: '#FFFFFF' }}
                >
                    {language === 'en' ? 'DISCOVER' : '发现'}
                </motion.h1>

                {/* Tabs */}
                <div className="flex gap-[1px]" style={{ background: '#1A1A1A' }}>
                    <TabButton
                        active={activeTab === 'feed'}
                        onClick={async () => {
                            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { }
                            setActiveTab('feed');
                        }}
                    >
                        {language === 'en' ? 'RESEARCH' : '研究'}
                    </TabButton>
                    <TabButton
                        active={activeTab === 'plan'}
                        onClick={async () => {
                            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { }
                            setActiveTab('plan');
                        }}
                    >
                        {language === 'en' ? 'PROTOCOL' : '方案'}
                    </TabButton>
                </div>
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
                            className="space-y-[1px]"
                            style={{ background: '#1A1A1A' }}
                        >
                            {feedItems.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={async () => {
                                        try {
                                            await Haptics.impact({ style: ImpactStyle.Light });
                                        } catch { }
                                    }}
                                    className="p-4 flex items-start justify-between"
                                    style={{ background: '#0A0A0A' }}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3" style={{ background: '#00FF94' }} />
                                            <span
                                                className="text-[9px] font-mono uppercase tracking-wider"
                                                style={{ color: '#555555' }}
                                            >
                                                {item.source}
                                            </span>
                                        </div>
                                        <p
                                            className="text-sm font-medium leading-snug mb-2"
                                            style={{ color: '#CCCCCC' }}
                                        >
                                            {item.title}
                                        </p>
                                        <span
                                            className="text-[10px] font-mono flex items-center gap-1"
                                            style={{ color: '#444444' }}
                                        >
                                            <Clock className="w-3 h-3" />
                                            {item.readTime} MIN
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 mt-1" style={{ color: '#333333' }} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Plan Header */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4"
                                style={{
                                    background: '#0A0A0A',
                                    border: '1px solid #007AFF40',
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-10 h-10 flex items-center justify-center"
                                        style={{
                                            background: '#007AFF20',
                                            border: '1px solid #007AFF50',
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5" style={{ color: '#007AFF' }} />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-mono uppercase tracking-wider text-sm"
                                            style={{ color: '#FFFFFF' }}
                                        >
                                            {language === 'en' ? 'RECOVERY PROTOCOL' : '恢复方案'}
                                        </h3>
                                        <p
                                            className="text-[10px] font-mono"
                                            style={{ color: '#007AFF' }}
                                        >
                                            {progress}% COMPLETE
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-[2px]" style={{ background: '#1A1A1A' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full"
                                        style={{ background: '#007AFF' }}
                                    />
                                </div>
                            </motion.div>

                            {/* Steps */}
                            <div className="space-y-[1px]" style={{ background: '#1A1A1A' }}>
                                {steps.map((step, i) => (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleStep(step.id)}
                                        className="p-4 flex items-center gap-4"
                                        style={{
                                            background: '#0A0A0A',
                                            opacity: step.completed ? 0.5 : 1,
                                        }}
                                    >
                                        <div
                                            className="w-5 h-5 flex items-center justify-center"
                                            style={{
                                                background: step.completed ? '#00FF94' : 'transparent',
                                                border: `1px solid ${step.completed ? '#00FF94' : '#333333'}`,
                                            }}
                                        >
                                            {step.completed && (
                                                <Check className="w-3 h-3" style={{ color: '#000000' }} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className="text-sm font-mono uppercase tracking-wide"
                                                style={{
                                                    color: step.completed ? '#666666' : '#CCCCCC',
                                                    textDecoration: step.completed ? 'line-through' : 'none',
                                                }}
                                            >
                                                {step.title}
                                            </p>
                                        </div>
                                        {step.time && (
                                            <span
                                                className="text-[10px] font-mono"
                                                style={{ color: '#444444' }}
                                            >
                                                {step.time}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
