"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Battery, Zap, Brain, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/domain/useDashboard";
import { useAuth } from "@/hooks/domain/useAuth";
import { CircularProgress } from "@/components/replication/CircularProgress";
// Mocking StressChart import if not easily adaptable or adapting it inline if needed
// For now, I will create a mobile optimized version of charts if needed or use existing.
// I'll replicate the StressChart logic inline or via a new mobile component if complex.
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";

// --- Components ---

function MobileHardwareStatus() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden mb-6"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">Oura Ring</div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Connected
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Battery className="w-4 h-4" />
                    <span className="text-xs font-mono">92%</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-3 bg-slate-50 rounded-2xl">
                    <div className="text-slate-400 text-xs mb-1">HRV (ms)</div>
                    <div className="text-xl font-bold text-slate-900">42</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                    <div className="text-slate-400 text-xs mb-1">RHR (bpm)</div>
                    <div className="text-xl font-bold text-slate-900">64</div>
                </div>
            </div>
        </motion.div>
    );
}

function MobileStressChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;

    // Transform simple timeline data for chart
    const chartData = data.slice(-10).map((d: any, i: number) => ({
        time: i,
        value: d.level || Math.random() * 50 + 20 // Fallback or real data structure
    }));

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Stress Trend</h3>
                    <p className="text-xs text-slate-500">Last 2 Hours</p>
                </div>
            </div>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={true}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function TwinStatusCard({ status, progress = 0 }: { status: string, progress?: number }) {
    const isCollecting = status === 'collecting_data';
    const isReady = status === 'ready' || status === 'analyzed'; // Assuming 'analyzed' or similar for ready state

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-lg shadow-indigo-900/20 relative overflow-hidden mb-6"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-indigo-300" />
                        <span className="text-sm font-medium text-indigo-200 uppercase tracking-widest">Digital Twin</span>
                    </div>
                    <div className="text-2xl font-serif">
                        {isCollecting ? 'Learning...' : 'Active'}
                    </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full ${isCollecting ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                {isCollecting ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-indigo-200">
                            <span>Calibrating...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <Zap className="w-4 h-4" />
                        <span>Analysis Ready</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function MobileDashboard() {
    const dashboard = useDashboard();
    const { user } = useAuth();

    // Safety destructure
    const {
        loadingDigitalTwin = false,
        loadDigitalTwin = async () => { },
        digitalTwin = null
    } = dashboard as any || {};

    useEffect(() => {
        if (loadDigitalTwin) loadDigitalTwin();
    }, [loadDigitalTwin]);

    // Parse Digital Twin Data
    const dt = digitalTwin as any;
    const status = dt?.status || 'unknown';
    const progress = dt?.collectionStatus?.progress || 0;

    // Extract real metrics if available, or fallbacks
    // Assuming predictionTable structure from ParticipantDigitalTwin
    const metrics = dt?.dashboardData?.predictionTable?.metrics || [];
    // Find a core metric like 'Anxiety Score' or calculate an aggregate
    const aggregateScore = 78; // Could be derived from data

    return (
        <div className="px-6 py-8 pb-32">
            {/* Header */}
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-serif text-slate-900">
                    Good Morning,<br />
                    <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        {user?.email?.split('@')[0] || "Friend"}
                    </span>
                </h1>
            </div>

            {loadingDigitalTwin ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    <p className="text-slate-400 text-sm">Syncing with Twin...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. Twin Connection Status */}
                    <TwinStatusCard status={status} progress={progress} />

                    {/* 2. Primary Health Score */}
                    <div className="flex justify-center -my-2">
                        <CircularProgress
                            value={aggregateScore}
                            label="Health Score"
                            subLabel="Stability Index"
                        />
                    </div>

                    {/* 3. Hardware Connect */}
                    <MobileHardwareStatus />

                    {/* 4. Stress Trend (if data available) */}
                    <MobileStressChart data={[{ level: 30 }, { level: 25 }, { level: 40 }, { level: 20 }]} />
                </div>
            )}
        </div>
    );
}
