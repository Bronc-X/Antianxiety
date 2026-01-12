"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    ViewDashboard,
    ViewMax,
    ViewPlan,
    ViewProfile,
    ViewScience,
    ViewSettings,
    ViewCalibration,
    ViewDigitalTwin,
    ViewWearables,
    ViewGoals,
    ViewOnboarding,
    ViewAssessment,
    ViewHabits,
    ViewAnalysis,
    ViewAiReminders,
    ViewLogin,
    ViewRegister,
    ViewProfileSetup,
    ViewMembership,
    ViewCoreHub,
    ViewDailyQuestionnaire,
    ViewBayesianLoop,
    ViewInquiryCenter,
    ViewInsightEngine,
    ViewVoiceAnalysis,
    ViewMaxLabs,
    ViewAdaptiveOnboarding,
    ViewDebugSession,
    ViewCuratedFeed
} from "@/components/mobile/MobileViews";
import {
    LayoutDashboard,
    Sparkles,
    Calendar,
    User,
    Wifi,
    Battery,
    Signal,
    FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import MaxAvatar from "@/components/max/MaxAvatar";

// --- Types ---
type ViewType = "home" | "max" | "plan" | "profile" | "science" | "settings" | "calibration" | "digital-twin" | "wearables" | "goals" | "onboarding" | "assessment" | "habits" | "analysis" | "reminders" | "login" | "register" | "profile-setup" | "membership" | "core-hub" | "daily-questionnaire" | "bayesian-loop" | "inquiry-center" | "voice-analysis" | "core-insight" | "max-labs" | "adaptive-onboarding" | "debug-session" | "curated-feed";

// --- Components ---

const StatusBar = () => (
    <div className="flex justify-between items-center px-6 py-3 text-emerald-950 dark:text-white text-xs font-medium sticky top-0 z-50 mix-blend-difference">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={12} className="rotate-90" />
        </div>
    </div>
);

const BottomNav = ({ activeView, onViewChange }: { activeView: ViewType; onViewChange: (view: ViewType) => void }) => {
    // Hide bottom nav in deep views if desired, or keep it.
    // Usually Settings doesn't have bottom nav, but let's keep it for easy navigation unless requested otherwise.
    // Actually, "Settings" usually is a pushed view.
    // If activeView is 'settings' or 'calibration', maybe we still show nav to allow jumping back?
    // Let's hide it for 'settings' and 'calibration' to focus user or make it modal-like.
    // But for simplicity in this "OS" simulation, let's keep it or just render it.

    const navItems = [
        { id: "home", icon: LayoutDashboard, label: "Home" },
        { id: "science", icon: FlaskConical, label: "Science" },
        { id: "max", icon: Sparkles, label: "Max" },
        { id: "plan", icon: Calendar, label: "Plan" },
        { id: "profile", icon: User, label: "Profile" },
    ];

    const fullScreenViews = [
        'login',
        'register',
        'onboarding'
    ];

    if (fullScreenViews.includes(activeView as string)) {
        return null; // Hide nav for full-screen views
    }

    return (
        <div className="absolute bottom-4 left-4 right-4 h-[70px] bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl flex items-center justify-around px-2 z-50">
            {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as ViewType)}
                        className="flex flex-col items-center justify-center w-14 h-14 relative group"
                    >
                        <div className={cn(
                            "transition-all duration-300 rounded-2xl mb-1 flex items-center justify-center",
                            isActive
                                ? item.id === 'max'
                                    ? "-translate-y-5 scale-125"
                                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 -translate-y-4 scale-110 p-2.5"
                                : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 p-2.5"
                        )}>
                            {item.id === 'max' ? (
                                <MaxAvatar
                                    size={isActive ? 42 : 28}
                                    state={isActive ? "thinking" : "idle"}
                                    className={cn("transition-all duration-500", isActive && "shadow-xl shadow-sky-500/20")}
                                />
                            ) : (
                                <item.icon size={22} className={cn(isActive && "fill-current")} />
                            )}
                        </div>
                        {isActive && (
                            <motion.span
                                layoutId="navLabel"
                                className="absolute bottom-1.5 text-[10px] font-bold text-emerald-900 dark:text-white"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// --- Main Page ---
export default function MobileSimulatorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const viewParam = searchParams.get('view') as ViewType;
    const currentView = viewParam && [
        "home", "max", "plan", "profile", "science",
        "settings", "calibration", "digital-twin",
        "wearables", "goals", "onboarding",
        "assessment", "habits", "analysis", "reminders",
        "login", "register", "profile-setup", "membership",
        "core-hub", "daily-questionnaire", "bayesian-loop", "inquiry-center", "voice-analysis", "core-insight", "max-labs", "adaptive-onboarding", "debug-session", "curated-feed"
    ].includes(viewParam) ? viewParam : "home";

    const handleViewChange = (view: ViewType | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('view', view);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen w-full bg-[#EAE9E5] dark:bg-[#050505] flex items-center justify-center p-4 md:p-8 font-sans">

            {/* Phone Container */}
            <div className="relative w-full max-w-[400px] h-[850px] bg-[#F9F9F7] dark:bg-[#0A0A0A] rounded-[3rem] shadow-2xl border-[8px] border-[#2A2A28] overflow-hidden flex flex-col ring-4 ring-black/5 transition-all">

                {/* Dynamic Island */}
                <div className="absolute top-0 inset-x-0 h-8 bg-transparent z-50 flex justify-center">
                    <div className="w-32 h-6 bg-black rounded-b-2xl transition-all hover:h-8 hover:w-40 cursor-pointer flex items-center justify-center group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-medium flex gap-2">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Recording
                        </div>
                    </div>
                </div>

                <StatusBar />

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-6 pt-2 pb-28">
                    <AnimatePresence mode="wait">
                        {currentView === "home" && <ViewDashboard key="home" onNavigate={handleViewChange} />}
                        {currentView === "science" && <ViewScience key="science" />}
                        {currentView === "max" && <ViewMax key="max" />}
                        {currentView === "plan" && <ViewPlan key="plan" onNavigate={handleViewChange} />}
                        {currentView === "profile" && (
                            <ViewProfile
                                key="profile"
                                onNavigate={handleViewChange}
                            />
                        )}
                        {currentView === "settings" && <ViewSettings key="settings" />}
                        {currentView === "calibration" && <ViewCalibration key="calibration" />}
                        {currentView === "digital-twin" && <ViewDigitalTwin key="digital-twin" />}
                        {currentView === "wearables" && <ViewWearables key="wearables" onBack={() => handleViewChange('profile')} />}
                        {currentView === "goals" && <ViewGoals key="goals" onBack={() => handleViewChange('plan')} />}
                        {currentView === "onboarding" && <ViewOnboarding key="onboarding" onComplete={() => handleViewChange('profile-setup')} />}
                        {currentView === "assessment" && <ViewAssessment key="assessment" onBack={() => handleViewChange('home')} />}
                        {currentView === "habits" && <ViewHabits key="habits" onBack={() => handleViewChange('home')} />}
                        {currentView === "analysis" && <ViewAnalysis key="analysis" onBack={() => handleViewChange('home')} />}
                        {currentView === "reminders" && <ViewAiReminders key="reminders" onBack={() => handleViewChange('home')} />}
                        {currentView === "login" && <ViewLogin key="login" onNavigate={handleViewChange} />}
                        {currentView === "register" && <ViewRegister key="register" onNavigate={handleViewChange} />}
                        {currentView === "profile-setup" && <ViewProfileSetup key="profile-setup" onNavigate={handleViewChange} />}
                        {currentView === "membership" && <ViewMembership key="membership" onNavigate={handleViewChange} />}
                        {currentView === "core-hub" && <ViewCoreHub key="core-hub" onBack={() => handleViewChange('profile')} onNavigate={handleViewChange} />}
                        {currentView === "daily-questionnaire" && <ViewDailyQuestionnaire key="daily-questionnaire" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "bayesian-loop" && <ViewBayesianLoop key="bayesian-loop" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "inquiry-center" && <ViewInquiryCenter key="inquiry-center" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "voice-analysis" && <ViewVoiceAnalysis key="voice-analysis" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "core-insight" && <ViewInsightEngine key="core-insight" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "max-labs" && <ViewMaxLabs key="max-labs" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "adaptive-onboarding" && <ViewAdaptiveOnboarding key="adaptive-onboarding" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "debug-session" && <ViewDebugSession key="debug-session" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "curated-feed" && <ViewCuratedFeed key="curated-feed" onBack={() => handleViewChange("core-hub")} />}
                    </AnimatePresence>
                </main>

                {/* Bottom Navigation */}
                <BottomNav activeView={currentView} onViewChange={handleViewChange} />

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/10 dark:bg-white/20 rounded-full z-50 pointer-events-none" />
            </div>

            {/* Desktop Context info */}
            <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 max-w-xs space-y-4">
                <h1 className="text-4xl font-bold text-emerald-900 dark:text-emerald-50">
                    智能健康操作系统
                </h1>
                <p className="text-stone-500 text-lg">
                    由智能 Hooks 和通用 UI 组件驱动的四合一统一体验。
                </p>
                <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-400">
                        <Sparkles size={16} className="text-emerald-600" /> Max 智能健康助手
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-400">
                        <Calendar size={16} className="text-emerald-600" /> 自适应计划系统
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-400">
                        <FlaskConical size={16} className="text-emerald-600" /> 科学模块与校准
                    </div>
                </div>
            </div>
        </div>
    );
}
