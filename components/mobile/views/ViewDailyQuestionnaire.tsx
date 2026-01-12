'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import DailyQuestionnaire from '@/components/DailyQuestionnaire';
import { useProfile } from '@/hooks/domain/useProfile';

interface ViewDailyQuestionnaireProps {
    onBack?: () => void;
}

export const ViewDailyQuestionnaire = ({ onBack }: ViewDailyQuestionnaireProps) => {
    const { profile } = useProfile();

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
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Daily Check-in</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Quick calibration for today&apos;s state</p>
                </div>
            </div>

            <DailyQuestionnaire userId={profile?.id} />
        </motion.div>
    );
};
