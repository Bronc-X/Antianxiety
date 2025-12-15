'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Calculator, Divide, X, Equal, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepCalculationProps {
    prior: number;
    likelihood: number; // 0-1
    evidence: number; // 0-1
    posterior: number;
    onNext: () => void;
}

// Helper for Matrix-like number decoding
function ScrambleNumber({ value, isComplete }: { value: string | number, isComplete: boolean }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        if (!isComplete) {
            const interval = setInterval(() => {
                // Random 2 digit number
                setDisplay(Math.floor(Math.random() * 99));
            }, 50);
            return () => clearInterval(interval);
        } else {
            setDisplay(value);
        }
    }, [isComplete, value]);

    return <span>{display}</span>;
}

export default function StepCalculation({ prior, likelihood, evidence, posterior, onNext }: StepCalculationProps) {
    const { t } = useI18n();
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Dramatic calculation sequence
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsComplete(true);
                    return 100;
                }
                // Non-linear progress for realism (fast then slow)
                const increment = prev > 80 ? 0.5 : 1.5;
                return Math.min(prev + increment, 100);
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    // Format numbers for display
    const priorProb = (prior / 100).toFixed(2);
    const likelihoodProb = likelihood.toFixed(2);
    const evidenceProb = evidence.toFixed(2);

    return (
        <div className="flex flex-col h-full pt-4 md:pt-10 max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-block px-3 py-1 rounded-full bg-[#9CAF88]/10 text-[#0B3D2E] text-xs font-medium tracking-wider mb-4 border border-[#9CAF88]/20">
                    {t('ritual.calc.title')}
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-[#0B3D2E] mb-3">
                    {t('ritual.calc.subtitle')}
                </h2>
            </motion.div>

            {/* Formula Visual */}
            <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">
                <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#E7E1D6] shadow-xl shadow-[#0B3D2E]/5 relative z-10 w-full max-w-lg overflow-hidden">
                    {/* Bayes Theorem Structure */}
                    <div className="flex flex-col items-center gap-6">

                        {/* Numerator */}
                        <div className="flex items-center gap-4 text-2xl md:text-4xl font-serif text-[#0B3D2E]">
                            <motion.div
                                className="flex flex-col items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="text-xs font-sans text-[#0B3D2E]/40 uppercase tracking-widest">{t('ritual.formula.prior')}</span>
                                <span className="tabular-nums font-medium">{priorProb}</span>
                            </motion.div>

                            <X className="w-5 h-5 text-[#9CAF88]" />

                            <motion.div
                                className="flex flex-col items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="text-xs font-sans text-[#0B3D2E]/40 uppercase tracking-widest">{t('ritual.formula.likelihood')}</span>
                                <span className="tabular-nums font-medium">{likelihoodProb}</span>
                            </motion.div>
                        </div>

                        {/* Divider */}
                        <motion.div
                            className="w-full h-px bg-[#0B3D2E]/20 relative"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="absolute left-1/2 -translate-x-1/2 -top-3 p-1 bg-white items-center justify-center flex">
                                <Divide className="w-4 h-4 text-[#0B3D2E]/40" />
                            </div>
                        </motion.div>

                        {/* Denominator */}
                        <motion.div
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <span className="text-4xl font-serif text-[#0B3D2E] tabular-nums font-medium">{evidenceProb}</span>
                            <span className="text-xs font-sans text-[#0B3D2E]/40 uppercase tracking-widest">{t('ritual.formula.evidence')}</span>
                        </motion.div>

                    </div>

                    {/* Result Overlay Reveal */}
                    <motion.div
                        className="absolute inset-0 bg-[#0B3D2E] z-20 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                    >
                        <div className="text-center">
                            <div className="text-[#FAF6EF]/60 text-sm uppercase tracking-widest mb-2 font-medium">True Probability</div>
                            <div className="text-6xl md:text-7xl font-serif text-[#FAF6EF] tabular-nums tracking-tight">
                                <ScrambleNumber value={posterior} isComplete={isComplete} />%
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Progress/Action */}
            <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                {!isComplete ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-64 h-1 bg-[#E7E1D6] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#0B3D2E]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-[#0B3D2E]/50 font-medium tracking-wider animate-pulse">
                            {t('ritual.calc.calculating')}
                        </span>
                    </div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={onNext}
                        className="group relative px-8 py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl overflow-hidden shadow-lg shadow-[#0B3D2E]/20"
                    >
                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-sm font-medium tracking-wider uppercase">{t('ritual.button.reveal')}</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}
