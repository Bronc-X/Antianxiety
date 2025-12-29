'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Activity, Moon, Zap, Flame } from 'lucide-react';

// Color Constants
const COLORS = {
    BLACK: '#000000',
    CARD_BG: '#0A0A0A',
    BORDER: '#1A1A1A',

    // Accents
    RECOVERY: '#00FF94', // Green
    STRAIN: '#007AFF',   // Blue
    SLEEP: '#B388FF',    // Purple/Lavender

    // Stress
    STRESS_HIGH: '#FF3B30',
    STRESS_MED: '#FF9500',
    STRESS_LOW: '#007AFF',

    TEXT_MAIN: '#FFFFFF',
    TEXT_DIM: '#666666',
};

// ----------------------------------------------------------------------
// 1. Metric Bars (Linear Segmented Progress) - Replacement for Rings
// ----------------------------------------------------------------------

interface MetricBarsProps {
    recovery: number;
    strain: number;
    sleep: number;
}

export function MetricBars({ recovery, strain, sleep }: MetricBarsProps) {
    const Bar = ({ label, value, color, delay }: { label: string, value: number, color: string, delay: number }) => (
        <div className="mb-5 last:mb-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono tracking-wider text-[#666666] uppercase">{label}</span>
                <span className="text-sm font-bold font-mono" style={{ color }}>{value}%</span>
            </div>
            <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden relative">
                {/* Background segments opacity */}
                <div className="absolute inset-0 flex gap-[2px]">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-[#1A1A1A]" />
                    ))}
                </div>

                {/* Active Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay }}
                    className="h-full relative z-10"
                    style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                />
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <Bar label="RECOVERY" value={recovery} color={COLORS.RECOVERY} delay={0.1} />
            <Bar label="STRAIN" value={strain} color={COLORS.STRAIN} delay={0.2} />
            <Bar label="SLEEP SCORE" value={sleep} color={COLORS.SLEEP} delay={0.3} />
        </div>
    );
}


// ----------------------------------------------------------------------
// 2. Metric Card (Top Row: Health Score, etc.)
// ----------------------------------------------------------------------

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    color: string;
}

export function MetricCard({ icon, label, value, subValue, color }: MetricCardProps) {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 p-4 rounded-xl relative overflow-hidden group"
            style={{ background: COLORS.CARD_BG, border: `1px solid ${COLORS.BORDER}` }}
        >
            {/* Glow Effect on Hover/Active */}
            <div
                className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-0 group-hover:opacity-5 transition-opacity blur-2xl rounded-full pointer-events-none"
            />

            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#666666] mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white leading-none tracking-tight">{value}</span>
                    {subValue && <span className="text-[10px] text-[#888888]">{subValue}</span>}
                </div>
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------------------------
// 3. Stress Line Chart (Gradient + Grid)
// ----------------------------------------------------------------------

export function StressLineChart() {
    return (
        <div className="w-full h-[180px] relative mt-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-[1px] bg-[#222] border-t border-dashed border-[#333]" />)}
            </div>

            {/* The Gradient Line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineScroll" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFAA00" />  {/* High Stress (Orange) */}
                        <stop offset="50%" stopColor="#FF4400" />
                        <stop offset="100%" stopColor="#00A2FF" /> {/* Low Stress (Blue) */}
                    </linearGradient>
                </defs>
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    d="M0,80 C20,70 40,90 60,60 C80,30 100,50 120,80 C140,110 160,100 180,120 C200,140 220,130 240,150 C260,170 280,140 300,120"
                    fill="none"
                    stroke="url(#lineScroll)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                />
            </svg>

            <div className="absolute bottom-2 left-2 text-[10px] text-[#666]">06:30 AM</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-[#666]">07:30 AM</div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 4. Stress Overview (Horizontal Bar Chart)
// ----------------------------------------------------------------------

interface StressLevelProps {
    label: string;
    duration: string; // e.g. "0:56:00"
    percentage: number;
    color: string;
}

export function StressBarChart() {
    const Row = ({ label, duration, percentage, color }: StressLevelProps) => (
        <div className="flex items-center text-[10px] font-mono mb-3 last:mb-0 group">
            <span className="w-8 text-[#666666] tracking-wide group-hover:text-white transition-colors">{label}</span>
            <div className="flex-1 mx-3 h-6 relative flex items-center">
                {/* Bar Array */}
                <div className="flex gap-[2px] h-full w-full items-center">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0.5, opacity: 0.2 }}
                            animate={{
                                scaleY: i / 30 < percentage / 100 ? 1 : 0.5,
                                opacity: i / 30 < percentage / 100 ? 1 : 0.2,
                                backgroundColor: i / 30 < percentage / 100 ? color : '#1A1A1A'
                            }}
                            transition={{ delay: i * 0.01 }}
                            className="w-[3px] h-full rounded-sm"
                        />
                    ))}
                </div>
            </div>
            <div className="text-right w-16">
                <div className="text-white font-bold">{percentage}%</div>
                <div className="text-[#444444] text-[8px]">{duration}</div>
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <Row label="HIGH" duration="0:56:00" percentage={5} color={COLORS.STRESS_HIGH} />
            <Row label="MED" duration="0:56:00" percentage={36} color={COLORS.STRESS_MED} />
            <Row label="LOW" duration="0:56:00" percentage={59} color={COLORS.STRESS_LOW} />
        </div>
    );
}
