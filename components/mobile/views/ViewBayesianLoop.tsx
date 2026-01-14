"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Minus,
    Sparkles
} from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { BayesianMoment } from "@/components/bayesian/BayesianMoment";
import { useBayesianHistory, type BayesianHistoryRange } from "@/hooks/domain/useBayesianHistory";
import { useBayesianNudgeAction } from "@/hooks/domain/useBayesianNudgeAction";
import { cn } from "@/lib/utils";

interface HistoryPoint {
    id: string;
    date: string;
    belief_context?: string;
    prior_score: number;
    posterior_score: number;
    evidence_stack?: unknown[];
    exaggeration_factor?: number;
}

interface HistorySummary {
    total_entries: number;
    average_prior: number;
    average_posterior: number;
    average_reduction: number;
    trend: "improving" | "stable" | "worsening";
}

const RANGE_OPTIONS: { label: string; value: BayesianHistoryRange }[] = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
    { label: "ALL", value: "all" }
];

const NUDGE_ACTIONS = [
    { id: "breathing_exercise", label: "Breathing" },
    { id: "meditation", label: "Meditation" },
    { id: "exercise", label: "Exercise" },
    { id: "sleep_improvement", label: "Sleep" },
    { id: "hydration", label: "Hydration" },
    { id: "journaling", label: "Journaling" },
    { id: "stretching", label: "Stretching" }
];

interface ViewBayesianLoopProps {
    onBack?: () => void;
}

export const ViewBayesianLoop = ({ onBack }: ViewBayesianLoopProps) => {
    const { fetchHistory, isLoading: isHistoryLoading, error: historyError } = useBayesianHistory();
    const { trigger, isLoading: isNudging, error: nudgeError } = useBayesianNudgeAction();

    const [range, setRange] = useState<BayesianHistoryRange>("30d");
    const [points, setPoints] = useState<HistoryPoint[]>([]);
    const [summary, setSummary] = useState<HistorySummary | null>(null);
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const [momentData, setMomentData] = useState<{ prior: number; posterior: number } | null>(null);

    const loadHistory = useCallback(async () => {
        const data = await fetchHistory(range);
        if (!data) return;
        const payload = data?.data ?? data;
        setPoints(payload?.points ?? []);
        setSummary(payload?.summary ?? null);
    }, [fetchHistory, range]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadHistory();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadHistory]);

    const trendIcon = useMemo(() => {
        if (!summary) return null;
        if (summary.trend === "improving") return <TrendingDown className="w-4 h-4" />;
        if (summary.trend === "worsening") return <TrendingUp className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    }, [summary]);

    const handleNudge = async (actionType: string) => {
        setNudgeMessage(null);
        const result = await trigger({ action_type: actionType, duration_minutes: 10 });
        if (!result) return;
        setNudgeMessage(result.message);
        const prior = Math.round((result.new_posterior - result.correction) * 10) / 10;
        setMomentData({ prior, posterior: result.new_posterior });
        await loadHistory();
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
                        <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Bayesian Loop</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Belief updates + evidence history</p>
                    </div>
                </div>
                <button
                    onClick={loadHistory}
                    disabled={isHistoryLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5 text-stone-500", isHistoryLoading && "animate-spin")} />
                </button>
            </div>

            <div className="flex gap-2">
                {RANGE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setRange(option.value)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            range === option.value
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {historyError && (
                <CardGlass className="p-4 text-sm text-rose-500">
                    {historyError}
                </CardGlass>
            )}

            {summary && (
                <CardGlass className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-stone-500 dark:text-stone-400">Trend</div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                            {trendIcon}
                            {summary.trend}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-xs text-stone-400">Prior</div>
                            <div className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
                                {summary.average_prior}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-stone-400">Posterior</div>
                            <div className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
                                {summary.average_posterior}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-stone-400">Reduction</div>
                            <div className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
                                {summary.average_reduction}
                            </div>
                        </div>
                    </div>
                </CardGlass>
            )}

            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Recent Beliefs
                    </h3>
                    <span className="text-xs text-stone-400">{summary?.total_entries ?? 0} entries</span>
                </div>
                {points.length === 0 && !isHistoryLoading ? (
                    <CardGlass className="p-4 text-sm text-stone-400">No history yet.</CardGlass>
                ) : (
                    points.slice(-8).map((point) => (
                        <CardGlass key={point.id} className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                                    {point.belief_context || "General"}
                                </div>
                                <div className="text-xs text-stone-400">
                                    {new Date(point.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-stone-400">Prior → Posterior</div>
                                <div className="text-sm font-bold text-emerald-950 dark:text-emerald-50">
                                    {Math.round(point.prior_score)} → {Math.round(point.posterior_score)}
                                </div>
                            </div>
                        </CardGlass>
                    ))
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Trigger Nudge
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {NUDGE_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleNudge(action.id)}
                            disabled={isNudging}
                            className={cn(
                                "py-3 rounded-xl text-sm font-semibold border transition-all",
                                "bg-white dark:bg-white/5 border-stone-200 dark:border-white/10",
                                "hover:border-emerald-400 hover:text-emerald-600",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
                {nudgeError && (
                    <CardGlass className="p-4 text-sm text-rose-500">{nudgeError}</CardGlass>
                )}
                {nudgeMessage && (
                    <CardGlass className="p-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700">
                        {nudgeMessage}
                    </CardGlass>
                )}
            </div>

            <AnimatePresence>
                {momentData && (
                    <BayesianMoment
                        prior={momentData.prior}
                        posterior={momentData.posterior}
                        onComplete={() => setMomentData(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
