"use client";

import { motion } from "framer-motion";

interface CircularProgressProps {
    value: number; // 0-100 score
    label: string;
    subLabel: string;
}

export const CircularProgress = ({ value, label, subLabel }: CircularProgressProps) => {
    const radius = 80;
    const strokeWidth = 12;
    const percentage = Math.min(Math.max(value, 0), 100);
    const circumference = radius * 2 * Math.PI;
    const arcLength = circumference * 0.6; // 60% of full circle
    const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

    return (
        <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-sm">
            <div className="relative w-48 h-32 flex items-center justify-center overflow-hidden">
                <svg
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                    className="rotate-[198deg]"
                >
                    {/* Background Track */}
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeLinecap="round"
                    />
                    {/* Progress Path - Gradient changed to Calming Teal/Green */}
                    <motion.circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="url(#resilience-gradient)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: arcLength }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                        <linearGradient id="resilience-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34D399" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                    </defs>
                </svg>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-5xl font-bold text-slate-900 tracking-tight"
                    >
                        {value}
                    </motion.div>
                    <div className="text-emerald-600 text-sm font-medium">{subLabel}</div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-between w-full px-4 mt-2 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    当前状态
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    潜力
                </div>
            </div>
        </div>
    );
};
