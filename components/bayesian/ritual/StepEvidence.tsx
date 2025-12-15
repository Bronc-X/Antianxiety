'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, FileText, CheckCircle2, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Paper } from '@/types/max'; // Ensure types exist

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

    // Mock Evidence Collection Process
    useEffect(() => {
        let progress = 0;
        const foundPapers: PaperPreview[] = [];
        const interval = setInterval(() => {
            progress += 2; // Slower progress for more drama
            setScanProgress(progress);

            // Simulate finding papers at certain milestones
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
                // Complete - pass mock data up
                onEvidenceCollected({
                    hrv: { rmssd: 45, lf_hf: 1.2, score: 0.8 },
                    papers: foundPapers.map(({ id, title, relevance_score, url }) => ({ id, title, relevance_score, url })),
                    likelihood: 0.4, // Reduced probability due to healthy HRV
                    evidenceWeight: 0.8 // High confidence in this evidence
                });
            }
        }, 80); // 4 seconds total

        return () => clearInterval(interval);
    }, [onEvidenceCollected]);

    return (
        <div className="flex flex-col h-full pt-4 md:pt-10 max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-block px-3 py-1 rounded-full bg-[#9CAF88]/10 text-[#0B3D2E] text-xs font-medium tracking-wider mb-4 border border-[#9CAF88]/20">
                    {t('ritual.evidence.title')}
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-[#0B3D2E] mb-3">
                    {t('ritual.evidence.subtitle')}
                </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* BIO CARD */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 border border-[#E7E1D6] relative overflow-hidden shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#E7E1D6]/30 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-[#0B3D2E]/40 uppercase tracking-wider">{t('ritual.bio.title')}</div>
                            <div className="text-[#0B3D2E] font-medium">
                                {isScanning ? t('ritual.bio.scanning') : t('ritual.bio.complete')}
                            </div>
                        </div>
                    </div>

                    {/* HRV Waveform Animation */}
                    <div className="h-32 flex items-end justify-center gap-1 mb-4 overflow-hidden mask-linear-fade">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-2 bg-[#9CAF88] rounded-t-full opacity-60"
                                animate={{
                                    height: isScanning ? [20, 40 + Math.random() * 60, 20] : 40,
                                    opacity: isScanning ? 0.6 : 0.3
                                }}
                                transition={{
                                    repeat: isScanning ? Infinity : 0,
                                    duration: 1.5,
                                    ease: "easeInOut",
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#E7E1D6]/50">
                        <span className="text-sm text-[#0B3D2E]/60">{t('ritual.bio.tone')}</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-sm font-medium text-[#0B3D2E]">
                                {isScanning ? '...' : t('ritual.bio.tone.normal')}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* PAPERS CARD */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 border border-[#E7E1D6] relative overflow-hidden shadow-sm"
                >
                    {/* Scanline Effect - The Requested Feature #4 */}
                    {isScanning && (
                        <motion.div
                            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#9CAF88]/10 to-transparent z-20 pointer-events-none"
                            initial={{ top: "-20%" }}
                            animate={{ top: "120%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    )}

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#E7E1D6]/30 flex items-center justify-center">
                            <Search className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-[#0B3D2E]/40 uppercase tracking-wider">{t('ritual.evidence.search')}</div>
                            <div className="text-[#0B3D2E] font-medium">
                                {isScanning ? t('ritual.evidence.searching') : `${papersFound.length} Papers Found`}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 h-32 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

                        {papersFound.length === 0 && isScanning && (
                            <div className="flex flex-col items-center justify-center h-full text-[#0B3D2E]/30 text-sm gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connecting to PubMed...</span>
                            </div>
                        )}

                        {papersFound.map((paper) => (
                            <motion.div
                                key={paper.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#FAF6EF] p-3 rounded-lg border border-[#E7E1D6] flex justify-between items-start"
                            >
                                <div className="flex gap-2">
                                    <FileText className="w-4 h-4 text-[#9CAF88] mt-0.5" />
                                    <div>
                                        <div className="text-xs font-medium text-[#0B3D2E] line-clamp-1">{paper.title}</div>
                                        <div className="text-[10px] text-[#0B3D2E]/50">{paper.authors[0]} • {paper.year}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-[#9CAF88] bg-[#9CAF88]/10 px-1.5 py-0.5 rounded">
                                    {Math.round(paper.relevance_score * 100)}% {t('ritual.evidence.match')}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-[#E7E1D6]/50">
                        <span className="text-sm text-[#0B3D2E]/60">Scientific Consensus</span>
                        <span className="text-sm font-medium text-[#0B3D2E]">
                            {isScanning ? '...' : 'High Confidence'}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-[#E7E1D6] rounded-full overflow-hidden mb-8">
                <motion.div
                    className="h-full bg-[#0B3D2E]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                />
            </div>

            {/* Action Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: !isScanning ? 1 : 0.5 }}
                className="flex justify-center"
            >
                <button
                    onClick={onNext}
                    disabled={isScanning}
                    className="group relative px-8 py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#154a3a] shadow-lg shadow-[#0B3D2E]/20"
                >
                    <div className="relative flex items-center justify-center gap-3">
                        {isScanning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span className="text-sm font-medium tracking-wider uppercase">{t('ritual.button.calc')}</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
