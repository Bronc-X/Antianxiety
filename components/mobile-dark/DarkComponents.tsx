'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BioGaugeProps {
    value: number;
    max?: number;
    label: string;
    status: string;
    color?: 'green' | 'blue' | 'red' | 'yellow';
}

const colorMap = {
    green: '#00FF94',
    blue: '#007AFF',
    red: '#FF3B30',
    yellow: '#FFCC00',
};

export function BioGauge({ value, max = 100, label, status, color = 'green' }: BioGaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const size = 220;
    const strokeWidth = 6;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (animatedValue / max) * 100;
    const offset = circumference - (progress / 100) * circumference;
    const accentColor = colorMap[color];

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Outer glow ring */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-20"
                style={{ background: accentColor }}
            />

            {/* SVG Gauge */}
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#1A1A1A"
                    strokeWidth={strokeWidth}
                />

                {/* Progress arc */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                {/* Tick marks */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i / 12) * 360 - 90;
                    const x1 = size / 2 + (radius - 10) * Math.cos((angle * Math.PI) / 180);
                    const y1 = size / 2 + (radius - 10) * Math.sin((angle * Math.PI) / 180);
                    const x2 = size / 2 + (radius - 18) * Math.cos((angle * Math.PI) / 180);
                    const y2 = size / 2 + (radius - 18) * Math.sin((angle * Math.PI) / 180);

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#333333"
                            strokeWidth={1}
                        />
                    );
                })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-5xl font-mono font-bold tracking-tight"
                    style={{ color: '#FFFFFF' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {animatedValue}
                </motion.span>
                <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em] mt-1"
                    style={{ color: accentColor }}
                >
                    {label}
                </span>
            </div>

            {/* Status badge */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-1"
                style={{
                    background: '#111111',
                    border: `1px solid ${accentColor}40`,
                }}
            >
                <span
                    className="text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: accentColor }}
                >
                    {status}
                </span>
            </motion.div>
        </div>
    );
}

// Mini stat block for grid display
interface StatBlockProps {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'green' | 'blue' | 'red' | 'yellow';
    delay?: number;
}

export function StatBlock({ label, value, unit, trend, color = 'green', delay = 0 }: StatBlockProps) {
    const accentColor = colorMap[color];
    const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—';
    const trendColor = trend === 'up' ? '#00FF94' : trend === 'down' ? '#FF3B30' : '#666666';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-4"
            style={{
                background: '#0A0A0A',
                border: '1px solid #1A1A1A',
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <span
                    className="text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: '#555555' }}
                >
                    {label}
                </span>
                <span
                    className="text-[10px] font-mono"
                    style={{ color: trendColor }}
                >
                    {trendSymbol}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span
                    className="text-2xl font-mono font-bold"
                    style={{ color: '#FFFFFF' }}
                >
                    {value}
                </span>
                {unit && (
                    <span
                        className="text-xs font-mono"
                        style={{ color: '#444444' }}
                    >
                        {unit}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// RAG Insight Card (Swiss Style)
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
            className="p-5"
            style={{
                background: '#0A0A0A',
                border: '1px solid #222222',
            }}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Source citation */}
            <div className="flex items-center gap-2 mb-4">
                <div
                    className="w-1 h-4"
                    style={{ background: '#00FF94' }}
                />
                <span
                    className="text-[10px] font-mono uppercase tracking-[0.1em]"
                    style={{ color: '#555555' }}
                >
                    {source}
                </span>
            </div>

            {/* Main conclusion */}
            <p
                className="text-lg font-medium leading-snug mb-3"
                style={{
                    color: '#FFFFFF',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {conclusion}
            </p>

            {/* Expandable detail */}
            {detail && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                        height: expanded ? 'auto' : 0,
                        opacity: expanded ? 1 : 0
                    }}
                    className="overflow-hidden"
                >
                    <p
                        className="text-sm leading-relaxed pt-3 border-t"
                        style={{
                            color: '#666666',
                            borderColor: '#222222',
                        }}
                    >
                        {detail}
                    </p>
                </motion.div>
            )}

            {/* Expand indicator */}
            <div
                className="text-[9px] font-mono uppercase tracking-wider mt-3"
                style={{ color: '#333333' }}
            >
                {expanded ? '— COLLAPSE' : '+ EXPAND'}
            </div>
        </motion.div>
    );
}
