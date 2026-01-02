"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    HealthMetricCard,
    MoodWaveChart,
    NextAppointmentCard
} from "@/components/mobile/HealthWidgets";
import {
    Heart,
    Moon,
} from "lucide-react";
import { useDashboard } from "@/hooks/domain/useDashboard";

const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
} as const;

interface ViewDashboardProps {
    onNavigate?: (view: string) => void;
}

export const ViewDashboard = ({ onNavigate }: ViewDashboardProps) => {
    const { profile, weeklyLogs, hardwareData, digitalTwin, isLoading } = useDashboard();

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    // Fallback data
    const userName = profile?.full_name || "User";
    const userAvatar = "https://i.pravatar.cc/150?u=admin";

    // Check if daily check-in is complete
    const isCheckinCompleted = React.useMemo(() => {
        if (!weeklyLogs || weeklyLogs.length === 0) return false;

        // Simple local date check "YYYY-MM-DD"
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return weeklyLogs.some(log => log.log_date?.startsWith(today));
    }, [weeklyLogs]);

    // Hardware Metrics
    const heartRateValue = hardwareData?.resting_heart_rate?.value;
    const heartRate = heartRateValue ? Math.round(heartRateValue).toString() : "--";

    // Sleep: Try to get from today's log or recent logs
    const recentLog = weeklyLogs?.[0];
    const latestLog = weeklyLogs?.length ? [...weeklyLogs].sort((a, b) => (b.log_date || "").localeCompare(a.log_date || ""))[0] : null;

    const sleepMins = latestLog?.sleep_duration_minutes;
    const sleepDuration = sleepMins
        ? `${Math.floor(sleepMins / 60)}h ${sleepMins % 60}m`
        : "--";

    // Chart Data Handling
    const dtData = digitalTwin as any;
    const rawTrend = dtData?.dashboardData?.charts?.anxietyTrend || [];
    const chartData = Array.isArray(rawTrend)
        ? rawTrend.map((v: number, i: number) => ({ value: v, time: `W${i}` }))
        : [];

    return (
        <motion.div
            initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
            className="space-y-6 pb-24"
        >
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{greeting}</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Let&apos;s start your day with intention, {userName}.</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden ring-2 ring-white dark:ring-black">
                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Daily Check-in CTA */}
            {!isCheckinCompleted ? (
                <NextAppointmentCard
                    onClick={() => onNavigate?.('calibration')}
                    title="Daily Check-in"
                    subtitle="Action Required"
                    label="Today"
                    icon={Heart} /* Using Heart icon for calibration */
                    bgClass="bg-gradient-to-br from-indigo-600 to-violet-700"
                />
            ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Daily Calibration Complete</h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Your digital twin is updated.</p>
                    </div>
                    <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                        <Heart size={16} className="text-emerald-600 dark:text-emerald-100 fill-current" />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <HealthMetricCard
                    title="Heart Rate"
                    value={heartRate}
                    unit="bpm"
                    icon={Heart}
                    trend={hardwareData?.resting_heart_rate ? "neutral" : undefined}
                    trendValue="--"
                    colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                    className="h-[150px]"
                />
                <HealthMetricCard
                    title="Sleep"
                    value={sleepDuration}
                    unit=""
                    icon={Moon}
                    trend="neutral"
                    trendValue="--"
                    colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    className="h-[150px]"
                />
            </div>

            <div onClick={() => onNavigate?.('digital-twin')} className="cursor-pointer active:scale-[0.98] transition-transform">
                <MoodWaveChart
                    data={chartData}
                    title="Emotional Resilience"
                    subtitle="Based on your Bayesian Analysis"
                    color="#059669"
                />
            </div>
        </motion.div>
    );
};
