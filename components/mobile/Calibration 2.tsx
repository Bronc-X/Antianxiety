'use client';

/**
 * Mobile Calibration Presentational Component (The Skin - Mobile)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Check, Moon, Battery, Brain, Heart, WifiOff,
    ChevronRight, AlertCircle
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import type { UseCalibrationReturn } from '@/hooks/domain/useCalibration';

interface MobileCalibrationProps {
    calibration: UseCalibrationReturn;
}

const MOOD_OPTIONS = [
    { value: 'great', emoji: '😊', label: 'Great', bg: 'bg-green-100' },
    { value: 'good', emoji: '🙂', label: 'Good', bg: 'bg-emerald-100' },
    { value: 'okay', emoji: '😐', label: 'Okay', bg: 'bg-yellow-100' },
    { value: 'low', emoji: '😔', label: 'Low', bg: 'bg-orange-100' },
    { value: 'bad', emoji: '😢', label: 'Bad', bg: 'bg-red-100' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

function MetricSlider({
    icon,
    label,
    value,
    onChange,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
}) {
    const { impact } = useHaptics();

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        if (newValue !== value) {
            await impact(ImpactStyle.Light);
            onChange(newValue);
        }
    };

    return (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${color}`}>
                        {icon}
                    </div>
                    <span className="font-medium text-gray-900">{label}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{value}</span>
            </div>
            <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color.includes('amber') ? '#d97706' : color.includes('rose') ? '#e11d48' : '#9333ea' }}
            />
        </motion.div>
    );
}

export function MobileCalibration({ calibration: hook }: MobileCalibrationProps) {
    const { todayData, isLoading, isSaving, isOffline, error, save } = hook;
    const { impact, notification } = useHaptics();

    const [formData, setFormData] = useState({
        sleep_quality: 7,
        sleep_duration_minutes: 420,
        mood_status: 'okay',
        energy_level: 5,
        stress_level: 5,
        anxiety_level: 5,
    });
    const [step, setStep] = useState(0);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (todayData) {
            setFormData({
                sleep_quality: todayData.sleep_quality || 7,
                sleep_duration_minutes: todayData.sleep_duration_minutes || 420,
                mood_status: todayData.mood_status || 'okay',
                energy_level: todayData.energy_level || 5,
                stress_level: todayData.stress_level || 5,
                anxiety_level: todayData.anxiety_level || 5,
            });
        }
    }, [todayData]);

    const handleMoodSelect = async (mood: string) => {
        await impact(ImpactStyle.Medium);
        setFormData(prev => ({ ...prev, mood_status: mood }));
    };

    const handleSave = async () => {
        await impact(ImpactStyle.Medium);
        const success = await save(formData);
        if (success) {
            await notification('success');
            setSaveSuccess(true);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (saveSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6"
                >
                    <Check className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2"
                >
                    Calibration Complete!
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80 text-center"
                >
                    Your data has been saved. See you tomorrow!
                </motion.p>
            </div>
        );
    }

    const sleepHours = Math.floor(formData.sleep_duration_minutes / 60);

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
                        <span className="text-sm text-amber-700">Offline - will sync later</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-white px-4 py-6 border-b">
                <h1 className="text-xl font-bold text-gray-900">Daily Calibration</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-4 pb-32"
            >
                {/* Mood */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-4">
                    <h3 className="font-medium text-gray-900 mb-4">How are you feeling?</h3>
                    <div className="flex gap-2">
                        {MOOD_OPTIONS.map((mood) => (
                            <motion.button
                                key={mood.value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMoodSelect(mood.value)}
                                className={`flex-1 py-3 rounded-xl transition-all ${formData.mood_status === mood.value
                                        ? mood.bg + ' ring-2 ring-offset-2 ring-gray-400'
                                        : 'bg-gray-50'
                                    }`}
                            >
                                <span className="text-2xl block">{mood.emoji}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Sleep */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-indigo-100">
                            <Moon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">Sleep</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                impact(ImpactStyle.Light);
                                setFormData(prev => ({
                                    ...prev,
                                    sleep_duration_minutes: Math.max(0, prev.sleep_duration_minutes - 30)
                                }));
                            }}
                            className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold"
                        >
                            -
                        </motion.button>
                        <div className="text-center">
                            <span className="text-4xl font-bold text-gray-900">{sleepHours}</span>
                            <span className="text-gray-500 ml-1">hrs</span>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                impact(ImpactStyle.Light);
                                setFormData(prev => ({
                                    ...prev,
                                    sleep_duration_minutes: Math.min(960, prev.sleep_duration_minutes + 30)
                                }));
                            }}
                            className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold"
                        >
                            +
                        </motion.button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Quality</span>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={formData.sleep_quality}
                            onChange={(e) => setFormData(prev => ({ ...prev, sleep_quality: parseInt(e.target.value) }))}
                            className="flex-1 h-2 bg-gray-200 rounded-full appearance-none"
                            style={{ accentColor: '#6366f1' }}
                        />
                        <span className="text-sm font-medium w-6">{formData.sleep_quality}</span>
                    </div>
                </motion.div>

                {/* Metrics */}
                <MetricSlider
                    icon={<Battery className="h-5 w-5 text-amber-600" />}
                    label="Energy"
                    value={formData.energy_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, energy_level: v }))}
                    color="bg-amber-100"
                />
                <MetricSlider
                    icon={<Brain className="h-5 w-5 text-rose-600" />}
                    label="Stress"
                    value={formData.stress_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, stress_level: v }))}
                    color="bg-rose-100"
                />
                <MetricSlider
                    icon={<Heart className="h-5 w-5 text-purple-600" />}
                    label="Anxiety"
                    value={formData.anxiety_level}
                    onChange={(v) => setFormData(prev => ({ ...prev, anxiety_level: v }))}
                    color="bg-purple-100"
                />
            </motion.div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Calibration
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

export default MobileCalibration;
