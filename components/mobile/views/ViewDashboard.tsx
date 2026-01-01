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

export const ViewDashboard = () => {
    return (
        <motion.div
            initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
            className="space-y-6 pb-24"
        >
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Good Morning</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Let&apos;s start your day with intention.</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden ring-2 ring-white dark:ring-black">
                    <img src="https://i.pravatar.cc/150?u=admin" alt="User" />
                </div>
            </div>

            <NextAppointmentCard />

            <div className="grid grid-cols-2 gap-4">
                <HealthMetricCard
                    title="Heart Rate" value="72" unit="bpm" icon={Heart} trend="up" trendValue="2%"
                    colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                    className="h-[150px]"
                />
                <HealthMetricCard
                    title="Sleep" value="8h" unit="20m" icon={Moon} trend="up" trendValue="12%"
                    colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    className="h-[150px]"
                />
            </div>

            <MoodWaveChart />
        </motion.div>
    );
};
