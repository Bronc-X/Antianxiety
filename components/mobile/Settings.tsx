'use client';

/**
 * Mobile Settings Presentational Component (The Skin - Mobile)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, RefreshCw, User, Brain, Sliders, WifiOff,
    ChevronRight, AlertCircle
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import type { UseSettingsReturn } from '@/hooks/domain/useSettings';

interface MobileSettingsProps {
    settings: UseSettingsReturn;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <motion.div variants={itemVariants} className="mb-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
                {title}
            </h3>
            <div className="bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
                {children}
            </div>
        </motion.div>
    );
}

function SettingsRow({
    icon,
    label,
    value,
    onClick,
    rightElement,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
}) {
    const { impact } = useHaptics();

    const handleClick = async () => {
        await impact(ImpactStyle.Light);
        onClick?.();
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.02)' }}
            onClick={handleClick}
            className="w-full flex items-center gap-3 px-4 py-3.5"
        >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                {icon}
            </div>
            <span className="flex-1 text-left text-gray-900">{label}</span>
            {value && <span className="text-gray-400 text-sm">{value}</span>}
            {rightElement || <ChevronRight className="w-4 h-4 text-gray-300" />}
        </motion.button>
    );
}

function SliderSheet({
    isOpen,
    onClose,
    title,
    value,
    onChange,
    min = 1,
    max = 10,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}) {
    const { impact } = useHaptics();

    const handleChange = async (newValue: number) => {
        await impact(ImpactStyle.Light);
        onChange(newValue);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-40"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10"
                    >
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-semibold text-center mb-8">{title}</h3>

                        <div className="text-center mb-6">
                            <span className="text-5xl font-bold text-emerald-600">{value}</span>
                            <span className="text-gray-400">/{max}</span>
                        </div>

                        <input
                            type="range"
                            min={min}
                            max={max}
                            value={value}
                            onChange={(e) => handleChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-8"
                        />

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-medium"
                        >
                            Done
                        </motion.button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function MobileSettings({ settings: hook }: MobileSettingsProps) {
    const { settings, isLoading, isSaving, isOffline, error, update } = hook;
    const { impact, notification } = useHaptics();

    const [activeSheet, setActiveSheet] = useState<'honesty' | 'humor' | null>(null);
    const [localSettings, setLocalSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (key: string, value: unknown) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        await impact(ImpactStyle.Medium);
        const success = await update(localSettings);
        if (success) {
            await notification('success');
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2"
                    >
                        <WifiOff className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Offline mode</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Settings</h1>
                    {hasChanges && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium"
                        >
                            {isSaving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4"
            >
                {/* Body */}
                <SettingsGroup title="Body Metrics">
                    <SettingsRow
                        icon={<User className="w-4 h-4" />}
                        label="Height"
                        value={localSettings.height ? `${localSettings.height} cm` : 'Not set'}
                    />
                    <SettingsRow
                        icon={<User className="w-4 h-4" />}
                        label="Weight"
                        value={localSettings.weight ? `${localSettings.weight} kg` : 'Not set'}
                    />
                    <SettingsRow
                        icon={<User className="w-4 h-4" />}
                        label="Age"
                        value={localSettings.age ? `${localSettings.age}` : 'Not set'}
                    />
                </SettingsGroup>

                {/* MAX AI */}
                <SettingsGroup title="MAX AI">
                    <SettingsRow
                        icon={<Brain className="w-4 h-4" />}
                        label="Honesty Level"
                        value={`${localSettings.max_honesty || 7}/10`}
                        onClick={() => setActiveSheet('honesty')}
                    />
                    <SettingsRow
                        icon={<Brain className="w-4 h-4" />}
                        label="Humor Level"
                        value={`${localSettings.max_humor || 5}/10`}
                        onClick={() => setActiveSheet('humor')}
                    />
                </SettingsGroup>

                {/* Focus */}
                <SettingsGroup title="Health Focus">
                    <SettingsRow
                        icon={<Sliders className="w-4 h-4" />}
                        label="Primary Goal"
                        value={localSettings.primary_goal?.replace(/_/g, ' ') || 'Not set'}
                    />
                </SettingsGroup>
            </motion.div>

            {/* Sheets */}
            <SliderSheet
                isOpen={activeSheet === 'honesty'}
                onClose={() => setActiveSheet(null)}
                title="Honesty Level"
                value={localSettings.max_honesty || 7}
                onChange={(v) => handleChange('max_honesty', v)}
            />
            <SliderSheet
                isOpen={activeSheet === 'humor'}
                onClose={() => setActiveSheet(null)}
                title="Humor Level"
                value={localSettings.max_humor || 5}
                onChange={(v) => handleChange('max_humor', v)}
            />
        </div>
    );
}

export default MobileSettings;
