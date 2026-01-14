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

const initialOnboardingForm = {
    first_name: "",
    age: "",
    gender: "female",
    primary_goal: "",
    secondary_goals: "",
    sleep_quality: "",
    stress_level: "",
    energy_level: "",
    exercise_frequency: "",
    diet_type: "",
    work_hours: "",
    height: "",
    weight: "",
    notification_time: "08:00",
    language: "zh",
    ai_personality: "supportive"
};

type OnboardingFormKey = keyof typeof initialOnboardingForm;

export const ViewAdaptiveOnboarding = ({ onBack }: ViewAdaptiveOnboardingProps) => {
    const adaptive = useAdaptiveOnboarding();
    const phaseGoals = usePhaseGoals();
    const onboarding = useOnboarding({ suppressRedirect: true });
    const assistantProfile = useAssistantProfile();

    const [adaptiveAnswers, setAdaptiveAnswers] = useState({
        primary_goal: "sleep",
        stress_level: "medium",
        energy_level: "low"
    });
    const [adaptiveResult, setAdaptiveResult] = useState<unknown>(null);

    const [phaseGoalsResult, setPhaseGoalsResult] = useState<unknown>(null);
    const [goalId, setGoalId] = useState("");
    const [newGoalType, setNewGoalType] = useState("sleep");
    const [newGoalTitle, setNewGoalTitle] = useState("");

    const [onboardingForm, setOnboardingForm] = useState(initialOnboardingForm);
    const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);

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

    const updateOnboardingField = (key: OnboardingFormKey, value: string) => {
        setOnboardingForm(prev => ({ ...prev, [key]: value }));
    };

    const toNumber = (value: string) => {
        if (!value) return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const toList = (value: string) => {
        const list = value.split(",").map(entry => entry.trim()).filter(Boolean);
        return list.length > 0 ? list : undefined;
    };

    const buildOnboardingPayload = () => {
        switch (onboarding.currentStep) {
            case 1:
                return {
                    first_name: onboardingForm.first_name.trim() || undefined,
                    age: toNumber(onboardingForm.age),
                    gender: onboardingForm.gender || undefined
                };
            case 2:
                return {
                    primary_goal: onboardingForm.primary_goal.trim() || undefined,
                    secondary_goals: toList(onboardingForm.secondary_goals)
                };
            case 3:
                return {
                    sleep_quality: toNumber(onboardingForm.sleep_quality),
                    stress_level: toNumber(onboardingForm.stress_level),
                    energy_level: toNumber(onboardingForm.energy_level)
                };
            case 4:
                return {
                    exercise_frequency: onboardingForm.exercise_frequency.trim() || undefined,
                    diet_type: onboardingForm.diet_type.trim() || undefined,
                    work_hours: toNumber(onboardingForm.work_hours),
                    height: toNumber(onboardingForm.height),
                    weight: toNumber(onboardingForm.weight)
                };
            case 5:
                return {
                    notification_time: onboardingForm.notification_time || undefined,
                    language: onboardingForm.language || undefined,
                    ai_personality: onboardingForm.ai_personality || undefined
                };
            default:
                return {};
        }
    };

    const handleSaveOnboarding = async () => {
        setOnboardingStatus(null);
        const payload = buildOnboardingPayload();
        const cleaned = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => {
                if (value === undefined || value === "") return false;
                if (Array.isArray(value) && value.length === 0) return false;
                return true;
            })
        );
        if (Object.keys(cleaned).length === 0) {
            setOnboardingStatus("Please fill at least one field.");
            return;
        }
        const success = await onboarding.saveStep(cleaned);
        setOnboardingStatus(success ? "Saved." : "Save failed.");
    };

    const handleSaveAssistant = async () => {
        const payload: Record<string, unknown> = {};
        if (assistantInput.gender) payload.gender = assistantInput.gender;
        if (assistantInput.age_range) payload.age_range = assistantInput.age_range;
        if (assistantInput.sleep_hours) payload.sleep_hours = Number(assistantInput.sleep_hours);
        if (assistantInput.stress_level) payload.stress_level = Number(assistantInput.stress_level);
        await assistantProfile.save(payload);
    };

    const totalSteps = onboarding.progress.total_steps || 5;
    const completedSteps = onboarding.progress.completed_steps.length;
    const activeStep = Math.min(onboarding.currentStep, totalSteps);
    const progressPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
    const stepLabels: Record<number, string> = {
        1: "Basic Info",
        2: "Health Goals",
        3: "Current State",
        4: "Lifestyle",
        5: "Preferences"
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
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Onboarding Flow</h3>
                </div>
                <div className="text-xs text-stone-500">
                    Step {activeStep} / {totalSteps} · Completed {completedSteps}
                </div>
                <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                {onboarding.isLoading ? (
                    <div className="text-xs text-stone-400">Loading onboarding state...</div>
                ) : onboarding.isComplete ? (
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-emerald-600">Onboarding Complete</div>
                        <p className="text-xs text-stone-500">
                            Your profile is ready. You can return to the core hub or reset the flow.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="py-2 rounded-xl border border-stone-200 text-stone-500 text-xs font-semibold"
                                >
                                    Back to Hub
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onboarding.reset()}
                                className="py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-xs text-stone-500">
                            Active: {stepLabels[activeStep] || "Onboarding"}
                        </div>
                        {activeStep === 1 && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={onboardingForm.first_name}
                                    onChange={(e) => updateOnboardingField("first_name", e.target.value)}
                                    placeholder="First name"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.age}
                                    onChange={(e) => updateOnboardingField("age", e.target.value)}
                                    placeholder="Age"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <select
                                    value={onboardingForm.gender}
                                    onChange={(e) => updateOnboardingField("gender", e.target.value)}
                                    className="col-span-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                >
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        )}
                        {activeStep === 2 && (
                            <div className="space-y-2">
                                <input
                                    value={onboardingForm.primary_goal}
                                    onChange={(e) => updateOnboardingField("primary_goal", e.target.value)}
                                    placeholder="Primary goal (sleep, stress...)"
                                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.secondary_goals}
                                    onChange={(e) => updateOnboardingField("secondary_goals", e.target.value)}
                                    placeholder="Secondary goals (comma separated)"
                                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    value={onboardingForm.sleep_quality}
                                    onChange={(e) => updateOnboardingField("sleep_quality", e.target.value)}
                                    placeholder="Sleep"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.stress_level}
                                    onChange={(e) => updateOnboardingField("stress_level", e.target.value)}
                                    placeholder="Stress"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.energy_level}
                                    onChange={(e) => updateOnboardingField("energy_level", e.target.value)}
                                    placeholder="Energy"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                            </div>
                        )}
                        {activeStep === 4 && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={onboardingForm.exercise_frequency}
                                    onChange={(e) => updateOnboardingField("exercise_frequency", e.target.value)}
                                    placeholder="Exercise frequency"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.diet_type}
                                    onChange={(e) => updateOnboardingField("diet_type", e.target.value)}
                                    placeholder="Diet type"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.work_hours}
                                    onChange={(e) => updateOnboardingField("work_hours", e.target.value)}
                                    placeholder="Work hours"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.height}
                                    onChange={(e) => updateOnboardingField("height", e.target.value)}
                                    placeholder="Height (cm)"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <input
                                    value={onboardingForm.weight}
                                    onChange={(e) => updateOnboardingField("weight", e.target.value)}
                                    placeholder="Weight (kg)"
                                    className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                            </div>
                        )}
                        {activeStep === 5 && (
                            <div className="space-y-2">
                                <input
                                    type="time"
                                    value={onboardingForm.notification_time}
                                    onChange={(e) => updateOnboardingField("notification_time", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                                <select
                                    value={onboardingForm.language}
                                    onChange={(e) => updateOnboardingField("language", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                >
                                    <option value="zh">Chinese</option>
                                    <option value="en">English</option>
                                </select>
                                <input
                                    value={onboardingForm.ai_personality}
                                    onChange={(e) => updateOnboardingField("ai_personality", e.target.value)}
                                    placeholder="AI personality"
                                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onboarding.prevStep}
                                disabled={activeStep === 1}
                                className="py-2 rounded-xl border border-stone-200 text-stone-500 text-xs font-semibold disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveOnboarding}
                                disabled={onboarding.isSaving}
                                className="py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
                            >
                                {activeStep === totalSteps ? "Finish" : "Save & Next"}
                            </button>
                        </div>
                        {onboarding.isOffline && (
                            <div className="text-xs text-amber-500">Offline mode: sync when online.</div>
                        )}
                        {onboardingStatus && (
                            <div className="text-xs text-emerald-600">{onboardingStatus}</div>
                        )}
                    </div>
                )}
                {onboarding.error && <div className="text-xs text-rose-500">{onboarding.error}</div>}
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
