"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import {
    User,
    Heart,
    Shield,
    HelpCircle,
    LogOut,
    Zap,
    Brain,
    ChevronRight,
    Camera,
    Settings,
    Bell,
    Smartphone,
    Volume2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewProfileEdit } from "./ViewProfileEdit";

const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
} as const;

import { useProfile } from "@/hooks/domain/useProfile";
import { useAuth } from "@/hooks/domain/useAuth";

interface ViewProfileProps {
    onNavigate?: (view: string) => void;
}

export const ViewProfile = ({ onNavigate }: ViewProfileProps) => {
    const { profile } = useProfile();
    const { signOut, isSigningOut } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        const success = await signOut('/mobile?view=login');
        if (success) {
            onNavigate?.('login');
        }
    };

    if (!mounted) return null;

    const userName = profile?.full_name || profile?.nickname || "User";
    const userRole = (profile as any)?.subscription_status === 'pro' || (profile as any)?.subscription_status === 'founding'
        ? "Pro Member"
        : "Free Member";

    const joinDate = profile?.member_since
        ? `Joined ${new Date(profile.member_since).getFullYear()}`
        : "Joined 2026";

    const avatarUrl = "https://i.pravatar.cc/150?u=admin";

    const stats = [
        { label: "Streak", value: `${profile?.streak_days || 0}`, icon: Zap, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-500/20" },
        { label: "Logs", value: `${profile?.total_logs || 0}`, icon: Brain, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
    ];

    const menuGroups = [
        {
            title: "General",
            items: [
                { icon: User, label: "Account Settings", value: "", action: () => onNavigate?.("settings") },
                { icon: Brain, label: "Core Features", value: "", action: () => onNavigate?.("core-hub") },
                { icon: Bell, label: "Notifications", value: "On", action: () => { } },
                { icon: Smartphone, label: "Devices", value: "2 Active", action: () => onNavigate?.("wearables") },
            ]
        },
        {
            title: "Health & Privacy",
            items: [
                { icon: Heart, label: "Health Data Connect", value: "Synced", action: () => { } },
                { icon: Shield, label: "Privacy & Security", value: "", action: () => { } },
            ]
        },
        {
            title: "Preferences",
            items: [
                { icon: Volume2, label: "Sound & Haptics", value: "", action: () => { } },
                { icon: HelpCircle, label: "Support", value: "", action: () => { } },
            ]
        }
    ];

    return (
        <motion.div
            initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
            className="space-y-6 pb-24 relative"
        >
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Profile</h2>
                <button
                    onClick={() => onNavigate?.("settings")}
                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-5 mb-4 px-2">
                <div className="relative group cursor-pointer" onClick={() => setShowEdit(true)}>
                    <div className="h-24 w-24 rounded-full bg-stone-200 p-1 shadow-lg shadow-emerald-900/10">
                        <img src={avatarUrl} alt={userName} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-black" />
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-md hover:scale-105 transition-transform">
                        <Camera size={14} />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{userName}</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm mb-2">{userRole} • {joinDate}</p>
                    <button
                        onClick={() => setShowEdit(true)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat, i) => (
                    <CardGlass key={i} className="p-3 flex flex-col items-center justify-center gap-2 border-stone-100 dark:border-white/5 !rounded-2xl">
                        <div className={cn("p-2 rounded-full", stat.bg, stat.color)}>
                            <stat.icon size={16} />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-emerald-950 dark:text-white leading-none">{stat.value}</p>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider mt-1">{stat.label}</p>
                        </div>
                    </CardGlass>
                ))}
            </div>

            {/* Settings Menu */}
            <div className="space-y-6">
                {menuGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-2 mb-2">{group.title}</h4>
                        <CardGlass className="p-0 overflow-hidden !rounded-3xl border-stone-100 dark:border-white/5">
                            {group.items.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={item.action}
                                    className={cn(
                                        "flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors active:bg-stone-100",
                                        i !== group.items.length - 1 && "border-b border-stone-100 dark:border-white/5"
                                    )}>
                                    <div className="flex items-center gap-3">
                                        <div className="text-stone-400 dark:text-stone-500">
                                            <item.icon size={18} />
                                        </div>
                                        <span className="font-medium text-stone-700 dark:text-stone-200 text-sm">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.value && <span className="text-xs text-stone-400 font-medium">{item.value}</span>}
                                        <ChevronRight size={16} className="text-stone-300" />
                                    </div>
                                </div>
                            ))}
                        </CardGlass>
                    </div>
                ))}

                <button
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="w-full py-4 text-center text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSigningOut ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogOut size={16} />
                            Log Out
                        </>
                    )}
                </button>

                <p className="text-center text-[10px] text-stone-300 dark:text-stone-600 pb-4">
                    Version 2.4.0 (Build 302)
                </p>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {showEdit && <ViewProfileEdit onClose={() => setShowEdit(false)} />}
            </AnimatePresence>
        </motion.div>
    )
}
