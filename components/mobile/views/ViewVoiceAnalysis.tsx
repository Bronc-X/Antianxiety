"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Loader2 } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useVoiceAnalysis } from "@/hooks/domain/useVoiceAnalysis";

interface ViewVoiceAnalysisProps {
    onBack?: () => void;
}

export const ViewVoiceAnalysis = ({ onBack }: ViewVoiceAnalysisProps) => {
    const { analyze, isProcessing, error } = useVoiceAnalysis();
    const [transcript, setTranscript] = useState("");
    const [formState, setFormState] = useState({
        sleepDuration: "7h",
        sleepQuality: "ok",
        exerciseDuration: "20m",
        moodStatus: "neutral",
        stressLevel: "medium",
        notes: ""
    });
    const [result, setResult] = useState<unknown | null>(null);

    const handleAnalyze = async () => {
        const data = await analyze({
            transcript,
            currentFormState: formState
        });
        if (data) {
            setResult(data);
        }
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
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Voice Analysis</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Analyze tone + stress markers</p>
                </div>
            </div>

            <CardGlass className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Transcript</h3>
                </div>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste a voice transcript..."
                    className="w-full min-h-[120px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                />
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formState).map(([key, value]) => (
                        <label key={key} className="text-xs text-stone-500 space-y-1">
                            <span className="uppercase">{key}</span>
                            <input
                                value={value}
                                onChange={(e) => setFormState(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm text-stone-700 dark:text-stone-200"
                            />
                        </label>
                    ))}
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isProcessing || !transcript.trim()}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                    Analyze
                </button>
                {error && <div className="text-xs text-rose-500">{error}</div>}
                {result && (
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                )}
            </CardGlass>
        </motion.div>
    );
};
