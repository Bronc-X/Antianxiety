"use client";

import React from "react";
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
    ViewMembership
} from "@/components/mobile/MobileViews";
import {
    LayoutDashboard,
    Sparkles,
    Calendar,
    User,
    FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import MaxAvatar from "@/components/max/MaxAvatar";

// --- Types ---
type ViewType = "home" | "max" | "plan" | "profile" | "science" | "settings" | "calibration" | "digital-twin" | "wearables" | "goals" | "onboarding" | "assessment" | "habits" | "analysis" | "reminders" | "login" | "register" | "profile-setup" | "membership";

// --- Bottom Navigation for Native App ---
const BottomNav = ({ activeView, onViewChange }: { activeView: ViewType; onViewChange: (view: ViewType) => void }) => {
    const navItems = [
        { id: "home", icon: LayoutDashboard, label: "Home" },
        { id: "science", icon: FlaskConical, label: "Science" },
        { id: "max", icon: Sparkles, label: "Max" },
        { id: "plan", icon: Calendar, label: "Plan" },
        { id: "profile", icon: User, label: "Profile" },
    ];

    const fullScreenViews = ['login', 'register', 'onboarding'];

    if (fullScreenViews.includes(activeView as string)) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 pb-safe bg-white/95 dark:bg-black/95 backdrop-blur-2xl border-t border-stone-200/50 dark:border-white/10 flex items-center justify-around px-2 py-2 z-50">
            {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as ViewType)}
                        className="flex flex-col items-center justify-center w-16 h-14 relative group"
                    >
                        <div className={cn(
                            "transition-all duration-300 rounded-2xl mb-0.5 flex items-center justify-center",
                            isActive
                                ? item.id === 'max'
                                    ? "scale-110"
                                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 p-2"
                                : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 p-2"
                        )}>
                            {item.id === 'max' ? (
                                <MaxAvatar
                                    size={isActive ? 36 : 26}
                                    state={isActive ? "thinking" : "idle"}
                                    className={cn("transition-all duration-500", isActive && "shadow-xl shadow-sky-500/20")}
                                />
                            ) : (
                                <item.icon size={20} className={cn(isActive && "fill-current")} />
                            )}
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium transition-colors",
                            isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400"
                        )}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

// --- Native App Page (Full Screen, No Simulator Frame) ---
export default function NativeAppPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const viewParam = searchParams.get('view') as ViewType;
    const currentView = viewParam && [
        "home", "max", "plan", "profile", "science",
        "settings", "calibration", "digital-twin",
        "wearables", "goals", "onboarding",
        "assessment", "habits", "analysis", "reminders",
        "login", "register", "profile-setup", "membership"
    ].includes(viewParam) ? viewParam : "home";

    const handleViewChange = (view: ViewType | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('view', view);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen w-full bg-[#F9F9F7] dark:bg-[#0A0A0A] flex flex-col">
            {/* Content Area - Full Screen */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pt-safe pb-24">
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
                </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <BottomNav activeView={currentView} onViewChange={handleViewChange} />
        </div>
    );
}
