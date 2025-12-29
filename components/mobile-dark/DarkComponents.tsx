'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Color Constants
const COLORS = {
    BLACK: '#000000',
    GREEN: '#00FF94',
    BLUE: '#007AFF', // Electric Blue
    RED: '#FF3B30',
    TEXT_MAIN: '#FFFFFF',
    TEXT_DIM: '#666666',
    BORDER: '#222222',
    GLOW_GREEN: '0 0 10px rgba(0, 255, 148, 0.5)',
    GLOW_BLUE: '0 0 10px rgba(0, 122, 255, 0.5)',
};

interface BioGaugeProps {
    value: number;
    max?: number;
    label: string;
    subLabel?: string;
    status: string;
    color?: 'green' | 'blue' | 'red';
}

const colorMap = {
    green: COLORS.GREEN,
    blue: COLORS.BLUE,
    red: COLORS.RED,
};

export function BioGauge({ value, max = 100, label, subLabel, status, color = 'green' }: BioGaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const size = 260; // Massive size
    const strokeWidth = 2; // Thin line
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((animatedValue / max) * circumference);
    const accentColor = colorMap[color];

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* SVG Gauge */}
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background track - Very subtle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#111111"
                    strokeWidth={strokeWidth}
                />

                {/* Progress arc with Glow */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt" // Sharp edges
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // Exponential ease
                    style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}
                />

                {/* Tick marks - Precision scale */}
                {Array.from({ length: 60 }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    const len = isMajor ? 6 : 3;
                    const angle = (i / 60) * 360;
                    const rad = (angle * Math.PI) / 180;

                    // Inner ticks
                    const rInner = radius - 10;
                    const x1 = size / 2 + rInner * Math.cos(rad);
                    const y1 = size / 2 + rInner * Math.sin(rad);
                    const x2 = size / 2 + (rInner - len) * Math.cos(rad);
                    const y2 = size / 2 + (rInner - len) * Math.sin(rad);

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isMajor ? '#333333' : '#111111'}
                            strokeWidth={1}
                        />
                    );
                })}
            </svg>

            {/* Center content - Condensed Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span
                    className="text-[10px] font-mono tracking-widest uppercase mb-2"
                    style={{ color: COLORS.TEXT_DIM }}
                >
                    {label}
                </span>

                <motion.span
                    className="text-7xl font-sans font-bold tracking-tighter leading-none"
                    style={{
                        color: COLORS.TEXT_MAIN,
                        textShadow: '0 0 20px rgba(255,255,255,0.1)'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {animatedValue}%
                </motion.span>

                <div
                    className="mt-4 px-2 py-0.5"
                    style={{
                        background: accentColor,
                        boxShadow: `0 0 10px ${accentColor}40`
                    }}
                >
                    <span
                        className="text-[10px] font-sans font-bold uppercase tracking-widest"
                        style={{ color: COLORS.BLACK }}
                    >
                        {status}
                    </span>
                </div>

                {subLabel && (
                    <span
                        className="text-[9px] font-mono text-center mt-3 max-w-[120px]"
                        style={{ color: accentColor }}
                    >
                        {subLabel}
                    </span>
                )}
            </div>

            {/* Decoractive Crosshairs */}
            <div className="absolute top-0 bottom-0 w-[1px] bg-[#111111]" />
            <div className="absolute left-0 right-0 h-[1px] bg-[#111111]" />
        </div>
    );
}

// Mini stat block - Typographic hierarchy
interface StatBlockProps {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'blue' | 'red';
    delay?: number;
}

export function StatBlock({ label, value, unit, trend, color = 'green', delay = 0 }: StatBlockProps) {
    const trendColor = colorMap[color];
    const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
            className="flex flex-col p-4 relative"
            style={{ borderRight: '1px solid #111111', borderBottom: '1px solid #111111' }}
        >
            <div className="flex justify-between items-start mb-1">
                <span
                    className="text-[9px] font-mono uppercase tracking-widest"
                    style={{ color: '#444444' }}
                >
                    {label}
                </span>
                <span
                    className="text-[8px] font-mono"
                    style={{ color: trendColor }}
                >
                    {trendSymbol}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span
                    className="text-2xl font-sans font-bold tracking-tighter"
                    style={{ color: COLORS.TEXT_MAIN }}
                >
                    {value}
                </span>
                {unit && (
                    <span
                        className="text-[10px] font-mono uppercase"
                        style={{ color: '#444444' }}
                    >
                        {unit}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// RAG Insight Card - Swiss Poster Style
interface InsightCardProps {
    source: string;
    conclusion: string;
    detail?: string;
    delay?: number;
}

export function InsightCard({ source, conclusion, detail, delay = 0 }: InsightCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="relative p-6 bg-black"
            style={{ border: '1px solid #222222' }}
        >
            {/* Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00FF94]" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-none bg-white flex items-center justify-center">
                    <span className="text-[10px] font-serif font-bold text-black">N</span>
                </div>
                <span
                    className="text-[9px] font-mono uppercase tracking-widest"
                    style={{ color: '#666666' }}
                >
                    {source}
                </span>
            </div>

            {/* Headline - Swiss Style Typography */}
            <h3
                className="text-xl font-sans font-bold leading-tight tracking-tight mb-4"
                style={{ color: COLORS.TEXT_MAIN, fontFamily: 'Arial, sans-serif' }}
            >
                {conclusion}
            </h3>

            {/* Data Block */}
            <div className="pl-4 border-l border-[#333333]">
                <p
                    className="text-[11px] font-mono leading-relaxed"
                    style={{ color: '#888888' }}
                >
                    {detail}
                </p>
            </div>

            {/* Interaction Hint */}
            <div className="mt-4 flex justify-end">
                <span className="text-[9px] font-mono text-[#333333] tracking-widest">
                    [ TAP FOR SOURCE ]
                </span>
            </div>
        </motion.div>
    );
}
