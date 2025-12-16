'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
        <div className="flex flex-col h-full w-full">
            <div className="flex-1">
                {/* Visual "Pulse" or subtle prompt */}
                <p className="text-[#0B3D2E]/60 text-lg mb-6 leading-relaxed">
                    {t('ritual.input.label')}
                </p>

                {/* Text Input area - lighter, cleaner */}
                <textarea
                    value={worry}
                    onChange={(e) => onChange({ worry: e.target.value })}
                    placeholder={t('ritual.input.placeholder')}
                    className="w-full h-40 p-5 bg-[#F8F9FA] rounded-2xl border border-[#000000]/5 text-[#2D3436] placeholder:text-[#B2BEC3] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:bg-white resize-none transition-all text-xl font-medium leading-relaxed shadow-inner"
                    autoFocus
                />

                {/* Slider Section */}
                <div className="mt-10 bg-white border border-[#EBE5da] p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <label className="text-sm font-bold text-[#2D3436] uppercase tracking-wide opacity-60">
                            {t('ritual.slider.label')}
                        </label>
                        <span className="text-3xl font-bold text-[#2A9D8F] tabular-nums">
                            {prior}%
                        </span>
                    </div>

                    <div className="relative h-14 flex items-center">
                        <div className="absolute inset-x-0 h-4 bg-[#F1F2F6] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#2A9D8F]"
                                initial={{ width: 0 }}
                                animate={{ width: `${prior}%` }}
                                transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                            />
                        </div>

                        {/* Interactive Slider */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={prior}
                            onChange={(e) => onChange({ prior: parseInt(e.target.value) })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        {/* Draggable knob visual */}
                        <motion.div
                            className="absolute w-8 h-8 bg-white rounded-full shadow-md border-4 border-[#2A9D8F] z-10 pointer-events-none"
                            style={{ left: `${prior}%`, x: '-50%' }}
                        />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#2D3436]/40 font-bold uppercase tracking-widest mt-2 px-1">
                        <span>{t('ritual.slider.unlikely')}</span>
                        <span>{t('ritual.slider.possible')}</span>
                        <span>{t('ritual.slider.certain')}</span>
                    </div>
                </div>
            </div>

            {/* Floating Action Button area */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!worry.trim()}
                    className="flex items-center gap-2 px-8 py-3 bg-[#2A9D8F] text-white rounded-full font-bold shadow-lg shadow-[#2A9D8F]/30 hover:bg-[#208b7d] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                    <span>{t('ritual.button.analyze')}</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
