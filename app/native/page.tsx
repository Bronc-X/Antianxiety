"use client";

/**
 * Native App Page - 完全复制 /mobile 的逻辑
 * 使用 React 状态管理视图切换，不使用 URL 路由
 */

import React, { useEffect, useState } from "react";
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
    ViewProfileEdit,
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
    FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import MaxAvatar from "@/components/max/MaxAvatar";
import { BiometricGate } from "@/components/auth/BiometricGate";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { DeepLink } from "@/lib/deeplink";
import { getPushEnabled, initializePushNotifications, setPushEnabled } from "@/lib/push-notifications";
import { useWearables, type WearableProvider } from "@/hooks/domain/useWearables";
import { useHealthKitBackgroundSync } from "@/hooks/useHealthKitBackgroundSync";

const WEARABLE_PROVIDERS: WearableProvider[] = ['oura', 'fitbit', 'apple_health', 'garmin', 'whoop'];

function parseWearableState(state: string): { provider?: string } | null {
    try {
        return JSON.parse(state);
    } catch {
        // Ignore direct JSON parse failures
    }

    try {
        const normalized = state.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const decoded = typeof atob === 'function' ? atob(padded) : null;
        if (!decoded) return null;
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function parseWearableCallbackUrl(rawUrl: string): { code: string; provider: WearableProvider } | null {
    try {
        const url = new URL(rawUrl);
        if (url.protocol !== 'antianxiety:') return null;
        if (url.host !== 'oauth') return null;
        const path = url.pathname.replace(/^\//, '');
        if (path !== 'wearables') return null;

        const code = url.searchParams.get('code');
        if (!code) return null;

        let provider = url.searchParams.get('provider') as WearableProvider | null;
        const state = url.searchParams.get('state');
        if (!provider && state) {
            const parsedState = parseWearableState(state);
            if (typeof parsedState?.provider === 'string') {
                provider = parsedState.provider as WearableProvider;
            }
        }

        if (!provider || !WEARABLE_PROVIDERS.includes(provider)) return null;

        return { code, provider };
    } catch {
        return null;
    }
}

// --- Types ---
type ViewType = "home" | "max" | "plan" | "profile" | "science" | "settings" | "calibration" | "digital-twin" | "wearables" | "goals" | "onboarding" | "assessment" | "habits" | "analysis" | "reminders" | "login" | "register" | "profile-setup" | "membership" | "profile-edit" | "core-hub" | "daily-questionnaire" | "bayesian-loop" | "inquiry-center" | "voice-analysis" | "core-insight" | "max-labs" | "adaptive-onboarding" | "debug-session" | "curated-feed";

// --- 完全复制 /mobile 的 BottomNav，但使用 useState ---
const BottomNav = ({ activeView, onViewChange }: { activeView: ViewType; onViewChange: (view: ViewType) => void }) => {
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
        'onboarding',
        'profile-edit'
    ];

    if (fullScreenViews.includes(activeView as string)) {
        return null;
    }

    return (
        <div className="absolute bottom-4 left-4 right-4 h-[70px] bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl flex items-center justify-around px-2 z-50">
            {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onViewChange(item.id as ViewType);
                        }}
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

// --- Native App Page - 使用 React 状态管理，不使用 URL ---
export default function NativeAppPage() {
    // 使用 React 状态代替 URL 参数
    const [currentView, setCurrentView] = useState<ViewType>("home");
    const biometricDisabledViews: ViewType[] = ['login', 'register', 'onboarding', 'profile-setup', 'membership'];
    const biometricEnabled = !biometricDisabledViews.includes(currentView);
    const { handleCallback } = useWearables();
    useHealthKitBackgroundSync();

    const handleViewChange = (view: ViewType | string) => {
        // 直接更新状态，不调用 router.push
        setCurrentView(view as ViewType);
    };

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'ios') return;
        let cleanup: (() => void) | null = null;

        const setup = async () => {
            cleanup = await initializePushNotifications({
                onToken: (token) => {
                    console.info('Push token ready:', token);
                },
                onNotification: (notification) => {
                    console.info('Push notification received:', notification);
                },
                onAction: (action) => {
                    console.info('Push notification action:', action);
                },
                onError: (message) => {
                    console.warn('Push registration error:', message);
                }
            });

            const enabled = await getPushEnabled();
            if (enabled) {
                const permission = await setPushEnabled(true);
                if (permission !== 'granted') {
                    console.warn('Push permission not granted:', permission);
                }
            }
        };

        setup();

        return () => {
            if (cleanup) {
                void cleanup();
            }
        };
    }, []);

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'ios') return;
        let listener: { remove: () => void } | null = null;

        const handleUrl = async (url: string) => {
            const parsed = parseWearableCallbackUrl(url);
            if (!parsed) return;

            try {
                await handleCallback(parsed.code, parsed.provider);
                setCurrentView('wearables');
            } catch (error) {
                console.warn('Wearable OAuth callback failed:', error);
            } finally {
                try {
                    await Browser.close();
                } catch {
                    // Ignore browser close errors
                }
            }
        };

        const setup = async () => {
            try {
                const launch = await DeepLink.getLaunchUrl();
                if (launch?.url) {
                    await handleUrl(launch.url);
                }
            } catch (error) {
                console.warn('Failed to read launch URL:', error);
            }

            try {
                listener = await DeepLink.addListener('urlOpen', (event) => {
                    if (event?.url) {
                        void handleUrl(event.url);
                    }
                });
            } catch (error) {
                console.warn('Failed to listen for deep links:', error);
            }
        };

        setup();

        return () => {
            listener?.remove();
        };
    }, [handleCallback]);

    return (
        <BiometricGate enabled={biometricEnabled}>
            <div className="min-h-screen w-full bg-[#F9F9F7] dark:bg-[#0A0A0A] flex flex-col relative">
                {/* Content Area - Full Screen */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pt-safe pb-28">
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
                        {currentView === "settings" && <ViewSettings key="settings" onNavigate={handleViewChange} />}
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
                        {currentView === "core-hub" && <ViewCoreHub key="core-hub" onBack={() => handleViewChange("profile")} onNavigate={handleViewChange} />}
                        {currentView === "daily-questionnaire" && <ViewDailyQuestionnaire key="daily-questionnaire" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "bayesian-loop" && <ViewBayesianLoop key="bayesian-loop" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "inquiry-center" && <ViewInquiryCenter key="inquiry-center" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "voice-analysis" && <ViewVoiceAnalysis key="voice-analysis" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "core-insight" && <ViewInsightEngine key="core-insight" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "max-labs" && <ViewMaxLabs key="max-labs" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "adaptive-onboarding" && <ViewAdaptiveOnboarding key="adaptive-onboarding" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "debug-session" && <ViewDebugSession key="debug-session" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "curated-feed" && <ViewCuratedFeed key="curated-feed" onBack={() => handleViewChange("core-hub")} />}
                        {currentView === "profile-edit" && <ViewProfileEdit key="profile-edit" onClose={() => handleViewChange("settings")} />}
                    </AnimatePresence>
                </main>

                {/* Bottom Navigation - 完全复制 /mobile 的样式 */}
                <BottomNav activeView={currentView} onViewChange={handleViewChange} />

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/10 dark:bg-white/20 rounded-full z-50 pointer-events-none" />
            </div>
        </BiometricGate>
    );
}
