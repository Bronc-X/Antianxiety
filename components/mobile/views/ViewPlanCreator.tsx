"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import {
    X,
    Sparkles,
    ArrowRight,
    Clock,
    Calendar,
    Check,
    Zap,
    Brain,
    Trees,
    Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewPlanCreatorProps {
    onClose: () => void;
    onCreate: (input: { name: string; category: string; description?: string; items?: string[] }) => Promise<boolean>;
    isSaving?: boolean;
    error?: string | null;
}

const steps = ["Type", "Details", "Review"];

export const ViewPlanCreator = ({ onClose, onCreate, isSaving = false, error = null }: ViewPlanCreatorProps) => {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [planData, setPlanData] = useState({
        type: '',
        title: '',
        time: '30 min',
        aiPrompt: ''
    });
    const [isGenerating] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const categories = [
        { id: 'Mind', icon: Brain, color: "bg-purple-100 text-purple-600", label: "Mindfulness" },
        { id: 'Body', icon: Zap, color: "bg-orange-100 text-orange-600", label: "Workout" },
        { id: 'Nature', icon: Trees, color: "bg-green-100 text-green-600", label: "Outdoors" },
        { id: 'Nutrition', icon: Utensils, color: "bg-blue-100 text-blue-600", label: "Nutrition" },
    ];

    const canContinue = useMemo(() => {
        if (step === 0) {
            return mode === 'manual'
                ? Boolean(planData.type)
                : planData.aiPrompt.trim().length >= 4;
        }

        if (step === 1 && mode === 'manual') {
            return planData.title.trim().length > 0;
        }

        return true;
    }, [mode, planData.aiPrompt, planData.title, planData.type, step]);

    const handleNext = () => {
        setLocalError(null);

        if (!canContinue) {
            setLocalError(mode === 'manual' ? '请选择分类并填写标题' : '请输入你的目标或需求');
            return;
        }

        if (mode === 'ai' && step === 0) {
            const prompt = planData.aiPrompt.trim();
            const normalizedPrompt = prompt.toLowerCase();
            const resolvedType =
                /sleep|rest|睡|失眠/.test(normalizedPrompt) ? 'Mind' :
                    /run|workout|exercise|运动|健身/.test(normalizedPrompt) ? 'Body' :
                        /food|diet|nutrition|饮食|营养/.test(normalizedPrompt) ? 'Nutrition' :
                            /outdoor|walk|nature|户外|自然/.test(normalizedPrompt) ? 'Nature' :
                                'Mind';

            setPlanData(prev => ({
                ...prev,
                title: prev.title || prompt.slice(0, 28),
                type: prev.type || resolvedType,
                time: prev.time || '20 min',
            }));
            setStep(2);
            return;
        }

        setStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const buildPlanInput = () => {
        const name = planData.title.trim() || planData.aiPrompt.trim();
        if (!name) {
            setLocalError('请输入计划标题');
            return null;
        }

        const category = planData.type || (mode === 'ai' ? 'Mind' : 'general');
        const description = mode === 'ai'
            ? planData.aiPrompt.trim()
            : `Duration: ${planData.time}`;

        return {
            name,
            category,
            description,
        };
    };

    const handleConfirm = async () => {
        if (isGenerating) return;
        setLocalError(null);
        const input = buildPlanInput();
        if (!input) return;

        const success = await onCreate(input);
        if (success) {
            setPlanData({ type: '', title: '', time: '30 min', aiPrompt: '' });
            setStep(0);
            onClose();
            return;
        }

        if (!error) {
            setLocalError('创建失败，请稍后再试');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-[#EAE9E5] dark:bg-[#050505] flex flex-col"
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-2">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-stone-500"
                >
                    <X size={24} />
                </button>
                <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i <= step ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700")} />
                    ))}
                </div>
                <div className="w-8" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">Create Plan</h2>
                                <p className="text-stone-500">How should we start?</p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="grid grid-cols-2 gap-4">
                                <CardGlass
                                    className={cn("cursor-pointer border-2 hover:border-emerald-500/50 transition-all", mode === 'manual' ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-transparent")}
                                    onClick={() => setMode('manual')} // This logic needs to be wrapped properly in a client comp but for demo direct onClick is fine
                                >
                                    <div onClick={() => setMode('manual')} className="h-full flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                                            <Calendar size={20} />
                                        </div>
                                        <span className="font-bold text-stone-700">Manual</span>
                                    </div>
                                </CardGlass>
                                <CardGlass
                                    className={cn("cursor-pointer border-2 hover:border-amber-500/50 transition-all", mode === 'ai' ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10" : "border-transparent")}

                                >
                                    <div onClick={() => setMode('ai')} className="h-full flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Sparkles size={20} />
                                        </div>
                                        <span className="font-bold text-stone-700">AI Assist</span>
                                    </div>
                                </CardGlass>
                            </div>

                            {mode === 'manual' ? (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-800">Select Category</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setPlanData({ ...planData, type: cat.id })}
                                                className={cn(
                                                    "p-3 rounded-xl flex items-center gap-3 transition-all border",
                                                    planData.type === cat.id
                                                        ? "border-emerald-500 bg-white shadow-md text-emerald-950"
                                                        : "border-stone-200 bg-white/50 text-stone-500 hover:bg-white"
                                                )}
                                            >
                                                <div className={cn("p-1.5 rounded-lg", cat.color)}>
                                                    <cat.icon size={16} />
                                                </div>
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-800">What&apos;s your goal?</h3>
                                    <textarea
                                        className="w-full p-4 rounded-2xl bg-white border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none h-32"
                                        placeholder="E.g. I need to relax after a stressful meeting..."
                                        value={planData.aiPrompt}
                                        onChange={(e) => setPlanData({ ...planData, aiPrompt: e.target.value })}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 1 && mode === 'manual' && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">Details</h2>
                                <p className="text-stone-500">Fine tune your {planData.type} plan.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={planData.title}
                                        onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
                                        placeholder="e.g. Morning Jog"
                                        className="w-full p-4 rounded-2xl bg-white border border-stone-200 font-medium outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Duration</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        {['10 min', '20 min', '30 min', '45 min', '60 min'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setPlanData({ ...planData, time: t })}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
                                                    planData.time === t
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                        : "bg-white border-stone-200 text-stone-600"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">Review</h2>
                                <p className="text-stone-500">Ready to add this to your day?</p>
                            </div>

                            <CardGlass className="p-6 bg-gradient-to-br from-emerald-50/50 to-white/50 border-emerald-100">
                                <div className="flex items-start gap-4">
                                    <div className={cn("p-3 rounded-2xl bg-white shadow-sm text-emerald-600")}>
                                        <Zap size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 mb-2 uppercase tracking-wide">
                                            {planData.type}
                                        </span>
                                        <h3 className="text-xl font-bold text-emerald-950 mb-1">{planData.title}</h3>
                                        <div className="flex items-center gap-3 text-stone-500 text-sm">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {planData.time}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Simulated AI insights */}
                                {mode === 'ai' && (
                                    <div className="mt-6 pt-6 border-t border-emerald-100">
                                        <div className="flex gap-2 items-start">
                                            <Sparkles size={16} className="text-amber-500 mt-0.5" />
                                            <p className="text-xs text-stone-600 leading-relaxed">
                                                Based on your goal to <span className="font-semibold italic">&quot;{planData.aiPrompt}&quot;</span>, I&apos;ve designed a session that combines light movement with nature exposure to lower cortisol levels.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardGlass>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-white dark:bg-black/20 border-t border-stone-100 dark:border-white/5">
                {(localError || error) && (
                    <p className="text-sm text-rose-600 mb-3">{localError || error}</p>
                )}

                <button
                    onClick={step === 2 ? handleConfirm : handleNext}
                    disabled={isSaving || isGenerating}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                        isSaving || isGenerating
                            ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                            : "bg-emerald-950 text-white"
                    )}
                >
                    {isSaving || isGenerating ? (
                        <>
                            <Sparkles size={18} className="animate-spin" /> Saving Plan...
                        </>
                    ) : step === 2 ? (
                        <>Confirm & Add Plan <Check size={20} /></>
                    ) : (
                        <>Continue <ArrowRight size={20} /></>
                    )}
                </button>
            </div>
        </motion.div>
    )
}
