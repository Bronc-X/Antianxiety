"use client";

/**
 * ViewProfileSetup - User Profile Setup Component
 * 
 * 问卷完成后的用户基础信息填写
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Loader2,
    ArrowRight,
    Target,
    Moon,
    Zap,
    Brain,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/domain/useProfile";
import MaxAvatar from "@/components/max/MaxAvatar";

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

interface ViewProfileSetupProps {
    onNavigate?: (view: string) => void;
    onComplete?: () => void;
}

const GOALS = [
    { id: 'reduce-anxiety', label: 'Reduce Anxiety', icon: Brain, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
    { id: 'improve-sleep', label: 'Improve Sleep', icon: Moon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'boost-energy', label: 'Boost Energy', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { id: 'stress-management', label: 'Manage Stress', icon: Target, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
];

export const ViewProfileSetup = ({ onNavigate, onComplete }: ViewProfileSetupProps) => {
    const { profile, update, isSaving } = useProfile();

    const [nickname, setNickname] = useState(profile?.nickname || "");
    const [age, setAge] = useState(profile?.age?.toString() || "");
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(profile?.gender || "");
    const [primaryGoal, setPrimaryGoal] = useState(profile?.primary_goal || "");

    const isFormValid = nickname.trim() && age && gender && primaryGoal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) return;

        await update({
            nickname: nickname.trim(),
            age: parseInt(age),
            gender: gender as 'male' | 'female' | 'other',
            primary_goal: primaryGoal,
            onboarding_completed: true,
        });

        // Navigate to membership page
        if (onComplete) {
            onComplete();
        } else {
            onNavigate?.('membership');
        }
    };

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className="min-h-[calc(100vh-80px)] flex flex-col py-4 px-2"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                    <MaxAvatar size={60} state="idle" className="shadow-lg shadow-emerald-500/20" />
                </div>
                <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-1">
                    Almost there!
                </h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    Tell us a bit about yourself
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                {/* Nickname */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        What should we call you?
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your name or nickname"
                            required
                            className={cn(
                                "w-full pl-12 pr-4 py-3.5 rounded-2xl",
                                "bg-white dark:bg-white/5",
                                "border border-stone-200 dark:border-white/10",
                                "text-emerald-950 dark:text-white placeholder:text-stone-400",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                                "transition-all text-sm"
                            )}
                        />
                    </div>
                </div>

                {/* Age */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        How old are you?
                    </label>
                    <input
                        type="number"
                        min="13"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Enter your age"
                        required
                        className={cn(
                            "w-full px-4 py-3.5 rounded-2xl",
                            "bg-white dark:bg-white/5",
                            "border border-stone-200 dark:border-white/10",
                            "text-emerald-950 dark:text-white placeholder:text-stone-400",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                            "transition-all text-sm"
                        )}
                    />
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        Gender
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['male', 'female', 'other'] as const).map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGender(g)}
                                className={cn(
                                    "py-3 rounded-xl text-sm font-medium transition-all",
                                    gender === g
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : "bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300"
                                )}
                            >
                                {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Goal */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        What's your primary goal?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {GOALS.map((goal) => (
                            <button
                                key={goal.id}
                                type="button"
                                onClick={() => setPrimaryGoal(goal.id)}
                                className={cn(
                                    "p-4 rounded-2xl text-left transition-all flex items-center gap-3",
                                    primaryGoal === goal.id
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500"
                                        : "bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10"
                                )}
                            >
                                <div className={cn("p-2 rounded-xl", goal.color)}>
                                    <goal.icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        primaryGoal === goal.id
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : "text-stone-700 dark:text-stone-300"
                                    )}>
                                        {goal.label}
                                    </span>
                                </div>
                                {primaryGoal === goal.id && (
                                    <Check size={16} className="text-emerald-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isSaving || !isFormValid}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold text-white mt-6",
                        "bg-gradient-to-r from-emerald-600 to-teal-600",
                        "shadow-lg shadow-emerald-500/30",
                        "flex items-center justify-center gap-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-all hover:shadow-xl hover:shadow-emerald-500/40"
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight size={18} />
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default ViewProfileSetup;
