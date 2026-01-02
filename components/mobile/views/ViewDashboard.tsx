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
};

interface ViewDashboardProps {
    onNavigate?: (view: string) => void;
}

export const ViewDashboard = ({ onNavigate }: ViewDashboardProps) => {
    const { profile, hardwareData, digitalTwin, isLoading } = useDashboard();

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    // Fallback data
    const userName = profile?.display_name || "User";
    const userAvatar = profile?.avatar_url || "https://i.pravatar.cc/150?u=admin";

    // Hardware Metrics
    const heartRate = hardwareData?.heartRate?.[0]?.avg || "--";
    const sleepDuration = hardwareData?.sleep?.[0]?.duration ?
        `${Math.floor(hardwareData.sleep[0].duration / 60)}h ${hardwareData.sleep[0].duration % 60}m` : "--";

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
            <NextAppointmentCard
                onClick={() => onNavigate?.('calibration')}
                title="Daily Check-in"
                time="Action Required"
                doctor="Calibration"
                type="video"
            />

            <div className="grid grid-cols-2 gap-4">
                <HealthMetricCard
                    title="Heart Rate" value={`${heartRate}`} unit="bpm" icon={Heart} trend="neutral" trendValue="--"
                    colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                    className="h-[150px]"
                />
                <HealthMetricCard
                    title="Sleep" value={sleepDuration} unit="" icon={Moon} trend="neutral" trendValue="--"
                    colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    className="h-[150px]"
                />
            </div>

            <div onClick={() => onNavigate?.('digital-twin')} className="cursor-pointer active:scale-[0.98] transition-transform">
                <MoodWaveChart data={digitalTwin?.curveData || []} />
            </div>
        </motion.div>
    );
};
