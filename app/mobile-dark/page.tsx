'use client';

import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bell, User, Heart, CloudSun, ChevronRight, Activity, Flame } from 'lucide-react';
import { MetricBars, MetricCard, StressBarChart } from '@/components/mobile-dark/DarkComponents';
import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';

export default function DarkDashboard() {
    const { language } = useI18n();
    const date = new Date();
    const dateString = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    // Mock Data
    const metrics = {
        recovery: 72,
        strain: 92,
        sleep: 67
    };

    return (
        <div className="min-h-screen pb-24 font-sans text-white" style={{ background: '#000000' }}>
            {/* Header */}
            <header className="px-5 pt-14 pb-4 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-[#222222] rounded-full flex items-center justify-center">
                            <span className="text-[10px]">🗓️</span>
                        </div>
                        <p className="text-[10px] font-mono text-[#666666] uppercase tracking-wide">
                            {dateString}
                        </p>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Welcome Back, Bronc
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-[#333333]">
                        <Flame className="w-4 h-4 text-[#FF3B30] fill-current" />
                        <span className="text-[10px] font-mono ml-0.5">6</span>
                    </div>
                    <Link href="/mobile-dark/settings" className="w-8 h-8 rounded-full bg-black border border-[#333333] flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-[#CCCCCC]" />
                    </Link>
                </div>
            </header>

            <main className="px-5 space-y-4">
                {/* Top Row: Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        icon={<Heart className="w-5 h-5 fill-current" />}
                        color="#007AFF"
                        label="HEALTH SCORE"
                        value="8.5"
                        subValue="/ 10"
                    />
                    <MetricCard
                        icon={<CloudSun className="w-5 h-5" />}
                        color="#FF9500" // Sun color
                        label="WEATHER"
                        value="26°"
                        subValue="Bali"
                    />
                </div>

                {/* Main Card: Today's Snapshot */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border border-[#1A1A1A]"
                    style={{ background: '#0A0A0A' }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-medium tracking-wide text-[#CCCCCC]">Today's Snapshot</h2>
                        <ChevronRight className="w-4 h-4 text-[#444444]" />
                    </div>

                    {/* New Metric Bars Layout */}
                    <div className="mb-6">
                        <MetricBars
                            recovery={metrics.recovery}
                            strain={metrics.strain}
                            sleep={metrics.sleep}
                        />
                    </div>

                    {/* Insight Text */}
                    <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
                        <h3 className="text-sm font-bold text-white mb-1">Your body is in a balanced zone</h3>
                        <p className="text-xs text-[#888888] leading-relaxed">
                            Consider a light-to-moderate workout in the afternoon to maintain momentum.
                        </p>
                    </div>
                </motion.div>

                {/* Card: Stress Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl border border-[#1A1A1A]"
                    style={{ background: '#0A0A0A' }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                            <h2 className="text-sm font-medium tracking-wide text-[#CCCCCC]">Stress Overview</h2>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#444444]" />
                    </div>

                    <div className="flex flex-col gap-6">
                        <StressBarChart />

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1A1A1A]">
                            <div className="text-center">
                                <p className="text-[9px] font-mono text-[#555555] uppercase mb-1">Highest</p>
                                <p className="text-sm font-bold text-[#00FF94]">79</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-mono text-[#555555] uppercase mb-1">Lowest</p>
                                <p className="text-sm font-bold text-[#FF9500]">21</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-mono text-[#555555] uppercase mb-1">Average</p>
                                <p className="text-sm font-bold text-[#007AFF]">58</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            <DarkBottomNav />
        </div>
    );
}
