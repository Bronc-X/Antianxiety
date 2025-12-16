'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, FileText, Search, ArrowRight, Loader2, Database } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Paper } from '@/types/max';

type PaperPreview = Paper & {
    authors: string[];
    year: number;
    abstract: string;
};

interface StepEvidenceProps {
    onEvidenceCollected: (data: {
        hrv: { rmssd: number; lf_hf: number; score: number };
        papers: Paper[];
        likelihood: number;
        evidenceWeight: number;
    }) => void;
    onNext: () => void;
}

export default function StepEvidence({ onEvidenceCollected, onNext }: StepEvidenceProps) {
    const { t } = useI18n();
    const [scanProgress, setScanProgress] = useState(0);
    const [papersFound, setPapersFound] = useState<PaperPreview[]>([]);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        let progress = 0;
        const foundPapers: PaperPreview[] = [];
        const interval = setInterval(() => {
            progress += 2;
            setScanProgress(progress);

            if (progress === 30) {
                foundPapers.push({
                    id: '1',
                    title: 'HRV & Anxiety Correlations',
                    relevance_score: 0.95,
                    authors: ['Smith et al.'],
                    url: '#',
                    year: 2023,
                    abstract: 'Study showing high vagal tone correlates with lower anxiety.',
                });
                setPapersFound([...foundPapers]);
            }
            if (progress === 70) {
                foundPapers.push({
                    id: '2',
                    title: 'Cognitive Reappraisal Efficacy',
                    relevance_score: 0.88,
                    authors: ['Johnson & Lee'],
                    url: '#',
                    year: 2024,
                    abstract: 'Meta-analysis of CBT effectiveness.',
                });
                setPapersFound([...foundPapers]);
            }

            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                onEvidenceCollected({
                    hrv: { rmssd: 45, lf_hf: 1.2, score: 0.8 },
                    papers: foundPapers.map(({ id, title, relevance_score, url }) => ({ id, title, relevance_score, url })),
                    likelihood: 0.4,
                    evidenceWeight: 0.8
                });
            }
        }, 80);

        return () => clearInterval(interval);
    }, [onEvidenceCollected]);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 flex flex-col justify-center">

                {/* Visual Scanner Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">

                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-1/2 left-1/2 w-8 h-[2px] bg-[#264653]/10 -translate-x-1/2 -translate-y-1/2 z-0" />

                    {/* Left: BIO SENSOR (Simulated) */}
                    <div className="bg-[#FAF9F6] border border-[#264653]/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#264653]/5 rounded-lg text-[#264653]">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-[#264653]/50 uppercase tracking-widest">{t('ritual.bio.signals')}</span>
                        </div>

                        {/* Live Waveform */}
                        <div className="h-24 flex items-center justify-center gap-[2px] overflow-hidden mask-linear-fade">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 bg-[#264653] rounded-full"
                                    animate={{
                                        height: isScanning ? [10, 40 + Math.random() * 40, 10] : 20,
                                        opacity: isScanning ? 0.8 : 0.2
                                    }}
                                    transition={{
                                        repeat: isScanning ? Infinity : 0,
                                        duration: 1.2,
                                        ease: "easeInOut",
                                        delay: i * 0.05
                                    }}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between items-center text-sm font-medium text-[#264653]">
                            <span>{t('ritual.bio.rmssd')}</span>
                            <span>{isScanning ? '45ms' : '45ms'}</span>
                        </div>
                    </div>

                    {/* Right: DATABASE SEARCH */}
                    <div className="bg-[#FAF9F6] border border-[#264653]/10 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#264653]/5 rounded-lg text-[#264653]">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-[#264653]/50 uppercase tracking-widest">{t('ritual.db.index')}</span>
                        </div>

                        {/* Results Feed */}
                        <div className="flex-1 space-y-3 relative min-h-[140px]">
                            <AnimatePresence>
                                {papersFound.map((paper) => (
                                    <motion.div
                                        key={paper.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white p-3 rounded-lg border border-[#264653]/5 shadow-sm flex items-start gap-3"
                                    >
                                        <FileText className="w-4 h-4 text-[#E76F51] shrink-0 mt-1" />
                                        <div>
                                            <div className="text-xs font-bold text-[#264653] leading-tight">{paper.title}</div>
                                            <div className="text-[10px] font-medium text-[#264653]/40 mt-1">{paper.authors[0]}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isScanning && papersFound.length < 2 && (
                                <motion.div
                                    className="absolute bottom-0 text-xs text-[#264653]/40 flex items-center gap-2"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {t('ritual.db.scanning')}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-8">
                    <div className="flex justify-between text-xs font-bold uppercase text-[#264653]/40 mb-2">
                        <span>{t('ritual.data.confidence')}</span>
                        <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#264653]/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#264653]"
                            animate={{ width: `${scanProgress}%` }}
                        />
                    </div>
                </div>

            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-8 py-3 bg-[#264653] text-white rounded-full font-bold shadow-lg shadow-[#264653]/30 hover:bg-[#1d353f] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                    {isScanning ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t('ritual.button.analyzing')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>{t('ritual.button.calc')}</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
