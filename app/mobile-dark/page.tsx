'use client';

import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { ChevronRight, Activity } from 'lucide-react';
import { MetricCard, StressLineChart, BioArc, StressBarcode, GlassDockDark } from "@/components/mobile-dark/DarkComponents";
import { ElasticHeader } from "@/components/mobile-dark/ElasticHeader";
import { Zap } from "lucide-react";

export default function DarkDashboard() {
    const { language } = useI18n();

    // Mock Data
    const metrics = {
        recovery: 72,
        strain: 92,
        sleep: 67
    };

    return (
        <div className="min-h-screen pb-24 font-sans text-white" style={{ background: '#000000' }}>
            {/* Elastic Header with Bio-Orb */}
            <ElasticHeader />

            {/* Main Content - Relative z-20 to pull up over the header tail if needed, or just flow normal */}
            <div className="relative z-20 px-4 -mt-20 pb-32 flex flex-col gap-6">

                {/* 1. Daily Snapshot (Bio-Arc) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111111] rounded-[32px] p-6 border border-[#222]"
                >
                    <div className="flex justify-between items-center mb-0">
                        <h2 className="text-[#666] text-xs font-mono uppercase tracking-widest">Daily Resilience</h2>
                        <button className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#666]">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* The New Bio-Arc (Replaces MetricBars) */}
                    <BioArc />

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <MetricCard
                            icon={<Zap className="w-5 h-5" />}
                            label="VOLTAGE"
                            value="98%"
                            subValue="CHARGED"
                            color="#00FF94"
                        />
                        <MetricCard
                            icon={<Activity className="w-5 h-5" />}
                            label="HRV"
                            value="42"
                            subValue="MS"
                            color="#007AFF"
                        />
                    </div>
                </motion.div>


                {/* 2. Stress Monitor (Soft Card + Gradient Chart + Barcode) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#111111] rounded-[32px] p-6 border border-[#222]"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-white text-lg font-medium">Stress Level</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-xs text-[#00A2FF] font-mono">MANAGEABLE</span>
                            </div>
                        </div>
                    </div>

                    <StressLineChart />

                    <div className="mt-8 pt-6 border-t border-[#222]">
                        <h4 className="text-[10px] text-[#666] font-mono mb-4 uppercase tracking-widest">24H DYNAMICS</h4>
                        {/* The New Stress Barcode (Replaces StressBarChart) */}
                        <StressBarcode />
                    </div>
                </motion.div>

                {/* Insight Text */}
                <div className="p-4 rounded-3xl bg-[#111111] border border-[#222222]">
                    <h3 className="text-sm font-bold text-white mb-1">Your body is in a balanced zone</h3>
                    <p className="text-xs text-[#888888] leading-relaxed">
                        Recovery is high. Good day to push strain.
                    </p>
                </div>

            </div>

            <GlassDockDark />
        </div>
    );
}
