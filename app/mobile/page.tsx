'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Bell, Plus, ChevronRight, Droplets } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Fire3D, Avocado3D } from '@/components/mobile/Icons3D';
import Link from 'next/link';

// Multi-Ring Health Chart Component
function MultiRingChart({
    data
}: {
    data: { label: string; value: number; color: string; max?: number }[]
}) {
    const size = 200;
    const center = size / 2;
    const baseRadius = 35;
    const ringGap = 18;
    const strokeWidth = 12;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {data.map((ring, index) => {
                    const radius = baseRadius + (index * ringGap);
                    const circumference = 2 * Math.PI * radius;
                    const progress = ring.value / (ring.max || 100);
                    const offset = circumference - (progress * circumference);

                    return (
                        <g key={ring.label}>
                            {/* Background ring */}
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth={strokeWidth}
                                opacity={0.3}
                            />
                            {/* Progress ring */}
                            <motion.circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={ring.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-4xl font-bold text-gray-900"
                >
                    72%
                </motion.span>
                <span className="text-xs text-gray-500">Recovery</span>
            </div>
        </div>
    );
}

// Animated Counter Component
function AnimatedCounter({
    value,
    suffix = '',
    delay = 0
}: {
    value: number;
    suffix?: string;
    delay?: number;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let start = 0;
            const duration = 1500;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                setDisplayValue(Math.round(start + (value - start) * easeOut));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }, delay);

        return () => clearTimeout(timeout);
    }, [value, delay]);

    return <span>{displayValue}{suffix}</span>;
}

// Premium Stat Card
function PremiumStatCard({
    label,
    value,
    suffix = '',
    subLabel,
    color,
    delay = 0
}: {
    label: string;
    value: number;
    suffix?: string;
    subLabel?: string;
    color: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
                try {
                    await Haptics.impact({ style: ImpactStyle.Light });
                } catch { }
            }}
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
        >
            {/* Color accent */}
            <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30"
                style={{ background: color, transform: 'translate(30%, -30%)' }}
            />

            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">
                <AnimatedCounter value={value} suffix={suffix} delay={delay + 200} />
            </p>
            {subLabel && (
                <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
            )}
        </motion.div>
    );
}

// Stress Distribution Bar
function StressBar({
    level,
    percentage,
    time,
    color,
    delay
}: {
    level: string;
    percentage: number;
    time: string;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3"
        >
            <span className="w-10 text-xs font-semibold text-gray-500">{level}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
            <span className="text-xs text-gray-400 w-16">{percentage}% {time}</span>
        </motion.div>
    );
}

export default function MobileDashboard() {
    const { language } = useI18n();
    const [streak, setStreak] = useState(4);
    const [showStreakCelebration, setShowStreakCelebration] = useState(false);

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

    const getFormattedDate = () => {
        const now = new Date();
        if (language === 'en') {
            return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }
        return now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
    };

    const ringData = [
        { label: 'Recovery', value: 72, color: '#0B3D2E', max: 100 },
        { label: 'Strain', value: 92, color: '#3B82F6', max: 100 },
        { label: 'HRV', value: 41, color: '#8B5CF6', max: 100 },
        { label: 'Sleep', value: 67, color: '#06B6D4', max: 100 },
    ];

    return (
        <div
            className="min-h-screen pb-8"
            style={{
                background: 'linear-gradient(180deg, #B8D4E8 0%, #E8EEF2 30%, #F8F9FA 60%, #FFFFFF 100%)',
            }}
        >
            {/* Header with glass effect */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 px-5 pt-3 pb-4"
                style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avocado3D size={36} />
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{getFormattedDate()}</p>
                            <h1 className="text-xl font-bold text-gray-900">{getGreeting()}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Streak Badge */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                                try {
                                    await Haptics.notification({ type: NotificationType.Success });
                                } catch { }
                                setShowStreakCelebration(true);
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-orange-50 rounded-full border border-orange-100"
                        >
                            <Fire3D size={20} />
                            <span className="text-sm font-bold text-orange-600">{streak}</span>
                        </motion.button>

                        {/* Notification */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="relative w-11 h-11 bg-white rounded-2xl shadow-sm flex items-center justify-center"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <div className="px-5 space-y-5">
                {/* Multi-Ring Chart Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-[32px] p-6"
                    style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            {language === 'en' ? "Today's Snapshot" : '今日概览'}
                        </h2>
                        <Link href="/mobile/calibration">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-[#0B3D2E] text-white text-xs font-semibold rounded-full"
                            >
                                {language === 'en' ? 'Calibrate' : '校准'}
                            </motion.button>
                        </Link>
                    </div>

                    <div className="flex items-center justify-center py-4">
                        <MultiRingChart data={ringData} />
                    </div>

                    {/* Ring Legend */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                        {ringData.map((ring, i) => (
                            <motion.div
                                key={ring.label}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                className="text-center"
                            >
                                <div
                                    className="w-3 h-3 rounded-full mx-auto mb-1"
                                    style={{ background: ring.color }}
                                />
                                <p className="text-[10px] text-gray-500">{ring.label}</p>
                                <p className="text-sm font-bold text-gray-900">{ring.value}%</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Digest Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-[28px] p-5"
                    style={{
                        background: 'linear-gradient(135deg, #0B3D2E 0%, #1a5c47 100%)',
                        boxShadow: '0 12px 40px rgba(11, 61, 46, 0.25)',
                    }}
                >
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />

                    <div className="relative">
                        <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-semibold mb-2">
                            {language === 'en' ? "Today's Digest" : '今日洞察'}
                        </p>
                        <p className="text-white font-medium leading-relaxed">
                            {language === 'en'
                                ? "Your body is in a balanced zone. Consider a light workout this afternoon for optimal recovery."
                                : "你的身体今天处于平衡状态。建议下午进行轻度锻炼以获得最佳恢复。"
                            }
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-[#D4AF37]"
                            />
                            <span className="text-xs text-white/60">Max • Updated 2 min ago</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stress Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-[28px] p-5"
                    style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h3 className="text-sm font-semibold text-gray-900">
                                {language === 'en' ? 'Stress Overview' : '压力概览'}
                            </h3>
                        </div>
                        <span className="text-xs text-gray-400">Duration 18:38:00</span>
                    </div>

                    <div className="space-y-3">
                        <StressBar level="HIGH" percentage={5} time="0:56:00" color="#EF4444" delay={0.5} />
                        <StressBar level="MED" percentage={36} time="0:56:00" color="#F97316" delay={0.6} />
                        <StressBar level="LOW" percentage={59} time="0:56:00" color="#3B82F6" delay={0.7} />
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <PremiumStatCard
                        label={language === 'en' ? 'Sleep' : '睡眠'}
                        value={6}
                        suffix="h 52m"
                        subLabel="Good"
                        color="#8B5CF6"
                        delay={0.5}
                    />
                    <PremiumStatCard
                        label={language === 'en' ? 'Heart Rate' : '心率'}
                        value={68}
                        suffix=" bpm"
                        subLabel="+1.0%"
                        color="#EF4444"
                        delay={0.6}
                    />
                    <PremiumStatCard
                        label="HRV"
                        value={56}
                        suffix=" ms"
                        subLabel="+2.0%"
                        color="#0B3D2E"
                        delay={0.7}
                    />
                    <PremiumStatCard
                        label={language === 'en' ? 'Active' : '活动'}
                        value={294}
                        suffix=" min"
                        subLabel="+1.0%"
                        color="#F59E0B"
                        delay={0.8}
                    />
                </div>
            </div>

            {/* Streak Celebration Modal */}
            <AnimatePresence>
                {showStreakCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6"
                        onClick={() => setShowStreakCelebration(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white rounded-[32px] p-8 text-center w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            }}
                        >
                            <Fire3D size={80} className="mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
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
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${i < streak
                                                ? 'bg-gradient-to-br from-[#0B3D2E] to-[#1a5c47] text-white'
                                                : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        {i < streak ? '✓' : day}
                                    </motion.div>
                                ))}
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowStreakCelebration(false)}
                                className="w-full py-4 bg-gradient-to-r from-[#0B3D2E] to-[#1a5c47] text-white font-bold rounded-2xl shadow-lg shadow-[#0B3D2E]/30"
                            >
                                {language === 'en' ? 'Continue' : '继续'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
