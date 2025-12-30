"use client";

import { CircularProgress } from "@/components/replication/CircularProgress";
import { StressChart } from "@/components/replication/StressChart";
import { MacroBreakdown } from "@/components/replication/MacroBreakdown";
import { ActiveCalories } from "@/components/replication/ActiveCalories";
import { GlassNav } from "@/components/replication/GlassNav";
import { User, Bell, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
    return (
        <div className="flex flex-col h-full w-full bg-slate-50 relative">

            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex justify-between items-start z-10 sticky top-0 bg-slate-50/80 backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                        <Calendar className="w-3 h-3" />
                        今天，10月12日
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">早安，Rico</h1>
                </div>
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center relative"
                >
                    <span className="text-xl">😌</span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </motion.div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 scroll-smooth pb-32 no-scrollbar">
                <div className="space-y-6">
                    {/* Main Circular Progress - Resilience */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <CircularProgress
                            value={85}
                            label="韧性指数"
                            subLabel="今日心理韧性"
                        />
                    </motion.div>

                    {/* Stress Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <StressChart />
                    </motion.div>

                    {/* Title Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="pt-2"
                    >
                        <h2 className="text-lg font-bold text-slate-900 mb-4">今日洞察</h2>
                        <div className="space-y-4">
                            <MacroBreakdown />
                            <ActiveCalories />
                        </div>
                    </motion.div>

                    {/* Extra spacing for nav */}
                    <div className="h-20" />
                </div>
            </div>

            {/* Floating Navigation */}
            <GlassNav />
        </div>
    );
}
