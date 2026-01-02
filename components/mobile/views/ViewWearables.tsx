/**
 * ViewWearables - Manage Device Integrations
 * 
 * Allows users to connect/disconnect wearable devices (Oura, Fitbit, Apple Health).
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Watch,
    Smartphone,
    CheckCircle2,
    XCircle,
    RotateCw,
    ExternalLink,
    ChevronRight,
    ArrowLeft,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWearables, type WearableProvider } from '@/hooks/domain/useWearables';
import { CardGlass } from '@/components/mobile/HealthWidgets';

// ============================================
// Configuration
// ============================================

const PROVIDERS: { id: WearableProvider; name: string; icon: any; color: string; description: string }[] = [
    {
        id: 'oura',
        name: 'Oura Ring',
        icon: Activity, // Placeholder, usually a ring icon
        color: 'text-stone-800 dark:text-white',
        description: 'Sleep, Readiness and Activity score syncing.'
    },
    {
        id: 'apple_health',
        name: 'Apple Health',
        icon: Activity, // Heart icon often used
        color: 'text-rose-500',
        description: 'Sync steps, workouts, and sleep from HealthKit.'
    },
    {
        id: 'fitbit',
        name: 'Fitbit',
        icon: Watch,
        color: 'text-emerald-500',
        description: 'Activity, heart rate, and sleep data.'
    },
    {
        id: 'garmin',
        name: 'Garmin',
        icon: Watch,
        color: 'text-blue-500',
        description: 'Advanced sports metrics and recovery stats.'
    },
    {
        id: 'whoop',
        name: 'WHOOP',
        icon: Activity,
        color: 'text-stone-900 dark:text-stone-100',
        description: 'Strain and Recovery monitoring.'
    }
];

// ============================================
// Types
// ============================================

interface ViewWearablesProps {
    onBack?: () => void;
}

// ============================================
// Main Component
// ============================================

export const ViewWearables = ({ onBack }: ViewWearablesProps) => {
    const {
        status,
        isLoading,
        isConnecting,
        connect,
        disconnect,
        loadStatus,
        isProviderConnected
    } = useWearables();

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const handleConnect = async (provider: WearableProvider) => {
        const url = await connect(provider);
        if (url) {
            window.location.href = url;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Integrations</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Manage your connected devices</p>
                </div>
            </div>

            {/* Provider List */}
            <div className="space-y-3">
                {PROVIDERS.map((provider) => {
                    const isConnected = isProviderConnected(provider.id);
                    const ProviderIcon = provider.icon;

                    return (
                        <CardGlass
                            key={provider.id}
                            className="p-4 flex flex-col gap-3 group relative overflow-hidden"
                            onClick={() => !isConnected ? handleConnect(provider.id) : null}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2.5 rounded-xl bg-stone-100 dark:bg-white/5", provider.color)}>
                                        <ProviderIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-emerald-950 dark:text-emerald-50">{provider.name}</h3>
                                        {isConnected ? (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                <CheckCircle2 size={12} />
                                                <span>Connected</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 mt-0.5">
                                                <XCircle size={12} />
                                                <span>Not Connected</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="z-10">
                                    {isConnected ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                disconnect(provider.id);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnect(provider.id);
                                            }}
                                            disabled={isConnecting}
                                            className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5"
                                        >
                                            Connect <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pr-8">
                                {provider.description}
                            </p>
                        </CardGlass>
                    );
                })}
            </div>

            {/* Sync Disclaimer */}
            <div className="px-4 py-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/5">
                <div className="flex items-start gap-3">
                    <Info size={16} className="text-stone-400 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">Data Privacy</h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                            Your health data is encrypted and used solely to personalize your Anti-Anxiety plan.
                            We never sell your data to third parties.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
