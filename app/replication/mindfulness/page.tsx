"use client";

import { motion } from "framer-motion";
import { X, Play, Pause } from "lucide-react";
import InteractiveShape from "@/components/replication/InteractiveShape";
import { useState } from "react";

export default function MindfulnessPage() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="flex flex-col h-full w-full relative bg-slate-50 overflow-hidden">

            {/* Full Screen Gradient Ambient */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-slate-100 pointer-events-none" />

            {/* Header */}
            <header className="px-6 pt-12 flex justify-between items-center z-10">
                <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:bg-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Breathing</div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">

                {/* Breathing Orb Container */}
                <motion.div
                    animate={{
                        scale: isPlaying ? [1, 1.5, 1] : 1,
                    }}
                    transition={{
                        duration: 8, // 4s in, 4s out
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-72 h-72 flex items-center justify-center"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <InteractiveShape />
                    </div>

                    {/* Instruction Text overlaid on Orb */}
                    <motion.div
                        key={isPlaying ? "playing" : "paused"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-20 text-center"
                    >
                        {isPlaying ? (
                            <div className="text-slate-900/50 font-medium text-lg tracking-widest animate-pulse">
                                吸气... / 呼气...
                            </div>
                        ) : (
                            <div className="text-slate-900 font-bold text-2xl">
                                准备好了吗?
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Timer */}
                <div className="mt-12 text-center">
                    <div className="text-6xl font-light text-slate-900 tabular-nums tracking-tighter">
                        04:30
                    </div>
                    <div className="text-slate-400 mt-2 font-medium">剩余时间</div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-12 flex justify-center z-10">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all"
                >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
            </div>
        </div>
    );
}
