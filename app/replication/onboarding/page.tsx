"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import InteractiveShape from "@/components/replication/InteractiveShape";

const STEPS = [
    {
        id: "welcome",
        title: "欢迎使用 Antianxiety",
        description: "在开始之前，让我们花几分钟了解您的心理健康状态！",
        buttonText: "开始疗愈之旅",
        buttonAction: "next"
    },
    {
        id: "notifications",
        title: "帮助我们实现平静",
        description: "获取正念练习提醒和压力状态更新",
        buttonText: "允许通知",
        buttonAction: "next"
    },
    {
        id: "health",
        title: "允许访问健康数据",
        description: "我们需要您的健康数据(HRV/睡眠)来分析焦虑指数",
        buttonText: "连接健康数据",
        buttonAction: "finish"
    }
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            window.location.href = "/replication/activity-level";
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 relative overflow-hidden">
            {/* Background Clouds/Decoration */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-teal-100/50 to-transparent pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center items-center px-8 z-10 w-full">
                {/* 2.5D Animated Shape */}
                <div className="h-64 w-full flex items-center justify-center relative mb-8">
                    <InteractiveShape />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex flex-col items-center text-center gap-4 w-full max-w-sm"
                    >
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {STEPS[currentStep].title}
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            {STEPS[currentStep].description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 pb-12 z-10">
                <Button
                    onClick={handleNext}
                    className="w-full h-14 rounded-full text-lg font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                >
                    {STEPS[currentStep].buttonText}
                </Button>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep ? "w-8 bg-slate-900" : "w-2 bg-slate-300"}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
