"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Layers, UserCheck, PlayCircle } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useAdaptiveOnboarding } from "@/hooks/domain/useAdaptiveOnboarding";
import { usePhaseGoals } from "@/hooks/domain/usePhaseGoals";
import { useOnboarding } from "@/hooks/domain/useOnboarding";
import { useAssistantProfile } from "@/hooks/domain/useAssistantProfile";

interface ViewAdaptiveOnboardingProps {
    onBack?: () => void;
}

export const ViewAdaptiveOnboarding = ({ onBack }: ViewAdaptiveOnboardingProps) => {
    const adaptive = useAdaptiveOnboarding();
    const phaseGoals = usePhaseGoals();
    const onboarding = useOnboarding();
    const assistantProfile = useAssistantProfile();

    const [adaptiveAnswers, setAdaptiveAnswers] = useState({
        primary_goal: "sleep",
        stress_level: "medium",
        energy_level: "low"
    });
    const [adaptiveResult, setAdaptiveResult] = useState<any>(null);

    const [phaseGoalsResult, setPhaseGoalsResult] = useState<any>(null);
    const [goalId, setGoalId] = useState("");
    const [newGoalType, setNewGoalType] = useState("sleep");
    const [newGoalTitle, setNewGoalTitle] = useState("");

    const [onboardingJson, setOnboardingJson] = useState("{\"first_name\":\"A\",\"primary_goal\":\"sleep\"}");
    const [onboardingResult, setOnboardingResult] = useState<any>(null);

    const [assistantInput, setAssistantInput] = useState({
        gender: "",
        age_range: "",
        sleep_hours: "",
        stress_level: ""
    });

    const handleAdaptive = async () => {
        const result = await adaptive.recommend(adaptiveAnswers);
        setAdaptiveResult(result);
    };

    const handlePhaseGoals = async () => {
        const result = await phaseGoals.fetchGoals();
        setPhaseGoalsResult(result);
    };

    const handleExplainGoal = async () => {
        if (!goalId) return;
        const result = await phaseGoals.explainGoal(goalId);
        setPhaseGoalsResult(result);
    };

    const handleConfirmGoal = async () => {
        if (!goalId || !newGoalType) return;
        const result = await phaseGoals.confirmGoal(goalId, newGoalType, newGoalTitle || undefined);
        setPhaseGoalsResult(result);
    };

    const handleSaveOnboarding = async () => {
        try {
            const payload = JSON.parse(onboardingJson);
            const success = await onboarding.saveStep(payload);
            setOnboardingResult({ success, progress: onboarding.progress });
        } catch (err) {
            setOnboardingResult({ error: err instanceof Error ? err.message : "Invalid JSON" });
        }
    };

    const handleSaveAssistant = async () => {
        const payload: any = {};
        if (assistantInput.gender) payload.gender = assistantInput.gender;
        if (assistantInput.age_range) payload.age_range = assistantInput.age_range;
        if (assistantInput.sleep_hours) payload.sleep_hours = Number(assistantInput.sleep_hours);
        if (assistantInput.stress_level) payload.stress_level = Number(assistantInput.stress_level);
        await assistantProfile.save(payload);
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
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Adaptive Onboarding</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Goals + profile + onboarding state</p>
                </div>
            </div>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Goal Recommendation</h3>
                </div>
                {Object.entries(adaptiveAnswers).map(([key, value]) => (
                    <input
                        key={key}
                        value={value}
                        onChange={(e) => setAdaptiveAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                        placeholder={key}
                    />
                ))}
                <button
                    onClick={handleAdaptive}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                >
                    Recommend
                </button>
                {adaptive.error && <div className="text-xs text-rose-500">{adaptive.error}</div>}
                {adaptiveResult && (
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(adaptiveResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Phase Goals</h3>
                </div>
                <button
                    onClick={handlePhaseGoals}
                    className="w-full py-2 rounded-xl border border-violet-200 text-violet-600 text-sm font-semibold"
                >
                    Load Goals
                </button>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        placeholder="Goal ID"
                        className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                    <input
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value)}
                        placeholder="New type"
                        className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                    <input
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="New title"
                        className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleExplainGoal}
                        className="py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                    >
                        Explain Goal
                    </button>
                    <button
                        onClick={handleConfirmGoal}
                        className="py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                    >
                        Confirm Goal
                    </button>
                </div>
                {phaseGoals.error && <div className="text-xs text-rose-500">{phaseGoals.error}</div>}
                {phaseGoalsResult && (
                    <pre className="text-xs bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(phaseGoalsResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Onboarding Progress</h3>
                </div>
                <div className="text-xs text-stone-500">
                    Step {onboarding.currentStep} / {onboarding.progress.total_steps} · Completed {onboarding.progress.completed_steps.length}
                </div>
                <textarea
                    value={onboardingJson}
                    onChange={(e) => setOnboardingJson(e.target.value)}
                    className="w-full min-h-[90px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                <button
                    onClick={handleSaveOnboarding}
                    className="w-full py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
                >
                    Save Step
                </button>
                {onboarding.error && <div className="text-xs text-rose-500">{onboarding.error}</div>}
                {onboardingResult && (
                    <pre className="text-xs bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(onboardingResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Assistant Profile</h3>
                </div>
                {Object.entries(assistantInput).map(([key, value]) => (
                    <input
                        key={key}
                        value={value}
                        onChange={(e) => setAssistantInput(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={key}
                        className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                ))}
                <button
                    onClick={handleSaveAssistant}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                >
                    Save Profile
                </button>
                {assistantProfile.error && <div className="text-xs text-rose-500">{assistantProfile.error}</div>}
            </CardGlass>
        </motion.div>
    );
};
