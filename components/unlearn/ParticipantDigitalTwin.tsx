'use client';

import { useRef, useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Settings, TrendingUp, Clock, BarChart3, RefreshCw, AlertCircle, Loader2, X, Bell, Shield, Zap, LogIn, Heart, Lightbulb, Target, AlertTriangle, Moon, Activity, Smile, Brain, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDigitalTwinCurve, getDataQualityStatus } from '@/hooks/domain/useDigitalTwinCurve';
import { useAskMaxExplain } from '@/hooks/domain/useAskMaxExplain';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';
import type { DigitalTwinCurveOutput, CurveTimepoint, TimelineMilestone, ScaleBaselineItem } from '@/types/digital-twin-curve';
import { getRecommendations } from '@/lib/health-recommendations';
import MaxAvatar from '@/components/max/MaxAvatar';
import {
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Line,
    ComposedChart,
} from 'recharts';

// ============================================
// Design Tokens (from DesktopDigitalTwin)
// ============================================

const COLORS = {
    anxiety: '#D4AF37', // Gold (Focus)
    sleep: '#94A8D0',   // Steel Lavender (Calm)
    mood: '#88C9B3',    // Sage Teal (Balance)
    energy: '#89B4D6',  // Air Superiority Blue (Flow)
    hrv: '#D69EAC',     // Dusty Rose (Heart)
    // Removed stress
};

const METRIC_LABELS = {
    anxietyScore: 'Anxiety Score',
    sleepQuality: 'Sleep Quality',
    moodStability: 'Mood Stability',
    energyLevel: 'Energy Level',
    hrvScore: 'HRV Index',
};

const METRIC_LABELS_CN = {
    anxietyScore: '焦虑评分',
    sleepQuality: '睡眠质量',
    moodStability: '情绪稳定',
    energyLevel: '能量水平',
    hrvScore: 'HRV 代理',
};

// ============================================
// Types
// ============================================

type ViewType = 'prediction' | 'progress' | 'advice';

// ============================================
// Not Logged In State Component
// ============================================

function NotLoggedInState({ language }: { language: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="text-white font-semibold mb-2">
                {language === 'en' ? 'Sign in to view your Digital Twin' : '登录后查看你的数字孪生'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {language === 'en'
                    ? 'Your personalized health insights are waiting for you.'
                    : '你的个性化健康洞察正在等待你。'}
            </p>
        </div>
    );
}

// ============================================
// Loading State Component
// ============================================

function LoadingState({ language }: { language: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
            <p className="text-white/70 text-sm">
                {language === 'en' ? 'Loading your digital twin...' : '正在加载你的数字孪生...'}
            </p>
        </div>
    );
}

// ============================================
// Error State Component
// ============================================

function ErrorState({
    message,
    onRetry,
    language
}: {
    message: string;
    onRetry: () => void;
    language: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">
                {language === 'en' ? 'Something went wrong' : '出现了一些问题'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6">{message}</p>
            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0B3D2E] font-medium text-sm hover:bg-[#B8960C] transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                {language === 'en' ? 'Try Again' : '重试'}
            </button>
        </div>
    );
}

// ============================================
// No Analysis State Component
// ============================================

function NoAnalysisState({
    onTriggerAnalysis,
    isAnalyzing,
    language
}: {
    onTriggerAnalysis: () => void;
    isAnalyzing: boolean;
    language: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
                {language === 'en' ? 'Ready for Analysis' : '准备好进行分析'}
            </h3>
            <p className="text-white/60 text-sm text-center mb-6 max-w-md">
                {language === 'en'
                    ? 'Your data has been collected. Generate your first AI-powered health analysis.'
                    : '你的数据已收集完成。生成你的首次 AI 健康分析。'}
            </p>
            <button
                onClick={onTriggerAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium hover:bg-[#B8960C] transition-colors disabled:opacity-50"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'en' ? 'Analyzing...' : '分析中...'}
                    </>
                ) : (
                    <>
                        <TrendingUp className="w-4 h-4" />
                        {language === 'en' ? 'Generate Analysis' : '生成分析'}
                    </>
                )}
            </button>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export default function ParticipantDigitalTwin() {
    const { language } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });

    // Use Digital Twin Curve Hook
    const {
        curveData,
        isLoading: loadingCurve,
        error: curveError,
        generateCurve,
        refreshCurve,
    } = useDigitalTwinCurve();

    // Auth and Profile hooks
    const { isAuthenticated } = useAuth();
    const { profile } = useProfile();

    // Local UI state
    const [activeView, setActiveView] = useState<ViewType>('prediction');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [medicalConsent, setMedicalConsent] = useState(false);
    const [analysisFrequency, setAnalysisFrequency] = useState<'auto' | 'daily' | 'weekly'>('auto');
    const [notifications, setNotifications] = useState(true);

    // NEW: Selected metrics for curve chart
    const [selectedMetrics, setSelectedMetrics] = useState<(keyof typeof METRIC_LABELS)[]>(() =>
        Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[]
    );

    // Carousel state
    const [activeChartTab, setActiveChartTab] = useState<'chart' | 'table'>('chart');
    const swipeStartXRef = useRef<number | null>(null);

    // Handle metric toggle
    const handleMetricToggle = useCallback((metric: keyof typeof METRIC_LABELS) => {
        setSelectedMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    }, []);

    // Toast for no data hint - with position
    const [hintPosition, setHintPosition] = useState<{ x: number; y: number } | null>(null);

    // Load data on mount
    useEffect(() => {
        if (isAuthenticated) {
            generateCurve();
        }
    }, [isAuthenticated, generateCurve]);

    // Listen for calibration to refresh
    useEffect(() => {
        const handleCalibration = () => {
            refreshCurve();
        };
        window.addEventListener('daily-calibration:completed', handleCalibration);
        return () => {
            window.removeEventListener('daily-calibration:completed', handleCalibration);
        };
    }, [refreshCurve]);

    // Derive state
    const loading = loadingCurve;
    const error = curveError;
    const notLoggedIn = !isAuthenticated;
    const hasData = !!curveData;

    // Trigger analysis / regenerate
    const triggerAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            await generateCurve('improving');
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [generateCurve]);

    // View options - updated labels
    const viewOptions = language === 'en'
        ? [
            { id: 'prediction' as ViewType, label: '15-Week Curves', icon: TrendingUp },
            { id: 'progress' as ViewType, label: 'Progress & Baseline', icon: Clock },
            { id: 'advice' as ViewType, label: 'Health Advice', icon: Heart },
        ]
        : [
            { id: 'prediction' as ViewType, label: '15周预测曲线', icon: TrendingUp },
            { id: 'progress' as ViewType, label: '进度 & 基线', icon: Clock },
            { id: 'advice' as ViewType, label: '健康建议', icon: Heart },
        ];

    // Extract data from curveData
    const rawTimepoints = useMemo<CurveTimepoint[]>(
        () => curveData?.A_predictedLongitudinalOutcomes?.timepoints ?? [],
        [curveData]
    );

    const normalizeMetricPrediction = (raw: unknown): { value: number; confidence: string } => {
        if (raw && typeof raw === 'object') {
            const rawObj = raw as Record<string, unknown>;
            const rawValue = rawObj.value ?? rawObj.score ?? raw;
            const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            return {
                ...rawObj,
                value: Number.isNaN(numeric) ? 0 : numeric,
                confidence: typeof rawObj.confidence === 'string' ? rawObj.confidence : 'medium',
            };
        }

        const numeric = typeof raw === 'number' ? raw : Number(raw);
        return {
            value: Number.isNaN(numeric) ? 0 : numeric,
            confidence: 'medium',
        };
    };

    // Debug logging
    useEffect(() => {
        if (curveData) {
            console.log('📈 Curve Data:', curveData);
            console.log('📊 Raw Timepoints:', rawTimepoints);
        }
    }, [curveData, rawTimepoints]);

    const timepoints = rawTimepoints.map((tp) => ({
        ...tp,
        metrics: Object.fromEntries(
            Object.entries(tp.metrics ?? {}).map(([key, value]) => [
                key,
                normalizeMetricPrediction(value),
            ])
        ) as CurveTimepoint['metrics'],
    }));
    const milestones = curveData?.B_timeSinceBaselineVisit?.milestones || [];
    const baselineScales = (curveData?.C_participantBaselineData?.scales ?? []).map((scale) => {
        const rawValue = (scale as { value?: unknown }).value;
        const normalizedValue = rawValue && typeof rawValue === 'object' && 'score' in rawValue
            ? (rawValue as { score?: unknown }).score
            : rawValue;
        const numericValue = typeof normalizedValue === 'number'
            ? normalizedValue
            : normalizedValue == null
                ? null
                : Number(normalizedValue);
        return {
            ...scale,
            value: typeof numericValue === 'number' && Number.isNaN(numericValue) ? null : numericValue,
        };
    });
    const baselineVitals = curveData?.C_participantBaselineData?.vitals || {};

    // Derive participant info from profile
    const displayName = profile?.full_name || profile?.nickname || profile?.first_name || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <section
            ref={containerRef}
            className="relative py-12 md:py-24 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0B3D2E] via-[#051F18] to-black"
        >
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] gap-4 md:gap-12 items-start">
                    {/* Left Column - Interactive Navigation (Desktop: full, Mobile: compact header only) */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="space-y-4 md:space-y-6"
                    >
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium"
                            style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
                        >
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#D4AF37]" />
                            {language === 'en' ? 'DIGITAL TWIN' : '数字孪生'}
                        </div>

                        {/* Desktop Only: View Buttons */}
                        <div className="hidden md:flex md:flex-col md:space-y-2">
                            {viewOptions.map((option, i) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                                    onClick={(e) => {
                                        if (!hasData) {
                                            setHintPosition({ x: e.clientX + 15, y: e.clientY });
                                            setTimeout(() => setHintPosition(null), 2000);
                                            return;
                                        }
                                        setActiveView(option.id);
                                    }}
                                    className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-all duration-300 cursor-pointer ${activeView === option.id
                                        ? 'bg-[#D4AF37]/20 border-l-2 border-[#D4AF37] text-[#D4AF37]'
                                        : 'border-l-2 border-transparent hover:bg-white/10'
                                        } ${!hasData ? 'opacity-70' : ''}`}
                                >
                                    <option.icon className={`w-4 h-4 ${activeView === option.id ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                                    <span className={activeView === option.id ? 'text-[#D4AF37]' : 'text-white'}>
                                        {option.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* No Data Hint - fixed position near click */}
                        <AnimatePresence>
                            {hintPosition && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="fixed z-[100] px-3 py-2 bg-[#0B3D2E] border border-[#D4AF37]/50 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none"
                                    style={{
                                        left: hintPosition.x,
                                        top: hintPosition.y,
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    {language === 'en'
                                        ? 'Ready for analysis'
                                        : '随时可以生成分析'}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Desktop Only: Description */}
                        <div className="hidden md:block pt-8">
                            <h2 className="text-white font-bold leading-[1.1] mb-4" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
                                {language === 'en' ? 'Personalized ML models trained on your data' : '基于你数据训练的个性化模型'}
                            </h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                {language === 'en'
                                    ? 'Your digital twin continuously learns from your inputs to provide increasingly accurate predictions.'
                                    : '数字孪生将持续学习你的输入，给出更精准的预测。'}
                            </p>
                        </div>

                        {/* Desktop Only: Refresh Button */}
                        {hasData && (
                            <button
                                onClick={triggerAnalysis}
                                disabled={isAnalyzing}
                                className="hidden md:flex items-center gap-2 text-sm text-white/60 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                {isAnalyzing
                                    ? (language === 'en' ? 'Analyzing...' : '分析中...')
                                    : (language === 'en' ? 'Refresh analysis' : '刷新分析')}
                            </button>
                        )}
                    </motion.div>

                    {/* Right Column - Dynamic Content Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="overflow-hidden backdrop-blur-xl w-full max-w-full"
                        style={{
                            backgroundColor: 'rgba(5, 31, 24, 0.7)',
                            border: '1px solid rgba(212, 175, 55, 0.1)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            borderRadius: '16px',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-7 h-7 md:w-8 md:h-8 bg-[#D4AF37] flex items-center justify-center">
                                    <span className="text-[#0B3D2E] font-bold text-xs md:text-sm">{initials.charAt(0)}</span>
                                </div>
                                <span className="text-white text-xs md:text-sm">
                                    {language === 'en'
                                        ? <><span className="hidden sm:inline">Participant&apos;s Digital Twin in </span><span className="text-[#D4AF37]">Anxiety Recovery</span></>
                                        : <><span className="hidden sm:inline">参与者数字孪生：</span><span className="text-[#D4AF37]">焦虑恢复</span></>}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Only: View Toggle Buttons - Inside Panel */}
                        <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-3 scrollbar-none" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                            {viewOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={(e) => {
                                        if (!hasData) {
                                            setHintPosition({ x: e.clientX + 15, y: e.clientY });
                                            setTimeout(() => setHintPosition(null), 2000);
                                            return;
                                        }
                                        setActiveView(option.id);
                                    }}
                                    className={`flex-shrink-0 px-3 py-2 text-xs flex items-center gap-1.5 rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap ${activeView === option.id
                                        ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]'
                                        : 'bg-white/5 border border-transparent text-white/70 hover:bg-white/10'
                                        } ${!hasData ? 'opacity-70' : ''}`}
                                >
                                    <option.icon className={`w-3.5 h-3.5 ${activeView === option.id ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        {loading ? (
                            <LoadingState language={language} />
                        ) : notLoggedIn ? (
                            <NotLoggedInState language={language} />
                        ) : error ? (
                            <ErrorState message={error} onRetry={() => generateCurve()} language={language} />
                        ) : !hasData ? (
                            <NoAnalysisState
                                onTriggerAnalysis={triggerAnalysis}
                                isAnalyzing={isAnalyzing}
                                language={language}
                            />
                        ) : (
                            <AnimatePresence mode="wait">
                                {/* Data Quality Banner - shown for all views when data exists */}
                                {curveData && <DataQualityBanner curveData={curveData} language={language} />}

                                {activeView === 'prediction' && (
                                    <motion.div
                                        key="prediction"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Horizontal Swipeable Carousel */}
                                        <div className="relative">
                                            {/* Tab Buttons */}


                                            {/* Swipeable Container */}
                                            <div
                                                className="overflow-hidden cursor-grab active:cursor-grabbing outline-none"
                                                onTouchStart={(e) => {
                                                    const touch = e.touches[0];
                                                    swipeStartXRef.current = touch.clientX;
                                                }}
                                                onTouchEnd={(e) => {
                                                    const touch = e.changedTouches[0];
                                                    const startX = swipeStartXRef.current;
                                                    if (typeof startX === 'number') {
                                                        const diff = touch.clientX - startX;
                                                        if (Math.abs(diff) > 50) {
                                                            if (diff > 0 && activeChartTab === 'table') setActiveChartTab('chart');
                                                            if (diff < 0 && activeChartTab === 'chart') setActiveChartTab('table');
                                                        }
                                                    }
                                                    swipeStartXRef.current = null;
                                                }}
                                                onMouseDown={(e) => {
                                                    swipeStartXRef.current = e.clientX;
                                                }}
                                                onMouseUp={(e) => {
                                                    const startX = swipeStartXRef.current;
                                                    if (typeof startX === 'number') {
                                                        const diff = e.clientX - startX;
                                                        if (Math.abs(diff) > 50) {
                                                            if (diff > 0 && activeChartTab === 'table') setActiveChartTab('chart');
                                                            if (diff < 0 && activeChartTab === 'chart') setActiveChartTab('table');
                                                        }
                                                    }
                                                    swipeStartXRef.current = null;
                                                }}
                                                onMouseLeave={() => {
                                                    swipeStartXRef.current = null;
                                                }}
                                            >
                                                <div
                                                    className="flex transition-transform duration-300 ease-out"
                                                    style={{ transform: activeChartTab === 'chart' ? 'translateX(0)' : 'translateX(-100%)' }}
                                                >
                                                    {/* Slide 1: Chart */}
                                                    <div className="w-full flex-shrink-0">
                                                        <RechartsCurveChart
                                                            timepoints={curveData.A_predictedLongitudinalOutcomes.timepoints}
                                                            selectedMetrics={selectedMetrics}
                                                            onMetricToggle={handleMetricToggle}
                                                            language={language}
                                                            currentWeek={curveData.meta?.currentWeek}
                                                        />
                                                    </div>

                                                    {/* Slide 2: Data Table */}
                                                    <div className="w-full flex-shrink-0">
                                                        <CurvePredictionView
                                                            timepoints={curveData.A_predictedLongitudinalOutcomes.timepoints.filter(tp => tp.week <= 12)}
                                                            initials={initials}
                                                            displayName={displayName}
                                                            language={language}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Swipe Indicator Dots */}
                                            <div className="flex justify-center gap-1.5 mt-3">
                                                <button
                                                    onClick={() => setActiveChartTab('chart')}
                                                    className={`h-1.5 rounded-full transition-all ${activeChartTab === 'chart' ? 'bg-[#D4AF37] w-4' : 'bg-white/30 w-1.5'
                                                        }`}
                                                />
                                                <button
                                                    onClick={() => setActiveChartTab('table')}
                                                    className={`h-1.5 rounded-full transition-all ${activeChartTab === 'table' ? 'bg-[#D4AF37] w-4' : 'bg-white/30 w-1.5'
                                                        }`}
                                                />
                                            </div>

                                            {/* Swipe Hint (shown briefly) */}
                                            <div className="text-center text-white/30 text-xs mt-2">
                                                {language === 'en' ? '← Swipe to switch →' : '← 左右滑动切换 →'}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeView === 'progress' && (
                                    <motion.div
                                        key="progress"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-6"
                                    >
                                        {/* Timeline Progress */}
                                        <ProgressTimeline
                                            milestones={milestones}
                                            currentWeek={curveData?.meta?.currentWeek ?? 0}
                                            language={language}
                                        />

                                        {/* Baseline Assessment */}
                                        <CurveBaselineView
                                            scales={baselineScales}
                                            vitals={baselineVitals}
                                            language={language}
                                        />
                                    </motion.div>
                                )}

                                {activeView === 'advice' && (
                                    <motion.div
                                        key="advice"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-6"
                                    >


                                        {/* Health Recommendations */}
                                        <CurveHealthRecommendationView
                                            scales={baselineScales}
                                            timepoints={timepoints}
                                            language={language}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md mx-4 p-6 rounded-lg"
                            style={{ backgroundColor: '#0B3D2E', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-semibold text-lg">
                                    {language === 'en' ? 'Digital Twin Settings' : '数字孪生设置'}
                                </h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Settings Options */}
                            <div className="space-y-6">
                                {/* Analysis Frequency */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Analysis Frequency' : '分析频率'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'auto', label: language === 'en' ? 'Auto' : '自动' },
                                            { value: 'daily', label: language === 'en' ? 'Daily' : '每日' },
                                            { value: 'weekly', label: language === 'en' ? 'Weekly' : '每周' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setAnalysisFrequency(option.value as typeof analysisFrequency)}
                                                className={`py-2 px-3 text-sm rounded transition-colors ${analysisFrequency === option.value
                                                    ? 'bg-[#D4AF37] text-[#0B3D2E] font-medium'
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">
                                        {language === 'en'
                                            ? 'Auto: Analyzes after each daily calibration'
                                            : '自动：每次完成每日校准后分析'}
                                    </p>
                                </div>

                                {/* Medical History Consent */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Privacy Settings' : '隐私设置'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setMedicalConsent(!medicalConsent)}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="text-white text-sm">
                                                {language === 'en' ? 'Share Medical History' : '分享医疗历史'}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                {language === 'en'
                                                    ? 'Include detailed health data in analysis'
                                                    : '在分析中包含详细健康数据'}
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors ${medicalConsent ? 'bg-[#D4AF37]' : 'bg-white/20'}`}>
                                            <motion.div
                                                animate={{ x: medicalConsent ? 16 : 2 }}
                                                className="w-5 h-5 mt-0.5 bg-white rounded-full shadow"
                                            />
                                        </div>
                                    </button>
                                </div>

                                {/* Notifications */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bell className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-white text-sm font-medium">
                                            {language === 'en' ? 'Notifications' : '通知'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(!notifications)}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="text-white text-sm">
                                                {language === 'en' ? 'Analysis Updates' : '分析更新'}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                {language === 'en'
                                                    ? 'Get notified when new insights are ready'
                                                    : '新洞察准备好时通知我'}
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors ${notifications ? 'bg-[#D4AF37]' : 'bg-white/20'}`}>
                                            <motion.div
                                                animate={{ x: notifications ? 16 : 2 }}
                                                className="w-5 h-5 mt-0.5 bg-white rounded-full shadow"
                                            />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full mt-6 py-3 bg-[#D4AF37] text-[#0B3D2E] font-medium rounded hover:bg-[#B8960C] transition-colors"
                            >
                                {language === 'en' ? 'Save Settings' : '保存设置'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}


// ============================================
// NEW: Curve-based View Components (using useDigitalTwinCurve)
// ============================================

// Curve Prediction View
function CurvePredictionView({
    timepoints,
    initials,
    displayName,
    language,
}: {
    timepoints: CurveTimepoint[];
    initials: string;
    displayName: string;
    language: string;
}) {
    // State for mobile tap-to-toggle popover
    const [activePopover, setActivePopover] = useState<string | null>(null);

    // Removed stressResilience
    const metricKeys = ['anxietyScore', 'sleepQuality', 'moodStability', 'energyLevel', 'hrvScore'] as const;
    const metricLabels = language === 'en'
        ? { anxietyScore: 'Anxiety', sleepQuality: 'Sleep', moodStability: 'Mood', energyLevel: 'Energy', hrvScore: 'HRV' }
        : { anxietyScore: '焦虑', sleepQuality: '睡眠', moodStability: '情绪', energyLevel: '能量', hrvScore: 'HRV' };

    return (
        <motion.div
            key="prediction"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Participant Info */}
            <div className="flex items-start gap-6 px-6 py-4" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                <div className="relative w-16 h-16 overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)', color: '#0B3D2E' }}>
                        {initials}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/50">{language === 'en' ? 'Name: ' : '姓名：'}</span>
                    <span className="text-white">{displayName}</span>
                </div>
            </div>

            {/* Data Table with Interactive Metric Rows */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                            <th className="px-4 py-3 text-left text-white/60 font-medium">{language === 'en' ? 'Metric' : '指标'}</th>
                            {timepoints.map(tp => (
                                <th key={tp.week} className="px-4 py-3 text-center text-white/60 font-medium">
                                    {tp.week === 0 ? (language === 'en' ? 'Baseline' : '基线') : `${tp.week}${language === 'en' ? ' wk' : '周'}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {metricKeys.map((key) => {
                            // Get user's actual baseline value
                            const baselineValue = timepoints[0]?.metrics[key]?.value ?? 0;
                            const targetValue = timepoints[timepoints.length - 1]?.metrics[key]?.value ?? 0;

                            // Metric metadata with dynamic content
                            const metricInfo: Record<string, {
                                range: string;
                                getIdeal: (v: number) => { cn: string; en: string };
                                getTips: (v: number) => { cn: string; en: string };
                                getTime: (v: number) => { cn: string; en: string };
                            }> = {
                                anxietyScore: {
                                    range: '0-100',
                                    getIdeal: (v) => v < 20
                                        ? { cn: '✓ 已在正常范围 (< 20)', en: '✓ Already in normal range (< 20)' }
                                        : { cn: `目标: 降至 20 以下 (当前 ${v.toFixed(0)})`, en: `Goal: Below 20 (currently ${v.toFixed(0)})` },
                                    getTips: (v) => v >= 60
                                        ? { cn: '建议：每天10分钟深呼吸练习，减少咖啡因摄入', en: 'Tip: 10 min deep breathing daily, reduce caffeine' }
                                        : v >= 40
                                            ? { cn: '建议：规律作息，尝试正念冥想 App', en: 'Tip: Regular schedule, try mindfulness apps' }
                                            : { cn: '保持现有习惯，继续观察', en: 'Maintain current habits, keep monitoring' },
                                    getTime: (v) => v >= 60
                                        ? { cn: '预计 4-6 周显著改善', en: 'Expect noticeable improvement in 4-6 weeks' }
                                        : v >= 40
                                            ? { cn: '预计 2-4 周可见改善', en: 'Expect improvement in 2-4 weeks' }
                                            : { cn: '预计 1-2 周稳固效果', en: 'Expect stability in 1-2 weeks' },
                                },
                                sleepQuality: {
                                    range: '0-100',
                                    getIdeal: (v) => v > 70
                                        ? { cn: '✓ 睡眠质量良好 (> 70)', en: '✓ Good sleep quality (> 70)' }
                                        : { cn: `目标: 提升至 70+ (当前 ${v.toFixed(0)})`, en: `Goal: Above 70 (currently ${v.toFixed(0)})` },
                                    getTips: (v) => v < 40
                                        ? { cn: '建议：睡前1小时关闭电子设备，固定睡眠时间', en: 'Tip: No screens 1h before bed, fixed bedtime' }
                                        : v < 60
                                            ? { cn: '建议：卧室温度保持20°C，睡前避免剧烈运动', en: 'Tip: Keep room at 20°C, avoid exercise before bed' }
                                            : { cn: '保持良好习惯', en: 'Maintain good habits' },
                                    getTime: (v) => v < 40
                                        ? { cn: '预计 2-3 周可见改善', en: 'Expect improvement in 2-3 weeks' }
                                        : { cn: '预计 1-2 周可见改善', en: 'Expect improvement in 1-2 weeks' },
                                },
                                moodStability: {
                                    range: '0-100',
                                    getIdeal: (v) => v > 60
                                        ? { cn: '✓ 情绪稳定 (> 60)', en: '✓ Mood is stable (> 60)' }
                                        : { cn: `目标: 提升至 60+ (当前 ${v.toFixed(0)})`, en: `Goal: Above 60 (currently ${v.toFixed(0)})` },
                                    getTips: (v) => v < 40
                                        ? { cn: '建议：每日情绪日记，增加户外活动', en: 'Tip: Daily mood journal, more outdoor time' }
                                        : { cn: '建议：保持社交联系，规律运动', en: 'Tip: Stay socially connected, regular exercise' },
                                    getTime: () => ({ cn: '预计 2-3 周可见改善', en: 'Expect improvement in 2-3 weeks' }),
                                },
                                energyLevel: {
                                    range: '0-100',
                                    getIdeal: (v) => v > 60
                                        ? { cn: '✓ 能量充沛 (> 60)', en: '✓ Good energy (> 60)' }
                                        : { cn: `目标: 提升至 60+ (当前 ${v.toFixed(0)})`, en: `Goal: Above 60 (currently ${v.toFixed(0)})` },
                                    getTips: (v) => v < 40
                                        ? { cn: '建议：增加蛋白质摄入，确保7-8小时睡眠', en: 'Tip: More protein, ensure 7-8h sleep' }
                                        : { cn: '建议：适量有氧运动，避免午后咖啡因', en: 'Tip: Light cardio, avoid afternoon caffeine' },
                                    getTime: () => ({ cn: '预计 1-2 周可见改善', en: 'Expect improvement in 1-2 weeks' }),
                                },
                                hrvScore: {
                                    range: '0-100',
                                    getIdeal: (v) => v > 50
                                        ? { cn: '✓ HRV健康 (> 50)', en: '✓ Healthy HRV (> 50)' }
                                        : { cn: `目标: 提升至 50+ (当前 ${v.toFixed(0)})`, en: `Goal: Above 50 (currently ${v.toFixed(0)})` },
                                    getTips: () => ({ cn: '建议：减少压力源，规律运动，充足睡眠', en: 'Tip: Reduce stress, regular exercise, good sleep' }),
                                    getTime: () => ({ cn: '预计 3-4 周可见改善', en: 'Expect improvement in 3-4 weeks' }),
                                },
                            };

                            const info = metricInfo[key] || metricInfo.anxietyScore;
                            const ideal = info.getIdeal(baselineValue);
                            const tips = info.getTips(baselineValue);
                            const time = info.getTime(baselineValue);

                            return (
                                <tr key={key} className="border-b border-white/5" style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                    {/* Metric Name with Info Button */}
                                    <td className="px-4 py-3 text-white/80 relative">
                                        <div className="flex items-center gap-2">
                                            <span>{metricLabels[key]}</span>
                                            <button
                                                className="text-white/40 hover:text-[#D4AF37] active:text-[#D4AF37] transition-colors text-sm"
                                                onClick={() => setActivePopover(activePopover === key ? null : key)}
                                                title={language === 'en' ? 'Tap for details' : '点击查看详情'}
                                            >
                                                ⓘ
                                            </button>
                                        </div>

                                        {/* Click-controlled Popover (Portal to escape clipping) */}
                                        {activePopover === key && createPortal(
                                            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-transparent"
                                                onClick={() => setActivePopover(null)} // Close on background click
                                            >
                                                <div
                                                    className="
                                                        w-full max-w-xs p-5 rounded-xl
                                                        bg-[#0B1410] border border-[#D4AF37]/40
                                                        shadow-2xl
                                                        text-left
                                                        animate-in fade-in zoom-in-95 duration-200
                                                    "
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Close Button */}
                                                    <button
                                                        className="absolute top-4 right-4 text-white/40 hover:text-white"
                                                        onClick={() => setActivePopover(null)}
                                                    >
                                                        ✕
                                                    </button>

                                                    {/* Header */}
                                                    <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-4">
                                                        <span className="text-[#D4AF37] text-lg font-semibold">{metricLabels[key]}</span>
                                                        <span className="text-white/40 text-sm bg-white/5 px-2 py-0.5 rounded-full">{info.range}</span>
                                                    </div>

                                                    {/* Baseline Info */}
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                                            <div className="text-white/50 text-xs mb-1">{language === 'en' ? 'Baseline' : '当前基线'}</div>
                                                            <div className="text-white font-bold text-xl">{baselineValue.toFixed(0)}</div>
                                                        </div>
                                                        <div className="bg-[#D4AF37]/10 rounded-lg p-3 text-center border border-[#D4AF37]/20">
                                                            <div className="text-[#D4AF37]/80 text-xs mb-1">{language === 'en' ? '12w Goal' : '12周预测'}</div>
                                                            <div className="text-[#D4AF37] font-bold text-xl">{targetValue.toFixed(0)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Ideal Range */}
                                                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                                                        <div className="text-[#88C9B3] text-sm font-medium flex items-start gap-2">
                                                            <span>🎯</span>
                                                            <span>{language === 'en' ? ideal.en : ideal.cn}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tips */}
                                                    <div className="mb-4">
                                                        <div className="text-white/60 text-xs mb-2 uppercase tracking-wider font-semibold">
                                                            {language === 'en' ? 'Recommendation' : '改善建议'}
                                                        </div>
                                                        <div className="text-white/90 text-sm leading-relaxed bg-[#0B1410] border-l-2 border-[#89B4D6] pl-3 py-1">
                                                            {language === 'en' ? tips.en : tips.cn}
                                                        </div>
                                                    </div>

                                                    {/* Timeline */}
                                                    <div className="text-[#89B4D6] text-xs flex items-center gap-1.5 mt-2 pt-3 border-t border-white/5">
                                                        <span>⏱</span>
                                                        <span>{language === 'en' ? time.en : time.cn}</span>
                                                    </div>
                                                </div>
                                            </div>,
                                            document.body
                                        )}
                                    </td>

                                    {/* Data Cells - Plain Values */}
                                    {timepoints.map((tp, idx) => {
                                        const m = tp.metrics[key];
                                        return (
                                            <td key={tp.week} className={`px-4 py-3 text-center font-medium ${idx === 0 ? 'text-[#D4AF37]' : 'text-white/70'}`}>
                                                {m?.value?.toFixed(0) ?? '—'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

// Curve Baseline View
function CurveBaselineView({
    scales,
    vitals,
    language,
}: {
    scales: ScaleBaselineItem[];
    vitals: { restingHeartRate?: number; bloodPressure?: string; bmi?: number };
    language: string;
}) {
    const getSeverityColor = (name: string, value: number | null) => {
        if (value === null) return 'text-white/50';
        if (name === 'GAD-7' && value >= 10) return 'text-amber-300'; // Was red
        if (name === 'PHQ-9' && value >= 10) return 'text-amber-300'; // Was red
        if (name === 'ISI' && value >= 15) return 'text-amber-300';   // Was red
        if (name === 'PSS-10' && value >= 20) return 'text-[#D4AF37]'; // Was amber
        return 'text-emerald-300'; // Was green
    };

    const getGentleInterpretation = (name: string, value: number | null, lang: string) => {
        if (value === null) return '—';

        // Gentle, non-clinical language map
        const level = ((v) => {
            if (name === 'GAD-7') return v >= 15 ? 'high' : v >= 10 ? 'elevated' : v >= 5 ? 'mild' : 'normal';
            if (name === 'PHQ-9') return v >= 20 ? 'high' : v >= 10 ? 'elevated' : v >= 5 ? 'mild' : 'normal';
            if (name === 'ISI') return v >= 22 ? 'high' : v >= 15 ? 'elevated' : v >= 8 ? 'mild' : 'normal';
            if (name === 'PSS-10') return v >= 27 ? 'high' : v >= 14 ? 'elevated' : 'normal';
            return 'normal';
        })(value);

        const textMap: Record<string, { en: string; cn: string }> = {
            'high': { en: 'Needs Attention', cn: '需重点关注' },
            'elevated': { en: 'Moderate Level', cn: '中等水平' },
            'mild': { en: 'Mild Level', cn: '轻微水平' },
            'normal': { en: 'Within Range', cn: '在范围内' },
        };

        return lang === 'en' ? textMap[level].en : textMap[level].cn;
    };

    return (
        <motion.div
            key="baseline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
        >
            <h3 className="text-white font-semibold mb-4">
                {language === 'en' ? 'Baseline Assessment Scales' : '基线评估量表'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
                {scales.map((s, i) => (
                    <motion.div
                        key={s.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="p-4 bg-white/5 rounded"
                    >
                        <div className="text-white/50 text-xs mb-1">{s.name}</div>
                        <div className={`text-2xl font-bold ${getSeverityColor(s.name, s.value)}`}>
                            {s.value ?? '—'}
                        </div>
                        <div className="text-white/40 text-xs mt-1">{getGentleInterpretation(s.name, s.value, language)}</div>
                    </motion.div>
                ))}
            </div>

            {(vitals.restingHeartRate || vitals.bloodPressure || vitals.bmi) && (
                <>
                    <h4 className="text-white/70 text-sm mb-3">{language === 'en' ? 'Vitals' : '生理指标'}</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {vitals.restingHeartRate && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.restingHeartRate}</div>
                                <div className="text-white/40 text-xs">{language === 'en' ? 'Heart Rate' : '心率'}</div>
                            </div>
                        )}
                        {vitals.bloodPressure && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.bloodPressure}</div>
                                <div className="text-white/40 text-xs">{language === 'en' ? 'Blood Pressure' : '血压'}</div>
                            </div>
                        )}
                        {vitals.bmi && (
                            <div className="p-3 bg-white/5 rounded text-center">
                                <div className="text-white text-lg font-semibold">{vitals.bmi}</div>
                                <div className="text-white/40 text-xs">BMI</div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}

// Curve Health Recommendation View
function CurveHealthRecommendationView({
    scales,
    timepoints,
    language,
}: {
    scales: ScaleBaselineItem[];
    timepoints: CurveTimepoint[];
    language: string;
}) {
    // Use Ask Max hook for recommendation explanations
    const { isLoading, isExpanded, getExplanation, askMax } = useAskMaxExplain();

    // Severity grading helper
    // Severity grading helper - Gentle Language
    const getSeverityLevel = (scaleName: string, value: number): 'high' | 'elevated' | 'mild' | 'normal' => {
        if (scaleName === 'GAD-7') return value >= 15 ? 'high' : value >= 10 ? 'elevated' : value >= 5 ? 'mild' : 'normal';
        if (scaleName === 'PHQ-9') return value >= 20 ? 'high' : value >= 10 ? 'elevated' : value >= 5 ? 'mild' : 'normal';
        if (scaleName === 'ISI') return value >= 22 ? 'high' : value >= 15 ? 'elevated' : value >= 8 ? 'mild' : 'normal';
        if (scaleName === 'PSS-10') return value >= 27 ? 'high' : value >= 14 ? 'elevated' : 'normal';
        return 'normal';
    };

    // Get severity color
    // Get severity color & label
    const severityConfig = {
        high: {
            bg: 'bg-[#D4AF37]/10',
            border: 'border-[#D4AF37]/30',
            text: 'text-[#D4AF37]',
            label: language === 'en' ? 'Needs Attention' : '需重点关注'
        },
        elevated: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-300',
            label: language === 'en' ? 'Moderate Level' : '中等水平'
        },
        mild: {
            bg: 'bg-white/5',
            border: 'border-white/10',
            text: 'text-white/60',
            label: language === 'en' ? 'Mild Level' : '轻微水平'
        },
        normal: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            label: language === 'en' ? 'Within Range' : '在范围内'
        },
    };

    // Analyze trend from timepoints (week 0 vs week 15)
    const week0 = timepoints.find(t => t.week === 0);
    const week15 = timepoints.find(t => t.week === 15);
    const anxietyTrend = week0 && week15
        ? (week0.metrics?.anxietyScore?.value ?? 0) - (week15.metrics?.anxietyScore?.value ?? 0)
        : 0;
    const trendDirection = anxietyTrend > 10 ? 'improving' : anxietyTrend < -5 ? 'worsening' : 'stable';

    // Derive focus areas with severity

    const focusAreas = scales.filter(s => s.value && getSeverityLevel(s.name, s.value) !== 'normal').map(s => ({
        ...s,
        severityLevel: getSeverityLevel(s.name, s.value ?? 0),
    }));

    // Helper to map icon string to component
    const iconMap: Record<string, typeof Lightbulb> = {
        breathing: Activity,
        activity: Target,
        sleep: Moon,
        mindfulness: Brain,
        exercise: TrendingUp,
        social: Heart,
        nutrition: Smile,
        tracking: BarChart3,
        alert: AlertCircle,
    };

    // Generate personalized recommendations from database
    const recs: { icon: typeof Lightbulb; title: string; description: string; science: string; priority: 'high' | 'medium' | 'low' }[] = [];

    // GAD-7 based recommendations
    const gad7 = scales.find(s => s.name === 'GAD-7');
    if (gad7?.value) {
        const level = getSeverityLevel('GAD-7', gad7.value);
        if (level !== 'normal') {
            // Map new gentle levels back to clinical tiers for DB lookup if needed, or adjust DB lookup logic
            // For lookup: high -> severe, elevated -> moderate, mild -> mild
            const lookupSeverity = level === 'high' ? 'severe' : level === 'elevated' ? 'moderate' : 'mild';
            const dbRecs = getRecommendations('anxiety', lookupSeverity, 2);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Lightbulb,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // PHQ-9 based recommendations  
    const phq9 = scales.find(s => s.name === 'PHQ-9');
    if (phq9?.value) {
        const level = getSeverityLevel('PHQ-9', phq9.value);
        if (level !== 'normal') {
            const lookupSeverity = level === 'high' ? 'severe' : level === 'elevated' ? 'moderate' : 'mild';
            const dbRecs = getRecommendations('depression', lookupSeverity, 2);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Target,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // ISI (sleep) based recommendations
    const isi = scales.find(s => s.name === 'ISI');
    if (isi?.value) {
        const level = getSeverityLevel('ISI', isi.value);
        if (level !== 'normal') {
            const lookupSeverity = level === 'high' ? 'severe' : level === 'elevated' ? 'moderate' : 'mild';
            const dbRecs = getRecommendations('sleep', lookupSeverity, 1);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Moon,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // PSS-10 (stress) based recommendations
    const pss = scales.find(s => s.name === 'PSS-10');
    if (pss?.value) {
        const level = getSeverityLevel('PSS-10', pss.value);
        if (level !== 'normal') {
            const lookupSeverity = level === 'high' ? 'severe' : 'moderate';
            const dbRecs = getRecommendations('stress', lookupSeverity, 1);
            dbRecs.forEach(r => recs.push({
                icon: iconMap[r.icon] || Activity,
                title: language === 'en' ? r.title.en : r.title.cn,
                description: language === 'en' ? r.description.en : r.description.cn,
                science: language === 'en' ? r.science.en : r.science.cn,
                priority: r.priority,
            }));
        }
    }

    // Trend-based recommendations
    if (trendDirection === 'improving') {
        recs.push({
            icon: TrendingUp,
            title: language === 'en' ? 'Maintain Your Momentum' : '保持势头',
            description: language === 'en'
                ? 'Your curve shows improvement! Continue current practices and stay consistent.'
                : '你的曲线显示改善！继续当前方法，保持一致性。',
            science: language === 'en'
                ? 'Consistency is key: 80% who maintain habits see sustained improvement.'
                : '一致性是关键：80%坚持习惯者持续改善。',
            priority: 'low',
        });
    } else if (trendDirection === 'worsening') {
        recs.push({
            icon: AlertTriangle,
            title: language === 'en' ? 'Adjust Your Approach' : '调整方法',
            description: language === 'en'
                ? 'Curve trending up. Consider increasing intervention intensity or trying new techniques.'
                : '曲线上升趋势。考虑增加干预强度或尝试新技术。',
            science: language === 'en'
                ? 'Adaptive treatment: Adjusting approach improves outcomes by 25%.'
                : '适应性治疗：调整方案使效果提高25%。',
            priority: 'high',
        });
    }

    // Always add daily calibration from general
    const generalRec = getRecommendations('general', 'mild', 1)[0];
    if (generalRec) {
        recs.push({
            icon: iconMap[generalRec.icon] || Heart,
            title: language === 'en' ? generalRec.title.en : generalRec.title.cn,
            description: language === 'en' ? generalRec.description.en : generalRec.description.cn,
            science: language === 'en' ? generalRec.science.en : generalRec.science.cn,
            priority: generalRec.priority,
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return (
        <motion.div
            key="recommendation-curve"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-3 md:p-6"
        >
            {/* Header - Compact */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-sm md:text-base">
                        {language === 'en' ? 'Health Advice' : '健康建议'}
                    </h3>
                    <p className="text-white/50 text-[10px] md:text-sm">
                        {language === 'en' ? 'Based on your curve data' : '基于你的曲线数据'}
                    </p>
                </div>
            </div>

            {/* Focus Areas - 3 per row */}
            {focusAreas.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-white text-xs font-medium">
                            {language === 'en' ? 'Focus Areas' : '关注重点'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {focusAreas.slice(0, 3).map(s => {
                            const config = severityConfig[s.severityLevel];
                            return (
                                <div key={s.name} className={`p-1.5 ${config.bg} border ${config.border} rounded text-center`}>
                                    <div className="text-white text-[10px] font-medium truncate">{s.name}</div>
                                    <div className="text-[#D4AF37] text-[11px] font-bold">{s.value}</div>
                                    <div className={`text-[8px] mt-0.5 ${config.text}`}>{config.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Expected Progress - Compact */}
            {
                week0 && week15 && (
                    <div className="mb-4 p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                            <span className="text-white text-[10px] font-medium">
                                {language === 'en' ? '15-Week Progress' : '15周预期'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                                <span className="text-white/50">{language === 'en' ? 'Anxiety' : '焦虑'}: </span>
                                <span className="text-[#D4AF37]">{week0.metrics?.anxietyScore?.value?.toFixed(0) ?? '—'}</span>
                                <span className="text-white/30"> → </span>
                                <span className="text-green-400">{week15.metrics?.anxietyScore?.value?.toFixed(0) ?? '—'}</span>
                            </div>
                            <div>
                                <span className="text-white/50">{language === 'en' ? 'Mood' : '情绪'}: </span>
                                <span className="text-[#D4AF37]">{week0.metrics?.moodStability?.value?.toFixed(0) ?? '—'}</span>
                                <span className="text-white/30"> → </span>
                                <span className="text-green-400">{week15.metrics?.moodStability?.value?.toFixed(0) ?? '—'}</span>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Recommendations - Grid 2 columns on mobile */}
            <div className="grid grid-cols-2 gap-2">
                {recs.slice(0, 6).map((rec, i) => {
                    const recId = `rec-${i}-${rec.title.slice(0, 10)}`;
                    const expanded = isExpanded(recId);
                    const loading = isLoading(recId);
                    const explanation = getExplanation(recId);

                    return (
                        <motion.div
                            key={rec.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="p-2.5 bg-white/5 border-l-2 border-[#D4AF37] rounded-r flex flex-col"
                        >
                            <div className="flex items-start gap-1.5">
                                <rec.icon className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-[11px] leading-tight line-clamp-2">{rec.title}</div>
                                    <div className="text-white/60 text-[10px] mt-1 line-clamp-2">{rec.description}</div>
                                </div>
                            </div>

                            {/* Ask Max Button - Compact */}
                            <button
                                onClick={() => askMax({ recId, title: rec.title, description: rec.description, science: rec.science, language: language === 'en' ? 'en' : 'zh' })}
                                className="mt-2 flex items-center justify-center gap-1 px-2 py-1 text-[9px] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] transition-colors"
                            >
                                {loading ? (
                                    <span className="animate-pulse">{language === 'en' ? 'Thinking...' : '思考中...'}</span>
                                ) : (
                                    <>
                                        <MaxAvatar state="idle" size={12} />
                                        <span>{language === 'en' ? 'Ask Max' : '问Max'}</span>
                                    </>
                                )}
                            </button>

                            {/* Max's Explanation */}
                            <AnimatePresence>
                                {expanded && explanation && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-2 p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded"
                                    >
                                        <div className="text-white/80 text-[10px] leading-relaxed">
                                            {explanation}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Warning - Compact */}
            <div className="mt-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-amber-300 font-medium text-[10px]">
                            {language === 'en' ? 'Note' : '提示'}
                        </div>
                        <div className="text-amber-200/70 text-[9px] mt-0.5">
                            {language === 'en'
                                ? 'AI-generated. Consult a professional for clinical concerns.'
                                : 'AI生成，如有临床问题请咨询专业人员。'}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
}

// ============================================
// NEW: Recharts Curve Chart (from DesktopDigitalTwin)
// ============================================



interface RechartsCurveChartProps {
    timepoints: CurveTimepoint[];
    selectedMetrics: (keyof typeof METRIC_LABELS)[];
    onMetricToggle: (metric: keyof typeof METRIC_LABELS) => void;
    language: string;
    currentWeek?: number;
}

interface TooltipEntry {
    dataKey?: string;
    value?: number;
    stroke?: string;
}

function RechartsCurveChart({ timepoints, selectedMetrics, onMetricToggle, language, currentWeek = 1 }: RechartsCurveChartProps) { // Default to 1 to show some history if currentWeek missing
    // Time Unit State
    const [timeUnit, setTimeUnit] = useState<'day' | 'week' | 'month'>('week');

    const chartData = useMemo(() => {
        if (timeUnit === 'month') {
            // Resample to exact months: Week 0, 4, 8, 12
            const targetWeeks = [0, 4, 8, 12];

            // Helper to get interpolated value for a specific week
            const getValueAtWeek = (w: number, metric: keyof typeof METRIC_LABELS) => {
                // Find surrounding timepoints
                // timepoints are sorted by week usually.
                if (timepoints.length === 0) return 0;

                // Exact match
                const exact = timepoints.find(tp => tp.week === w);
                if (exact) return exact.metrics[metric]?.value || 0;

                // Interpolate
                let prev = timepoints[0];
                let next = timepoints[timepoints.length - 1];

                for (let i = 0; i < timepoints.length - 1; i++) {
                    if (timepoints[i].week <= w && timepoints[i + 1].week >= w) {
                        prev = timepoints[i];
                        next = timepoints[i + 1];
                        break;
                    }
                }

                if (prev.week === next.week) return prev.metrics[metric]?.value || 0;

                const t = (w - prev.week) / (next.week - prev.week);
                const v1 = prev.metrics[metric]?.value || 0;
                const v2 = next.metrics[metric]?.value || 0;
                return v1 + (v2 - v1) * t;
            };

            return targetWeeks.map(w => {
                let label = '';
                if (w === 0) label = language === 'en' ? 'Start' : '起始';
                else label = `${w / 4}M`;

                return {
                    name: label,
                    week: w,
                    anxietyScore: getValueAtWeek(w, 'anxietyScore'),
                    sleepQuality: getValueAtWeek(w, 'sleepQuality'),
                    moodStability: getValueAtWeek(w, 'moodStability'),
                    energyLevel: getValueAtWeek(w, 'energyLevel'),
                    hrvScore: getValueAtWeek(w, 'hrvScore'),
                }
            });
        }

        if (timeUnit === 'day') {
            // Interpolate 7 days for the CURRENT week
            // Start: currentWeek, End: currentWeek + 1
            // Use curve interpolation logic roughly
            // Actually we need the segment where currentWeek falls.
            // timepoints are 0, 3, 6...
            // currentWeek e.g. 1. Find segment 0-3.
            // simple linear interpolation between two timepoints for 7 steps.

            // Find start and end timepoints for interpolation
            let startTp = timepoints[0];
            let endTp = timepoints[1];

            for (let i = 0; i < timepoints.length - 1; i++) {
                if (currentWeek >= timepoints[i].week && currentWeek < timepoints[i + 1].week) {
                    startTp = timepoints[i];
                    endTp = timepoints[i + 1];
                    break;
                }
            }
            // If currentWeek >= last point, just hold last point flat? Or extrapolate?
            if (currentWeek >= timepoints[timepoints.length - 1].week) {
                startTp = timepoints[timepoints.length - 1];
                endTp = timepoints[timepoints.length - 1];
            }

            const days = [];
            const weekSpan = endTp.week - startTp.week || 1; // Avoid div by 0

            for (let d = 0; d < 7; d++) {
                // Progress within the segment. 
                // We want to show 7 days STARTING from currentWeek?
                // Or just the 7 days of the "Current Week" view?
                // Interpreting "Week" usually means "This weekMon-Sun".
                // Let's show 7 interpolated points starting from `currentWeek` value.
                // Interpolation factor `t` (0 to 1) between startTp and endTp

                // Let's say we just show "Day 1" to "Day 7" of the current phase.
                // Progress from currentWeek to currentWeek + 1week
                // Relative position in the 3-week segment:
                const relativeDayStart = (currentWeek - startTp.week) / weekSpan; // 0..1
                const relativeDayEnd = (currentWeek + 1 - startTp.week) / weekSpan;

                // We want 7 steps from relativeDayStart to relativeDayEnd
                const t0 = relativeDayStart;
                const t1 = relativeDayEnd;
                const progress = t0 + (t1 - t0) * (d / 6); // 0 to 1 scaling of the 1-week chunk

                // Interpolate function
                const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

                days.push({
                    name: language === 'en' ? `D${d + 1}` : `D${d + 1}`,
                    week: currentWeek + (d / 7),
                    anxietyScore: lerp(startTp.metrics.anxietyScore?.value || 0, endTp.metrics.anxietyScore?.value || 0, progress),
                    sleepQuality: lerp(startTp.metrics.sleepQuality?.value || 0, endTp.metrics.sleepQuality?.value || 0, progress),
                    moodStability: lerp(startTp.metrics.moodStability?.value || 0, endTp.metrics.moodStability?.value || 0, progress),
                    energyLevel: lerp(startTp.metrics.energyLevel?.value || 0, endTp.metrics.energyLevel?.value || 0, progress),
                    hrvScore: lerp(startTp.metrics.hrvScore?.value || 0, endTp.metrics.hrvScore?.value || 0, progress),
                });
            }
            return days;
        }

        // Default: Week view (0-12w)
        return timepoints.filter(tp => tp.week <= 12).map(tp => ({
            name: `${tp.week}w`,
            week: tp.week,
            anxietyScore: tp.metrics.anxietyScore?.value || 0,
            sleepQuality: tp.metrics.sleepQuality?.value || 0,
            moodStability: tp.metrics.moodStability?.value || 0,
            energyLevel: tp.metrics.energyLevel?.value || 0,
            hrvScore: tp.metrics.hrvScore?.value || 0,
        }));
    }, [timepoints, timeUnit, currentWeek, language]);

    // Calculate start percentage for animation based on currentWeek
    // Modified for different views
    const totalWeeks = 12;
    // For Day view, we are zooming in, so logical startPct is always 0 (start of this specific view)
    // For Month/Week, we retain the "timeline" feel.
    const startPct = timeUnit === 'day'
        ? 0
        : Math.min(Math.max((currentWeek) / totalWeeks, 0), 1);

    // Simple mapping from full metric name to short key for COLORS lookup
    const getMetricColor = (metric: keyof typeof METRIC_LABELS) => {
        if (metric === 'anxietyScore') return COLORS.anxiety;
        if (metric === 'sleepQuality') return COLORS.sleep;
        if (metric === 'moodStability') return COLORS.mood;
        if (metric === 'energyLevel') return COLORS.energy;
        if (metric === 'hrvScore') return COLORS.hrv;
        return '#fff';
    };

    const getMetricLabel = (metric: keyof typeof METRIC_LABELS) => {
        return language === 'en' ? METRIC_LABELS[metric] : METRIC_LABELS_CN[metric];
    };

    const periodOptions = [
        { value: 'day', label: language === 'en' ? 'Day' : '天' },
        { value: 'week', label: language === 'en' ? 'Week' : '周' },
        { value: 'month', label: language === 'en' ? 'Month' : '月' },
    ] as const;

    return (
        <div className="w-full h-[400px] flex flex-col relative group overflow-hidden px-2 sm:px-4">
            {/* Background Breathing Animation - Lighter Opacity */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent animate-pulse" />

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between mb-4 relative z-10 gap-3">
                {/* Metric Toggles - Horizontally scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none sm:flex-wrap sm:justify-center">
                    {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((metric) => {
                        const isSelected = selectedMetrics.includes(metric);
                        const color = getMetricColor(metric);

                        return (
                            <button
                                key={metric}
                                onClick={() => onMetricToggle(metric)}
                                className={`
                                    flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                                    border whitespace-nowrap
                                    ${isSelected
                                        ? `bg-[${color}]/10 border-[${color}] text-white shadow-[0_0_10px_${color}40]`
                                        : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'
                                    }
                                `}
                                style={{
                                    borderColor: isSelected ? color : undefined,
                                    backgroundColor: isSelected ? `${color}1A` : undefined, // 10% opacity
                                    boxShadow: isSelected ? `0 0 10px ${color}40` : undefined,
                                }}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full ${isSelected ? '' : 'bg-white/20'}`}
                                    style={{ backgroundColor: isSelected ? color : undefined }}
                                />
                                {getMetricLabel(metric)}
                            </button>
                        );
                    })}
                </div>

                {/* Time Unit Selector */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    {periodOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setTimeUnit(opt.value as 'day' | 'week' | 'month')}
                            className={`
                                px-3 py-1 text-[10px] font-medium rounded-md transition-all
                                ${timeUnit === opt.value
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                    >
                        <defs>
                            {/* Glow Filter */}
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Gradients for each metric - Static/Mild, no flow animation in gradient itself */}
                            {Object.entries(COLORS).map(([key, color]) => (
                                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                                </linearGradient>
                            ))}

                            {/* Line Drawing Mask */}
                            <clipPath id="line-draw-clip" clipPathUnits="objectBoundingBox">
                                <rect x="0" y="0" width="1" height="1">
                                    <animate
                                        attributeName="width"
                                        values={`${startPct}; 1; 1`}
                                        keyTimes="0; 0.666; 1"
                                        dur="9s"
                                        repeatCount="indefinite"
                                        calcMode="spline"
                                        keySplines="0.4 0 0.2 1; 0 0 1 1"
                                    />
                                </rect>
                            </clipPath>
                        </defs>
                        {/* More subtle grid */}
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (timeUnit === 'week') {
                                    return value === '0w' ? (language === 'en' ? 'Base' : '基线') : value;
                                }
                                if (timeUnit === 'month') {
                                    return value === 'Start' || value === '起始' ? value : `${value}`;
                                }
                                return value; // For day view, just show D1, D2 etc.
                            }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            domain={[0, 100]}
                            width={30}
                        />
                        <Tooltip
                            position={{ x: 10, y: -20 }}
                            offset={10}
                            wrapperStyle={{ pointerEvents: 'none' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#0B1410]/95 border border-[#D4AF37]/20 rounded-lg p-2 shadow-lg backdrop-blur-md max-w-[140px] text-xs">
                                            <p className="text-[#D4AF37] text-xs font-semibold mb-2 border-b border-white/10 pb-1 flex justify-between">
                                                <span>{label}</span>
                                                {/* Highlight if this is roughly the current week */}
                                                {label && (label.toString().includes(`${currentWeek}w`) || label === 'Now') && (
                                                    <span className="text-white/60 bg-white/10 px-1.5 rounded text-[10px] ml-2">Currently</span>
                                                )}
                                            </p>
                                            {(() => {
                                                const entries = Array.isArray(payload) ? (payload as TooltipEntry[]) : [];
                                                const uniqueEntries = entries.filter(
                                                    (entry, index, self) =>
                                                        index === self.findIndex((item) => item.dataKey === entry.dataKey)
                                                );

                                                return uniqueEntries.map((entry) => {
                                                    const metricKey = entry.dataKey as keyof typeof METRIC_LABELS;
                                                    const value = entry.value as number;
                                                    const name = getMetricLabel(metricKey);

                                                    // Interpretation Logic
                                                    let status = '';
                                                    let statusColor = 'text-white/50';

                                                    // Generic interpretation based on 0-100 score
                                                    if (metricKey === 'anxietyScore') {
                                                        // Anxiety: Higher is Worse? In our curve chart, Y-axis is usually "Goodness" or standardized?
                                                        // Checking previous code: anxietyScore is "severity (higher=worse)".
                                                        // AND curve-engine says: "anxietyScore is severity".
                                                        // BUT data mapping: "anxietyScore: tp.metrics.anxietyScore?.value".
                                                        // So 100 = Severe Anxiety? Or did we invert it for the chart?
                                                        // Chart YAxis domain [0,100]. Usually we want "up is good"?
                                                        // Re-reading curve-engine: "predictExponentialValue" returns 0-100.
                                                        // "anxietyScore: ... 0-100 severity (higher=worse), decreases toward target."
                                                        // So chart lines go DOWN for anxiety?
                                                        // Verify: "targets.anxietyScore: ... clamp(baseline * 0.05, 0, 100)". Target is near 0.
                                                        // So yes, for Anxiety, Low is Good.
                                                        if (value < 20) { status = language === 'en' ? 'Calm' : '平稳'; statusColor = 'text-[#88C9B3]'; } // Greenish
                                                        else if (value < 40) { status = language === 'en' ? 'Light' : '轻微'; statusColor = 'text-[#89B4D6]'; } // Blueish
                                                        else if (value < 60) { status = language === 'en' ? 'Moderate' : '中等'; statusColor = 'text-[#D4AF37]'; } // Gold
                                                        else if (value < 80) { status = language === 'en' ? 'Elevated' : '均值偏高'; statusColor = 'text-[#D69EAC]'; } // Pinkish
                                                        else { status = language === 'en' ? 'Needs Care' : '需关注'; statusColor = 'text-[#E0B0FF]'; } // Lavender/Purple instead of Red
                                                    } else {
                                                        // Others (Sleep, Mood, Energy, HRV): Higher is Better
                                                        if (value > 80) { status = language === 'en' ? 'Excellent' : '充盈'; statusColor = 'text-[#88C9B3]'; }
                                                        else if (value > 60) { status = language === 'en' ? 'Good' : '良好'; statusColor = 'text-[#89B4D6]'; }
                                                        else if (value > 40) { status = language === 'en' ? 'Fair' : '平稳'; statusColor = 'text-[#D4AF37]'; }
                                                        else if (value > 20) { status = language === 'en' ? 'Low' : '稍低'; statusColor = 'text-[#D69EAC]'; }
                                                        else { status = language === 'en' ? 'Restoring' : '需恢复'; statusColor = 'text-[#E0B0FF]'; }
                                                    }

                                                    return (
                                                        <div key={metricKey} className="flex flex-col mb-1.5 last:mb-0">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-white/70" style={{ color: entry.stroke }}>{name}</span>
                                                                <span className="font-mono font-medium text-white">{value.toFixed(1)}%</span>
                                                            </div>
                                                            <div className={`text-[10px] text-right ${statusColor} opacity-80 scale-95 origin-right`}>
                                                                {status}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '2 2' }}
                        />
                        {(['anxietyScore', 'sleepQuality', 'moodStability', 'energyLevel', 'hrvScore'] as const).map(metric => {
                            if (!selectedMetrics.includes(metric)) return null;

                            // Map metric full name back to short key for color lookups
                            let key = '';
                            if (metric === 'anxietyScore') key = 'anxiety';
                            else if (metric === 'sleepQuality') key = 'sleep';
                            else if (metric === 'moodStability') key = 'mood';
                            else if (metric === 'energyLevel') key = 'energy';
                            else if (metric === 'hrvScore') key = 'hrv';

                            const color = COLORS[key as keyof typeof COLORS];

                            return (
                                <Fragment key={metric}>
                                    {/* 1. Static/Fading Area (Background) - No drawing animation */}
                                    <Area
                                        type="monotone"
                                        dataKey={metric}
                                        stroke="none"
                                        fill={`url(#color${key})`}
                                        isAnimationActive={true}
                                        animationDuration={1500}
                                        animationEasing="ease-in-out"
                                    />
                                    {/* 2. Drawing Line (Foreground) - Uses clipPath */}
                                    <Line
                                        type="monotone"
                                        dataKey={metric}
                                        stroke={color}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                                        isAnimationActive={false} // Handled by clipPath
                                        filter="url(#glow)"
                                        clipPath="url(#line-draw-clip)"
                                    />
                                </Fragment>
                            );
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-white/20 text-[10px] mt-4 uppercase tracking-widest font-light">
                {language === 'en' ? 'AI-Powered Clinical Projections' : 'AI 驱动的临床预测模型'}
            </div>
        </div>
    );
}

// ============================================
// NEW: Progress Timeline (from DesktopDigitalTwin)
// ============================================

interface ProgressTimelineProps {
    milestones: TimelineMilestone[];
    currentWeek: number | null;
    language: string;
}

function ProgressTimeline({ milestones, currentWeek, language }: ProgressTimelineProps) {
    const progressPercent = Math.min(((currentWeek || 0) / 15) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-white font-semibold">
                    {language === 'en' ? 'Progress Timeline' : '进度时间线'}
                </h3>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-2 bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full"
                    />
                </div>

                {/* Milestone Dots */}
                <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ marginTop: '-3px' }}>
                    {milestones.map((milestone) => (
                        <motion.div
                            key={milestone.week}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: milestone.week * 0.05 }}
                            className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${milestone.status === 'completed' ? 'bg-emerald-500' :
                                milestone.status === 'current' ? 'bg-[#D4AF37] ring-4 ring-[#D4AF37]/30' :
                                    'bg-white/20'
                                }`}
                        >
                            {milestone.status === 'completed' && (
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Milestone Labels */}
            <div className="flex justify-between text-xs text-white/50 mb-6">
                {milestones.map((milestone) => (
                    <div key={milestone.week} className="text-center" style={{ width: '60px' }}>
                        <p className="font-medium">{language === 'en' ? `W${milestone.week}` : `${milestone.week}周`}</p>
                    </div>
                ))}
            </div>

            {/* Current Milestone Info */}
            {milestones.find(m => m.status === 'current') && (() => {
                const currentMilestone = milestones.find(m => m.status === 'current')!;
                // Translate milestone if we have a translation
                const translations: Record<string, { event: { en: string; cn: string }; detail: { en: string; cn: string } }> = {
                    'Baseline assessment': {
                        event: { en: 'Week 0 - Baseline Assessment', cn: '第0周 - 基线评估' },
                        detail: { en: 'Initial measurements and calibration', cn: '初始测量和校准' },
                    },
                    'Week-3 review': {
                        event: { en: 'Week 3 - Early Review', cn: '第3周 - 早期评估' },
                        detail: { en: 'Recalibrate based on 14-day trend', cn: '基于14天趋势重新校准' },
                    },
                    'Week-6 review': {
                        event: { en: 'Week 6 - Midpoint Check', cn: '第6周 - 中期检查' },
                        detail: { en: 'Assess progress and adjust intervention', cn: '评估进展并调整干预' },
                    },
                    'Week-9 mid review': {
                        event: { en: 'Week 9 - Progress Milestone', cn: '第9周 - 进度里程碑' },
                        detail: { en: 'Review treatment response', cn: '审查治疗反应' },
                    },
                    'Week-12 re-assessment': {
                        event: { en: 'Week 12 - Comprehensive Evaluation', cn: '第12周 - 综合评估' },
                        detail: { en: 'Full reassessment of all metrics', cn: '所有指标全面重新评估' },
                    },
                    'Week-15 closeout': {
                        event: { en: 'Week 15 - Program Completion', cn: '第15周 - 项目完成' },
                        detail: { en: 'Final assessment and next steps', cn: '最终评估和后续步骤' },
                    },
                };
                const eventKey = currentMilestone.event || '';
                const translation = translations[eventKey];
                const displayEvent = translation
                    ? (language === 'en' ? translation.event.en : translation.event.cn)
                    : currentMilestone.event;
                const displayDetail = translation
                    ? (language === 'en' ? translation.detail.en : translation.detail.cn)
                    : currentMilestone.detail;

                return (
                    <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                        <p className="text-[#D4AF37] font-medium">
                            {displayEvent}
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                            {displayDetail}
                        </p>
                    </div>
                );
            })()}
        </motion.div>
    );
}

// ============================================
// NEW: Data Quality Banner
// ============================================

interface DataQualityBannerProps {
    curveData: DigitalTwinCurveOutput;
    language: string;
}

function DataQualityBanner({ curveData, language }: DataQualityBannerProps) {
    const { isGood, warnings } = getDataQualityStatus(curveData);

    if (isGood) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-6"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium text-amber-300">
                        {language === 'en' ? 'Data Quality Notice' : '数据质量提示'}
                    </p>
                    <ul className="text-sm text-amber-200/70 mt-1 space-y-0.5">
                        {warnings.slice(0, 3).map((w, i) => (
                            <li key={i}>• {w}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}
