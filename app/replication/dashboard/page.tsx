"use client";

import { CircularProgress } from "@/components/replication/CircularProgress";
import { StressChart } from "@/components/replication/StressChart";
import { MacroBreakdown } from "@/components/replication/MacroBreakdown";
import { ActiveCalories } from "@/components/replication/ActiveCalories";
import { GlassNav } from "@/components/replication/GlassNav";
import { motion } from "framer-motion";
import { useMemo } from 'react';
import { useDashboard } from '@/hooks/domain/useDashboard';

export default function DashboardPage() {
    const { profile, weeklyLogs, isLoading, error } = useDashboard();
    const status = isLoading ? 'loading' : error ? 'error' : 'success';
    const isSkeleton = status === 'loading';

    // Transform data for components
    const todayLog = weeklyLogs[0]; // Assuming sorted desc

    // Stress Data (using last 7 logs reversed for chart)
    const stressData = weeklyLogs
        .filter(log => typeof log.stress_level === 'number')
        .slice(0, 7)
        .reverse()
        .map(log => ({
            time: new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short' }),
            value: (log.stress_level as number) * 10 // scale 1-10 to 10-100 for chart
        }));
    const currentStress = typeof todayLog?.stress_level === 'number' ? todayLog.stress_level * 10 : undefined;

    // Active Calories (Mindfulness/Exercise)
    const activeMinutes = typeof todayLog?.exercise_duration_minutes === 'number' ? todayLog.exercise_duration_minutes : undefined;
    const activityHistory = weeklyLogs
        .slice(0, 10)
        .reverse()
        .map(l => l.exercise_duration_minutes)
        .filter((value): value is number => typeof value === 'number');

    // Macro Breakdown (Mood Analysis)
    const moodStats = useMemo(() => {
        if (!weeklyLogs.length) return undefined;
        let peaceful = 0, anxious = 0, focus = 0, total = 0;
        weeklyLogs.forEach(log => {
            if (!log.mood_status) return;
            if (log.mood_status.includes('Good') || log.mood_status.includes('Calm') || log.mood_status.includes('良好')) peaceful++;
            else if (log.mood_status.includes('Anxious') || log.mood_status.includes('Stress') || log.mood_status.includes('低落')) anxious++;
            else focus++; // Default/Other to focus for demo
            total++;
        });
        if (total === 0) return undefined;
        return {
            peaceful: Math.round((peaceful / total) * 100),
            anxious: Math.round((anxious / total) * 100),
            focus: Math.round((focus / total) * 100)
        };
    }, [weeklyLogs]);

    const showResilience = isSkeleton || typeof currentStress === 'number';
    const showStressChart = isSkeleton || stressData.length > 0;
    const showMoodStats = isSkeleton || !!moodStats;
    const showActivity = isSkeleton || activityHistory.length > 0 || typeof activeMinutes === 'number';

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 relative">
            <header className="px-6 pt-12 pb-6 flex justify-between items-start z-10 sticky top-0 bg-slate-50/80 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className={`text-sm font-medium text-slate-400 uppercase tracking-wider mb-1${isSkeleton ? ' text-transparent bg-slate-200 rounded px-3 inline-block' : ''}`}>
                        {isSkeleton ? 'loading' : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h1>
                    <h2 className={`text-3xl font-bold text-slate-800${isSkeleton ? ' text-transparent bg-slate-200 rounded px-6 inline-block' : ''}`}>
                        {isSkeleton ? 'loading' : `Good morning${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
                    </h2>
                </motion.div>
                <div className={`w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm${isSkeleton ? ' animate-pulse' : ''}`}>
                    {profile?.id ? (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt="Profile" />
                    ) : null}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 scroll-smooth pb-32 no-scrollbar space-y-4">
                {showResilience && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <CircularProgress
                            value={typeof currentStress === 'number' ? 100 - currentStress : 0}
                            label="韧性指数"
                            subLabel="今日心理韧性"
                            isSkeleton={isSkeleton}
                        />
                    </motion.div>
                )}

                {showStressChart && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <StressChart
                            data={stressData}
                            currentStress={currentStress}
                            trendLabel={stressData.length > 1 && stressData[stressData.length - 1].value < stressData[stressData.length - 2].value ? "Stress Dropping" : "Stable"}
                            isSkeleton={isSkeleton}
                        />
                    </motion.div>
                )}

                {(showMoodStats || showActivity) && (
                    <div className="grid grid-cols-2 gap-4">
                        {showMoodStats && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                <MacroBreakdown stats={moodStats} isSkeleton={isSkeleton} />
                            </motion.div>
                        )}
                        {showActivity && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                <ActiveCalories minutes={activeMinutes} history={activityHistory} isSkeleton={isSkeleton} />
                            </motion.div>
                        )}
                    </div>
                )}

                {status === 'error' && error ? (
                    <div className="text-sm text-red-500 text-center pt-2">
                        {error}
                    </div>
                ) : null}
            </div>

            <GlassNav />
        </div>
    );
}
