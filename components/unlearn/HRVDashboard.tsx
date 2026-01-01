'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Moon, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { useWearables } from '@/hooks/domain/useWearables';

interface HRVData {
    value: number;
    status: 'low' | 'normal' | 'good' | 'excellent';
    trend: number;
    lastUpdated: string;
}

interface SleepData {
    duration: number;
    quality: number;
    deepSleep: number;
    remSleep: number;
}

interface ActivityData {
    steps: number;
    calories: number;
    activeMinutes: number;
}

export default function HRVDashboard() {
    const { language } = useI18n();
    const { loadStatus: loadWearableStatus } = useWearables();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });
    const [initialLoading, setInitialLoading] = useState(true);
    const [hrv, setHrv] = useState<HRVData | null>(null);
    const [sleep, setSleep] = useState<SleepData | null>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Track if initial fetch has completed to prevent re-fetching on re-renders
    const hasFetchedRef = useRef(false);

    const languageRef = useRef(language);
    const loadWearableStatusRef = useRef(loadWearableStatus);

    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    useEffect(() => {
        loadWearableStatusRef.current = loadWearableStatus;
    }, [loadWearableStatus]);

    const fetchHealthData = useCallback(async (isInitial = false) => {
        // Prevent duplicate initial fetches
        if (isInitial && hasFetchedRef.current) return;
        if (isInitial) hasFetchedRef.current = true;

        try {
            setErrorMessage(null);
            const data = await loadWearableStatusRef.current();
            if (data?.latestData) {
                setHrv(data.latestData.hrv || null);
                setSleep(data.latestData.sleep || null);
                setActivity(data.latestData.activity || null);
            } else {
                setHrv(null);
                setSleep(null);
                setActivity(null);
            }
        } catch (error) {
            console.error('Failed to fetch health data:', error);
            setErrorMessage(languageRef.current === 'en' ? 'Unable to load wearable data.' : '暂时无法加载穿戴数据。');
            setHrv(null);
            setSleep(null);
            setActivity(null);
        } finally {
            if (isInitial) setInitialLoading(false);
        }
    }, []);

    // Initial fetch - only runs once
    useEffect(() => {
        fetchHealthData(true);
    }, [fetchHealthData]);

    // Background refresh interval
    useEffect(() => {
        const interval = setInterval(() => {
            fetchHealthData(false);
        }, 60000);

        const handleFocus = () => fetchHealthData(false);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchHealthData]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return '#D4AF37';
            case 'good': return '#10B981';
            case 'normal': return '#F59E0B';
            case 'low': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, Record<string, string>> = {
            excellent: { en: 'Excellent', zh: '极佳' },
            good: { en: 'Good', zh: '良好' },
            normal: { en: 'Normal', zh: '正常' },
            low: { en: 'Low', zh: '偏低' },
        };
        return labels[status]?.[language] || status;
    };

    if (initialLoading) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1000px] mx-auto flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                </div>
            </section>
        );
    }

    if (!hrv && !sleep && !activity) {
        return (
            <section ref={ref} className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1000px] mx-auto text-center">
                    <p className="text-white/50">{language === 'en' ? 'No wearable data available' : '暂无穿戴设备数据'}</p>
                </div>
            </section>
        );
    }

    return (
        <section ref={ref} className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[1000px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Real-Time Biometrics' : '实时生物数据'}
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Your body speaks in data' : '你的身体在用数据说话'}
                    </h2>
                </div>

                {/* HRV Main Card */}
                {hrv && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className="mb-8 p-8 bg-white/5 border border-white/10"
                    >
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* HRV Gauge */}
                            <div className="flex justify-center">
                                <div className="relative w-48 h-48">
                                    <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
                                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                        <motion.circle
                                            cx="100" cy="100" r="80" fill="none"
                                            stroke={getStatusColor(hrv.status)}
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray="502"
                                            initial={{ strokeDashoffset: 502 }}
                                            animate={isInView ? { strokeDashoffset: 502 - (502 * hrv.value / 100) } : {}}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            className="text-5xl font-bold text-white"
                                            initial={{ opacity: 0 }}
                                            animate={isInView ? { opacity: 1 } : {}}
                                            transition={{ delay: 0.5 }}
                                        >
                                            {hrv.value}
                                        </motion.span>
                                        <span className="text-xs text-white/50 mt-1">ms</span>
                                        <span
                                            className="text-sm font-medium mt-2 px-3 py-1"
                                            style={{ backgroundColor: `${getStatusColor(hrv.status)}20`, color: getStatusColor(hrv.status) }}
                                        >
                                            {getStatusLabel(hrv.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* HRV Details */}
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-4">
                                    {language === 'en' ? 'Heart Rate Variability' : '心率变异性 (HRV)'}
                                </h3>
                                <p className="text-white/60 mb-6 leading-relaxed">
                                    {language === 'en'
                                        ? 'HRV is a key indicator of your autonomic nervous system health and recovery capacity.'
                                        : 'HRV 是反映你自主神经系统健康和恢复能力的关键指标。'}
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={`w-5 h-5 ${hrv.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                                        <span className={`font-medium ${hrv.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {hrv.trend > 0 ? '+' : ''}{hrv.trend}%
                                        </span>
                                        <span className="text-white/40 text-sm">{language === 'en' ? 'vs last week' : '较上周'}</span>
                                    </div>
                                    <span className="text-white/30 text-sm">{hrv.lastUpdated}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Secondary Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Sleep Card */}
                    {sleep && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.2 }}
                            className="p-6 bg-white/5 border border-white/10"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-500/20 flex items-center justify-center">
                                    <Moon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h4 className="text-white font-semibold">{language === 'en' ? 'Sleep' : '睡眠'}</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Duration' : '时长'}</span>
                                    <span className="text-white font-medium">{sleep.duration}h</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Quality Score' : '质量评分'}</span>
                                    <span className="text-white font-medium">{sleep.quality}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Deep Sleep' : '深度睡眠'}</span>
                                    <span className="text-white font-medium">{sleep.deepSleep}h</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Activity Card */}
                    {activity && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.3 }}
                            className="p-6 bg-white/5 border border-white/10"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-500/20 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h4 className="text-white font-semibold">{language === 'en' ? 'Activity' : '活动'}</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Steps' : '步数'}</span>
                                    <span className="text-white font-medium">{activity.steps.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Calories' : '卡路里'}</span>
                                    <span className="text-white font-medium">{activity.calories} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">{language === 'en' ? 'Active Minutes' : '活动时间'}</span>
                                    <span className="text-white font-medium">{activity.activeMinutes} min</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
