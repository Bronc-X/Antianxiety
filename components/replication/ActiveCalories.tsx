"use client";

import { motion } from "framer-motion";
import { Wind } from "lucide-react";
import Link from "next/link";


interface ActiveCaloriesProps {
    minutes?: number;
    history?: number[];
    isSkeleton?: boolean;
}

export const ActiveCalories = ({
    minutes,
    history = [],
    isSkeleton = false
}: ActiveCaloriesProps) => {
    const displayHistory = isSkeleton ? new Array(10).fill(50) : history;
    const displayMinutes = typeof minutes === 'number' ? minutes : 0;

    return (
        <Link href="/replication/mindfulness">
            <div className={`p-5 bg-white rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer${isSkeleton ? ' animate-pulse' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <h3 className="text-sm font-semibold text-slate-500">正念练习时长</h3>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Bar Chart Visualization */}
                    <div className="flex-1 h-12 flex gap-1 items-end">
                        {displayHistory.map((h, i) => (

                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className={`flex-1 rounded-sm ${isSkeleton ? "bg-slate-200" : i > 7 ? "bg-slate-100" : "bg-teal-400"}`} // Highlight recent
                            />
                        ))}
                    </div>

                    <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Wind className="w-5 h-5 text-teal-500 fill-teal-500" />
                        <span className={`text-xl${isSkeleton ? ' text-transparent bg-slate-200 rounded px-2' : ''}`}>
                            {isSkeleton ? 'loading' : displayMinutes}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">分钟</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
