'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Activity,
    Brain,
    Moon,
    Heart,
    Zap,
    Target,
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    Settings,
    ChevronRight
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UnifiedProfile {
    demographics: {
        gender?: string;
        age?: number;
        bmi?: number;
    };
    health_goals: Array<{ goal_text: string; category: string }>;
    health_concerns: string[];
    lifestyle_factors: {
        sleep_hours?: number;
        exercise_frequency?: string;
        stress_level?: string;
    };
    recent_mood_trend: 'improving' | 'stable' | 'declining';
    ai_inferred_traits: Record<string, unknown>;
    last_aggregated_at: string;
}

interface WellnessLog {
    log_date: string;
    sleep_duration_minutes: number | null;
    mood_status: string | null;
    stress_level: number | null;
}

interface HardwareData {
    hrv?: { value: number; source: string; recorded_at: string };
    resting_heart_rate?: { value: number; source: string; recorded_at: string };
    sleep_score?: { value: number; source: string; recorded_at: string };
    spo2?: { value: number; source: string; recorded_at: string };
}

export default function DashboardPage() {
    const router = useRouter();
    const { language } = useI18n();
    const isZh = language !== 'en';
    const supabase = createClientComponentClient();

    const [profile, setProfile] = useState<UnifiedProfile | null>(null);
    const [weeklyLogs, setWeeklyLogs] = useState<WellnessLog[]>([]);
    const [hardwareData, setHardwareData] = useState<HardwareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch unified profile
        const { data: unifiedProfile } = await supabase
            .from('unified_user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (unifiedProfile) {
            setProfile(unifiedProfile as UnifiedProfile);
        }

        // Fetch last 7 days of wellness logs
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: logs } = await supabase
            .from('daily_wellness_logs')
            .select('log_date, sleep_duration_minutes, mood_status, stress_level')
            .eq('user_id', user.id)
            .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
            .order('log_date', { ascending: true });

        if (logs) {
            setWeeklyLogs(logs);
        }

        // Fetch hardware data (HRV, etc.)
        try {
            const hwResponse = await fetch('/api/user/hardware-sync');
            if (hwResponse.ok) {
                const hwData = await hwResponse.json();
                if (hwData.success && hwData.data) {
                    setHardwareData(hwData.data);
                }
            }
        } catch (e) {
            console.log('Hardware data not available');
        }

        setLoading(false);
    }

    async function handleSync() {
        setSyncing(true);
        try {
            await fetch('/api/user/profile-sync', { method: 'POST' });
            await loadData();
        } finally {
            setSyncing(false);
        }
    }

    const getMoodTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-amber-500" />;
        }
    };

    const getMoodTrendText = (trend: string) => {
        const texts: Record<string, { zh: string; en: string }> = {
            improving: { zh: '情绪上升', en: 'Improving' },
            declining: { zh: '情绪下降', en: 'Declining' },
            stable: { zh: '情绪稳定', en: 'Stable' },
        };
        return texts[trend]?.[isZh ? 'zh' : 'en'] || trend;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#FEFCF8] to-[#F8F4ED] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FEFCF8] to-[#F8F4ED]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FEFCF8]/80 backdrop-blur-lg border-b border-[#E7E1D6]/30">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl hover:bg-[#E7E1D6]/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeft className="w-5 h-5 text-[#0B3D2E]" />
                        </motion.button>
                        <div>
                            <h1 className="font-bold text-xl text-[#0B3D2E]">
                                {isZh ? '我的健康画像' : 'My Health Profile'}
                            </h1>
                            <p className="text-xs text-[#0B3D2E]/60">
                                {isZh ? '你的数字健康孪生体' : 'Your Digital Health Twin'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={handleSync}
                            disabled={syncing}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <RefreshCw className={`w-5 h-5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button
                            onClick={() => router.push('/settings')}
                            className="p-2 rounded-xl hover:bg-[#E7E1D6]/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Settings className="w-5 h-5 text-[#0B3D2E]" />
                        </motion.button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
                {!profile ? (
                    /* No Profile State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-[#E7E1D6] p-8 text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-lg font-bold text-[#0B3D2E] mb-2">
                            {isZh ? '尚未建立健康画像' : 'No Health Profile Yet'}
                        </h2>
                        <p className="text-sm text-[#0B3D2E]/60 mb-6">
                            {isZh
                                ? '完成每日校准或填写问卷后，系统将自动生成你的健康画像'
                                : 'Complete daily check-ins or questionnaires to generate your health profile'}
                        </p>
                        <button
                            onClick={() => router.push('/daily-calibration')}
                            className="px-6 py-3 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0a3629] transition-colors"
                        >
                            {isZh ? '开始每日校准' : 'Start Daily Calibration'}
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* Core Metrics Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
                        >
                            {/* Goals Card */}
                            <div className="bg-white rounded-2xl border border-[#E7E1D6] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50">
                                        {isZh ? '核心目标' : 'Goals'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {profile.health_goals?.slice(0, 2).map((goal, i) => (
                                        <p key={i} className="text-sm font-medium text-[#0B3D2E] truncate">
                                            {goal.goal_text}
                                        </p>
                                    )) || (
                                            <p className="text-sm text-[#0B3D2E]/50">{isZh ? '未设置' : 'Not set'}</p>
                                        )}
                                </div>
                            </div>

                            {/* Lifestyle Card */}
                            <div className="bg-white rounded-2xl border border-[#E7E1D6] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Moon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50">
                                        {isZh ? '生活习惯' : 'Lifestyle'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-[#0B3D2E]">
                                        {isZh ? '睡眠' : 'Sleep'}: {profile.lifestyle_factors?.sleep_hours || '-'}h
                                    </p>
                                    <p className="text-sm font-medium text-[#0B3D2E]">
                                        {isZh ? '运动' : 'Exercise'}: {profile.lifestyle_factors?.exercise_frequency || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Mood Trend Card */}
                            <div className="bg-white rounded-2xl border border-[#E7E1D6] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <Heart className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50">
                                        {isZh ? '情绪趋势' : 'Mood'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getMoodTrendIcon(profile.recent_mood_trend)}
                                    <span className="text-sm font-medium text-[#0B3D2E]">
                                        {getMoodTrendText(profile.recent_mood_trend)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Hardware Data (HRV, etc.) */}
                        {hardwareData && (hardwareData.hrv || hardwareData.sleep_score) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                            >
                                {hardwareData.hrv && (
                                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200/50 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Heart className="w-4 h-4 text-rose-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-rose-600/70">HRV</span>
                                        </div>
                                        <p className="text-2xl font-bold text-rose-700">{hardwareData.hrv.value}<span className="text-sm font-normal ml-1">ms</span></p>
                                        <p className="text-[10px] text-rose-500/60 mt-1">{hardwareData.hrv.source}</p>
                                    </div>
                                )}
                                {hardwareData.resting_heart_rate && (
                                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200/50 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-red-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-red-600/70">{isZh ? '静息心率' : 'RHR'}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-red-700">{hardwareData.resting_heart_rate.value}<span className="text-sm font-normal ml-1">bpm</span></p>
                                    </div>
                                )}
                                {hardwareData.sleep_score && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/50 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600/70">{isZh ? '睡眠评分' : 'Sleep'}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-indigo-700">{hardwareData.sleep_score.value}<span className="text-sm font-normal ml-1">/100</span></p>
                                    </div>
                                )}
                                {hardwareData.spo2 && (
                                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200/50 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-cyan-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600/70">SpO2</span>
                                        </div>
                                        <p className="text-2xl font-bold text-cyan-700">{hardwareData.spo2.value}<span className="text-sm font-normal ml-1">%</span></p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Health Tags */}
                        {profile.health_concerns?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl border border-[#E7E1D6] p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-4 h-4 text-[#0B3D2E]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50">
                                        {isZh ? '健康关注点' : 'Health Tags'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.health_concerns.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-[#0B3D2E]/50">
                                    {isZh
                                        ? '个性化推荐基于以上标签生成'
                                        : 'Personalized recommendations are based on these tags'}
                                </p>
                            </motion.div>
                        )}

                        {/* Weekly Trend Chart Placeholder */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl border border-[#E7E1D6] p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#0B3D2E]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]/50">
                                        {isZh ? '过去7天' : 'Last 7 Days'}
                                    </span>
                                </div>
                                <span className="text-xs text-[#0B3D2E]/40">
                                    {weeklyLogs.length} {isZh ? '条记录' : 'entries'}
                                </span>
                            </div>

                            {weeklyLogs.length > 0 ? (
                                <div className="flex items-end justify-between h-24 gap-2">
                                    {weeklyLogs.map((log, i) => {
                                        const height = log.stress_level ? (10 - log.stress_level) * 10 : 50;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div
                                                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-lg transition-all"
                                                    style={{ height: `${height}%` }}
                                                />
                                                <span className="text-[10px] text-[#0B3D2E]/40">
                                                    {new Date(log.log_date).getDate()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-sm text-[#0B3D2E]/40">
                                    {isZh ? '暂无数据' : 'No data yet'}
                                </div>
                            )}
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <button
                                onClick={() => router.push('/daily-calibration')}
                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E7E1D6] hover:bg-emerald-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[#0B3D2E]">
                                            {isZh ? '每日校准' : 'Daily Check'}
                                        </p>
                                        <p className="text-xs text-[#0B3D2E]/50">
                                            {isZh ? '记录今日状态' : 'Log today\'s status'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#0B3D2E]/30 group-hover:text-[#0B3D2E]/60" />
                            </button>

                            <button
                                onClick={() => router.push('/goals')}
                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E7E1D6] hover:bg-blue-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[#0B3D2E]">
                                            {isZh ? '阶段计划' : 'Phase Goals'}
                                        </p>
                                        <p className="text-xs text-[#0B3D2E]/50">
                                            {isZh ? '设定健康目标' : 'Set health goals'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#0B3D2E]/30 group-hover:text-[#0B3D2E]/60" />
                            </button>
                        </motion.div>

                        {/* Last Updated */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center text-xs text-[#0B3D2E]/40"
                        >
                            {isZh ? '上次更新' : 'Last updated'}: {new Date(profile.last_aggregated_at).toLocaleString()}
                        </motion.p>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
