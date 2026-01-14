"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    X,
    Trash2,
    Pause,
    Archive,
    CheckCircle2,
    Circle
} from "lucide-react";
import { type PlanData } from "@/hooks/domain/usePlans";
import { cn } from "@/lib/utils";

interface ViewPlanDetailProps {
    onClose: () => void;
    plan: PlanData;
}

export const ViewPlanDetail = ({ onClose, plan }: ViewPlanDetailProps) => {
    // Helper to get logic for colors/labels
    const rawType = plan.plan_type || plan.category || 'general';
    const normalizedType = rawType.toLowerCase();
    const uiType = normalizedType === 'exercise' || normalizedType === 'body'
        ? 'Body'
        : normalizedType === 'diet' || normalizedType === 'nutrition'
            ? 'Nutrition'
            : normalizedType === 'sleep'
                ? 'Sleep'
                : normalizedType === 'nature' || normalizedType === 'outdoors'
                    ? 'Nature'
                    : normalizedType === 'mind' || normalizedType === 'comprehensive'
                        ? 'Mind'
                        : 'General';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none"
        >
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-[#FAFAF8] dark:bg-[#111] rounded-t-[2rem] pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Handle for drag (visual only) */}
                <div className="w-full flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800" />
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-600 mb-3 uppercase tracking-wide">
                                {uiType}
                            </span>
                            <h2 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50 leading-tight">
                                {plan.name}
                            </h2>
                        </div>
                        <button className="p-2 bg-stone-100 dark:bg-white/10 rounded-full" onClick={onClose}>
                            <X size={20} className="text-stone-500" />
                        </button>
                    </div>

                    {/* Stats Row - Placeholder for now as PlanData doesn't have these */}
                    {/* 
                    <div className="flex items-center gap-6 mb-8 text-stone-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Clock size={16} /> 30 min
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} /> Daily
                        </div>
                    </div>
                    */}

                    {/* Subtasks / Session Breakdown */}
                    <div className="space-y-4 mb-8">
                        <h3 className="font-bold text-stone-800 dark:text-stone-200">执行细项</h3>
                        <div className="space-y-3">
                            {plan.items && plan.items.length > 0 ? (
                                plan.items.map((item, i) => (
                                    <div key={item.id || i} className="flex items-start gap-4 p-3 rounded-xl bg-white dark:bg-white/5 border border-stone-100 dark:border-white/5">
                                        <div className={cn("flex-shrink-0 mt-0.5 text-stone-300", item.completed && "text-emerald-500")}>
                                            {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-stone-700 dark:text-stone-300">{item.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : plan.description ? (
                                // Fallback: Show description as content
                                <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-stone-100 dark:border-white/5">
                                    <p className="text-stone-600 dark:text-stone-400 whitespace-pre-wrap leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>
                            ) : (
                                // Empty state
                                <div className="p-4 rounded-xl bg-stone-50 dark:bg-white/5 text-center">
                                    <p className="text-stone-400 text-sm">暂无执行细项</p>
                                    <p className="text-stone-400 text-xs mt-1">可以在 Max 聊天中让 AI 生成更详细的方案</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition-colors">
                            <Pause size={24} />
                            Pause Plan
                        </button>
                        <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors">
                            <Archive size={24} />
                            Archive
                        </button>
                    </div>

                    <button className="w-full mt-4 flex items-center justify-center gap-2 text-rose-500 font-medium p-4 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 size={18} /> Delete Plan
                    </button>

                </div>
            </motion.div>
        </motion.div>
    )
}
