'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Check, RefreshCw, TrendingDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepResultProps {
    prior: number;
    posterior: number;
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

function Typewriter({ text }: { text: string }) {
    const words = text.split(' ');
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
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
            className="text-[#2D3436] text-lg leading-relaxed flex flex-wrap gap-x-1.5 font-medium"
        >
            {words.map((word, i) => (
                <motion.span key={i} variants={child}>
                    {word}
                </motion.span>
            ))}
        </motion.p>
    );
}

export default function StepResult({ prior, posterior, onComplete, onRedo }: StepResultProps) {
    const { t } = useI18n();

    // Calculate stats
    const percentageDrop = prior > 0 ? Math.round(((prior - posterior) / prior) * 100) : 0;

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 flex flex-col items-center justify-center">

                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full bg-gradient-to-br from-[#FFF] to-[#FFF8E7] rounded-3xl p-8 shadow-xl border border-[#F4A261]/20 relative overflow-hidden"
                >
                    {/* Floating bg elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4A261]/10 rounded-full blur-2xl" />

                    {/* Main Stats Row */}
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-around gap-8 md:gap-0">
                        {/* Before */}
                        <div className="text-center opacity-60 scale-90">
                            <div className="text-sm font-bold uppercase tracking-widest text-[#2D3436]/60 mb-2">
                                {t('ritual.result.initial')}
                            </div>
                            <div className="text-5xl font-bold text-[#2D3436]">
                                <Counter value={prior} />%
                            </div>
                        </div>

                        {/* Arrow/Indicator */}
                        <div className="flex flex-col items-center text-[#F4A261]">
                            <TrendingDown className="w-8 h-8 mb-1" />
                            <div className="text-xs font-bold bg-[#F4A261]/10 px-2 py-1 rounded text-[#E76F51]">
                                -<Counter value={percentageDrop} />% {t('ritual.result.drop')}
                            </div>
                        </div>

                        {/* After (Hero) */}
                        <div className="text-center">
                            <div className="text-sm font-bold uppercase tracking-widest text-[#E76F51] mb-2">
                                {t('ritual.result.objective')}
                            </div>
                            <div className="text-7xl font-bold text-[#E76F51] drop-shadow-sm">
                                <Counter value={posterior} />%
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-8 h-px w-full bg-[#E76F51]/10" />

                    {/* AI Analysis */}
                    <div>
                        <h4 className="text-sm font-bold uppercase text-[#2D3436]/40 mb-3 tracking-wide">
                            {t('ritual.analysis.title')}
                        </h4>
                        <Typewriter text={t('ritual.analysis.default')} />
                    </div>

                </motion.div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex gap-4 md:gap-6 justify-center w-full">
                <button
                    onClick={onRedo}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#EBE5da] text-[#2D3436]/60 hover:text-[#2D3436] hover:border-[#2D3436]/20 bg-transparent transition-all font-bold text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('ritual.button.recalibrate')}
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#E76F51] text-white rounded-full hover:bg-[#D46046] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-bold text-sm"
                >
                    <Check className="w-4 h-4" />
                    {t('ritual.button.accept')}
                </button>
            </div>
        </div>
    );
}
