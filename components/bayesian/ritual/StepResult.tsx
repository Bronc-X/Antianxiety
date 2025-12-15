'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepResultProps {
    prior: number;
    posterior: number;
    worry: string;
    onComplete: () => void;
    onRedo: () => void;
}

function Counter({ value, className }: { value: number, className?: string }) {
    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// Typewriter Effect Component
function Typewriter({ text }: { text: string }) {
    // Split text into words for smoother animation than characters
    const words = text.split(' ');

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const child = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.p
            variants={container}
            initial="hidden"
            animate="visible"
            className="text-[#0B3D2E]/70 leading-relaxed mb-6 flex flex-wrap gap-x-1.5"
        >
            {words.map((word, i) => (
                <motion.span key={i} variants={child}>
                    {word}
                </motion.span>
            ))}
        </motion.p>
    );
}

export default function StepResult({ prior, posterior, worry, onComplete, onRedo }: StepResultProps) {
    const { t } = useI18n();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setShowConfetti(true);
        // Reset confetti after a few seconds
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const reduction = prior - posterior;
    const percentageChange = prior > 0 ? Math.round(((prior - posterior) / prior) * 100) : 0;

    return (
        <div className="flex flex-col h-full pt-4 md:pt-10 max-w-4xl mx-auto relative">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-block px-3 py-1 rounded-full bg-[#9CAF88]/10 text-[#0B3D2E] text-xs font-medium tracking-wider mb-4 border border-[#9CAF88]/20">
                    {t('ritual.result.title')}
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-[#0B3D2E] mb-3">
                    {worry.length > 30 ? worry.substring(0, 30) + '...' : worry}
                </h2>
                <div className="flex items-center justify-center gap-2 text-[#0B3D2E]/50 text-sm">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{t('ritual.confidence')}: High</span>
                </div>
            </motion.div>

            {/* Main Result Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                className="bg-white rounded-3xl p-8 md:p-12 border border-[#E7E1D6] shadow-xl shadow-[#0B3D2E]/5 relative overflow-hidden mb-8"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CAF88]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C4A77D]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Visual Comparison */}
                    <div className="flex flex-col gap-8">
                        {/* BEFORE */}
                        <div className="flex items-center gap-4 opacity-50">
                            <div className="w-16 h-16 rounded-2xl bg-[#E7E1D6]/30 flex items-center justify-center text-xl font-serif text-[#0B3D2E]">
                                <Counter value={prior} />%
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/50 font-medium mb-1">{t('ritual.result.initial')}</div>
                                <div className="h-2 w-32 bg-[#E7E1D6]/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#0B3D2E]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prior}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ARROW */}
                        <div className="pl-6 text-[#9CAF88]">
                            <ArrowLeft className="w-6 h-6 -rotate-90 md:rotate-0" />
                        </div>

                        {/* AFTER */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-[#0B3D2E] flex items-center justify-center text-4xl font-serif text-[#FAF6EF] shadow-lg shadow-[#0B3D2E]/20">
                                <Counter value={posterior} />%
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/50 font-medium mb-1">{t('ritual.result.objective')}</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-serif text-[#0B3D2E]">-<Counter value={reduction} />%</span>
                                    <span className="text-xs text-[#9CAF88] font-medium bg-[#9CAF88]/10 px-1.5 py-0.5 rounded">
                                        <Counter value={percentageChange} />% Drop
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Text */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#E7E1D6] pt-8 md:pt-0 md:pl-12"
                    >
                        <h4 className="font-serif text-xl text-[#0B3D2E] mb-4">{t('ritual.analysis.title')}</h4>

                        {/* Typewriter Effect Applied Here */}
                        <Typewriter text={t('ritual.analysis.default')} />

                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg text-xs font-medium text-[#0B3D2E]/60">{t('ritual.tag.biased')}</div>
                            <div className="px-3 py-1 bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg text-xs font-medium text-[#0B3D2E]/60">{t('ritual.tag.hrv')}</div>
                        </div>
                    </motion.div>

                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={onRedo}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E7E1D6] text-[#0B3D2E]/60 hover:text-[#0B3D2E] hover:bg-white hover:border-[#0B3D2E]/20 transition-all font-medium text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('ritual.button.recalibrate')}
                </button>

                <button
                    onClick={onComplete}
                    className="group flex items-center gap-2 px-8 py-3 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl hover:bg-[#154a3a] transition-all shadow-lg shadow-[#0B3D2E]/20 font-medium text-sm"
                >
                    <Check className="w-4 h-4" />
                    {t('ritual.button.accept')}
                </button>
            </div>
        </div>
    );
}
