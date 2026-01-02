"use client";

/**
 * ViewAnalysis - Health Analysis Dashboard
 * 
 * Mobile UI for viewing analysis reports and trends using useAnalysis hook.
 */

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    RefreshCw,
    ChevronLeft,
    FileText,
    Sparkles,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalysis, type TrendData } from "@/hooks/domain/useAnalysis";

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
};

// ============================================
// Sub-Components
// ============================================

function TrendCard({ trend }: { trend: TrendData }) {
    const trendIcon = trend.direction === 'up'
        ? <TrendingUp className="w-4 h-4" />
        : trend.direction === 'down'
            ? <TrendingDown className="w-4 h-4" />
            : <Minus className="w-4 h-4" />;

    const trendColor = trend.direction === 'up'
        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
        : trend.direction === 'down'
            ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
            : "text-stone-500 bg-stone-50 dark:bg-white/5";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 p-4"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-500 dark:text-stone-400">
                    {trend.metric}
                </span>
                <div className={cn("p-1.5 rounded-lg", trendColor)}>
                    {trendIcon}
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                    {trend.value}
                </span>
                {trend.change && (
                    <span className={cn("text-sm font-medium mb-0.5", trendColor.split(' ')[0])}>
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function ReportCard({ report, isLatest }: {
    report: { id: string; created_at: string; summary?: string; type?: string; insights?: string[] };
    isLatest?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white dark:bg-white/5 rounded-2xl border p-4",
                isLatest
                    ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
                    : "border-stone-200 dark:border-white/10"
            )}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-2 rounded-xl",
                        isLatest ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-stone-100 dark:bg-white/10"
                    )}>
                        <FileText className={cn(
                            "w-4 h-4",
                            isLatest ? "text-emerald-600" : "text-stone-500"
                        )} />
                    </div>
                    <div>
                        <span className="font-bold text-emerald-950 dark:text-emerald-50 text-sm">
                            {report.type === 'monthly' ? 'Monthly' : 'Weekly'} Report
                        </span>
                        {isLatest && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
                                Latest
                            </span>
                        )}
                    </div>
                </div>
                <span className="text-xs text-stone-400">
                    {new Date(report.created_at).toLocaleDateString()}
                </span>
            </div>

            {report.summary && (
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3">
                    {report.summary}
                </p>
            )}

            {report.insights && report.insights.length > 0 && (
                <div className="space-y-2">
                    {report.insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-amber-500 mt-1 flex-shrink-0" />
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                {insight}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================
// Main Component
// ============================================

interface ViewAnalysisProps {
    onBack?: () => void;
}

export const ViewAnalysis = ({ onBack }: ViewAnalysisProps) => {
    const {
        latestReport,
        trends,
        history,
        isLoading,
        isGenerating,
        error,
        generate,
        loadHistory,
        refresh
    } = useAnalysis();

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pb-32"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">
                        Analysis
                    </h1>
                </div>
                <button
                    onClick={refresh}
                    disabled={isLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5 text-stone-500", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Trends Grid */}
                    {trends.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                                30-Day Trends
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {trends.slice(0, 4).map((trend, idx) => (
                                    <TrendCard key={idx} trend={trend} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => generate('weekly')}
                        disabled={isGenerating}
                        className="w-full mb-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate New Analysis
                            </>
                        )}
                    </motion.button>

                    {/* Latest Report */}
                    {latestReport && (
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                                Latest Report
                            </h2>
                            <ReportCard report={latestReport} isLatest />
                        </div>
                    )}

                    {/* History */}
                    {history.length > 1 && (
                        <div>
                            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                                Previous Reports
                            </h2>
                            <div className="space-y-3">
                                {history.slice(1, 5).map((report) => (
                                    <ReportCard key={report.id} report={report} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!latestReport && trends.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-emerald-950 dark:text-emerald-50 mb-2">
                                No Analysis Yet
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mb-6">
                                Generate your first health analysis to see personalized insights.
                            </p>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};
