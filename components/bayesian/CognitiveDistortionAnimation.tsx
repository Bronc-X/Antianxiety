'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Scale, Shield, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface CognitiveDistortionAnimationProps {
    prior: number;       // The "Subjective Fear" (e.g. 70%)
    posterior: number;   // The "Objective Reality" (e.g. 50%)
    distortionLabel?: string;
}

export const CognitiveDistortionAnimation: React.FC<CognitiveDistortionAnimationProps> = ({
    prior,
    posterior,
    distortionLabel = "Emotional Amplification"
}) => {
    const { t } = useI18n();
    // Calculate the "excess" fear
    const distortion = Math.max(0, prior - posterior);
    const distortionPercent = Math.round((distortion / prior) * 100);

    return (
        <div className="w-full bg-[#FAF6EF] dark:bg-neutral-800/50 rounded-2xl p-6 border border-[#E7E1D6]/50 relative overflow-hidden">
            {/* Context Legend */}
            <div className="flex justify-between items-center mb-8 text-xs font-medium tracking-wider uppercase text-[#0B3D2E]/40">
                <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-[#8B6914]" />
                    <span>{t('bayesian.fear')} (Prior)</span>
                </div>
                <div className="flex items-center gap-2">
                    <Scale className="w-3 h-3 text-[#5A7A4A]" />
                    <span>{t('bayesian.truth')} (Posterior)</span>
                </div>
            </div>

            {/* The Balance Beam Container */}
            <div className="relative h-24 flex items-center justify-center">

                {/* 1. Prior Bar (The "Phantom" Size) */}
                <div className="w-full h-8 bg-[#E7E1D6] rounded-full overflow-hidden relative flex">
                    {/* The Objective Part (Green) */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${posterior}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-[#5A7A4A] relative z-10"
                    />

                    {/* The Distortion Part (Gold/Orange) - This represents the excess fear */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${distortion}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className="h-full bg-[#8B6914] relative z-0 flex items-center justify-center overflow-hidden"
                    >
                        {/* Shimmer effect to show it's "fake" or "amplified" */}
                        <div className="absolute inset-0 bg-white/20 skew-x-12 animate-shimmer" />
                    </motion.div>
                </div>

                {/* Floating Labels */}
                <div className="absolute top-0 w-full h-full pointer-events-none">
                    {/* Fear Label */}
                    <motion.div
                        className="absolute -top-6 text-[#8B6914] font-bold"
                        initial={{ left: '0%' }}
                        animate={{ left: `${prior - 5}%` }}
                        transition={{ duration: 1.5 }}
                    >
                        {prior}%
                    </motion.div>

                    {/* Truth Label */}
                    <motion.div
                        className="absolute -bottom-6 text-[#5A7A4A] font-bold"
                        initial={{ left: '0%' }}
                        animate={{ left: `${posterior - 5}%` }}
                        transition={{ duration: 1.5 }}
                    >
                        {posterior}%
                    </motion.div>
                </div>
            </div>

            {/* Insight Message */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="mt-8 flex items-start gap-3 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-[#E7E1D6]"
            >
                <div className="p-2 bg-[#8B6914]/10 rounded-lg shrink-0">
                    <Brain className="w-4 h-4 text-[#8B6914]" />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-[#0B3D2E] mb-1">{t('ritual.distortion.detected')}</h4>
                    <p className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                        {t('ritual.distortion.analysis').replace('{percent}', distortionPercent.toString())}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
