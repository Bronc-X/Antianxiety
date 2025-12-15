'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepInputProps {
    worry: string;
    prior: number;
    onChange: (updates: { worry?: string; prior?: number }) => void;
    onNext: () => void;
}

export default function StepInput({ worry, prior, onChange, onNext }: StepInputProps) {
    const { t } = useI18n();

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto pt-4 md:pt-12">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-block px-3 py-1 rounded-full bg-[#9CAF88]/10 text-[#0B3D2E] text-xs font-medium tracking-wider mb-4 border border-[#9CAF88]/20">
                    {t('ritual.input.title')}
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-[#0B3D2E] mb-3">
                    {t('ritual.input.subtitle')}
                </h2>
                <p className="text-[#0B3D2E]/60 max-w-md mx-auto">
                    {t('ritual.input.label')}
                </p>
            </motion.div>

            {/* Input Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-[#E7E1D6] mb-8"
            >
                <div className="space-y-8">
                    {/* Text Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#0B3D2E]/80 ml-1">
                            {t('ritual.input.label')}
                        </label>
                        <textarea
                            value={worry}
                            onChange={(e) => onChange({ worry: e.target.value })}
                            placeholder={t('ritual.input.placeholder')}
                            className="w-full h-32 p-4 bg-[#FAF6EF] rounded-xl border border-[#E7E1D6] text-[#0B3D2E] placeholder:text-[#0B3D2E]/30 focus:outline-none focus:ring-1 focus:ring-[#9CAF88] focus:border-[#9CAF88] resize-none transition-all text-lg font-serif"
                            autoFocus
                        />
                    </div>

                    {/* Slider Input */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-medium text-[#0B3D2E]/80 ml-1">
                                {t('ritual.slider.label')}
                            </label>
                            <span className="text-2xl font-serif text-[#0B3D2E] tabular-nums">
                                {prior}%
                            </span>
                        </div>

                        <div className="relative h-12 flex items-center">
                            {/* Track */}
                            <div className="absolute inset-x-0 h-2 bg-[#FAF6EF] rounded-full border border-[#E7E1D6] overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#9CAF88]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${prior}%` }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                />
                            </div>

                            {/* Slider Thumb */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={prior}
                                onChange={(e) => onChange({ prior: parseInt(e.target.value) })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />

                            {/* Visual Thumb */}
                            <motion.div
                                className="absolute w-6 h-6 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-[#9CAF88] z-10 pointer-events-none flex items-center justify-center"
                                style={{ left: `${prior}%`, x: '-50%' }}
                            >
                                <div className="w-2 h-2 rounded-full bg-[#0B3D2E]" />
                            </motion.div>
                        </div>

                        <div className="flex justify-between text-xs text-[#0B3D2E]/40 font-medium tracking-wide uppercase px-1">
                            <span>{t('ritual.slider.unlikely')}</span>
                            <span>{t('ritual.slider.possible')}</span>
                            <span>{t('ritual.slider.certain')}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center"
            >
                <button
                    onClick={onNext}
                    disabled={!worry.trim()}
                    className="group relative px-8 py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#154a3a] shadow-lg shadow-[#0B3D2E]/20"
                >
                    <div className="relative flex items-center justify-center gap-3">
                        <span className="text-sm font-medium tracking-wider uppercase">{t('ritual.button.analyze')}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
