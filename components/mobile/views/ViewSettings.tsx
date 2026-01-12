"use client";

/**
 * ViewSettings - Complete Mobile Settings Component
 * 
 * Full-featured settings page for iOS mobile app with:
 * - Account management
 * - AI personality tuning
 * - Notification preferences
 * - Privacy & Security
 * - Language & Appearance
 * - Support & About
 * 
 * Design: Glass morphism with iOS 26 Liquid Glass influence
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Brain,
    Bell,
    BellRing,
    Shield,
    Lock,
    Languages,
    Moon,
    Sun,
    Smartphone,
    Volume2,
    VolumeX,
    Vibrate,
    ChevronRight,
    ChevronLeft,
    Save,
    RefreshCw,
    WifiOff,
    AlertCircle,
    Check,
    LogOut,
    Trash2,
    Download,
    Mail,
    HelpCircle,
    FileText,
    Info,
    Loader2,
    Sparkles,
    Zap,
    Heart,
    Target,
    Palette,
} from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/domain/useSettings";
import { useAuth } from "@/hooks/domain/useAuth";
import { useProfile } from "@/hooks/domain/useProfile";
import { useHaptics, ImpactStyle } from "@/hooks/useHaptics";
import { getPushEnabled, setPushEnabled } from '@/lib/push-notifications';
import { exportUserData } from '@/app/actions/data-export';

// ============================================
// Types
// ============================================

interface ViewSettingsProps {
    onNavigate?: (view: string) => void;
    onBack?: () => void;
}

type ActiveSheet =
    | 'honesty'
    | 'humor'
    | 'personality'
    | 'goal'
    | 'language'
    | 'theme'
    | 'delete-confirm'
    | null;

// ============================================
// Animation Variants
// ============================================

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

// ============================================
// GlassCard Component (iOS 26 Style)
// ============================================

function GlassCard({ children, className, onClick }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    return (
        <motion.div
            variants={itemVariants}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-white/80 dark:bg-white/10 backdrop-blur-xl",
                "border border-stone-200/60 dark:border-white/20",
                "shadow-sm shadow-stone-200/50 dark:shadow-none",
                onClick && "cursor-pointer active:bg-stone-50 dark:active:bg-white/15",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// Settings Group Component
// ============================================

function SettingsGroup({
    title,
    icon: Icon,
    children
}: {
    title: string;
    icon?: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-2 px-1">
                {Icon && <Icon className="w-3.5 h-3.5 text-stone-400" />}
                <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <GlassCard className="divide-y divide-stone-100 dark:divide-white/10">
                {children}
            </GlassCard>
        </motion.div>
    );
}

// ============================================
// Settings Row Component
// ============================================

function SettingsRow({
    icon: Icon,
    iconColor = "text-stone-500",
    iconBg = "bg-stone-100 dark:bg-white/10",
    label,
    value,
    description,
    onClick,
    rightElement,
    danger = false,
}: {
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
    label: string;
    value?: string;
    description?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
}) {
    const { impact } = useHaptics();

    const handleClick = async () => {
        if (onClick) {
            await impact(ImpactStyle.Light);
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={!onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left",
                onClick && "active:bg-stone-50 dark:active:bg-white/5 transition-colors"
            )}
        >
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
                <Icon className={cn("w-4 h-4", danger ? "text-red-500" : iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <span className={cn(
                    "block text-sm font-medium",
                    danger ? "text-red-500" : "text-stone-800 dark:text-stone-100"
                )}>
                    {label}
                </span>
                {description && (
                    <span className="block text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                        {description}
                    </span>
                )}
            </div>
            {value && (
                <span className="text-sm text-stone-400 dark:text-stone-500 mr-1">
                    {value}
                </span>
            )}
            {rightElement || (onClick && <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600" />)}
        </button>
    );
}

// ============================================
// Toggle Switch Component
// ============================================

function ToggleSwitch({
    checked,
    onChange,
    disabled = false
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    const { impact } = useHaptics();

    const handleToggle = async () => {
        if (disabled) return;
        await impact(ImpactStyle.Light);
        onChange(!checked);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
                "relative w-12 h-7 rounded-full transition-all duration-200",
                checked
                    ? "bg-emerald-500"
                    : "bg-stone-200 dark:bg-stone-700",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <motion.div
                animate={{ x: checked ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
            />
        </button>
    );
}

// ============================================
// Bottom Sheet Component
// ============================================

function BottomSheet({
    isOpen,
    onClose,
    title,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-6 pb-8">
                            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-center mb-6 text-stone-800 dark:text-white">
                                {title}
                            </h3>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================
// Slider Sheet Component
// ============================================

function SliderSheet({
    isOpen,
    onClose,
    title,
    description,
    value,
    onChange,
    min = 0,
    max = 100,
    labels,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    labels?: { low: string; high: string };
}) {
    const { impact } = useHaptics();
    const [localValue, setLocalValue] = useState(value);

    const handleChange = async (newValue: number) => {
        await impact(ImpactStyle.Light);
        setLocalValue(newValue);
    };

    const handleConfirm = async () => {
        await impact(ImpactStyle.Medium);
        onChange(localValue);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            {description && (
                <p className="text-sm text-stone-500 text-center mb-6">{description}</p>
            )}

            <div className="text-center mb-8">
                <span className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                    {localValue}
                </span>
                <span className="text-2xl text-stone-400">%</span>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                value={localValue}
                onChange={(e) => handleChange(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-4"
            />

            {labels && (
                <div className="flex justify-between text-xs text-stone-400 mb-8">
                    <span>{labels.low}</span>
                    <span>{labels.high}</span>
                </div>
            )}

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold"
            >
                确认
            </motion.button>
        </BottomSheet>
    );
}

// ============================================
// Selection Sheet Component
// ============================================

function SelectionSheet({
    isOpen,
    onClose,
    title,
    options,
    value,
    onChange,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: Array<{ value: string; label: string; description?: string; icon?: React.ElementType }>;
    value: string;
    onChange: (value: string) => void;
}) {
    const { impact } = useHaptics();

    const handleSelect = async (optionValue: string) => {
        await impact(ImpactStyle.Medium);
        onChange(optionValue);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = value === option.value;
                    return (
                        <motion.button
                            key={option.value}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(option.value)}
                            className={cn(
                                "w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all",
                                isSelected
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500"
                                    : "bg-stone-50 dark:bg-stone-800 border-2 border-transparent"
                            )}
                        >
                            {Icon && (
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    isSelected ? "bg-emerald-500 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-500"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            )}
                            <div className="flex-1">
                                <span className={cn(
                                    "block font-medium",
                                    isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-stone-700 dark:text-stone-200"
                                )}>
                                    {option.label}
                                </span>
                                {option.description && (
                                    <span className="block text-xs text-stone-400 mt-0.5">
                                        {option.description}
                                    </span>
                                )}
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-emerald-500" />}
                        </motion.button>
                    );
                })}
            </div>
        </BottomSheet>
    );
}

// ============================================
// Confirmation Dialog Component
// ============================================

function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "确认",
    cancelText = "取消",
    danger = false,
    isLoading = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    isLoading?: boolean;
}) {
    const { notification } = useHaptics();

    const handleConfirm = async () => {
        if (danger) {
            await notification('warning');
        }
        onConfirm();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-stone-600 dark:text-stone-300 text-center mb-8">
                {message}
            </p>

            <div className="space-y-3">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2",
                        danger
                            ? "bg-red-500 text-white"
                            : "bg-emerald-600 text-white",
                        isLoading && "opacity-70"
                    )}
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmText}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800"
                >
                    {cancelText}
                </motion.button>
            </div>
        </BottomSheet>
    );
}

// ============================================
// Main Component
// ============================================

export const ViewSettings = ({ onNavigate, onBack }: ViewSettingsProps) => {
    const { settings, isLoading, isSaving, isOffline, error, update } = useSettings();
    const { user, signOut, isSigningOut } = useAuth();
    const { remove, isSaving: isDeleting } = useProfile();
    const { impact, notification } = useHaptics();
    const isIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

    // Local state
    const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
    const [localSettings, setLocalSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Notification preferences (local state, would need backend support)
    const [notifications, setNotifications] = useState({
        push: true,
        email: false,
        sound: true,
        haptics: true,
    });

    useEffect(() => {
        if (!isIosNative) return;
        let cancelled = false;

        const load = async () => {
            const enabled = await getPushEnabled();
            if (!cancelled) {
                setNotifications(prev => ({ ...prev, push: enabled }));
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isIosNative]);

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [language, setLanguage] = useState<'zh' | 'en'>('zh');

    // Sync settings
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    // Handle setting change
    const handleChange = useCallback((key: string, value: unknown) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    }, []);

    // Save settings
    const handleSave = useCallback(async () => {
        await impact(ImpactStyle.Medium);
        const success = await update(localSettings);
        if (success) {
            await notification('success');
            setHasChanges(false);
        }
    }, [localSettings, update, impact, notification]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        await impact(ImpactStyle.Heavy);
        const success = await signOut('/mobile?view=login');
        if (success) {
            onNavigate?.('login');
        }
    }, [signOut, impact, onNavigate]);

    const handleDeleteAccount = useCallback(async () => {
        setActionError(null);
        await notification('warning');
        const success = await remove();
        if (success) {
            await notification('success');
            await signOut('/mobile?view=login');
            onNavigate?.('login');
        } else {
            setActionError('删除账户失败，请稍后再试');
            await notification('warning');
        }
        setActiveSheet(null);
    }, [notification, remove, signOut, onNavigate]);

    const handleExportData = useCallback(async () => {
        if (isExporting) return;
        setActionError(null);
        await impact(ImpactStyle.Medium);
        setIsExporting(true);

        try {
            const result = await exportUserData();
            if (!result.success || !result.data) {
                setActionError(result.error || '导出失败，请稍后再试');
                await notification('warning');
                return;
            }

            const { filename, payload } = result.data;
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
            await notification('success');
        } catch (err) {
            setActionError(err instanceof Error ? err.message : '导出失败，请稍后再试');
            await notification('warning');
        } finally {
            setIsExporting(false);
        }
    }, [impact, isExporting, notification]);

    // Personality options
    const personalityOptions = [
        { value: 'max', label: 'MAX 模式', description: '简洁干练，带有干幽默', icon: Zap },
        { value: 'zen_master', label: 'Zen Master', description: '平静哲学，禅意智慧', icon: Heart },
        { value: 'dr_house', label: 'Dr. House', description: '直接诊断，医学专家', icon: Brain },
    ];

    // Goal options
    const goalOptions = [
        { value: 'lose_weight', label: '减脂塑形', icon: Target },
        { value: 'improve_sleep', label: '改善睡眠', icon: Moon },
        { value: 'boost_energy', label: '提升精力', icon: Zap },
        { value: 'maintain_energy', label: '保持健康', icon: Heart },
    ];

    // Theme options
    const themeOptions = [
        { value: 'light', label: '浅色模式', icon: Sun },
        { value: 'dark', label: '深色模式', icon: Moon },
        { value: 'system', label: '跟随系统', icon: Smartphone },
    ];

    // Language options
    const languageOptions = [
        { value: 'zh', label: '简体中文' },
        { value: 'en', label: 'English' },
    ];
    const combinedError = [error, actionError].filter(Boolean).join(' • ');

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                    <RefreshCw className="w-8 h-8 text-emerald-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-24"
        >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={onBack || (() => onNavigate?.('profile'))}
                        className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>

                    <h1 className="text-lg font-bold text-stone-800 dark:text-white">设置</h1>

                    {hasChanges ? (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm font-medium"
                        >
                            {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            保存
                        </motion.button>
                    ) : (
                        <div className="w-16" /> // Placeholder for alignment
                    )}
                </div>
            </div>

            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800 px-4 py-2.5 flex items-center gap-2"
                    >
                        <WifiOff className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">离线模式</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Banner */}
            <AnimatePresence>
                {combinedError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{combinedError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4"
            >
                {/* Account Section */}
                <SettingsGroup title="账户" icon={User}>
                    <SettingsRow
                        icon={User}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-100 dark:bg-blue-500/20"
                        label="姓名"
                        value={localSettings.full_name || '未设置'}
                        onClick={() => onNavigate?.('profile-edit')}
                    />
                    <SettingsRow
                        icon={Mail}
                        iconColor="text-purple-500"
                        iconBg="bg-purple-100 dark:bg-purple-500/20"
                        label="邮箱"
                        description={user?.email || '未绑定'}
                    />
                </SettingsGroup>

                {/* AI Settings */}
                <SettingsGroup title="AI 助手" icon={Brain}>
                    <SettingsRow
                        icon={Sparkles}
                        iconColor="text-violet-500"
                        iconBg="bg-violet-100 dark:bg-violet-500/20"
                        label="AI 人格"
                        value={personalityOptions.find(o => o.value === localSettings.ai_personality)?.label || 'MAX'}
                        onClick={() => setActiveSheet('personality')}
                    />
                    <SettingsRow
                        icon={Target}
                        iconColor="text-orange-500"
                        iconBg="bg-orange-100 dark:bg-orange-500/20"
                        label="健康目标"
                        value={goalOptions.find(o => o.value === localSettings.primary_goal)?.label || '未设置'}
                        onClick={() => setActiveSheet('goal')}
                    />
                    <SettingsRow
                        icon={Brain}
                        iconColor="text-emerald-500"
                        iconBg="bg-emerald-100 dark:bg-emerald-500/20"
                        label="诚实度"
                        value={`${localSettings.max_honesty || 90}%`}
                        onClick={() => setActiveSheet('honesty')}
                    />
                    <SettingsRow
                        icon={Sparkles}
                        iconColor="text-amber-500"
                        iconBg="bg-amber-100 dark:bg-amber-500/20"
                        label="幽默感"
                        value={`${localSettings.max_humor || 65}%`}
                        onClick={() => setActiveSheet('humor')}
                    />
                </SettingsGroup>

                {/* Notifications */}
                <SettingsGroup title="通知" icon={Bell}>
                    <SettingsRow
                        icon={BellRing}
                        iconColor="text-red-500"
                        iconBg="bg-red-100 dark:bg-red-500/20"
                        label="推送通知"
                        description="接收健康提醒和计划更新"
                        rightElement={
                            <ToggleSwitch
                                checked={notifications.push}
                                onChange={async (v) => {
                                    setNotifications(prev => ({ ...prev, push: v }));
                                    if (!isIosNative) return;

                                    const permission = await setPushEnabled(v);
                                    if (v && permission !== 'granted') {
                                        setNotifications(prev => ({ ...prev, push: false }));
                                        await notification('warning');
                                    }
                                }}
                            />
                        }
                    />
                    <SettingsRow
                        icon={Mail}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-100 dark:bg-blue-500/20"
                        label="邮件通知"
                        description="周报和重要更新"
                        rightElement={
                            <ToggleSwitch
                                checked={notifications.email}
                                onChange={(v) => setNotifications(prev => ({ ...prev, email: v }))}
                            />
                        }
                    />
                    <SettingsRow
                        icon={notifications.sound ? Volume2 : VolumeX}
                        iconColor="text-teal-500"
                        iconBg="bg-teal-100 dark:bg-teal-500/20"
                        label="提示音"
                        rightElement={
                            <ToggleSwitch
                                checked={notifications.sound}
                                onChange={(v) => setNotifications(prev => ({ ...prev, sound: v }))}
                            />
                        }
                    />
                    <SettingsRow
                        icon={Vibrate}
                        iconColor="text-pink-500"
                        iconBg="bg-pink-100 dark:bg-pink-500/20"
                        label="触觉反馈"
                        rightElement={
                            <ToggleSwitch
                                checked={notifications.haptics}
                                onChange={(v) => setNotifications(prev => ({ ...prev, haptics: v }))}
                            />
                        }
                    />
                </SettingsGroup>

                {/* Appearance */}
                <SettingsGroup title="外观与语言" icon={Palette}>
                    <SettingsRow
                        icon={theme === 'dark' ? Moon : Sun}
                        iconColor="text-indigo-500"
                        iconBg="bg-indigo-100 dark:bg-indigo-500/20"
                        label="主题"
                        value={themeOptions.find(o => o.value === theme)?.label}
                        onClick={() => setActiveSheet('theme')}
                    />
                    <SettingsRow
                        icon={Languages}
                        iconColor="text-cyan-500"
                        iconBg="bg-cyan-100 dark:bg-cyan-500/20"
                        label="语言"
                        value={languageOptions.find(o => o.value === language)?.label}
                        onClick={() => setActiveSheet('language')}
                    />
                </SettingsGroup>

                {/* Privacy & Security */}
                <SettingsGroup title="隐私与安全" icon={Shield}>
                    <SettingsRow
                        icon={Lock}
                        iconColor="text-green-500"
                        iconBg="bg-green-100 dark:bg-green-500/20"
                        label="生物识别锁定"
                        description="使用 Face ID / Touch ID"
                        rightElement={<ToggleSwitch checked={false} onChange={() => { }} />}
                    />
                    <SettingsRow
                        icon={Download}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-100 dark:bg-blue-500/20"
                        label="导出数据"
                        description={isExporting ? "正在导出..." : "下载您的所有数据"}
                        onClick={isExporting ? undefined : handleExportData}
                        rightElement={isExporting ? <Loader2 className="w-4 h-4 animate-spin text-stone-400" /> : undefined}
                    />
                    <SettingsRow
                        icon={Trash2}
                        iconColor="text-red-500"
                        iconBg="bg-red-100 dark:bg-red-500/20"
                        label="删除账户"
                        description="永久删除您的所有数据"
                        onClick={() => setActiveSheet('delete-confirm')}
                        danger
                    />
                </SettingsGroup>

                {/* Support */}
                <SettingsGroup title="支持" icon={HelpCircle}>
                    <SettingsRow
                        icon={HelpCircle}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-100 dark:bg-blue-500/20"
                        label="帮助中心"
                        onClick={() => { }}
                    />
                    <SettingsRow
                        icon={FileText}
                        iconColor="text-stone-500"
                        iconBg="bg-stone-100 dark:bg-white/10"
                        label="服务条款"
                        onClick={() => { }}
                    />
                    <SettingsRow
                        icon={Shield}
                        iconColor="text-stone-500"
                        iconBg="bg-stone-100 dark:bg-white/10"
                        label="隐私政策"
                        onClick={() => { }}
                    />
                </SettingsGroup>

                {/* Logout */}
                <motion.div variants={itemVariants} className="mt-6">
                    <button
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className="w-full py-4 text-center text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSigningOut ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                正在退出...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-4 h-4" />
                                退出登录
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Version */}
                <motion.div variants={itemVariants} className="mt-4">
                    <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                        <Info className="w-3 h-3" />
                        <span>Version 2.4.0 (Build 302)</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Sheets */}
            <SliderSheet
                key={`honesty-${activeSheet === 'honesty' ? localSettings.max_honesty || 90 : 'closed'}`}
                isOpen={activeSheet === 'honesty'}
                onClose={() => setActiveSheet(null)}
                title="诚实度"
                description="调整 AI 回复的直接程度"
                value={localSettings.max_honesty || 90}
                onChange={(v) => handleChange('max_honesty', v)}
                labels={{ low: '委婉温和', high: '直接坦率' }}
            />

            <SliderSheet
                key={`humor-${activeSheet === 'humor' ? localSettings.max_humor || 65 : 'closed'}`}
                isOpen={activeSheet === 'humor'}
                onClose={() => setActiveSheet(null)}
                title="幽默感"
                description="调整 AI 回复的趣味程度"
                value={localSettings.max_humor || 65}
                onChange={(v) => handleChange('max_humor', v)}
                labels={{ low: '严肃专业', high: '机智风趣' }}
            />

            <SelectionSheet
                isOpen={activeSheet === 'personality'}
                onClose={() => setActiveSheet(null)}
                title="选择 AI 人格"
                options={personalityOptions}
                value={localSettings.ai_personality || 'max'}
                onChange={(v) => handleChange('ai_personality', v)}
            />

            <SelectionSheet
                isOpen={activeSheet === 'goal'}
                onClose={() => setActiveSheet(null)}
                title="选择健康目标"
                options={goalOptions}
                value={localSettings.primary_goal || 'maintain_energy'}
                onChange={(v) => handleChange('primary_goal', v)}
            />

            <SelectionSheet
                isOpen={activeSheet === 'theme'}
                onClose={() => setActiveSheet(null)}
                title="选择主题"
                options={themeOptions}
                value={theme}
                onChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
            />

            <SelectionSheet
                isOpen={activeSheet === 'language'}
                onClose={() => setActiveSheet(null)}
                title="选择语言"
                options={languageOptions}
                value={language}
                onChange={(v) => setLanguage(v as 'zh' | 'en')}
            />

            <ConfirmDialog
                isOpen={activeSheet === 'delete-confirm'}
                onClose={() => setActiveSheet(null)}
                onConfirm={handleDeleteAccount}
                title="删除账户"
                message="此操作不可撤销。您的所有数据将被永久删除，包括健康记录、AI 对话历史和个人设置。"
                confirmText="确认删除"
                cancelText="取消"
                danger
                isLoading={isDeleting}
            />
        </motion.div>
    );
};

export default ViewSettings;
