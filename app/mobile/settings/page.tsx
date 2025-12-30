"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Bell, Moon, LogOut, ChevronRight, Shield, Heart,
    Smartphone, Globe, Zap, Loader2, Save
} from "lucide-react";
import { useAuth } from "@/hooks/domain/useAuth";
import { useSettings } from "@/hooks/domain/useSettings";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

// --- Components ---

function SettingSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{title}</h3>
            <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-slate-100 overflow-hidden">
                {children}
            </div>
        </div>
    );
}

function SettingItem({
    icon: Icon,
    label,
    value,
    onClick,
    isDestructive = false,
    toggle = null
}: {
    icon: any,
    label: string,
    value?: string,
    onClick?: () => void,
    isDestructive?: boolean,
    toggle?: { checked: boolean, onChange: () => void }
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group text-left"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className={`font-medium ${isDestructive ? 'text-red-600' : 'text-slate-900'}`}>{label}</div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {value && <span className="text-sm text-slate-400 font-medium">{value}</span>}

                {toggle ? (
                    <div
                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${toggle.checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        onClick={(e) => { e.stopPropagation(); toggle.onChange(); }}
                    >
                        <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                            animate={{ x: toggle.checked ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </div>
                ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
            </div>
        </button>
    );
}

export default function MobileSettingsPage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { settings, update, isSaving } = useSettings({ userId: user?.id });
    const { language, setLanguage } = useI18n(); // Assuming setLanguage available

    const handleLogout = async () => {
        await signOut();
        router.push('/mobile/login');
    };

    const toggleNotification = () => {
        // Mock toggle as local state or specific setting if available
        // For now assuming it's part of settings or handled separately
    };

    // Derived values
    const displayName = settings.full_name || user?.email?.split('@')[0] || "Friend";

    return (
        <div className="px-6 py-8 pb-32">
            <h1 className="text-2xl font-serif text-slate-900 mb-8">
                Settings
            </h1>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white mb-8 relative overflow-hidden shadow-lg shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-serif font-bold shadow-inner">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{displayName}</h2>
                        <p className="text-slate-400 text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-2.5 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors border border-white/5">
                        Edit Profile
                    </button>
                    <button className="px-4 py-2.5 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40">
                        Upgrade
                    </button>
                </div>
            </div>

            {/* Preferences */}
            <SettingSection title="Preferences">
                <SettingItem
                    icon={Globe}
                    label="Language"
                    value={language === 'en' ? 'English' : '中文'}
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                />
                <SettingItem
                    icon={Moon}
                    label="Dark Mode"
                    toggle={{ checked: false, onChange: () => { } }} // Todo: connect theme
                />
                <SettingItem
                    icon={Bell}
                    label="Notifications"
                    toggle={{ checked: true, onChange: () => { } }}
                />
            </SettingSection>

            {/* AI & Data */}
            <SettingSection title="Intelligence">
                <SettingItem
                    icon={Zap}
                    label="AI Personality"
                    value={settings.ai_personality || "Empathetic"}
                />
                <SettingItem
                    icon={Heart}
                    label="Health Data"
                    value="Connected"
                />
                <SettingItem
                    icon={Shield}
                    label="Privacy & Security"
                />
            </SettingSection>

            {/* Account */}
            <SettingSection title="Account">
                <SettingItem
                    icon={LogOut}
                    label="Sign Out"
                    isDestructive
                    onClick={handleLogout}
                />
            </SettingSection>

            <div className="text-center text-xs text-slate-400 mt-8">
                Version 1.0.2 (Build 45)<br />
                Made with ❤️ to help you unlearn anxiety.
            </div>
        </div>
    );
}
