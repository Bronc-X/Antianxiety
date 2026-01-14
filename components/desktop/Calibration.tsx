'use client';

/**
 * Desktop Calibration Presentational Component (The Skin - Desktop)
 */

import { useState, useEffect } from 'react';
import {
    Save, Check, Moon, Battery, Brain, Heart,
    AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseCalibrationReturn } from '@/hooks/domain/useCalibration';

interface DesktopCalibrationProps {
    calibration: UseCalibrationReturn;
}

const MOOD_OPTIONS = [
    { value: 'great', emoji: '😊', label: 'Great', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'good', emoji: '🙂', label: 'Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'low', emoji: '😔', label: 'Low', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'bad', emoji: '😢', label: 'Bad', color: 'bg-red-100 text-red-700 border-red-300' },
];

function CalibrationSkeleton() {
    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        </div>
    );
}

function SliderCard({
    icon,
    label,
    value,
    onChange,
    color,
    description,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
    description: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${color}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{label}</h3>
                        <p className="text-xs text-gray-500">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value))}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-${color.split('-')[1]}-600`}
                    />
                    <span className="text-lg font-semibold text-gray-900 w-8 text-right">{value}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function DesktopCalibration({ calibration: hook }: DesktopCalibrationProps) {
    const { todayData, isLoading, isSaving, error, save, refresh } = hook;

    const [formData, setFormData] = useState({
        sleep_quality: todayData?.sleep_quality || 7,
        sleep_duration_minutes: todayData?.sleep_duration_minutes || 420,
        mood_status: todayData?.mood_status || 'okay',
        energy_level: todayData?.energy_level || 5,
        stress_level: todayData?.stress_level || 5,
        anxiety_level: todayData?.anxiety_level || 5,
        notes: todayData?.notes || '',
    });
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (todayData) {
            const timer = setTimeout(() => {
                setFormData({
                    sleep_quality: todayData.sleep_quality || 7,
                    sleep_duration_minutes: todayData.sleep_duration_minutes || 420,
                    mood_status: todayData.mood_status || 'okay',
                    energy_level: todayData.energy_level || 5,
                    stress_level: todayData.stress_level || 5,
                    anxiety_level: todayData.anxiety_level || 5,
                    notes: todayData.notes || '',
                });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [todayData]);

    const handleSave = async () => {
        const success = await save(formData);
        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (isLoading) return <CalibrationSkeleton />;

    const sleepHours = Math.floor(formData.sleep_duration_minutes / 60);
    const sleepMinutes = formData.sleep_duration_minutes % 60;

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Daily Calibration</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refresh} disabled={isSaving}>
                        <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {saveSuccess ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save'}
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

            {/* Mood Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>How are you feeling today?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        {MOOD_OPTIONS.map((mood) => (
                            <button
                                key={mood.value}
                                onClick={() => setFormData(prev => ({ ...prev, mood_status: mood.value }))}
                                className={`flex-1 py-4 rounded-xl border-2 transition-all ${formData.mood_status === mood.value
                                        ? mood.color + ' border-current'
                                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                    }`}
                            >
                                <span className="text-2xl block mb-1">{mood.emoji}</span>
                                <span className="text-xs font-medium">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Sleep */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        Sleep
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 mb-2 block">Duration</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={sleepHours}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    sleep_duration_minutes: parseInt(e.target.value) * 60 + sleepMinutes
                                }))}
                                className="w-20 px-3 py-2 border rounded-lg text-center"
                                min={0}
                                max={16}
                            />
                            <span className="text-gray-500">hours</span>
                            <input
                                type="number"
                                value={sleepMinutes}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    sleep_duration_minutes: sleepHours * 60 + parseInt(e.target.value)
                                }))}
                                className="w-20 px-3 py-2 border rounded-lg text-center"
                                min={0}
                                max={59}
                            />
                            <span className="text-gray-500">minutes</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 mb-2 block">Quality: {formData.sleep_quality}/10</label>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={formData.sleep_quality}
                            onChange={(e) => setFormData(prev => ({ ...prev, sleep_quality: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <SliderCard
                    icon={<Battery className="h-5 w-5 text-amber-600" />}
                    label="Energy"
                    value={formData.energy_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, energy_level: v }))}
                    color="bg-amber-100"
                    description="How energetic do you feel?"
                />
                <SliderCard
                    icon={<Brain className="h-5 w-5 text-rose-600" />}
                    label="Stress"
                    value={formData.stress_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, stress_level: v }))}
                    color="bg-rose-100"
                    description="Current stress level"
                />
                <SliderCard
                    icon={<Heart className="h-5 w-5 text-purple-600" />}
                    label="Anxiety"
                    value={formData.anxiety_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, anxiety_level: v }))}
                    color="bg-purple-100"
                    description="Anxiety right now"
                />
            </div>

            {/* Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full h-24 px-4 py-3 border rounded-lg resize-none"
                        placeholder="Any thoughts or observations about today..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default DesktopCalibration;
