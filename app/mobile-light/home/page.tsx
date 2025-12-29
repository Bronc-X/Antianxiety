'use client';

import { motion } from 'framer-motion';
import { CalorieArc, MacroRings, BarcodeChart, GlassDock } from '@/components/mobile-light/LightFidelityComponents';
import { ChevronRight, Calendar } from 'lucide-react';

export default function LightHome() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 font-sans text-[#1A1A1A]">
            {/* Header */}
            <header className="px-6 pt-14 pb-4 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-medium tracking-wide uppercase mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Today, 12 October</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#1A1A1A]">Welcome Back, Rico</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-xl">
                    🥑
                </div>
            </header>

            <div className="px-6 space-y-6">

                {/* 1. Main Calorie Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100"
                >
                    <div className="flex justify-between items-center mb-0">
                        <span className="text-xs font-semibold text-gray-500">Calories KCAL</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>

                    <CalorieArc />
                </motion.div>

                {/* 2. Title Placeholder (from screenshot) -> Macros */}
                <div>
                    <h2 className="text-sm font-medium text-gray-400 mb-3 ml-1">Daily Breakdown</h2>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-xs font-semibold text-gray-500">Macros Breakdown</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>

                        <MacroRings />
                    </motion.div>
                </div>

                {/* 3. Active Calories */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-xs font-semibold text-gray-500">Active Calories</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>

                    <BarcodeChart />
                </motion.div>

                {/* 4. Bottom Sheet Hint */}
                <div className="relative pt-4 pb-20">
                    <h2 className="text-sm font-medium text-gray-400 mb-3 ml-1">Today logs</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
                        <div className="min-w-[120px] h-[140px] bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col justify-end">
                            <span className="text-2xl mb-1">🥣</span>
                            <span className="text-sm font-bold text-[#1A1A1A]">Breakfast</span>
                            <span className="text-xs text-gray-400">420 kcal</span>
                        </div>
                        <div className="min-w-[120px] h-[140px] bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col justify-end">
                            <span className="text-2xl mb-1">🥗</span>
                            <span className="text-sm font-bold text-[#1A1A1A]">Lunch</span>
                            <span className="text-xs text-gray-400">650 kcal</span>
                        </div>
                        <div className="min-w-[120px] h-[140px] bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col justify-end">
                            <span className="text-2xl mb-1">🍎</span>
                            <span className="text-sm font-bold text-[#1A1A1A]">Snack</span>
                            <span className="text-xs text-gray-400">120 kcal</span>
                        </div>
                    </div>
                </div>

            </div>

            <GlassDock />
        </div>
    );
}
