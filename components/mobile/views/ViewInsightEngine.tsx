"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Brain, Activity } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useInsight } from "@/hooks/domain/useInsight";
import { useDeepInference } from "@/hooks/domain/useDeepInference";
import { useUnderstandingScore } from "@/hooks/domain/useUnderstandingScore";
import { useAskMaxExplain } from "@/hooks/domain/useAskMaxExplain";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ViewInsightEngineProps {
    onBack?: () => void;
}

export const ViewInsightEngine = ({ onBack }: ViewInsightEngineProps) => {
    const { language } = useI18n();
    const { generate, fallback, isLoading: insightLoading, error: insightError } = useInsight();
    const { fetchInference, isLoading: inferenceLoading, error: inferenceError } = useDeepInference();
    const { fetchScore, isLoading: scoreLoading, error: scoreError } = useUnderstandingScore();
    const { askMax, getExplanation, isLoading: isAskLoading } = useAskMaxExplain();

    const [insightInput, setInsightInput] = useState({
        sleep_hours: "7",
        hrv: "55",
        stress_level: "5",
        exercise_minutes: "20"
    });
    const [insightText, setInsightText] = useState<string | null>(null);

    const [analysisJson, setAnalysisJson] = useState("{\"summary\":\"ok\"}");
    const [logsJson, setLogsJson] = useState("[]");
    const [inferenceResult, setInferenceResult] = useState<any>(null);
    const [inferenceErrorLocal, setInferenceErrorLocal] = useState<string | null>(null);

    const [scoreDays, setScoreDays] = useState("30");
    const [includeHistory, setIncludeHistory] = useState(true);
    const [scoreResult, setScoreResult] = useState<any>(null);

    const [recId, setRecId] = useState("demo-rec");
    const [recTitle, setRecTitle] = useState("Sleep consistency");
    const [recDescription, setRecDescription] = useState("Improve bedtime consistency by 30 minutes.");
    const [recScience, setRecScience] = useState("Circadian rhythm alignment improves stress recovery.");

    const handleInsightGenerate = async () => {
        setInsightText(null);
        const payload = {
            sleep_hours: Number(insightInput.sleep_hours || 0),
            hrv: Number(insightInput.hrv || 0),
            stress_level: Number(insightInput.stress_level || 0),
            exercise_minutes: Number(insightInput.exercise_minutes || 0)
        };
        const result = await generate(payload);
        if (result) {
            setInsightText(result);
        }
    };

    const handleInsightFallback = async () => {
        const result = await fallback();
        if (result) {
            setInsightText(result);
        }
    };

    const handleInference = async () => {
        setInferenceErrorLocal(null);
        try {
            const analysisResult = JSON.parse(analysisJson);
            const recentLogs = JSON.parse(logsJson);
            const result = await fetchInference({ analysisResult, recentLogs });
            setInferenceResult(result);
        } catch (err) {
            setInferenceErrorLocal(err instanceof Error ? err.message : "Invalid JSON input");
        }
    };

    const handleScore = async () => {
        const options = {
            days: Number(scoreDays || 0),
            includeHistory,
        };
        const result = await fetchScore(options);
        setScoreResult(result.data ?? null);
    };

    const handleAskMax = async () => {
        await askMax({
            recId,
            title: recTitle,
            description: recDescription,
            science: recScience,
            language: language === "en" ? "en" : "zh"
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
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
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Insight Engine</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Insights, inference, and explainers</p>
                </div>
            </div>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Insight</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(insightInput).map(([key, value]) => (
                        <label key={key} className="text-xs text-stone-500 space-y-1">
                            <span className="uppercase">{key}</span>
                            <input
                                value={value}
                                onChange={(e) => setInsightInput(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                            />
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleInsightGenerate}
                        disabled={insightLoading}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                    >
                        Generate
                    </button>
                    <button
                        onClick={handleInsightFallback}
                        className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-sm font-semibold"
                    >
                        Fallback
                    </button>
                </div>
                {insightError && <div className="text-xs text-rose-500">{insightError}</div>}
                {insightText && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                        {insightText}
                    </div>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Deep Inference</h3>
                </div>
                <textarea
                    value={analysisJson}
                    onChange={(e) => setAnalysisJson(e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                <textarea
                    value={logsJson}
                    onChange={(e) => setLogsJson(e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                <button
                    onClick={handleInference}
                    disabled={inferenceLoading}
                    className="w-full py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
                >
                    Run Inference
                </button>
                {(inferenceError || inferenceErrorLocal) && (
                    <div className="text-xs text-rose-500">{inferenceError || inferenceErrorLocal}</div>
                )}
                {inferenceResult && (
                    <pre className="text-xs bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(inferenceResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Understanding Score</h3>
                </div>
                <div className="flex gap-2">
                    <input
                        value={scoreDays}
                        onChange={(e) => setScoreDays(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                        placeholder="Days"
                    />
                    <label className="flex items-center gap-2 text-xs text-stone-500">
                        <input
                            type="checkbox"
                            checked={includeHistory}
                            onChange={(e) => setIncludeHistory(e.target.checked)}
                        />
                        Include history
                    </label>
                </div>
                <button
                    onClick={handleScore}
                    disabled={scoreLoading}
                    className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold"
                >
                    Fetch Score
                </button>
                {scoreError && <div className="text-xs text-rose-500">{scoreError}</div>}
                {scoreResult && (
                    <pre className="text-xs bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(scoreResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Ask Max Explain</h3>
                </div>
                <input
                    value={recId}
                    onChange={(e) => setRecId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                    placeholder="Recommendation ID"
                />
                <input
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                    placeholder="Title"
                />
                <textarea
                    value={recDescription}
                    onChange={(e) => setRecDescription(e.target.value)}
                    className="w-full min-h-[70px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                    placeholder="Description"
                />
                <textarea
                    value={recScience}
                    onChange={(e) => setRecScience(e.target.value)}
                    className="w-full min-h-[70px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                    placeholder="Science"
                />
                <button
                    onClick={handleAskMax}
                    disabled={isAskLoading(recId)}
                    className={cn(
                        "w-full py-2 rounded-xl text-sm font-semibold",
                        "bg-amber-500 text-white"
                    )}
                >
                    Explain
                </button>
                {getExplanation(recId) && (
                    <div className="text-sm text-amber-900 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                        {getExplanation(recId)}
                    </div>
                )}
            </CardGlass>
        </motion.div>
    );
};
