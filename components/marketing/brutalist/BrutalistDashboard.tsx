'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Moon, Brain, Heart, Zap, TrendingUp, TrendingDown, Minus, Settings, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BrutalistNav from './BrutalistNav';
import { useDashboard } from '@/hooks/domain/useDashboard';
import { useAuth } from '@/hooks/domain/useAuth';

interface WellnessLog {
    log_date: string;
    overall_readiness?: number | null;
    ai_recommendation?: string | null;
    sleep_quality?: number;
    stress_level?: number;
}

export default function BrutalistDashboard() {
    const router = useRouter();
    const { weeklyLogs, isLoading, error } = useDashboard();
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const logs = weeklyLogs as WellnessLog[];
    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs.find((log) => log.log_date === today) || null;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/brutalist/signup');
        }
    }, [authLoading, isAuthenticated, router]);

    const getReadinessColor = (score: number) => {
        if (score < 2.5) return 'text-blue-400 border-blue-400/50';
        if (score < 3.5) return 'text-cyan-400 border-cyan-400/50';
        if (score < 4.2) return 'text-yellow-400 border-yellow-400/50';
        return 'signal-green signal-green-border';
    };

    const getTrend = () => {
        if (logs.length < 2) return 'stable';
        const recent = logs.slice(0, 3).reduce((sum, l) => sum + (l.overall_readiness || 0), 0) / Math.min(logs.length, 3);
        const older = logs.slice(3).reduce((sum, l) => sum + (l.overall_readiness || 0), 0) / Math.max(logs.length - 3, 1);
        if (recent > older + 0.3) return 'improving';
        if (recent < older - 0.3) return 'declining';
        return 'stable';
    };

    if (isLoading || authLoading) {
        return (
            <div className="brutalist-page min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00FF94] border-t-transparent rounded-full animate-spin animate-pulse" />
            </div>
        );
    }

    const trend = getTrend();

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-3 border border-[#333] hover:border-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="brutalist-h3">Health Dashboard</h1>
                                <p className="text-sm text-[#888]">Your Bio-Digital Twin</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/settings')}
                            className="p-3 border border-[#333] hover:border-white transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Today's Status */}
                    {todayLog ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`brutalist-card p-8 mb-6 border-l-4 ${getReadinessColor(todayLog.overall_readiness || 0)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-[#888] mb-2">Today's Readiness</p>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-5xl font-bold">{(todayLog.overall_readiness || 0).toFixed(1)}</span>
                                        <span className="text-xl text-[#888]">/5</span>
                                    </div>
                                    <p className="brutalist-h3">{todayLog.ai_recommendation}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#888] mb-1">7-Day Trend</p>
                                    <div className="flex items-center gap-2">
                                        {trend === 'improving' && <TrendingUp className="w-5 h-5 signal-green" />}
                                        {trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-400" />}
                                        {trend === 'stable' && <Minus className="w-5 h-5 text-yellow-400" />}
                                        <span className="text-sm capitalize">{trend}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="brutalist-card p-8 mb-6 text-center"
                        >
                            <Activity className="w-12 h-12 mx-auto mb-4 text-[#555]" />
                            <h3 className="brutalist-h3 mb-2">No Calibration Today</h3>
                            <p className="brutalist-body mb-6">Complete your daily check-in to track your readiness.</p>
                            <button
                                onClick={() => router.push('/brutalist/calibration')}
                                className="brutalist-cta brutalist-cta-filled group"
                            >
                                <span>Start Calibration</span>
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </motion.div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="brutalist-card p-5"
                        >
                            <Moon className="w-5 h-5 text-blue-400 mb-3" />
                            <p className="text-2xl font-bold">{logs.filter(l => l.sleep_quality && l.sleep_quality >= 4).length}</p>
                            <p className="text-xs text-[#888]">Good Sleep Days</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="brutalist-card p-5"
                        >
                            <Brain className="w-5 h-5 text-purple-400 mb-3" />
                            <p className="text-2xl font-bold">{logs.filter(l => l.stress_level && l.stress_level <= 2).length}</p>
                            <p className="text-xs text-[#888]">Low Stress Days</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="brutalist-card p-5"
                        >
                            <Zap className="w-5 h-5 signal-green mb-3" />
                            <p className="text-2xl font-bold">{logs.filter(l => (l.overall_readiness || 0) >= 4).length}</p>
                            <p className="text-xs text-[#888]">Peak Days</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="brutalist-card p-5"
                        >
                            <Activity className="w-5 h-5 text-yellow-400 mb-3" />
                            <p className="text-2xl font-bold">{logs.length}</p>
                            <p className="text-xs text-[#888]">Calibrations</p>
                        </motion.div>
                    </div>

                    {/* 7-Day Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="brutalist-card p-6 mb-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="brutalist-h3">Last 7 Days</h3>
                            <span className="text-xs text-[#888]">{logs.length} entries</span>
                        </div>

                        {logs.length > 0 ? (
                            <div className="flex items-end justify-between h-32 gap-2">
                                {[...Array(7)].map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - (6 - i));
                                    const dateStr = date.toISOString().split('T')[0];
                                    const log = logs.find(l => l.log_date === dateStr);
                                    const height = log ? (log.overall_readiness || 0) * 20 : 0;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                            <div
                                                className={`w-full transition-all duration-300 ${log ? 'bg-gradient-to-t from-[#00FF94] to-[#00FF94]/50' : 'bg-[#222]'
                                                    }`}
                                                style={{ height: `${Math.max(height, 4)}%` }}
                                            />
                                            <span className="text-[10px] text-[#555]">
                                                {date.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-[#555]">
                                No data yet
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            onClick={() => router.push('/brutalist/calibration')}
                            className="brutalist-card p-6 flex items-center justify-between group hover:border-[#00FF94]/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 border border-[#333] group-hover:border-[#00FF94]/50 transition-colors">
                                    <Activity className="w-5 h-5 signal-green" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">Daily Calibration</p>
                                    <p className="text-sm text-[#888]">Check your readiness</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            onClick={() => router.push('/brutalist')}
                            className="brutalist-card p-6 flex items-center justify-between group hover:border-white/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 border border-[#333] group-hover:border-white/30 transition-colors">
                                    <Heart className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">Back to Home</p>
                                    <p className="text-sm text-[#888]">Return to landing</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
                        </motion.button>
                    </div>
                </div>
                {error && (
                    <div className="mt-6 text-center text-xs text-red-400">{error}</div>
                )}
            </main>
        </div>
    );
}
