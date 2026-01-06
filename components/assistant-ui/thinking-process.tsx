"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THINKING_STEPS = [
    "正在分析您的输入...",
    "正在回顾您的健康日志...",
    "正在检索相关心理学知识...",
    "正在构建个性化建议...",
    "Max 正在组织语言...",
];

export function ThinkingProcess() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Cycle through steps every 1.5 seconds
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % THINKING_STEPS.length);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className="relative flex size-4 items-center justify-center">
                    {/* Breathing/Pulse Effect when generating */}
                    <div className="absolute inset-0 z-10 rounded-full bg-[#4ADE80]/30 animate-pulse ring-[3px] ring-[#4ADE80]/50" style={{ animationDuration: '2s' }} />
                    <div className="size-2 rounded-full bg-[#4ADE80]" />
                </div>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={currentStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs font-medium text-[#4ADE80]"
                    >
                        {THINKING_STEPS[currentStep]}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                    className="h-full bg-[#4ADE80]"
                    initial={{ width: "0%" }}
                    animate={{
                        width: ["0%", "100%"],
                    }}
                    transition={{
                        duration: 12, // Slower duration
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop" // Start from 0 after reaching end
                    }}
                    style={{
                        boxShadow: "0 0 10px rgba(74, 222, 128, 0.5)"
                    }}
                />
            </div>
        </div>
    );
}
