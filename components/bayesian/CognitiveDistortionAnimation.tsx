'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Scale, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface CognitiveDistortionAnimationProps {
    prior: number;       // The "Subjective Fear" (e.g. 70%)
    posterior: number;   // The "Objective Reality" (e.g. 50%)
}

export const CognitiveDistortionAnimation: React.FC<CognitiveDistortionAnimationProps> = ({
    prior,
    posterior
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

                {/* Progress Bar */}
                <div className="w-full h-8 bg-[#E7E1D6] rounded-full overflow-hidden relative">
                    {/* Step 1: Yellow (Fear/Prior) rises to 70% */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prior}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute left-0 top-0 h-full bg-[#8B6914] flex items-center justify-center overflow-hidden"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-white/20 skew-x-12 animate-shimmer" />
                    </motion.div>

                    {/* Step 2: Green (Truth/Posterior) calibrates down to 50% */}
                    <motion.div
                        initial={{ width: `${prior}%` }}
                        animate={{ width: `${posterior}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 1.5 }}
                        className="absolute left-0 top-0 h-full bg-[#5A7A4A] z-10"
                    />
                </div>

                {/* Floating Labels */}
                <div className="absolute top-0 w-full h-full pointer-events-none">
                    {/* Fear Label (Yellow) - shows at prior position first */}
                    <motion.div
                        className="absolute -top-6 text-[#8B6914] font-bold text-sm"
                        initial={{ left: '0%', opacity: 0 }}
                        animate={{ left: `${prior - 5}%`, opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        {prior}%
                    </motion.div>

                    {/* Truth Label (Green) - appears after calibration */}
                    <motion.div
                        className="absolute -bottom-6 text-[#5A7A4A] font-bold text-sm"
                        initial={{ left: `${prior - 5}%`, opacity: 0 }}
                        animate={{ left: `${posterior - 5}%`, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 1.5 }}
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
