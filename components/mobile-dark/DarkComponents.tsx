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
    STRESS_LOW: '#007AFF', // Or Cyan/Green depending on preference

    TEXT_MAIN: '#FFFFFF',
    TEXT_DIM: '#666666',
};

// ----------------------------------------------------------------------
// 1. Concentric Rings (Today's Snapshot)
// ----------------------------------------------------------------------

interface ConcentricRingsProps {
    recovery: number; // 0-100
    strain: number;   // 0-100
    sleep: number;    // 0-100
}

export function ConcentricRings({ recovery, strain, sleep }: ConcentricRingsProps) {
    const size = 160;
    const center = size / 2;
    const strokeWidth = 8;
    const gap = 10;

    // Radii
    const r1 = 60; // Outer (Recovery)
    const r2 = 45; // Middle (Strain)
    const r3 = 30; // Inner (Sleep)

    const Ring = ({ r, value, color, delay }: { r: number, value: number, color: string, delay: number }) => {
        const c = 2 * Math.PI * r;
        const offset = c - ((value / 100) * c);

        return (
            <>
                {/* Track */}
                <circle cx={center} cy={center} r={r} fill="none" stroke="#222222" strokeWidth={strokeWidth} strokeLinecap="round" />
                {/* Value */}
                <motion.circle
                    cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay }}
                    className="transform -rotate-90 origin-center"
                    style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
                />
            </>
        );
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <Ring r={r1} value={recovery} color={COLORS.RECOVERY} delay={0.2} />
                <Ring r={r2} value={strain} color={COLORS.STRAIN} delay={0.4} />
                <Ring r={r3} value={sleep} color={COLORS.SLEEP} delay={0.6} />
            </svg>

            {/* Legend / Metrics List to the right usually, but here we just render the graphic. 
                External layout handles the legend. */}
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
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: COLORS.CARD_BG, border: `1px solid ${COLORS.BORDER}` }}
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ background: color }}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#666666] mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white leading-none">{value}</span>
                    {subValue && <span className="text-[10px] text-[#888888]">{subValue}</span>}
                </div>
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------------------------
// 3. Stress Overview (Horizontal Bar Chart)
// ----------------------------------------------------------------------

interface StressLevelProps {
    label: string;
    duration: string; // e.g. "0:56:00"
    percentage: number;
    color: string;
}

export function StressBarChart() {
    const Row = ({ label, duration, percentage, color }: StressLevelProps) => (
        <div className="flex items-center text-[10px] font-mono mb-3 last:mb-0">
            <span className="w-8 text-[#666666] tracking-wide">{label}</span>
            <div className="flex-1 mx-3 h-8 relative flex items-center">
                {/* Bar Array */}
                <div className="flex gap-[2px] h-full w-full">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-[2px] h-4 rounded-full"
                            style={{
                                background: i / 30 < percentage / 100 ? color : '#1A1A1A',
                                opacity: i / 30 < percentage / 100 ? 1 : 0.5
                            }}
                        />
                    ))}
                </div>
            </div>
            <div className="text-right w-16">
                <div className="text-white">{percentage}%</div>
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

// ----------------------------------------------------------------------
// 4. Snapshot Legend (Helper for Concentric Rings)
// ----------------------------------------------------------------------

export function SnapshotLegend({ recovery, strain, sleep }: { recovery: number, strain: number, sleep: number }) {
    return (
        <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between gap-6">
                <span className="text-[10px] font-mono tracking-wider text-[#CCCCCC]">RECOVERY</span>
                <span className="text-lg font-bold" style={{ color: COLORS.RECOVERY }}>{recovery}%</span>
            </div>
            <div className="flex items-center justify-between gap-6">
                <span className="text-[10px] font-mono tracking-wider text-[#CCCCCC]">STRAIN</span>
                <span className="text-lg font-bold" style={{ color: COLORS.STRAIN }}>{strain}%</span>
            </div>
            <div className="flex items-center justify-between gap-6">
                <span className="text-[10px] font-mono tracking-wider text-[#CCCCCC]">SLEEP</span>
                <span className="text-lg font-bold" style={{ color: COLORS.SLEEP }}>{sleep}%</span>
            </div>
        </div>
    );
}
