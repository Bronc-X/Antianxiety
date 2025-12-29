'use client';

import { motion } from 'framer-motion';
import { Heart, CloudSun, ChevronRight, LayoutGrid, Calendar, User, Zap } from 'lucide-react';
import Link from 'next/link';

// ----------------------------------------------------------------------
// Light Mode Components (Inline for now, can extract later)
// ----------------------------------------------------------------------

const COLORS = {
    BG: '#F5F5F7',
    CARD: '#FFFFFF',
    TEXT_MAIN: '#000000',
    TEXT_SEC: '#8E8E93',
    ACCENT_GREEN: '#34C759',
    ACCENT_BLUE: '#007AFF',
    ACCENT_ORANGE: '#FF9500',
    ACCENT_RED: '#FF3B30',
};

function LightMetricCard({ icon, label, value, subValue, color }: any) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100">
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
                style={{ background: color, boxShadow: `0 4px 10px ${color}30` }}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-black leading-none">{value}</span>
                    {subValue && <span className="text-[10px] text-gray-400">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}

function LightMetricBars({ recovery, strain, sleep }: any) {
    // Similar to Dark but light colors
    const Bar = ({ label, value, color }: any) => (
        <div className="mb-5 last:mb-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <Bar label="Recovery" value={recovery} color={COLORS.ACCENT_GREEN} />
            <Bar label="Strain" value={strain} color={COLORS.ACCENT_BLUE} />
            <Bar label="Sleep" value={sleep} color="#AF52DE" /> {/* Purple */}
        </div>
    );
}

function LightBottomNav() {
    return (
        <div className="fixed bottom-6 left-0 right-0 z-[9999] px-12 flex justify-center">
            <nav
                className="flex items-center justify-around w-full max-w-[320px] px-2 py-2 rounded-full backdrop-blur-xl bg-white/80 shadow-lg border border-white/50"
            >
                <Link href="/mobile-light" className="p-3 bg-black rounded-full text-white shadow-md">
                    <LayoutGrid className="w-5 h-5" />
                </Link>
                <Link href="/mobile-light/max" className="p-3 text-gray-400 hover:text-black transition-colors">
                    <Zap className="w-5 h-5" />
                </Link>
                <Link href="/mobile-light/discover" className="p-3 text-gray-400 hover:text-black transition-colors">
                    <Calendar className="w-5 h-5" />
                </Link>
                <Link href="/mobile-light/settings" className="p-3 text-gray-400 hover:text-black transition-colors">
                    <User className="w-5 h-5" />
                </Link>
            </nav>
        </div>
    );
}

export default function MobileLightPage() {
    const date = new Date();
    const dateString = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="pb-32 px-5 pt-14">
            {/* Header */}
            <header className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {dateString}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Good Morning
                    </h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-200 border border-white shadow-sm overflow-hidden">
                    {/* User Avatar Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {/* Top Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <LightMetricCard
                        icon={<Heart className="w-5 h-5 fill-white text-white" />}
                        color={COLORS.ACCENT_BLUE}
                        label="Health Score"
                        value="8.5"
                    />
                    <LightMetricCard
                        icon={<CloudSun className="w-5 h-5 text-white" />}
                        color={COLORS.ACCENT_ORANGE}
                        label="Weather"
                        value="26°"
                    />
                </div>

                {/* Main Card */}
                <div className="p-6 rounded-3xl bg-white shadow-xl shadow-gray-200/50 border border-white">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-semibold text-gray-900">Today's Snapshot</h2>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <LightMetricBars recovery={72} strain={92} sleep={67} />

                    <div className="mt-6 p-4 rounded-2xl bg-gray-50 text-gray-600 text-xs leading-relaxed border border-gray-100">
                        <span className="font-bold text-gray-900">All good!</span> Your recovery is high. Push yourself a bit more today.
                    </div>
                </div>

                {/* Stress Card */}
                <div className="p-6 rounded-3xl bg-white shadow-xl shadow-gray-200/50 border border-white">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <h2 className="text-sm font-semibold text-gray-900">Stress Level</h2>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    {/* Simple chart placeholder */}
                    <div className="h-32 flex items-end justify-between gap-1">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-full bg-blue-50 rounded-t-sm"
                                style={{
                                    height: `${20 + Math.random() * 80}%`,
                                    background: Math.random() > 0.8 ? '#FF3B30' : '#007AFF'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <LightBottomNav />
        </div>
    );
}
