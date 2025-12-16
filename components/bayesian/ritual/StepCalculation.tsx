'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Divide, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepCalculationProps {
    prior: number;
    likelihood: number;
    evidence: number;
    posterior: number;
    onNext: () => void;
}

function ScrambleNumber({ value, isComplete }: { value: string | number, isComplete: boolean }) {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
        if (!isComplete) {
            const interval = setInterval(() => {
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
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsComplete(true);
                    return 100;
                }
                const increment = prev > 80 ? 0.5 : 1.5;
                return Math.min(prev + increment, 100);
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const priorProb = (prior / 100).toFixed(2);
    const likelihoodProb = likelihood.toFixed(2);
    const evidenceProb = evidence.toFixed(2);

    return (
        <div className="flex flex-col h-full w-full items-center justify-center">

            {/* Main Formula Card */}
            <div className="relative w-full max-w-lg">
                {/* Matrix Backglow */}
                <div className="absolute inset-0 bg-[#E9C46A]/20 blur-[60px] rounded-full opacity-50" />

                <div className="relative z-10 bg-[#1e272e] text-[#E9C46A] p-10 rounded-3xl border border-[#E9C46A]/20 shadow-2xl overflow-hidden">

                    {/* Running Code Background Effect */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="absolute text-[10px] font-mono leading-none" style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                            }}>
                                101010010101
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-8 relative z-20">
                        {/* Equation */}
                        <div className="flex items-center gap-4 text-3xl md:text-5xl font-mono tracking-tighter">
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-sans tracking-widest opacity-50 mb-1">{t('ritual.formula.prior')}</span>
                                <span>{priorProb}</span>
                            </div>
                            <X className="w-6 h-6 opacity-50" />
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-sans tracking-widest opacity-50 mb-1">{t('ritual.formula.likelihood')}</span>
                                <span>{likelihoodProb}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-[#E9C46A]/30 flex items-center justify-center">
                            <div className="bg-[#1e272e] px-2">
                                <Divide className="w-6 h-6 opacity-50" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-3xl md:text-5xl font-mono tracking-tighter">{evidenceProb}</span>
                            <span className="text-sm font-sans tracking-widest opacity-50 mt-1">{t('ritual.formula.evidence')}</span>
                        </div>
                    </div>

                    {/* Final Reveal Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-[#E9C46A] z-30 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={isComplete ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-center text-[#1e272e]">
                            <div className="text-sm font-bold uppercase tracking-widest mb-1 opacity-60">{t('ritual.calc.posterior')}</div>
                            <div className="text-7xl font-bold font-mono tracking-tighter">
                                <ScrambleNumber value={posterior} isComplete={isComplete} />%
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Progress / Next Action */}
            <div className="mt-12 h-16 flex items-center justify-center w-full">
                {!isComplete ? (
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-[#2D3436]/40">
                            <span>{t('ritual.calc.processing')}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#E9C46A]/20 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-[#E9C46A]" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={onNext}
                        className="flex items-center gap-3 px-10 py-4 bg-[#E9C46A] text-[#1e272e] rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                        <span>{t('ritual.button.reveal')}</span>
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                )}
            </div>

        </div>
    );
}
