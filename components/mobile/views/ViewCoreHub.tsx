'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ClipboardList,
    Brain,
    MessageSquare,
    Mic,
    Sparkles,
    Layers,
    Bug,
    UserCheck,
    BookOpen
} from 'lucide-react';
import { CardGlass } from '@/components/mobile/HealthWidgets';
import { cn } from '@/lib/utils';

type ModuleStatus = 'ready' | 'soon';

interface CoreModule {
    id: string;
    title: string;
    description: string;
    icon: typeof ClipboardList;
    iconBg: string;
    iconColor: string;
    status: ModuleStatus;
}

const modules: CoreModule[] = [
    {
        id: 'daily-questionnaire',
        title: 'Daily Check-in',
        description: 'Quick questionnaire + bio-twin refresh pipeline.',
        icon: ClipboardList,
        iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
        iconColor: 'text-emerald-600',
        status: 'ready'
    },
    {
        id: 'bayesian-loop',
        title: 'Bayesian Loop',
        description: 'Belief updates + evidence stack visualization.',
        icon: Brain,
        iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
        iconColor: 'text-indigo-600',
        status: 'ready'
    },
    {
        id: 'inquiry-center',
        title: 'Inquiry Center',
        description: 'Pending + proactive inquiry sessions.',
        icon: MessageSquare,
        iconBg: 'bg-sky-100 dark:bg-sky-500/20',
        iconColor: 'text-sky-600',
        status: 'ready'
    },
    {
        id: 'voice-analysis',
        title: 'Voice Analysis',
        description: 'Capture and analyze voice stress markers.',
        icon: Mic,
        iconBg: 'bg-amber-100 dark:bg-amber-500/20',
        iconColor: 'text-amber-600',
        status: 'ready'
    },
    {
        id: 'max-labs',
        title: 'Max Labs',
        description: 'Advanced Max API + chat payload tools.',
        icon: Sparkles,
        iconBg: 'bg-rose-100 dark:bg-rose-500/20',
        iconColor: 'text-rose-600',
        status: 'ready'
    },
    {
        id: 'adaptive-onboarding',
        title: 'Adaptive Onboarding',
        description: 'Goal recommendations + phase goal tuning.',
        icon: UserCheck,
        iconBg: 'bg-teal-100 dark:bg-teal-500/20',
        iconColor: 'text-teal-600',
        status: 'ready'
    },
    {
        id: 'core-insight',
        title: 'Insight Engine',
        description: 'Deep inference, insights, and understanding score.',
        icon: Layers,
        iconBg: 'bg-violet-100 dark:bg-violet-500/20',
        iconColor: 'text-violet-600',
        status: 'ready'
    },
    {
        id: 'curated-feed',
        title: 'Curated Feed',
        description: 'Aggregated research feed + feedback loop.',
        icon: BookOpen,
        iconBg: 'bg-orange-100 dark:bg-orange-500/20',
        iconColor: 'text-orange-600',
        status: 'ready'
    },
    {
        id: 'debug-session',
        title: 'Debug Session',
        description: 'Diagnostics + session tooling.',
        icon: Bug,
        iconBg: 'bg-stone-200 dark:bg-white/10',
        iconColor: 'text-stone-600',
        status: 'ready'
    }
];

interface ViewCoreHubProps {
    onBack?: () => void;
    onNavigate?: (view: string) => void;
}

export const ViewCoreHub = ({ onBack, onNavigate }: ViewCoreHubProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Core Features</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Hook-to-UI integration hub</p>
                </div>
            </div>

            <div className="grid gap-4">
                {modules.map((module) => {
                    const isReady = module.status === 'ready';
                    const Icon = module.icon;
                    return (
                        <CardGlass
                            key={module.id}
                            className={cn(
                                'p-4 flex items-start gap-4',
                                isReady ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
                            )}
                            onClick={() => {
                                if (!isReady) return;
                                onNavigate?.(module.id);
                            }}
                        >
                            <div className={cn('p-3 rounded-xl', module.iconBg, module.iconColor)}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
                                        {module.title}
                                    </h3>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full',
                                            isReady
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-400'
                                        )}
                                    >
                                        {isReady ? 'Ready' : 'Soon'}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        </CardGlass>
                    );
                })}
            </div>
        </motion.div>
    );
};
