"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, MessageSquare, Send, X } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useInquiry } from "@/hooks/domain/useInquiry";
import { useProactiveInquiry } from "@/hooks/domain/useProactiveInquiry";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ViewInquiryCenterProps {
    onBack?: () => void;
}

export const ViewInquiryCenter = ({ onBack }: ViewInquiryCenterProps) => {
    const { language } = useI18n();
    const { pending, isLoading, isResponding, error, loadPending, respond } = useInquiry();
    const proactive = useProactiveInquiry({}, language === "en" ? "en" : "zh", false);

    const [pendingAnswer, setPendingAnswer] = useState("");
    const [proactiveAnswer, setProactiveAnswer] = useState("");

    useEffect(() => {
        loadPending(language === "en" ? "en" : "zh");
    }, [language, loadPending]);

    const pendingInquiry = pending?.inquiry;
    const hasPending = Boolean(pending?.hasInquiry && pendingInquiry);

    const proactiveOptions = proactive.currentInquiry?.options ?? [];
    const pendingOptions = pendingInquiry?.options ?? [];

    const proactivePatterns = useMemo(() => proactive.getResponsePatterns(), [proactive]);

    const handlePendingSubmit = async (value?: string) => {
        if (!pendingInquiry) return;
        const responseValue = value ?? pendingAnswer.trim();
        if (!responseValue) return;
        const success = await respond(pendingInquiry.id, responseValue);
        if (success) {
            setPendingAnswer("");
            await loadPending(language === "en" ? "en" : "zh");
        }
    };

    const handleProactiveSubmit = async (value?: string) => {
        if (!proactive.currentInquiry) return;
        const responseValue = value ?? proactiveAnswer.trim();
        if (!responseValue) return;
        await proactive.submitAnswer(responseValue);
        setProactiveAnswer("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Inquiry Center</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Pending + proactive inquiries</p>
                    </div>
                </div>
                <button
                    onClick={() => loadPending(language === "en" ? "en" : "zh")}
                    disabled={isLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5 text-stone-500", isLoading && "animate-spin")} />
                </button>
            </div>

            {error && (
                <CardGlass className="p-4 text-sm text-rose-500">
                    {error}
                </CardGlass>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Pending Inquiry
                    </h3>
                </div>
                <CardGlass className="p-4 space-y-4">
                    {hasPending ? (
                        <>
                            <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                                {pendingInquiry?.question_text}
                            </div>
                            {pendingOptions.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {pendingOptions.map((option: any) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePendingSubmit(option.value)}
                                            disabled={isResponding}
                                            className={cn(
                                                "py-2 rounded-xl text-sm font-semibold border transition-all",
                                                "bg-white dark:bg-white/5 border-stone-200 dark:border-white/10",
                                                "hover:border-emerald-400 hover:text-emerald-600",
                                                "disabled:opacity-50 disabled:cursor-not-allowed"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    value={pendingAnswer}
                                    onChange={(e) => setPendingAnswer(e.target.value)}
                                    placeholder="Your answer"
                                    className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                                />
                                <button
                                    onClick={() => handlePendingSubmit()}
                                    disabled={isResponding}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-stone-500">No pending inquiry.</div>
                    )}
                </CardGlass>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Proactive Inquiry
                    </h3>
                </div>
                <CardGlass className="p-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Engagement: {proactive.engagementLevel}</span>
                        <span>Response rate: {Math.round(proactivePatterns.responseRate * 100)}%</span>
                    </div>
                    <button
                        onClick={() => proactive.showInquiry()}
                        className="w-full py-2 rounded-xl border border-sky-200 text-sky-600 text-sm font-semibold hover:bg-sky-50"
                    >
                        Generate Question
                    </button>
                    {proactive.currentInquiry ? (
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                                {proactive.currentInquiry.question_text}
                            </div>
                            {proactiveOptions.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {proactiveOptions.map((option: any) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleProactiveSubmit(option.value)}
                                            className={cn(
                                                "py-2 rounded-xl text-sm font-semibold border transition-all",
                                                "bg-white dark:bg-white/5 border-stone-200 dark:border-white/10",
                                                "hover:border-emerald-400 hover:text-emerald-600"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    value={proactiveAnswer}
                                    onChange={(e) => setProactiveAnswer(e.target.value)}
                                    placeholder="Your answer"
                                    className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                                />
                                <button
                                    onClick={() => handleProactiveSubmit()}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <button
                                onClick={() => proactive.dismissInquiry()}
                                className="w-full py-2 rounded-xl border border-stone-200 text-stone-500 text-xs font-semibold"
                            >
                                <X size={14} className="inline mr-1" />
                                Dismiss
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-stone-500">No proactive inquiry active.</div>
                    )}
                </CardGlass>
            </div>
        </motion.div>
    );
};
