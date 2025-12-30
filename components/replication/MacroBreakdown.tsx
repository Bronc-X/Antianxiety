"use client";

import { motion } from "framer-motion";

export const MacroBreakdown = () => {
    return (
        <div className="p-5 bg-white rounded-[2rem] shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-500">情绪成分分析</h3>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="flex items-center justify-between">
                {/* Stats */}
                <div className="flex gap-6">
                    <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">平静</div>
                        <div className="text-lg font-bold text-violet-500">50%</div>
                        <div className="text-xs text-slate-400 mt-1">占比</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">焦虑</div>
                        <div className="text-lg font-bold text-rose-400">30%</div>
                        <div className="text-xs text-slate-400 mt-1">占比</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">专注</div>
                        <div className="text-lg font-bold text-sky-400">20%</div>
                        <div className="text-xs text-slate-400 mt-1">占比</div>
                    </div>
                </div>

                {/* Mini Donut Chart */}
                <div className="relative w-16 h-16">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                        {/* Peaceful Segment */}
                        <motion.circle
                            initial={{ strokeDasharray: "0 251" }}
                            animate={{ strokeDasharray: "125 251" }} // 50%
                            transition={{ duration: 1, delay: 0.2 }}
                            cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeDashoffset="0"
                        />
                        {/* Anxious Segment */}
                        <motion.circle
                            initial={{ strokeDasharray: "0 251" }}
                            animate={{ strokeDasharray: "75 251" }} // 30%
                            transition={{ duration: 1, delay: 0.4 }}
                            cx="50" cy="50" r="40" fill="none" stroke="#fb7185" strokeWidth="12" strokeDashoffset="-130"
                        />
                        {/* Focus Segment */}
                        <motion.circle
                            initial={{ strokeDasharray: "0 251" }}
                            animate={{ strokeDasharray: "50 251" }} // 20%
                            transition={{ duration: 1, delay: 0.6 }}
                            cx="50" cy="50" r="40" fill="none" stroke="#38bdf8" strokeWidth="12" strokeDashoffset="-205"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};
