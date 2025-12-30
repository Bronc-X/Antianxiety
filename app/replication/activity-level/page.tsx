"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, Armchair, Footprints, PersonStanding, Flame } from "lucide-react"; // Using closest proxies for icons
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ACTIVITY_LEVELS = [
    {
        id: "sedentary",
        title: "久坐不动",
        description: "一天的大部分时间都坐着（例如案头工作）。极少的体力活动",
        icon: <Armchair className="w-8 h-8 text-slate-500" />
    },
    {
        id: "lightly",
        title: "轻度活跃",
        description: "每周 1-3 次锻炼，每次约 30-45 分钟，低至中等强度",
        icon: <Footprints className="w-8 h-8 text-blue-500" />
    },
    {
        id: "moderate",
        title: "中度活跃",
        description: "每周 3-5 次锻炼，每次约 30-45 分钟，中等强度",
        icon: <PersonStanding className="w-8 h-8 text-orange-500" />
    },
    {
        id: "very",
        title: "非常活跃",
        description: "每周 6-7 次锻炼，每次通常 60 分钟以上",
        icon: <Flame className="w-8 h-8 text-red-500" />
    }
];

export default function ActivityLevelPage() {
    const [selected, setSelected] = useState("lightly");

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            {/* Background gradient from top */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-12 pb-4 z-10">
                <span className="font-semibold text-sm">9:41</span>
                <div className="flex gap-1">
                    <div className="w-4 h-2.5 bg-black rounded-sm" />
                    <div className="w-4 h-2.5 bg-black rounded-sm" />
                    <div className="w-4 h-2.5 bg-slate-300 rounded-sm" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 z-10 no-scrollbar">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                        最能定义您<br />活动水平的是什么？
                    </h1>
                </motion.div>

                <div className="space-y-4">
                    {ACTIVITY_LEVELS.map((level) => {
                        const isSelected = selected === level.id;
                        return (
                            <motion.div
                                key={level.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelected(level.id)}
                                className={`relative p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 ${isSelected
                                    ? "border-black bg-white shadow-xl shadow-blue-100 ring-1 ring-black/5"
                                    : "border-transparent bg-slate-50"
                                    }`}
                            >
                                {/* Checkmark Badge */}
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1.5 shadow-lg border-4 border-white"
                                    >
                                        <Check className="w-3 h-3 stroke-[4]" />
                                    </motion.div>
                                )}

                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{level.title}</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed pr-8">{level.description}</p>
                                </div>

                                <div className="self-center">
                                    {/* Character Image Placeholder */}
                                    {/* In a real app we would use the 3D character images here */}
                                    <div className="w-12 h-16 relative">
                                        {level.icon}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Fixed Area */}
            <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-white via-white to-transparent z-20 flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-slate-200" asChild>
                    <Link href="/replication/onboarding">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                </Button>

                <Button className="flex-1 h-14 rounded-full text-lg bg-black text-white hover:bg-black/90 shadow-xl shadow-black/10" asChild>
                    <Link href="/replication/dashboard">
                        继续
                    </Link>
                </Button>
            </div>
        </div>
    );
}
