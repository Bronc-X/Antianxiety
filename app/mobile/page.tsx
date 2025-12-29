'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Bell, Plus, ChevronRight, Flame } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Circular Progress Ring Component
function HealthRing({
    progress,
    size = 160,
    strokeWidth = 12,
    color = '#0B3D2E',
    label,
    value
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label: string;
    value: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">{label}</span>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    color,
    delay = 0
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
            onClick={async () => {
                try {
                    await Haptics.impact({ style: ImpactStyle.Light });
                } catch { }
            }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${color}20` }}
            >
                <div style={{ color }}>{icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </motion.div>
    );
}

export default function MobileDashboard() {
    const { language } = useI18n();
    const [streak, setStreak] = useState(4);
    const [showStreakCelebration, setShowStreakCelebration] = useState(false);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (language === 'en') {
            if (hour < 12) return 'Good morning';
            if (hour < 18) return 'Good afternoon';
            return 'Good evening';
        }
        if (hour < 12) return '早上好';
        if (hour < 18) return '下午好';
        return '晚上好';
    };

    // Format date
    const getFormattedDate = () => {
        const now = new Date();
        if (language === 'en') {
            return now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
        }
        return now.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div className="px-4 pt-4 pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <div>
                    <p className="text-sm text-gray-500">{getFormattedDate()}</p>
                    <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Streak Badge */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            try {
                                await Haptics.notification({ type: NotificationType.Success });
                            } catch { }
                            setShowStreakCelebration(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 rounded-full"
                    >
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-600">{streak}</span>
                    </motion.button>

                    {/* Notification Bell */}
                    <button className="relative w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* Add Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 bg-[#0B3D2E] rounded-full shadow-sm flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </motion.div>

            {/* Health Ring Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-6 shadow-sm mb-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {language === 'en' ? "Today's Snapshot" : '今日概览'}
                    </h2>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-center">
                    <HealthRing
                        progress={72}
                        label={language === 'en' ? 'Recovery' : '恢复度'}
                        value="72%"
                        color="#0B3D2E"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[#0B3D2E]">92%</p>
                        <p className="text-xs text-gray-500">{language === 'en' ? 'Strain' : '压力'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">41<span className="text-sm font-normal">ms</span></p>
                        <p className="text-xs text-gray-500">HRV</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">67%</p>
                        <p className="text-xs text-gray-500">{language === 'en' ? 'Sleep' : '睡眠'}</p>
                    </div>
                </div>
            </motion.div>

            {/* AI Digest Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-[#0B3D2E] to-[#1a5c47] rounded-3xl p-5 mb-6"
            >
                <p className="text-xs text-white/60 uppercase tracking-wider mb-2">
                    {language === 'en' ? "Today's Digest" : '今日洞察'}
                </p>
                <p className="text-white font-medium leading-relaxed">
                    {language === 'en'
                        ? "Your body is in a balanced zone today. Consider a light-to-moderate workout in the afternoon."
                        : "你的身体今天处于平衡状态。建议下午进行轻度到中度的锻炼。"
                    }
                </p>
            </motion.div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    icon={<span className="text-lg">😴</span>}
                    label={language === 'en' ? 'Sleep' : '睡眠'}
                    value="6h 52m"
                    color="#8B5CF6"
                    delay={0.5}
                />
                <StatCard
                    icon={<span className="text-lg">💓</span>}
                    label={language === 'en' ? 'Heart Rate' : '心率'}
                    value="68 bpm"
                    color="#EF4444"
                    delay={0.6}
                />
                <StatCard
                    icon={<span className="text-lg">🧘</span>}
                    label={language === 'en' ? 'Stress Score' : '压力指数'}
                    value="46"
                    color="#10B981"
                    delay={0.7}
                />
                <StatCard
                    icon={<span className="text-lg">🚶</span>}
                    label={language === 'en' ? 'Active' : '活动'}
                    value="294 min"
                    color="#F59E0B"
                    delay={0.8}
                />
            </div>

            {/* Streak Celebration Modal */}
            {showStreakCelebration && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowStreakCelebration(false)}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 mx-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-5xl mb-4">🔥</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {streak} {language === 'en' ? 'days streak!' : '天连续打卡！'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {language === 'en'
                                ? "You're on fire! Every day matters for hitting your goal!"
                                : "太棒了！每一天都是向目标迈进的一步！"
                            }
                        </p>
                        <div className="flex justify-center gap-2 mb-6">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < streak
                                            ? 'bg-[#0B3D2E] text-white'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {i < streak ? '✓' : day}
                                </div>
                            ))}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowStreakCelebration(false)}
                            className="w-full py-4 bg-[#0B3D2E] text-white font-semibold rounded-2xl"
                        >
                            {language === 'en' ? 'Continue' : '继续'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
