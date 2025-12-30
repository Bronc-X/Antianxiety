'use client';

/**
 * Desktop Settings Presentational Component (The Skin - Desktop)
 */

import { useState } from 'react';
import {
    Save, RefreshCw, User, Bell, Brain, Sliders,
    AlertCircle, Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseSettingsReturn } from '@/hooks/domain/useSettings';

interface DesktopSettingsProps {
    settings: UseSettingsReturn;
}

function SettingsSkeleton() {
    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}

function SettingsSection({
    title,
    icon,
    children
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function SliderInput({
    label,
    value,
    onChange,
    min = 1,
    max = 10,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-600">{label}</label>
                <span className="text-sm font-medium text-gray-900">{value}/{max}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
        </div>
    );
}

export function DesktopSettings({ settings: hook }: DesktopSettingsProps) {
    const { settings, isLoading, isSaving, error, update, refresh } = hook;

    const [localSettings, setLocalSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Sync local with hook data
    if (!hasChanges && JSON.stringify(localSettings) !== JSON.stringify(settings)) {
        setLocalSettings(settings);
    }

    const handleChange = (key: string, value: unknown) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        const success = await update(localSettings);
        if (success) {
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (isLoading) return <SettingsSkeleton />;

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Customize your experience</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refresh} disabled={isSaving}>
                        <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                        {saveSuccess ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Saved
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Body Metrics */}
            <SettingsSection title="Body Metrics" icon={<User className="h-4 w-4 text-gray-500" />}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
                        <input
                            type="number"
                            value={localSettings.height || ''}
                            onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="170"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                        <input
                            type="number"
                            value={localSettings.weight || ''}
                            onChange={(e) => handleChange('weight', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="65"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Age</label>
                        <input
                            type="number"
                            value={localSettings.age || ''}
                            onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Gender</label>
                        <select
                            value={localSettings.gender || ''}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </SettingsSection>

            {/* MAX AI Settings */}
            <SettingsSection title="MAX AI Personality" icon={<Brain className="h-4 w-4 text-gray-500" />}>
                <div className="space-y-6">
                    <SliderInput
                        label="Honesty Level"
                        value={localSettings.max_honesty || 7}
                        onChange={(v) => handleChange('max_honesty', v)}
                    />
                    <SliderInput
                        label="Humor Level"
                        value={localSettings.max_humor || 5}
                        onChange={(v) => handleChange('max_humor', v)}
                    />
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Personality Style</label>
                        <select
                            value={localSettings.ai_personality || 'balanced'}
                            onChange={(e) => handleChange('ai_personality', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="supportive">Supportive & Gentle</option>
                            <option value="balanced">Balanced</option>
                            <option value="direct">Direct & Honest</option>
                            <option value="motivational">Motivational Coach</option>
                        </select>
                    </div>
                </div>
            </SettingsSection>

            {/* Health Focus */}
            <SettingsSection title="Health Focus" icon={<Sliders className="h-4 w-4 text-gray-500" />}>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Primary Goal</label>
                    <select
                        value={localSettings.primary_goal || ''}
                        onChange={(e) => handleChange('primary_goal', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">Select a goal...</option>
                        <option value="reduce_anxiety">Reduce Anxiety</option>
                        <option value="better_sleep">Better Sleep</option>
                        <option value="manage_stress">Manage Stress</option>
                        <option value="improve_energy">Improve Energy</option>
                        <option value="overall_wellness">Overall Wellness</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Current Focus</label>
                    <input
                        type="text"
                        value={localSettings.current_focus || ''}
                        onChange={(e) => handleChange('current_focus', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., Morning routine, Work stress..."
                    />
                </div>
            </SettingsSection>
        </div>
    );
}

export default DesktopSettings;
