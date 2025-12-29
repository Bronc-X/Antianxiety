'use client';

import { motion } from 'framer-motion';
import { Activity, Zap, ChevronRight, Heart, CloudSun, Flame, Home, Calendar, User } from "lucide-react";
import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------
// 1. Metric Card (Soft Glass Style)
// ----------------------------------------------------------------------

export function MetricCard({ icon, label, value, subValue, color }: any) {
    return (
        <div className="bg-[#1A1A1A] p-4 rounded-[24px] border border-[#222] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity`} style={{ color }}>
                {icon}
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="mb-2 p-2 w-fit rounded-full bg-[#111] border border-[#222]" style={{ color }}>
                    {icon}
                </div>
                <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">{label}</h4>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
                        {subValue && <span className="text-[10px] text-[#666] font-mono">{subValue}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 2. Metric Bars (Segmented Progress)
// ----------------------------------------------------------------------

export function MetricBars({ recovery, strain, sleep }: any) {
    const Bar = ({ label, value, color }: any) => (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
                <span className="text-[#888] font-medium">{label}</span>
                <span className="font-bold text-white">{value}%</span>
            </div>
            <div className="h-2 bg-[#111] rounded-full overflow-hidden border border-[#222]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <Bar label="Recovery" value={recovery} color="#007AFF" />
            <Bar label="Strain" value={strain} color="#FF3B30" />
            <Bar label="Sleep" value={sleep} color="#00FF94" />
        </div>
    );
}

// ----------------------------------------------------------------------
// 3. Stress Line Chart (Gradient & Grid)
// ----------------------------------------------------------------------

export function StressLineChart() {
    return (
        <div className="w-full h-[180px] relative mt-4 bg-[#0A0A0A] rounded-xl border border-[#1A1A1A] overflow-hidden">

            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-30">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-[1px] bg-[#222] border-t border-dashed border-[#333]" />)}
            </div>

            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="stressGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF9500" /> {/* High Stress (Orange) */}
                        <stop offset="50%" stopColor="#FF375F" />
                        <stop offset="100%" stopColor="#007AFF" /> {/* Low Stress (Blue) */}
                    </linearGradient>
                </defs>

                {/* The Line */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2 }}
                    d="M0,80 C30,75 60,90 90,60 C120,30 150,50 180,80 C210,110 240,100 270,120 C300,140 330,130 360,150"
                    fill="none"
                    stroke="url(#stressGradientDark)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="drop-shadow(0px 0px 8px rgba(0, 122, 255, 0.4))"
                />
            </svg>
            <div className="absolute bottom-2 left-4 text-[10px] text-[#444] font-mono">06:00</div>
            <div className="absolute bottom-2 right-4 text-[10px] text-[#444] font-mono">18:00</div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 4. Stress Bar Chart (Vertical)
// ----------------------------------------------------------------------

export function StressBarChart() {
    return (
        <div className="flex items-end justify-between h-24 gap-1">
            {Array.from({ length: 24 }).map((_, i) => {
                const height = 20 + Math.random() * 60;
                const color = height > 60 ? '#FF3B30' : (height > 40 ? '#FF9500' : '#007AFF');
                return (
                    <div key={i} className="w-full bg-[#1A1A1A] rounded-sm relative group">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05 }}
                            className="absolute bottom-0 w-full rounded-sm opacity-80 group-hover:opacity-100"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                )
            })}
        </div>
    );
}

// ----------------------------------------------------------------------
// 5. Bio-Arc (High-Fidelity Dark Mode)
// ----------------------------------------------------------------------

export function BioArc({ score = 85, max = 100 }: { score?: number, max?: number }) {
    // 40 dashes
    const dashes = 40;

    return (
        <div className="relative flex flex-col items-center justify-center py-6">
            <div className="w-[280px] h-[140px] relative overflow-hidden">
                <svg viewBox="0 0 300 150" className="w-full h-full">
                    <defs>
                        <linearGradient id="bioGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#007AFF" />
                            <stop offset="100%" stopColor="#00FF94" />
                        </linearGradient>
                    </defs>

                    {/* Base Arc Track */}
                    <path
                        d="M 30 150 A 120 120 0 0 1 270 150"
                        fill="none"
                        stroke="#222"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="4 6" // Dashed effect
                    />

                    {/* Active Arc (Gradient) */}
                    <motion.path
                        initial={{ strokeDashoffset: 380 }}
                        animate={{ strokeDashoffset: 380 - (380 * (score / max)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        d="M 30 150 A 120 120 0 0 1 270 150"
                        fill="none"
                        stroke="url(#bioGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="380" // Full semi-circle length approx
                        style={{ strokeDasharray: '4 6' }} // Apply dash to active too
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center justify-end h-full pb-4">
                    <span className="text-5xl font-bold text-white tracking-tighter">{score}</span>
                    <span className="text-[10px] text-[#666] font-mono mt-1 uppercase tracking-widest">Bio-Resilience</span>
                </div>
            </div>

            <div className="flex justify-between w-full px-8 mt-4 text-[10px] font-mono text-[#666]">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_8px_#00FF94]"></span>
                    RECOVERY
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shadow-[0_0_8px_#007AFF]"></span>
                    STRAIN
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 6. Stress Barcode (High-Fidelity Dark Mode)
// ----------------------------------------------------------------------

export function StressBarcode() {
    return (
        <div className="flex items-end justify-between h-12 w-full gap-[2px] mt-4">
            {Array.from({ length: 40 }).map((_, i) => {
                let height = 20 + Math.random() * 80;
                let active = i > 15 && i < 30;
                // Gradient effect logic simulated by color
                let color = active ? '#FF3B30' : '#1A1A1A';
                if (i > 30) color = '#00FF94'; // Recovering at end

                return (
                    <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.02 }}
                        key={i}
                        className="w-full rounded-sm"
                        style={{
                            height: `${height}%`,
                            backgroundColor: color
                        }}
                    />
                )
            })}
        </div>
    );
}

// ----------------------------------------------------------------------
// 7. Glass Dock (High-Fidelity Dark Mode)
// ----------------------------------------------------------------------

export function GlassDockDark() {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 p-1.5 bg-[#141414]/80 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]">
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] bg-[#00FF94] text-black shadow-[0_0_20px_rgba(0,255,148,0.3)]">
                    <Home className="w-5 h-5 mb-[1px]" strokeWidth={2.5} />
                    <span className="text-[8px] font-bold">Home</span>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] text-[#666] hover:bg-white/10 hover:text-white transition-colors">
                    <Calendar className="w-5 h-5 mb-[1px]" />
                    <span className="text-[8px] font-medium">Plan</span>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-12 rounded-[20px] text-[#666] hover:bg-white/10 hover:text-white transition-colors">
                    <User className="w-5 h-5 mb-[1px]" />
                    <span className="text-[8px] font-medium">Me</span>
                </div>
            </div>
        </div>
    );
}
