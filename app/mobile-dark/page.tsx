'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Bell } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BioGauge, StatBlock, InsightCard } from '@/components/mobile-dark/DarkComponents';
import Link from 'next/link';
import DarkBottomNav from '@/components/mobile-dark/DarkBottomNav';

// Area Chart - Bloomberg Style
function EnergyChart({ data }: { data: number[] }) {
    const width = 320;
    const height = 150; // Taller for detail
    const padding = { top: 20, right: 0, bottom: 20, left: 0 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * chartWidth + padding.left;
        const y = chartHeight - ((value - minValue) / range) * chartHeight + padding.top;
        return { x, y };
    });

    const pathD = points.reduce((acc, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        // Slightly less smooth for "precision" feel, or catmull-rom
        const prev = points[index - 1];
        const cp1x = prev.x + (point.x - prev.x) / 3;
        const cp2x = prev.x + 2 * (point.x - prev.x) / 3;
        return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    return (
        <div className="w-full overflow-hidden relative" style={{ height }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="fintechGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
                    </linearGradient>
                    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.5" fill="#222222" />
                    </pattern>
                </defs>

                {/* Dotted Grid Background */}
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* Horizontal Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                    <line
                        key={ratio}
                        x1={padding.left}
                        y1={padding.top + ratio * chartHeight}
                        x2={width}
                        y2={padding.top + ratio * chartHeight}
                        stroke="#111111"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                    />
                ))}

                {/* Area Fill */}
                <motion.path
                    d={areaD}
                    fill="url(#fintechGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                {/* Line */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke="#007AFF"
                    strokeWidth={1.5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(0, 122, 255, 0.5))' }}
                />

                {/* Crosshair (Visual Only) */}
                <line x1={width * 0.7} y1={padding.top} x2={width * 0.7} y2={height - padding.bottom} stroke="#333333" strokeDasharray="2 2" strokeWidth={0.5} />
                <circle cx={width * 0.7} cy={padding.top + 0.3 * chartHeight} r={2} fill="#007AFF" />

                {/* X-Axis Labels */}
                {['00:00', '06:00', '12:00', '18:00', '24:00'].map((label, i) => (
                    <text
                        key={label}
                        x={padding.left + (i / 4) * chartWidth}
                        y={height - 5}
                        fill="#444444"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                    >
                        {label}
                    </text>
                ))}
            </svg>

            {/* Floating Tag */}
            <div
                className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#111111] border border-[#222222]"
            >
                <span className="text-[8px] font-mono text-[#007AFF]">ENERGY_FLUX_24H</span>
            </div>
        </div>
    );
}

export default function DarkDashboard() {
    const { language } = useI18n();
    const energyData = [45, 40, 35, 30, 28, 25, 30, 45, 65, 75, 80, 78, 70, 65, 60, 55, 50, 55, 60, 70, 75, 72, 68, 65];
    const currentHour = new Date().getHours();
    const currentEnergy = energyData[currentHour] || 65;

    const getStatus = (value: number) => {
        if (value >= 70) return { text: 'OPTIMAL', color: 'green' as const };
        if (value >= 50) return { text: 'STABLE', color: 'blue' as const };
        return { text: 'CRITICAL', color: 'red' as const };
    };

    const status = getStatus(currentEnergy);

    return (
        <div className="min-h-screen pb-24" style={{ background: '#000000' }}>
            {/* Header - Industrial */}
            <header className="px-5 pt-14 pb-2 flex justify-between items-end border-b border-[#111111]">
                <div>
                    <h1 className="text-3xl font-sans font-bold tracking-tighter text-white leading-none">
                        SYSTEM
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 bg-[#00FF94] animate-pulse" />
                        <span className="text-[10px] font-mono text-[#00FF94] tracking-widest">
                            ONLINE :: {new Date().toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                    </div>
                </div>
                <button className="relative p-2">
                    <Bell className="w-5 h-5 text-[#444444]" strokeWidth={1.5} />
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF3B30]" />
                </button>
            </header>

            {/* Main Gauge Section */}
            <section className="py-12 flex justify-center relative">
                <BioGauge
                    value={currentEnergy}
                    label="BIO-STATUS"
                    subLabel="HRV 20% > BASELINE"
                    status={status.text}
                    color={status.color}
                />
            </section>

            {/* Data Grid - 2x2 */}
            <section className="border-t border-[#111111]">
                <div className="grid grid-cols-2">
                    <StatBlock
                        label="HRV (RMSSD)"
                        value="56"
                        unit="ms"
                        trend="up"
                        color="green"
                        delay={0.2}
                    />
                    <StatBlock
                        label="RESTING HR"
                        value="62"
                        unit="bpm"
                        trend="down"
                        color="green"
                        delay={0.3}
                    />
                    <StatBlock
                        label="SLEEP DEBT"
                        value="1.2"
                        unit="hr"
                        trend="up"
                        color="red"
                        delay={0.4}
                    />
                    <StatBlock
                        label="RESP RATE"
                        value="14"
                        unit="rpm"
                        trend="neutral"
                        color="blue"
                        delay={0.5}
                    />
                </div>
            </section>

            {/* Chart Section */}
            <section className="mt-8 px-0 border-t border-b border-[#111111]">
                <EnergyChart data={energyData} />
            </section>

            {/* Insight Card */}
            <section className="p-5 mt-4">
                <InsightCard
                    source="NATURE . VOL 592"
                    conclusion="CORTISOL SPIKE DETECTED"
                    detail="Analysis of biometrics indicates a deviation from circadian baseline. Immediate 10m NSDR protocol recommended to restore autonomic balance."
                    delay={0.6}
                />
            </section>

            {/* Calibrate Action - Brutalist Button */}
            <section className="px-5 mt-8">
                <Link href="/mobile-dark/calibration">
                    <motion.button
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 bg-[#00FF94] flex items-center justify-between px-6"
                    >
                        <span className="text-black font-mono font-bold tracking-widest text-sm">
                            INITIATE CALIBRATION
                        </span>
                        <div className="w-2 h-2 bg-black" />
                    </motion.button>
                </Link>
            </section>
        </div>
    );
}
